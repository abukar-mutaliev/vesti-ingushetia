import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/video-ads`;

export const createVideoAdApi = (videoAdData) =>
    api.post(`${API_URL}/add`, videoAdData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const fetchAllActiveVideoAdsApi = () => api.get(`${API_URL}/all-active`);

export const fetchVideoAdsApi = (status = null) => {
    const url = status ? `${API_URL}/all?status=${status}` : `${API_URL}/all`;
    return api.get(url);
};

export const updateVideoAdApi = (id, videoAdData) =>
    api.put(`${API_URL}/update/${id}`, videoAdData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const updateExpirationDate = (id, newExpirationDate) => {
    return api.patch(`${API_URL}/update/${id}/expiration`, {
        expirationDate: newExpirationDate,
    });
};

export const pauseVideoAdApi = (id) => api.patch(`${API_URL}/pause/${id}`);

export const activateVideoAdApi = (id) => api.patch(`${API_URL}/activate/${id}`);

export const deleteVideoAdApi = (id) => api.delete(`${API_URL}/delete/${id}`);
