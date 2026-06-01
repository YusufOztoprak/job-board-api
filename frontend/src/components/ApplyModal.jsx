import { useEffect, useRef, useState } from 'react';
import { apply } from '../api/applications';

export default function ApplyModal({ job, isOpen, onClose, onSuccess }) {
    const [coverLetter, setCoverLetter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const closeTimerRef = useRef(null);

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Escape key closes modal
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Clear pending close timer on unmount
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCoverLetter('');
            setError(null);
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const len = coverLetter.length;
    const counterInvalid = len < 10 || len > 2000;
    const canSubmit = !counterInvalid && !submitting;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await apply({ jobId: job.id, cover_letter: coverLetter });
            onSuccess();
            onClose();
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;
            if (status === 409) {
                setError(message || 'You have already applied to this job.');
                // Keep submitting=true (button disabled) until modal auto-closes
                closeTimerRef.current = setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                setError(message || 'Failed to submit application.');
                setSubmitting(false);
            }
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl mx-4"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-gray-900">Apply to {job.title}</h2>
                <p className="text-sm text-gray-500 mt-0.5">at {job.company}</p>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cover Letter
                    </label>
                    <textarea
                        rows={8}
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        placeholder="Tell us why you're a great fit for this role..."
                        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <p className={`text-xs mt-1 text-right ${counterInvalid ? 'text-red-500' : 'text-gray-400'}`}>
                        {len} / 2000
                    </p>

                    <div className="flex gap-3 justify-end mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting…' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
