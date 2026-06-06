import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import Layout from '../components/Layout';
import * as AuthContext from '../context/AuthContext';

vi.mock('../context/AuthContext');

function renderLayout() {
    return render(
        <MemoryRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<div>Home</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe('Layout', () => {
    afterEach(() => vi.restoreAllMocks());

    it('shows Login and Register when unauthenticated', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: null,
            isAuthenticated: false,
            logout: vi.fn(),
        });
        renderLayout();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText('Register')).toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
        expect(screen.queryByText('My Applications')).not.toBeInTheDocument();
    });

    it('shows My Applications for candidate, not Admin', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { email: 'candidate@test.com', role: 'candidate' },
            isAuthenticated: true,
            logout: vi.fn(),
        });
        renderLayout();
        expect(screen.getByText('My Applications')).toBeInTheDocument();
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });

    it('shows Admin for employer, not My Applications', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { email: 'employer@test.com', role: 'employer' },
            isAuthenticated: true,
            logout: vi.fn(),
        });
        renderLayout();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.queryByText('My Applications')).not.toBeInTheDocument();
    });

    it('shows user email when authenticated', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { email: 'employer@test.com', role: 'employer' },
            isAuthenticated: true,
            logout: vi.fn(),
        });
        renderLayout();
        expect(screen.getByText('employer@test.com')).toBeInTheDocument();
    });
});
