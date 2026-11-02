
// import axios from 'axios';

// const API = axios.create({
//     baseURL: 'http://localhost:5000/api',
//     headers: {
//         'Content-Type': 'application/json'
//     }
// });

// API.interceptors.request.use((config) => {
//     const token = localStorage.getItem('token');

//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
// });

// export default API;

import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 15000
});

// Attach JWT token to every request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle API responses and expired sessions
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        const isAuthRequest =
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register');

        // A 401 from a protected request means the session is invalid
        if (
            status === 401 &&
            !isAuthRequest &&
            localStorage.getItem('token')
        ) {
            localStorage.removeItem('token');

            window.dispatchEvent(
                new Event('auth:expired')
            );
        }

        // Provide a clearer message for network errors
        if (!error.response) {
            error.userMessage = error.code === 'ECONNABORTED'
                ? 'The request timed out. Please try again.'
                : 'Unable to connect to the server. Please check your internet connection and make sure the backend is running.';
        }

        return Promise.reject(error);
    }
);

export default API;
