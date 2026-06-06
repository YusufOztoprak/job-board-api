import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ApplyModal from '../components/ApplyModal';

vi.mock('../api/applications', () => ({
    apply: vi.fn().mockResolvedValue({}),
}));

const mockJob = { id: 'job-1', title: 'Software Engineer', company: 'TechCo' };

const defaultProps = {
    job: mockJob,
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
};

describe('ApplyModal', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders the job title', () => {
        render(<ApplyModal {...defaultProps} />);
        expect(screen.getByText('Apply to Software Engineer')).toBeInTheDocument();
    });

    it('shows character counter starting at 0 / 2000', () => {
        render(<ApplyModal {...defaultProps} />);
        expect(screen.getByText('0 / 2000')).toBeInTheDocument();
    });

    it('submit button is disabled when cover letter is empty', () => {
        render(<ApplyModal {...defaultProps} />);
        expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });

    it('submit button is disabled when cover letter is below 10 characters', async () => {
        const user = userEvent.setup();
        render(<ApplyModal {...defaultProps} />);
        await user.type(screen.getByRole('textbox'), 'short');
        expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });

    it('submit button is enabled at exactly 10 characters', async () => {
        const user = userEvent.setup();
        render(<ApplyModal {...defaultProps} />);
        await user.type(screen.getByRole('textbox'), '1234567890');
        expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled();
    });

    it('submit button is disabled above 2000 characters', () => {
        render(<ApplyModal {...defaultProps} />);
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'a'.repeat(2001) },
        });
        expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    });

    it('pressing Escape calls onClose', async () => {
        const onClose = vi.fn();
        render(<ApplyModal {...defaultProps} onClose={onClose} />);
        await userEvent.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalled();
    });
});
