import axios from 'axios';
import Cookies from 'js-cookie';
import { refreshToken } from '@entities/user/auth/model/authSlice';
import { setError } from '../store/errorSlice';

let storeInstance;

export const setStore = (_store) => {
    storeInstance = _store;
};

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

let isCsrfTokenLoading = false;
let csrfToken = null;
let failedQueue = [];

const getCsrfToken = async () => {
    if (csrfToken) {
        return csrfToken;
    }

    if (isCsrfTokenLoading) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        });
    }

    isCsrfTokenLoading = true;

    try {
        const response = await axios.get(`${API_URL}/users/csrf-token`, {
            withCredentials: true,
        });
        csrfToken = response.data.csrfToken;

        if (csrfToken) {
            Cookies.set('csrf-token', csrfToken, {
                expires: 7,
                secure: true,
                sameSite: 'Strict',
            });
        }

        failedQueue.forEach(({ resolve }) => resolve(csrfToken));
        failedQueue = [];

        return csrfToken;
    } catch (error) {
        failedQueue.forEach(({ reject }) => reject(error));
        failedQueue = [];

        return null;
    } finally {
        isCsrfTokenLoading = false;
    }
};

const processQueue = (error) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    failedQueue = [];
};

api.interceptors.request.use(
    async (config) => {
        const csrfToken = await getCsrfToken();

        if (csrfToken) {
            config.headers['x-csrf-token'] = csrfToken;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 429) {
            const retryAfter = error.response.data.retryAfter || error.response.headers['retry-after'] || 60; // секунды
            storeInstance.dispatch(setError(`${retryAfter} секунд.`));

            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                console.log('Token is already refreshing, adding to queue.');
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => api(originalRequest))
                .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;
            console.log('Access token expired, attempting to refresh.');
            try {
                const store = (await import('./store')).default;
                const actionResult = await store.dispatch(refreshToken());

                if (actionResult.meta.requestStatus === 'fulfilled') {
                    console.log('Token refreshed successfully.');
                    isRefreshing = false;
                    processQueue(null);
                    return api(originalRequest);
                } else {
                    console.log('Token refreshed successfully.');
                    isRefreshing = false;
                    processQueue(actionResult.payload);
                    return Promise.reject(actionResult.payload);
                }
            } catch (refreshError) {
                console.log('Error during token refresh:', refreshError);
                isRefreshing = false;
                processQueue(refreshError);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
