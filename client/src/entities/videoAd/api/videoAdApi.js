import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/video-ads';

export const createVideoAdApi = (videoAdData) =>
    api.post(`${API_URL}/add`, videoAdData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const fetchAllVideoAdsApi = () => api.get(`${API_URL}/all`);

export const updateVideoAdApi = (id, videoAdData) =>
    api.put(`${API_URL}/update/${id}`, videoAdData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
export const updateExpirationDate = (id, newExpirationDate) => {
    return api.patch(`/videoAds/${id}/expiration`, {
        expirationDate: newExpirationDate,
    });
};

export const pauseVideoAdApi = (id) => api.patch(`${API_URL}/pause/${id}`);

export const activateVideoAdApi = (id) => api.patch(`${API_URL}/active/${id}`);
export const deleteVideoAdApi = (id) => api.delete(`${API_URL}/delete/${id}`);
