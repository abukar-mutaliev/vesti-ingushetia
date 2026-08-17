import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    fetchElectionPdfsApi,
    createElectionPdfApi,
    uploadElectionPdfApi,
    updateElectionPdfTitleApi,
    deleteElectionPdfApi,
    fetchCurrentElectionBannerApi,
    updateElectionBannerSettingsApi,
    uploadElectionBannerApi,
    deleteElectionBannerImageApi,
    fetchElectionsNewsApi,
} from '../api/electionsApi';

export const DEFAULT_BANNER_TITLE = 'Выборы 2026';

const sortElectionPdfs = (pdfs) =>
    [...pdfs].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id - b.id,
    );

export const fetchElectionPdfs = createAsyncThunk(
    'elections/fetchElectionPdfs',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchElectionPdfsApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const createElectionPdf = createAsyncThunk(
    'elections/createElectionPdf',
    async ({ formData }, { rejectWithValue }) => {
        try {
            const response = await createElectionPdfApi(formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const uploadElectionPdf = createAsyncThunk(
    'elections/uploadElectionPdf',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await uploadElectionPdfApi(id, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const updateElectionPdfTitle = createAsyncThunk(
    'elections/updateElectionPdfTitle',
    async ({ id, title }, { rejectWithValue }) => {
        try {
            const response = await updateElectionPdfTitleApi(id, title);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const deleteElectionPdf = createAsyncThunk(
    'elections/deleteElectionPdf',
    async (id, { rejectWithValue }) => {
        try {
            await deleteElectionPdfApi(id);
            return id;
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

const upsertElectionPdf = (pdfs, updatedPdf) => {
    const index = pdfs.findIndex((pdf) => pdf.id === updatedPdf.id);

    if (index === -1) {
        return sortElectionPdfs([...pdfs, updatedPdf]);
    }

    const nextPdfs = [...pdfs];
    nextPdfs[index] = updatedPdf;
    return sortElectionPdfs(nextPdfs);
};

const electionsSlice = createSlice({
    name: 'elections',
    initialState: {
        electionPdfs: [],
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
            .addCase(fetchElectionPdfs.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(fetchElectionPdfs.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                state.electionPdfs = sortElectionPdfs(action.payload);
            })
            .addCase(fetchElectionPdfs.rejected, (state, action) => {
                state.pdfStatus = 'failed';
                state.pdfError = action.payload;
            })
            .addCase(createElectionPdf.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(createElectionPdf.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                state.electionPdfs = upsertElectionPdf(
                    state.electionPdfs,
                    action.payload,
                );
            })
            .addCase(createElectionPdf.rejected, (state, action) => {
                state.pdfStatus = 'failed';
                state.pdfError = action.payload;
            })
            .addCase(uploadElectionPdf.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(uploadElectionPdf.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                state.electionPdfs = upsertElectionPdf(
                    state.electionPdfs,
                    action.payload,
                );
            })
            .addCase(uploadElectionPdf.rejected, (state, action) => {
                state.pdfStatus = 'failed';
                state.pdfError = action.payload;
            })
            .addCase(updateElectionPdfTitle.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(updateElectionPdfTitle.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                state.electionPdfs = upsertElectionPdf(
                    state.electionPdfs,
                    action.payload,
                );
            })
            .addCase(updateElectionPdfTitle.rejected, (state, action) => {
                state.pdfStatus = 'failed';
                state.pdfError = action.payload;
            })
            .addCase(deleteElectionPdf.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(deleteElectionPdf.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                state.electionPdfs = state.electionPdfs.filter(
                    (pdf) => pdf.id !== action.payload,
                );
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

export const fetchCurrentElectionPdf = fetchElectionPdfs;

export default electionsSlice.reducer;
