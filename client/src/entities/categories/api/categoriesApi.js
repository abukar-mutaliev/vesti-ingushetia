import api from '@app/providers/store/apiClient';

import { API_BASE_URL } from '@shared/config/apiBase';

const API_URL = `${API_BASE_URL}/categories`;

export const fetchNewsByCategoryApi = (categoryId) => {
    return api.get(`${API_URL}/news/${categoryId}`);
};
export const fetchCategoriesApi = () => api.get(`${API_URL}/`);
export const createCategoryApi = (category) =>
    api.post(`${API_URL}/add`, category);
export const deleteCategoryApi = (id) => api.delete(`${API_URL}/delete/${id}`);
export const updateCategoryApi = (id, category) =>
    api.put(`${API_URL}/update/${id}`, category);
