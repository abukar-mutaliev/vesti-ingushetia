import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/users';

export const updateAvatarApi = (formData) => {
    return api.put(`${API_URL}/update-avatar`, formData, {
        withCredentials: true,
    });
};

export const fetchUserRepliesApi = () =>
    api.get(`${API_URL}/replies`, { withCredentials: true });
