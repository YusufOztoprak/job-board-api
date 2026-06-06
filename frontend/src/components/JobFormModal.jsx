import { useEffect, useState } from 'react';
import { createJob, updateJob } from '../api/jobs';

function validateFields(fields) {
    const errors = {};

    if (!fields.title || fields.title.length < 3) errors.title = 'Title must be at least 3 characters.';
    else if (fields.title.length > 100) errors.title = 'Title must be at most 100 characters.';

    if (!fields.description || fields.description.length < 10) errors.description = 'Description must be at least 10 characters.';
    else if (fields.description.length > 1000) errors.description = 'Description must be at most 1000 characters.';

    if (!fields.company || fields.company.length < 2) errors.company = 'Company must be at least 2 characters.';
    else if (fields.company.length > 100) errors.company = 'Company must be at most 100 characters.';

    if (fields.location && fields.location.length > 100) errors.location = 'Location must be at most 100 characters.';

    if (fields.salary_min !== '') {
        const v = Number(fields.salary_min);
        if (isNaN(v) || v < 0) errors.salary_min = 'Must be a non-negative number.';
    }

    if (fields.salary_max !== '') {
        const v = Number(fields.salary_max);
        if (isNaN(v) || v < 0) {
            errors.salary_max = 'Must be a non-negative number.';
        } else if (fields.salary_min !== '' && !isNaN(Number(fields.salary_min)) && v < Number(fields.salary_min)) {
            errors.salary_max = 'Must be >= salary min.';
        }
    }

    return errors;
}

const EMPTY = { title: '', description: '', company: '', location: '', salary_min: '', salary_max: '' };

export default function JobFormModal({ mode, job, isOpen, onClose, onSuccess }) {
    const [fields, setFields] = useState(EMPTY);
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && job) {
                setFields({
                    title: job.title ?? '',
                    description: job.description ?? '',
                    company: job.company ?? '',
                    location: job.location ?? '',
                    salary_min: job.salary_min ?? '',
                    salary_max: job.salary_max ?? '',
                });
            } else {
                setFields(EMPTY);
            }
            setTouched({});
            setApiError(null);
            setSubmitting(false);
        }
    }, [isOpen, mode, job]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const errors = validateFields(fields);
    const isValid = Object.keys(errors).length === 0;

    const set = (key, value) => setFields(prev => ({ ...prev, [key]: value }));
    const touch = (key) => setTouched(prev => ({ ...prev, [key]: true }));

    const fieldClass = (key) =>
        `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            touched[key] && errors[key] ? 'border-red-400' : 'border-gray-300'
        }`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const allTouched = { title: true, description: true, company: true, location: true, salary_min: true, salary_max: true };
        setTouched(allTouched);
        if (!isValid) return;

        setSubmitting(true);
        setApiError(null);

        const payload = {
            title: fields.title,
            description: fields.description,
            company: fields.company,
        };
        if (fields.location) payload.location = fields.location;
        if (fields.salary_min !== '') payload.salary_min = Number(fields.salary_min);
        if (fields.salary_max !== '') payload.salary_max = Number(fields.salary_max);

        try {
            if (mode === 'create') {
                const res = await createJob(payload);
                onSuccess(res.data.data);
            } else {
                const res = await updateJob(job.id, payload);
                onSuccess(res.data.data);
            }
            onClose();
        } catch (err) {
            setApiError(err.response?.data?.message || 'Failed to save job.');
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-gray-900">
                    {mode === 'create' ? 'New Job' : 'Edit Job'}
                </h2>

                {apiError && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
                        {apiError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            value={fields.title}
                            onChange={e => set('title', e.target.value)}
                            onBlur={() => touch('title')}
                            className={fieldClass('title')}
                        />
                        {touched.title && errors.title && (
                            <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                            rows={5}
                            value={fields.description}
                            onChange={e => set('description', e.target.value)}
                            onBlur={() => touch('description')}
                            className={`${fieldClass('description')} resize-none`}
                        />
                        {touched.description && errors.description && (
                            <p className="text-xs text-red-600 mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                        <input
                            type="text"
                            value={fields.company}
                            onChange={e => set('company', e.target.value)}
                            onBlur={() => touch('company')}
                            className={fieldClass('company')}
                        />
                        {touched.company && errors.company && (
                            <p className="text-xs text-red-600 mt-1">{errors.company}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            value={fields.location}
                            onChange={e => set('location', e.target.value)}
                            onBlur={() => touch('location')}
                            className={fieldClass('location')}
                        />
                        {touched.location && errors.location && (
                            <p className="text-xs text-red-600 mt-1">{errors.location}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
                            <input
                                type="number"
                                min="0"
                                value={fields.salary_min}
                                onChange={e => set('salary_min', e.target.value)}
                                onBlur={() => touch('salary_min')}
                                className={fieldClass('salary_min')}
                            />
                            {touched.salary_min && errors.salary_min && (
                                <p className="text-xs text-red-600 mt-1">{errors.salary_min}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
                            <input
                                type="number"
                                min="0"
                                value={fields.salary_max}
                                onChange={e => set('salary_max', e.target.value)}
                                onBlur={() => touch('salary_max')}
                                className={fieldClass('salary_max')}
                            />
                            {touched.salary_max && errors.salary_max && (
                                <p className="text-xs text-red-600 mt-1">{errors.salary_max}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border rounded text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving…' : mode === 'create' ? 'Create Job' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
