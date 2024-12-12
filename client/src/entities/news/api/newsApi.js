import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/news`;

export const fetchNewsApi = () => api.get(`${API_URL}/all`);

export const fetchNewsByIdApi = (id) => api.get(`${API_URL}/${id}`);

export const fetchNewsByDateApi = (date) =>
    api.get(`${API_URL}/date`, {
        params: { date },
    });

export const createNewsApi = (newsData) => api.post(`${API_URL}/add`, newsData);

export const updateNewsApi = (id, formData) =>
    api.put(`${API_URL}/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const deleteNewsApi = (id) => api.delete(`${API_URL}/delete/${id}`);
