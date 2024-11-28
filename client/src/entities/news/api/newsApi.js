import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/news';

export const fetchNewsApi = () => api.get(`${API_URL}/all`);
export const fetchNewsByIdApi = (id) => api.get(`${API_URL}/${id}`);
export const fetchNewsByDateApi = (date) =>
    api.get(`${API_URL}/date?date=${date.toISOString()}`);
export const createNewsApi = (author) => api.post(`${API_URL}/add`, author);

export const updateNewsApi = (id, formData) =>
    api.put(`${API_URL}/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const deleteNewsApi = (id) => api.delete(`${API_URL}/delete/${id}`);
