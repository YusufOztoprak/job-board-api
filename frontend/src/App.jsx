import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobDetailPage from './pages/JobDetailPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import DashboardPage from './pages/admin/DashboardPage';
import JobsPage from './pages/admin/JobsPage';
import ApplicationsPage from './pages/admin/ApplicationsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="applications" element={<MyApplicationsPage />} />
                </Route>

                <Route element={<RoleRoute role="employer" />}>
                    <Route path="admin/dashboard" element={<DashboardPage />} />
                    <Route path="admin/jobs" element={<JobsPage />} />
                    <Route path="admin/applications" element={<ApplicationsPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
