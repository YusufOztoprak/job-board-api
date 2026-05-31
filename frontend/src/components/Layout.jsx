import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
                    <Link to="/" className="text-xl font-bold text-blue-600">
                        JobHub
                    </Link>
                    <nav className="ml-auto flex items-center gap-4">
                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
                                >
                                    Register
                                </Link>
                            </>
                        ) : (
                            <>
                                {user?.role === 'candidate' && (
                                    <Link
                                        to="/applications"
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        My Applications
                                    </Link>
                                )}
                                {user?.role === 'employer' && (
                                    <Link
                                        to="/admin/dashboard"
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        Admin
                                    </Link>
                                )}
                                <span className="text-sm text-gray-400">{user?.email}</span>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-3 py-1 rounded"
                                >
                                    Logout
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className="max-w-6xl mx-auto px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}
