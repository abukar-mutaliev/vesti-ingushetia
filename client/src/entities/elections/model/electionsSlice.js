import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    fetchElectionPdfsApi,
    uploadElectionPdfApi,
    deleteElectionPdfApi,
    fetchCurrentElectionBannerApi,
    updateElectionBannerSettingsApi,
    uploadElectionBannerApi,
    deleteElectionBannerImageApi,
    fetchElectionsNewsApi,
} from '../api/electionsApi';
import { ELECTION_PDF_DOCUMENTS } from './electionPdfDocuments';

export const DEFAULT_BANNER_TITLE = 'Выборы 2026';

const buildEmptyElectionPdfs = () =>
    ELECTION_PDF_DOCUMENTS.map(({ documentKey, title }) => ({
        documentKey,
        title,
        url: null,
        originalFilename: null,
    }));

const upsertElectionPdf = (pdfs, updatedPdf) => {
    const index = pdfs.findIndex(
        (pdf) => pdf.documentKey === updatedPdf.documentKey,
    );

    if (index === -1) {
        return [...pdfs, updatedPdf];
    }

    const nextPdfs = [...pdfs];
    nextPdfs[index] = updatedPdf;
    return nextPdfs;
};

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

export const uploadElectionPdf = createAsyncThunk(
    'elections/uploadElectionPdf',
    async ({ documentKey, formData }, { rejectWithValue }) => {
        try {
            const response = await uploadElectionPdfApi(documentKey, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    },
);

export const deleteElectionPdf = createAsyncThunk(
    'elections/deleteElectionPdf',
    async (documentKey, { rejectWithValue }) => {
        try {
            await deleteElectionPdfApi(documentKey);
            return documentKey;
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
        electionPdfs: buildEmptyElectionPdfs(),
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
                state.electionPdfs = action.payload;
            })
            .addCase(fetchElectionPdfs.rejected, (state, action) => {
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
            .addCase(deleteElectionPdf.pending, (state) => {
                state.pdfStatus = 'loading';
            })
            .addCase(deleteElectionPdf.fulfilled, (state, action) => {
                state.pdfStatus = 'succeeded';
                const documentKey = action.payload;
                const emptyPdf = buildEmptyElectionPdfs().find(
                    (pdf) => pdf.documentKey === documentKey,
                );
                state.electionPdfs = upsertElectionPdf(
                    state.electionPdfs,
                    emptyPdf,
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

// Backward compatibility
export const fetchCurrentElectionPdf = fetchElectionPdfs;

export default electionsSlice.reducer;
