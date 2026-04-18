import axios from 'axios';

// Create a globally configured Axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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