import axios from 'axios';

const normalizeBaseUrl = (value = '') => {
    return String(value).trim().replace(/\/+$/, '');
};

const ensureApiBaseUrl = (value = '') => {
    const normalized = normalizeBaseUrl(value);
    if (!normalized) return '';
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const runtimeApiUrl = ensureApiBaseUrl(import.meta.env.VITE_API_URL || '');
const fallbackApiUrl = import.meta.env.PROD
    ? 'https://flashen.onrender.com/api'
    : 'http://localhost:5000/api';

// Create a globally configured Axios instance
const api = axios.create({
    baseURL: runtimeApiUrl || fallbackApiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests and attach the JWT token automatically
api.interceptors.request.use(
    (config) => {
        // We assume the token is stored simply as "token" in localStorage after login
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // For file uploads (like PDFs), let the browser set the content type boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;