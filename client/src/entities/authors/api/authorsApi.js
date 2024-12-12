import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/authors`;

export const fetchAuthorsApi = () => api.get(`${API_URL}/all`);
export const fetchAuthorByIdApi = (id) => api.get(`${API_URL}/${id}`);
export const fetchNewsByAuthorApi = (id) => api.get(`${API_URL}/news/${id}`);
export const createAuthorApi = (author) =>
    api.post(`${API_URL}/authors/news/${id}`, author);
