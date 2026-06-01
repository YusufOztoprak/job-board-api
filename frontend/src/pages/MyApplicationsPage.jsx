import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMyApplications } from '../api/applications';
import ApplicationRow from '../components/ApplicationRow';

function SkeletonRow() {
    return (
        <div className="border rounded-lg p-4 bg-white animate-pulse flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 shrink-0" />
        </div>
    );
}

export default function MyApplicationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

    const [applications, setApplications] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        getMyApplications({ page, limit: 10 })
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
    }, [page, retryKey]);

    const handleWithdrawn = (id) => {
        setApplications(prev => prev.filter(a => a.id !== id));
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
        <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h1>

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
                    <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
                    <Link
                        to="/"
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                        Browse jobs
                    </Link>
                </div>
            )}

            {!loading && !error && applications.length > 0 && (
                <>
                    <div className="space-y-3">
                        {applications.map(app => (
                            <ApplicationRow
                                key={app.id}
                                application={app}
                                onWithdrawn={handleWithdrawn}
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
