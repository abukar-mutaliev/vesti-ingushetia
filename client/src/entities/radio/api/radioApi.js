import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/broadcast`;

export const createRadioApi = async (formData) =>
    api.post(`${API_URL}/add`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const fetchAllRadioApi = async () => api.get(`${API_URL}/all`);

export const fetchRadioByIdApi = async (id) =>
    await api.get(`${API_URL}/${id}`);

export const updateRadioApi = async (id, formData) =>
    api.put(`${API_URL}/update/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const deleteRadioApi = async (id) =>
    await api.delete(`${API_URL}/delete/${id}`);
