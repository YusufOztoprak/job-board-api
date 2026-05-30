import client from './client';

export const apply = (data) => client.post('/applications', data);
export const getMyApplications = (params) => client.get('/applications/me', { params });
export const getJobApplications = (jobId, params) => client.get(`/jobs/${jobId}/applications`, { params });
export const updateStatus = (id, status) => client.patch(`/applications/${id}/status`, { status });
export const withdraw = (id) => client.delete(`/applications/${id}`);
