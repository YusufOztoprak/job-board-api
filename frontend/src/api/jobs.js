import client from './client';

export const listJobs = (params) => client.get('/jobs', { params });
export const getJob = (id) => client.get(`/jobs/${id}`);
export const createJob = (data) => client.post('/jobs', data);
export const updateJob = (id, data) => client.put(`/jobs/${id}`, data);
export const deleteJob = (id) => client.delete(`/jobs/${id}`);
