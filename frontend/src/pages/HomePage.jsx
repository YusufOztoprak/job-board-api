import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listJobs } from '../api/jobs';
import JobCard from '../components/JobCard';
import useDebouncedValue from '../hooks/useDebouncedValue';

// Backend currently filters title OR company server-side; we issue two parallel
// requests and merge to provide a single-input search UX. Acceptable for the
// expected dataset size.

const LIMIT = 10;

const SORT_OPTIONS = [
    { label: 'Newest first', value: 'createdAt:desc' },
    { label: 'Oldest first', value: 'createdAt:asc' },
    { label: 'Salary: high to low', value: 'salary_max:desc' },
    { label: 'Salary: low to high', value: 'salary_min:asc' },
];

function SkeletonCard() {
    return (
        <div className="border rounded-lg p-4 bg-white animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-full mb-1" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
    );
}

export default function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [keyword, setKeyword] = useState(searchParams.get('q') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [salaryMin, setSalaryMin] = useState(searchParams.get('salary_min') || '');
    const [salaryMax, setSalaryMax] = useState(searchParams.get('salary_max') || '');
    const [sortValue, setSortValue] = useState(() => {
        const s = searchParams.get('sort') || 'createdAt';
        const o = searchParams.get('order') || 'desc';
        return `${s}:${o}`;
    });

    const debouncedKeyword = useDebouncedValue(keyword, 400);
    const debouncedLocation = useDebouncedValue(location, 400);

    const [jobs, setJobs] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [error, setError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    // Debounce text fields to URL; skip first render to avoid overwriting initial page param
    const mountedRef = useRef(false);
    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }
        setSearchParams(
            prev => {
                const next = new URLSearchParams(prev);
                if (debouncedKeyword) next.set('q', debouncedKeyword);
                else next.delete('q');
                if (debouncedLocation) next.set('location', debouncedLocation);
                else next.delete('location');
                next.set('page', '1');
                return next;
            },
            { replace: true },
        );
    }, [debouncedKeyword, debouncedLocation, setSearchParams]);

    // Fetch whenever URL or retry key changes
    useEffect(() => {
        let cancelled = false;

        const q = searchParams.get('q') || '';
        const loc = searchParams.get('location') || '';
        const sMin = searchParams.get('salary_min') || '';
        const sMax = searchParams.get('salary_max') || '';
        const sort = searchParams.get('sort') || 'createdAt';
        const order = searchParams.get('order') || 'desc';
        const pg = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

        const base = { page: pg, limit: LIMIT, sort, order };
        if (loc) base.location = loc;
        if (sMin) base.salary_min = sMin;
        if (sMax) base.salary_max = sMax;

        const doFetch = async () => {
            setLoading(true);
            setError(null);
            try {
                let data, pag;
                if (q) {
                    const [titleRes, companyRes] = await Promise.all([
                        listJobs({ ...base, title: q }),
                        listJobs({ ...base, company: q }),
                    ]);
                    const seen = new Set();
                    const merged = [];
                    for (const job of [...titleRes.data.data, ...companyRes.data.data]) {
                        if (!seen.has(job.id)) {
                            seen.add(job.id);
                            merged.push(job);
                        }
                    }
                    data = merged.slice(0, LIMIT);
                    const totalPages = Math.max(
                        titleRes.data.pagination.totalPages,
                        companyRes.data.pagination.totalPages,
                    );
                    pag = {
                        total: titleRes.data.pagination.total + companyRes.data.pagination.total,
                        page: pg,
                        limit: LIMIT,
                        totalPages,
                    };
                } else {
                    const res = await listJobs(base);
                    data = res.data.data;
                    pag = res.data.pagination;
                }
                if (!cancelled) {
                    setJobs(data);
                    setPagination(pag);
                }
            } catch {
                if (!cancelled) setError('Failed to load jobs.');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    setInitialLoad(false);
                }
            }
        };

        doFetch();
        return () => { cancelled = true; };
    }, [searchParams, retryKey]);

    const handleApply = () => {
        const [s, o] = sortValue.split(':');
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('sort', s);
            next.set('order', o);
            if (salaryMin) next.set('salary_min', salaryMin);
            else next.delete('salary_min');
            if (salaryMax) next.set('salary_max', salaryMax);
            else next.delete('salary_max');
            next.set('page', '1');
            return next;
        });
    };

    const handleReset = () => {
        setKeyword('');
        setLocation('');
        setSalaryMin('');
        setSalaryMax('');
        setSortValue('createdAt:desc');
        setSearchParams({});
    };

    const handleSortChange = (e) => {
        const val = e.target.value;
        setSortValue(val);
        const [s, o] = val.split(':');
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('sort', s);
            next.set('order', o);
            next.set('page', '1');
            return next;
        });
    };

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('page', String(newPage));
            return next;
        });
        window.scrollTo(0, 0);
    };

    const total = pagination?.total ?? 0;
    const totalPages = pagination?.totalPages ?? 1;
    const startItem = total === 0 ? 0 : (page - 1) * LIMIT + 1;
    const endItem = Math.min(page * LIMIT, total);

    return (
        <div className="py-8">
            <div className="flex flex-col sm:flex-row gap-6">
                {/* Sidebar */}
                <aside className="sm:w-72 shrink-0">
                    <div className="border rounded-lg p-4 bg-white space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                            <input
                                type="text"
                                placeholder="Title or company"
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                placeholder="City or Remote"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                            <input
                                type="number"
                                placeholder="e.g. 3000"
                                value={salaryMin}
                                onChange={e => setSalaryMin(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                            <input
                                type="number"
                                placeholder="e.g. 8000"
                                value={salaryMax}
                                onChange={e => setSalaryMax(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                            <select
                                value={sortValue}
                                onChange={handleSortChange}
                                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handleApply}
                                className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700"
                            >
                                Apply
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-1 border text-sm py-2 rounded text-gray-600 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Results */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-4 min-h-[24px]">
                        {!initialLoad && pagination && !error && (
                            <p className="text-sm text-gray-500">
                                Showing {startItem}–{endItem} of {total} jobs
                            </p>
                        )}
                        {!initialLoad && loading && (
                            <span className="text-sm text-blue-600 ml-auto">Loading…</span>
                        )}
                    </div>

                    {initialLoad && (
                        <div className="space-y-3">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    )}

                    {!initialLoad && error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center justify-between">
                            <span>{error}</span>
                            <button
                                onClick={() => setRetryKey(k => k + 1)}
                                className="text-sm underline ml-4 shrink-0"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!initialLoad && !error && !loading && jobs.length === 0 && (
                        <div className="text-center py-16 border rounded-lg bg-white">
                            <p className="text-gray-500 mb-3">No jobs match your filters.</p>
                            <button onClick={handleReset} className="text-sm text-blue-600 underline">
                                Clear filters
                            </button>
                        </div>
                    )}

                    {!initialLoad && !error && jobs.length > 0 && (
                        <>
                            <div className="space-y-3">
                                {jobs.map(job => <JobCard key={job.id} job={job} />)}
                            </div>
                            <div className="flex items-center justify-between mt-6">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                    className="px-4 py-2 border rounded text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                <span className="text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages}
                                    className="px-4 py-2 border rounded text-sm disabled:opacity-40 hover:bg-gray-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
