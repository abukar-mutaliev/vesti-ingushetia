import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/users`;

export const updateAvatarApi = (formData) => {
    return api.put(`${API_URL}/update-avatar`, formData, {
        withCredentials: true,
    });
};

export const fetchUserRepliesApi = () =>
    api.get(`${API_URL}/replies`, { withCredentials: true });

export const updateUserProfileApi = (userId, userData) => {
    return api.put(`${API_URL}/update/${userId}`, userData, {
        withCredentials: true,
    });
};

export const changePasswordApi = (passwordData) => {
    return api.put(`${API_URL}/change-password`, passwordData, {
        withCredentials: true,
    });
};