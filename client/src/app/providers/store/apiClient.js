import axios from 'axios';
import { refreshToken } from '@entities/user/auth/model/authSlice';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const store = (await import('./store')).default;
                const actionResult = await store.dispatch(refreshToken());

                if (actionResult.meta.requestStatus === 'fulfilled') {
                    isRefreshing = false;
                    processQueue(null);
                    return api(originalRequest);
                } else {
                    isRefreshing = false;
                    processQueue(actionResult.payload);
                    return Promise.reject(actionResult.payload);
                }
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
