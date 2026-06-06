import { Link, useNavigate } from 'react-router-dom';
import { deleteJob, updateJob } from '../api/jobs';

const numFmt = new Intl.NumberFormat();

function formatSalary(min, max) {
    if (min && max) return `$${numFmt.format(min)} – $${numFmt.format(max)}`;
    if (min) return `$${numFmt.format(min)}+`;
    if (max) return `$${numFmt.format(max)} max`;
    return 'Salary not disclosed';
}

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

export default function AdminJobRow({ job, applicationCount, onEdit, onToggled }) {
    const navigate = useNavigate();

    const handleToggle = async () => {
        try {
            if (job.is_active) {
                await deleteJob(job.id);
            } else {
                await updateJob(job.id, { is_active: true });
            }
            onToggled(job.id, !job.is_active);
        } catch {
            // Silently ignore — user can retry
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <Link
                        to={`/jobs/${job.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                        {job.title}
                    </Link>
                    <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${
                        job.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                    {job.company}
                    {job.location && <> &bull; {job.location}</>}
                </p>
                <p className="text-sm text-blue-700 mt-1">{formatSalary(job.salary_min, job.salary_max)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Posted {timeAgo(job.createdAt)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(job)}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleToggle}
                        className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50"
                    >
                        {job.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
                <button
                    onClick={() => navigate(`/admin/applications?jobId=${job.id}`)}
                    className="text-xs text-blue-600 hover:underline"
                >
                    {applicationCount ?? 0} application{(applicationCount ?? 0) !== 1 ? 's' : ''}
                </button>
            </div>
        </div>
    );
}
