import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JobCard from '../components/JobCard';

const baseJob = {
    id: 'job-1',
    title: 'Software Engineer',
    company: 'TechCo',
    location: 'Remote',
    salary_min: 3000,
    salary_max: 5000,
    createdAt: new Date().toISOString(),
    description: 'A great opportunity for a skilled engineer.',
};

function renderCard(job = baseJob) {
    return render(
        <MemoryRouter>
            <JobCard job={job} />
        </MemoryRouter>
    );
}

describe('JobCard', () => {
    it('renders the job title', () => {
        renderCard();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    it('renders the company name', () => {
        renderCard();
        expect(screen.getByText(/TechCo/)).toBeInTheDocument();
    });

    it('renders the location', () => {
        renderCard();
        expect(screen.getByText(/Remote/)).toBeInTheDocument();
    });

    it('renders salary range with thousands separators', () => {
        renderCard();
        // Intl.NumberFormat uses the runtime locale; accept either , or . as separator
        expect(screen.getByText(/\$3[.,]000\s*[–-]\s*\$5[.,]000/)).toBeInTheDocument();
    });

    it('shows "Salary not disclosed" when both min and max are null', () => {
        renderCard({ ...baseJob, salary_min: null, salary_max: null });
        expect(screen.getByText('Salary not disclosed')).toBeInTheDocument();
    });

    it('shows "$X+" when only salary_min is set', () => {
        renderCard({ ...baseJob, salary_min: 3000, salary_max: null });
        expect(screen.getByText(/\$3[.,]000\+/)).toBeInTheDocument();
    });

    it('shows "$Y max" when only salary_max is set', () => {
        renderCard({ ...baseJob, salary_min: null, salary_max: 5000 });
        expect(screen.getByText(/\$5[.,]000 max/)).toBeInTheDocument();
    });

    it('links to /jobs/:id', () => {
        renderCard();
        expect(screen.getByRole('link')).toHaveAttribute('href', '/jobs/job-1');
    });

    it('shows a "Posted" date string', () => {
        renderCard();
        expect(screen.getByText(/Posted/)).toBeInTheDocument();
    });
});
