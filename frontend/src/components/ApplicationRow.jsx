import { useState } from 'react';
import { Link } from 'react-router-dom';
import { withdraw as withdrawApi } from '../api/applications';
import { unmarkApplied } from '../storage/applied';

const STATUS_STYLES = {
    pending: 'bg-gray-100 text-gray-700',
    reviewed: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

function timeAgo(dateStr) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week ago';
    if (weeks < 5) return `${weeks} weeks ago`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 month ago';
    return `${months} months ago`;
}

export default function ApplicationRow({ application, onWithdrawn }) {
    const [withdrawing, setWithdrawing] = useState(false);
    const [error, setError] = useState(null);

    const job = application.job;
    const coverPreview = application.cover_letter && application.cover_letter.length > 160
        ? application.cover_letter.slice(0, 160) + '…'
        : application.cover_letter;

    const handleWithdraw = async () => {
        const confirmed = window.confirm(
            `Withdraw your application for "${job?.title}"? You can apply again afterwards.`
        );
        if (!confirmed) return;

        setWithdrawing(true);
        setError(null);
        try {
            await withdrawApi(application.id);
            unmarkApplied(application.jobId);
            onWithdrawn(application.id);
        } catch {
            setError('Failed to withdraw. Please try again.');
            setWithdrawing(false);
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <Link
                    to={`/jobs/${application.jobId}`}
                    className="font-semibold text-gray-900 hover:text-blue-600"
                >
                    <h3>{job?.title ?? 'Unknown job'}</h3>
                </Link>
                <p className="text-sm text-gray-500 mt-0.5">
                    {job?.company}
                    {job?.location && <> &bull; {job.location}</>}
                </p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_STYLES[application.status] ?? STATUS_STYLES.pending}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                        Applied {timeAgo(application.createdAt)}
                    </span>
                </div>
                {coverPreview && (
                    <p className="text-sm text-gray-500 italic mt-2">{coverPreview}</p>
                )}
                {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="shrink-0 text-sm border border-red-300 text-red-600 bg-white px-3 py-1.5 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {withdrawing ? 'Withdrawing…' : 'Withdraw'}
            </button>
        </div>
    );
}
