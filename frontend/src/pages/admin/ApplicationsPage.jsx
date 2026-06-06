import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listMyApplications, listMyJobs } from '../../api/admin';
import AdminApplicationRow from '../../components/AdminApplicationRow';

function SkeletonRow() {
    return (
        <div className="border rounded-lg p-4 bg-white animate-pulse flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-3/4 mt-2" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-24 shrink-0" />
        </div>
    );
}

export default function ApplicationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const jobIdFilter = searchParams.get('jobId') || '';

    const [applications, setApplications] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        listMyJobs({ limit: 100 })
            .then(res => setJobs(res.data.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = { page, limit: 10 };
        if (jobIdFilter) params.jobId = jobIdFilter;

        listMyApplications(params)
            .then(res => {
                if (!cancelled) {
                    setApplications(res.data.data);
                    setPagination(res.data.pagination);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load applications.');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [page, jobIdFilter, retryKey]);

    const handleJobFilter = (e) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (e.target.value) {
                next.set('jobId', e.target.value);
            } else {
                next.delete('jobId');
            }
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

    const totalPages = pagination?.totalPages ?? 1;
    const total = pagination?.total ?? 0;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Applications</h1>

            <div className="mb-4">
                <select
                    value={jobIdFilter}
                    onChange={handleJobFilter}
                    className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All jobs</option>
                    {jobs.map(j => (
                        <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="space-y-3">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            )}

            {!loading && error && (
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

            {!loading && !error && applications.length === 0 && (
                <div className="text-center py-16 border rounded-lg bg-white">
                    <p className="text-gray-500">No applications yet.</p>
                </div>
            )}

            {!loading && !error && applications.length > 0 && (
                <>
                    <div className="space-y-3">
                        {applications.map(app => (
                            <AdminApplicationRow
                                key={app.id}
                                application={app}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
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
                    )}

                    <p className="text-sm text-gray-400 mt-4 text-center">
                        {total} application{total !== 1 ? 's' : ''} total
                    </p>
                </>
            )}
        </div>
    );
}
