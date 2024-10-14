import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/authors';

export const fetchAuthorsApi = () => api.get(`${API_URL}/all`);
export const fetchAuthorByIdApi = (id) => api.get(`${API_URL}/${id}`);
export const fetchNewsByAuthorApi = (id) => api.get(`${API_URL}/news/${id}`);
export const createAuthorApi = (author) =>
    api.post(`${API_URL}/authors/news/${id}`, author);
export const updateAuthorApi = (id, author) =>
    api.put(`${API_URL}/update/${id}`, author);
export const deleteAuthorApi = (id) => api.delete(`${API_URL}/delete/${id}`);
