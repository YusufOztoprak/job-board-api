import { Link } from 'react-router-dom';

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

export default function JobCard({ job }) {
    const preview = job.description && job.description.length > 140
        ? job.description.slice(0, 140) + '…'
        : job.description;

    return (
        <Link
            to={`/jobs/${job.id}`}
            className="block border rounded-lg p-4 hover:shadow-md transition bg-white"
        >
            <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
                {job.company}
                {job.location && <> &bull; {job.location}</>}
            </p>
            <p className="text-sm text-blue-700 mt-1">{formatSalary(job.salary_min, job.salary_max)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Posted {timeAgo(job.createdAt)}</p>
            {preview && <p className="text-sm text-gray-600 mt-2">{preview}</p>}
        </Link>
    );
}
