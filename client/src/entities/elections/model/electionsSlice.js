import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    fetchCurrentElectionPdfApi,
    uploadElectionPdfApi,
    deleteElectionPdfApi,
    fetchCurrentElectionBannerApi,
    updateElectionBannerSettingsApi,
    uploadElectionBannerApi,
    deleteElectionBannerImageApi,
    fetchElectionsNewsApi,
} from '../api/electionsApi';

export const DEFAULT_BANNER_TITLE = 'Выборы 2026';

export const fetchCurrentElectionPdf = createAsyncThunk(
    'elections/fetchCurrentElectionPdf',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchCurrentElectionPdfApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const uploadElectionPdf = createAsyncThunk(
    'elections/uploadElectionPdf',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await uploadElectionPdfApi(formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const deleteElectionPdf = createAsyncThunk(
    'elections/deleteElectionPdf',
    async (_, { rejectWithValue }) => {
        try {
            await deleteElectionPdfApi();
            return null;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const fetchCurrentElectionBanner = createAsyncThunk(
    'elections/fetchCurrentElectionBanner',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchCurrentElectionBannerApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const updateElectionBannerSettings = createAsyncThunk(
    'elections/updateElectionBannerSettings',
    async (data, { rejectWithValue }) => {
        try {
            const response = await updateElectionBannerSettingsApi(data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const uploadElectionBanner = createAsyncThunk(
    'elections/uploadElectionBanner',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await uploadElectionBannerApi(formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const deleteElectionBannerImage = createAsyncThunk(
    'elections/deleteElectionBannerImage',
    async (_, { rejectWithValue }) => {
        try {
            const response = await deleteElectionBannerImageApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const fetchElectionsNews = createAsyncThunk(
    'elections/fetchElectionsNews',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchElectionsNewsApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

const electionsSlice = createSlice({
    name: 'elections',
    initialState: {
        currentPdf: null,
        pdfStatus: 'idle',
        pdfError: null,
        currentBanner: null,
        bannerStatus: 'idle',
        bannerError: null,
        electionsNews: [],
        electionsNewsStatus: 'idle',
        electionsNewsError: null,
    },
    reducers: {
        clearElectionsPdfError(state) {
            state.pdfError = null;
        },
        clearElectionsBannerError(state) {
            state.bannerError = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentElectionPdf.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(fetchCurrentElectionPdf.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                state.currentPdf = action.payload;
            })
            .addCase(fetchCurrentElectionPdf.rejected, (state, action) => {
                state.pdfStatus = 'failed';
                state.pdfError = action.payload;
            })
            .addCase(uploadElectionPdf.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(uploadElectionPdf.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                state.currentPdf = action.payload;
            })
            .addCase(uploadElectionPdf.rejected, (state, action) => {
                state.pdfStatus = 'failed';
                state.pdfError = action.payload;
            })
            .addCase(deleteElectionPdf.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(deleteElectionPdf.fulfilled, (state) => {
                state.pdfStatus = 'succeeded';
                state.currentPdf = null;
            })
            .addCase(deleteElectionPdf.rejected, (state, action) => {
                state.pdfStatus = 'failed';
                state.pdfError = action.payload;
            })
            .addCase(fetchCurrentElectionBanner.pending, (state) => {
                state.bannerStatus = 'loading';
            })
            .addCase(fetchCurrentElectionBanner.fulfilled, (state, action) => {
                state.bannerStatus = 'succeeded';
                state.currentBanner = action.payload;
            })
            .addCase(fetchCurrentElectionBanner.rejected, (state, action) => {
                state.bannerStatus = 'failed';
                state.bannerError = action.payload;
            })
            .addCase(updateElectionBannerSettings.pending, (state) => {
                state.bannerStatus = 'loading';
            })
            .addCase(updateElectionBannerSettings.fulfilled, (state, action) => {
                state.bannerStatus = 'succeeded';
                state.currentBanner = action.payload;
            })
            .addCase(updateElectionBannerSettings.rejected, (state, action) => {
                state.bannerStatus = 'failed';
                state.bannerError = action.payload;
            })
            .addCase(uploadElectionBanner.pending, (state) => {
                state.bannerStatus = 'loading';
            })
            .addCase(uploadElectionBanner.fulfilled, (state, action) => {
                state.bannerStatus = 'succeeded';
                state.currentBanner = action.payload;
            })
            .addCase(uploadElectionBanner.rejected, (state, action) => {
                state.bannerStatus = 'failed';
                state.bannerError = action.payload;
            })
            .addCase(deleteElectionBannerImage.pending, (state) => {
                state.bannerStatus = 'loading';
            })
            .addCase(deleteElectionBannerImage.fulfilled, (state, action) => {
                state.bannerStatus = 'succeeded';
                state.currentBanner = action.payload;
            })
            .addCase(deleteElectionBannerImage.rejected, (state, action) => {
                state.bannerStatus = 'failed';
                state.bannerError = action.payload;
            })
            .addCase(fetchElectionsNews.pending, (state) => {
                state.electionsNewsStatus = 'loading';
            })
            .addCase(fetchElectionsNews.fulfilled, (state, action) => {
                state.electionsNewsStatus = 'succeeded';
                state.electionsNews = action.payload;
            })
            .addCase(fetchElectionsNews.rejected, (state, action) => {
                state.electionsNewsStatus = 'failed';
                state.electionsNewsError = action.payload;
            });
    },
});

export const { clearElectionsPdfError, clearElectionsBannerError } =
    electionsSlice.actions;
export default electionsSlice.reducer;
