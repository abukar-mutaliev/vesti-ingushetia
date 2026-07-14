import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/elections`;

export const fetchCurrentElectionPdfApi = async () =>
    api.get(`${API_URL}/pdf`);

export const uploadElectionPdfApi = async (formData) =>
    api.put(`${API_URL}/pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const deleteElectionPdfApi = async () =>
    api.delete(`${API_URL}/pdf`);

export const fetchCurrentElectionBannerApi = async () =>
    api.get(`${API_URL}/banner`);

export const updateElectionBannerSettingsApi = async (data) =>
    api.patch(`${API_URL}/banner`, data);

export const uploadElectionBannerApi = async (formData) =>
    api.put(`${API_URL}/banner/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const deleteElectionBannerImageApi = async () =>
    api.delete(`${API_URL}/banner/image`);

export const fetchElectionsNewsApi = async () => api.get(`${API_URL}/news`);
