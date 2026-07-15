import api from '@app/providers/store/apiClient';

const API_URL = `${import.meta.env.VITE_API_URL}/elections`;

export const fetchElectionPdfsApi = async () => api.get(`${API_URL}/pdf`);

export const uploadElectionPdfApi = async (documentKey, formData) =>
    api.put(`${API_URL}/pdf/${documentKey}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

export const deleteElectionPdfApi = async (documentKey) =>
    api.delete(`${API_URL}/pdf/${documentKey}`);

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
