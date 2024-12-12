import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/users`;

export const registerUserApi = (userData) =>
    api.post(`${API_URL}/register`, userData);

export const updateUserRoleApi = (userId, isAdmin) =>
    api.put(`${API_URL}/${userId}/role`, { isAdmin });

export const loginUserApi = (credentials) =>
    api.post(`${API_URL}/login`, credentials);

export const fetchUserProfileApi = () =>
    api.get(`${API_URL}/profile`);

export const logoutUserApi = () =>
    api.post(`${API_URL}/logout`);

export const refreshTokenApi = () =>
    api.post(`${API_URL}/refresh`);

export const fetchUsersApi = () =>
    api.get(`${API_URL}/all`);
