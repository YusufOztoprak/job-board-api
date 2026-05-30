import axios from 'axios';
import { getAccessToken, clearSession } from '../storage/tokens';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearSession();
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export default client;
