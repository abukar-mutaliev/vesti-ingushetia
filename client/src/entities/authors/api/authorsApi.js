import api from '@app/providers/store/apiClient';

import { API_BASE_URL } from '@shared/config/apiBase';

const API_URL = `${API_BASE_URL}/authors`;

export const fetchAuthorsApi = () => api.get(`${API_URL}/all`);
export const fetchAuthorByIdApi = (id) => api.get(`${API_URL}/${id}`);
export const fetchNewsByAuthorApi = (id) => api.get(`${API_URL}/news/${id}`);
export const createAuthorApi = (author) =>
    api.post(`${API_URL}/authors/news/${id}`, author);
