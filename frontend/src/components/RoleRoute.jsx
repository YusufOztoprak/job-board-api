import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ role }) {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated || user?.role !== role) return <Navigate to="/login" replace />;
    return <Outlet />;
}
