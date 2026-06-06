import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateStatus as updateStatusApi } from '../api/applications';

const STATUS_STYLES = {
    pending: 'bg-gray-100 text-gray-700',
    reviewed: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['pending', 'reviewed', 'accepted', 'rejected'];

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

export default function AdminApplicationRow({ application: initialApplication }) {
    const [application, setApplication] = useState(initialApplication);
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);

    const job = application.job;
    const candidate = application.candidate;
    const coverLetter = application.cover_letter ?? '';
    const preview = coverLetter.length > 240 ? coverLetter.slice(0, 240) + '…' : coverLetter;
    const isLong = coverLetter.length > 240;

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        const prevStatus = application.status;
        setApplication(a => ({ ...a, status: newStatus }));
        setUpdating(true);
        try {
            await updateStatusApi(application.id, newStatus);
        } catch {
            setApplication(a => ({ ...a, status: prevStatus }));
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <Link
                        to={`/jobs/${application.jobId}`}
                        className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                        {job?.title ?? 'Unknown job'}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">{candidate?.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Applied {timeAgo(application.createdAt)}</p>
                    {coverLetter && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 italic">
                                {expanded ? coverLetter : preview}
                            </p>
                            {isLong && (
                                <button
                                    onClick={() => setExpanded(e => !e)}
                                    className="text-xs text-blue-600 hover:underline mt-1"
                                >
                                    {expanded ? 'Show less' : 'Show more'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_STYLES[application.status] ?? STATUS_STYLES.pending}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                    <select
                        value={application.status}
                        onChange={handleStatusChange}
                        disabled={updating}
                        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
