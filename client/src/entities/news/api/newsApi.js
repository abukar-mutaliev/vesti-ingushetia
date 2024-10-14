import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/news';

export const fetchNews = () => api.get(`${API_URL}/all`);
export const fetchNewsByIdApi = (id) => api.get(`${API_URL}/${id}`);
export const fetchNewsByDate = (date) =>
    api.get(`API_URL/date?date=${date.toISOString()}`);
export const createNews = (author) =>
    api.post(`${API_URL}/add`, author, { withCredentials: true });

export const updateNews = (id, formData) =>
    api.put(`${API_URL}/update/${id}`, formData, {
        withCredentials: true,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const deleteNews = (id) =>
    api.delete(`${API_URL}/delete/${id}`, { withCredentials: true });
