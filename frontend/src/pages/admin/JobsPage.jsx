import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listMyJobs, listMyApplications } from '../../api/admin';
import AdminJobRow from '../../components/AdminJobRow';
import JobFormModal from '../../components/JobFormModal';

function SkeletonRow() {
    return (
        <div className="border rounded-lg p-4 bg-white animate-pulse flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="flex gap-2 shrink-0">
                <div className="h-8 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded w-24" />
            </div>
        </div>
    );
}

export default function JobsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const [jobs, setJobs] = useState([]);
    const [pagination, setPagination] = useState(null);
    // Counts fetched once per page load: all applications with high limit, mapped by jobId client-side.
    // Pragmatic for expected dataset sizes — avoids N+1 requests.
    const [appCounts, setAppCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        listMyJobs({ page, limit: 10 })
            .then(async res => {
                if (cancelled) return;
                const jobList = res.data.data;
                setJobs(jobList);
                setPagination(res.data.pagination);

                if (jobList.length > 0) {
                    try {
                        const appsRes = await listMyApplications({ limit: 1000 });
                        const counts = {};
                        for (const app of appsRes.data.data) {
                            counts[app.jobId] = (counts[app.jobId] ?? 0) + 1;
                        }
                        if (!cancelled) setAppCounts(counts);
                    } catch {
                        // Non-critical — counts default to 0
                    }
                }

                if (!cancelled) setLoading(false);
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load jobs.');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [page, retryKey]);

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('page', String(newPage));
            return next;
        });
        window.scrollTo(0, 0);
    };

    const handleCreate = () => {
        setEditingJob(null);
        setModalOpen(true);
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setModalOpen(true);
    };

    const handleModalSuccess = (savedJob) => {
        if (!editingJob) {
            setJobs(prev => [savedJob, ...prev]);
        } else {
            setJobs(prev => prev.map(j => j.id === savedJob.id ? savedJob : j));
        }
    };

    const handleToggled = (jobId, newIsActive) => {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_active: newIsActive } : j));
    };

    const totalPages = pagination?.totalPages ?? 1;
    const total = pagination?.total ?? 0;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                >
                    + New Job
                </button>
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

            {!loading && !error && jobs.length === 0 && (
                <div className="text-center py-16 border rounded-lg bg-white">
                    <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                        + New Job
                    </button>
                </div>
            )}

            {!loading && !error && jobs.length > 0 && (
                <>
                    <div className="space-y-3">
                        {jobs.map(job => (
                            <AdminJobRow
                                key={job.id}
                                job={job}
                                applicationCount={appCounts[job.id] ?? 0}
                                onEdit={handleEdit}
                                onToggled={handleToggled}
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
                        {total} job{total !== 1 ? 's' : ''} total
                    </p>
                </>
            )}

            <JobFormModal
                mode={editingJob ? 'edit' : 'create'}
                job={editingJob}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
