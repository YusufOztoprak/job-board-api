import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getJob } from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { hasApplied, markApplied } from '../storage/applied';
import ApplyModal from '../components/ApplyModal';

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

function Skeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-3/4 mt-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-px bg-gray-200 my-4" />
            <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-4/6" />
            </div>
        </div>
    );
}

export default function JobDetailPage() {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setNotFound(false);

        getJob(id)
            .then(res => {
                if (!cancelled) {
                    const jobData = res.data.data;
                    setJob(jobData);
                    setApplied(hasApplied(jobData.id));
                    setLoading(false);
                }
            })
            .catch(err => {
                if (!cancelled) {
                    if (err.response?.status === 404) setNotFound(true);
                    else setError('Failed to load job details.');
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [id, retryKey]);

    const handleApplySuccess = () => {
        if (job) {
            markApplied(job.id);
            setApplied(true);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <Skeleton />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="max-w-3xl mx-auto py-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Job not found</h2>
                <p className="text-gray-500 mb-6">This listing may have been removed or never existed.</p>
                <Link to="/" className="text-blue-600 hover:underline">Back to all jobs</Link>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-3xl mx-auto py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={() => setRetryKey(k => k + 1)}
                        className="text-sm underline ml-4 shrink-0"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const isOwner = isAuthenticated && user?.id === job.userId;

    let applySection;
    if (!isAuthenticated) {
        applySection = (
            <button
                onClick={() => navigate(`/login?next=/jobs/${id}`)}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
                Log in to apply
            </button>
        );
    } else if (isOwner) {
        applySection = (
            <p className="text-gray-500 text-sm">
                This is your own posting. Manage it from the admin panel.
            </p>
        );
    } else if (user?.role === 'employer') {
        applySection = (
            <p className="text-gray-400 text-sm">Employers cannot apply to jobs.</p>
        );
    } else if (applied) {
        applySection = (
            <div>
                <span className="text-gray-400 text-sm">Application submitted</span>
                <div className="mt-1">
                    <Link to="/applications" className="text-sm text-blue-600 hover:underline">
                        View in My Applications →
                    </Link>
                </div>
            </div>
        );
    } else {
        applySection = (
            <>
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    Apply for this job
                </button>
                <ApplyModal
                    job={job}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={handleApplySuccess}
                />
            </>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to jobs
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mt-4">{job.title}</h1>
            <p className="text-gray-600 mt-1">
                {job.company}
                {job.location && <> &bull; {job.location}</>}
                {' '}&bull; Posted {timeAgo(job.createdAt)}
            </p>
            <p className="text-lg text-blue-700 mt-2">{formatSalary(job.salary_min, job.salary_max)}</p>

            <hr className="my-6 border-gray-200" />

            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>

            <div className="mt-8">{applySection}</div>
        </div>
    );
}
