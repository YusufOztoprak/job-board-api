import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import RoleRoute from '../components/RoleRoute';
import * as AuthContext from '../context/AuthContext';

vi.mock('../context/AuthContext');

function renderRoute(initialPath = '/admin') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="/" element={<div>Home Page</div>} />
                <Route element={<RoleRoute role="employer" />}>
                    <Route path="/admin" element={<div>Protected Content</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

describe('RoleRoute', () => {
    afterEach(() => vi.restoreAllMocks());

    it('redirects unauthenticated user to /login', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            isAuthenticated: false,
            user: null,
        });
        renderRoute();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('redirects authenticated candidate to /', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            isAuthenticated: true,
            user: { role: 'candidate' },
        });
        renderRoute();
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('renders protected content for authenticated employer', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            isAuthenticated: true,
            user: { role: 'employer' },
        });
        renderRoute();
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
});
