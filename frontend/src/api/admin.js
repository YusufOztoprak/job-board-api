import client from './client';

export const getStats = () => client.get('/admin/stats');
export const listMyJobs = (params) => client.get('/admin/jobs', { params });
export const listMyApplications = (params) => client.get('/admin/applications', { params });
