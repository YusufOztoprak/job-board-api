import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStats } from '../../api/admin';

function SkeletonCard() {
    return (
        <div className="border rounded-lg p-5 bg-white animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
    );
}

function StatCard({ label, value, accent }) {
    const accentClass = { blue: 'text-blue-600', indigo: 'text-indigo-600' }[accent] ?? 'text-gray-700';
    return (
        <div className="border rounded-lg p-5 bg-white">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{label}</p>
            <p className={`text-3xl font-bold ${accentClass}`}>{value}</p>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        getStats()
            .then(res => {
                if (!cancelled) {
                    setStats(res.data.data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load stats.');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [retryKey]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1 mb-8">Welcome back, {user?.email}</p>

            {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {!loading && error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center justify-between mb-8">
                    <span>{error}</span>
                    <button
                        onClick={() => setRetryKey(k => k + 1)}
                        className="text-sm underline ml-4 shrink-0"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!loading && stats && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        <StatCard label="Active Jobs" value={stats.jobs.active} accent="blue" />
                        <StatCard label="Inactive Jobs" value={stats.jobs.inactive} />
                        <StatCard label="Total Applications" value={stats.applications.total} accent="indigo" />
                        <StatCard label="Pending" value={stats.applications.byStatus.pending} />
                        <StatCard label="Reviewed" value={stats.applications.byStatus.reviewed} accent="blue" />
                        <div className="border rounded-lg p-5 bg-white">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Accepted / Rejected</p>
                            <p className="text-3xl font-bold text-gray-700">
                                {stats.applications.byStatus.accepted}
                                <span className="text-base font-normal text-gray-400 mx-1">/</span>
                                {stats.applications.byStatus.rejected}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            to="/admin/jobs"
                            className="flex-1 text-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Manage your jobs
                        </Link>
                        <Link
                            to="/admin/applications"
                            className="flex-1 text-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Review applications
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
