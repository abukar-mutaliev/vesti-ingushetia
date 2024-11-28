import api from '@app/providers/store/apiClient';

const API_URL = 'http://localhost:5000/api/projects';

export const fetchAllProjectsApi = () => api.get(`${API_URL}/all`);
export const fetchProjectByIdApi = (id) => api.get(`${API_URL}/${id}`);
export const createProject = (projectData) =>
    api.post(`${API_URL}/add`, projectData);

export const updateProject = (id, formData) =>
    api.put(`${API_URL}/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

export const deleteProject = (id) => api.delete(`${API_URL}/delete/${id}`);
