import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as videoAdApi from '../api/videoAdApi';

export const createVideoAd = createAsyncThunk(
    'videoAd/createVideoAd',
    async (videoAdData, { rejectWithValue }) => {
        try {
            const response = await videoAdApi.createVideoAdApi(videoAdData);
            return response.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка при создании видеообъявления',
            );
        }
    },
);

export const fetchAllActiveVideoAds = createAsyncThunk(
    'videoAd/fetchAllActiveVideoAds',
    async (_, { rejectWithValue }) => {
        try {
            const response = await videoAdApi.fetchAllActiveVideoAdsApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data ||
                    'Ошибка при получении активных видеообъявлений',
            );
        }
    },
);

export const fetchAllVideoAds = createAsyncThunk(
    'videoAd/fetchAllVideoAds',
    async (status = null, { rejectWithValue }) => {
        try {
            const response = await videoAdApi.fetchVideoAdsApi(status);
            return response.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка при получении видеообъявлений',
            );
        }
    },
);

export const updateVideoAd = createAsyncThunk(
    'videoAd/updateVideoAd',
    async ({ id, videoAdData }, { rejectWithValue }) => {
        try {
            const response = await videoAdApi.updateVideoAdApi(id, videoAdData);
            return response.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка при обновлении видеообъявления',
            );
        }
    },
);

export const deleteVideoAd = createAsyncThunk(
    'videoAd/deleteVideoAd',
    async (id, { rejectWithValue }) => {
        try {
            await videoAdApi.deleteVideoAdApi(id);
            return id;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка при удалении видеообъявления',
            );
        }
    },
);

export const pauseVideoAd = createAsyncThunk(
    'videoAd/pauseVideoAd',
    async (id, { rejectWithValue }) => {
        try {
            const response = await videoAdApi.pauseVideoAdApi(id);
            return response.data.videoAd;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка при приостановке видеообъявления',
            );
        }
    },
);

export const activateVideoAd = createAsyncThunk(
    'videoAd/activateVideoAd',
    async (id, { rejectWithValue }) => {
        try {
            const response = await videoAdApi.activateVideoAdApi(id);
            return response.data.videoAd;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка при активации видеообъявления',
            );
        }
    },
);

export const extendExpirationDate = createAsyncThunk(
    'videoAd/extendExpirationDate',
    async ({ id, newExpirationDate }, { rejectWithValue }) => {
        try {
            const response = await videoAdApi.updateExpirationDate(
                id,
                newExpirationDate,
            );
            return response.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data || 'Ошибка при продлении срока действия',
            );
        }
    },
);

const videoAdSlice = createSlice({
    name: 'videoAd',
    initialState: {
        ads: [],
        currentAd: null,
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllVideoAds.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllVideoAds.fulfilled, (state, action) => {
                state.loading = false;
                state.ads = action.payload;
            })
            .addCase(fetchAllVideoAds.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(fetchAllActiveVideoAds.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllActiveVideoAds.fulfilled, (state, action) => {
                state.loading = false;
                state.ads = action.payload;
            })
            .addCase(fetchAllActiveVideoAds.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createVideoAd.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createVideoAd.fulfilled, (state, action) => {
                state.loading = false;
                state.ads.push(action.payload);
            })
            .addCase(createVideoAd.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(updateVideoAd.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateVideoAd.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.ads.findIndex(
                    (ad) => ad.id === action.payload.id,
                );
                if (index !== -1) {
                    state.ads[index] = action.payload;
                }
            })
            .addCase(updateVideoAd.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(deleteVideoAd.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteVideoAd.fulfilled, (state, action) => {
                state.loading = false;
                state.ads = state.ads.filter((ad) => ad.id !== action.payload);
                if (state.currentAd && state.currentAd.id === action.payload) {
                    state.currentAd = null;
                }
            })
            .addCase(deleteVideoAd.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(pauseVideoAd.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(pauseVideoAd.fulfilled, (state, action) => {
                state.loading = false;
                const updatedAd = action.payload;
                const index = state.ads.findIndex(
                    (ad) => ad.id === updatedAd.id,
                );
                if (index !== -1) {
                    state.ads[index] = updatedAd;
                }

                if (state.currentAd && state.currentAd.id === updatedAd.id) {
                    state.currentAd = updatedAd;
                }
            })
            .addCase(pauseVideoAd.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(activateVideoAd.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(activateVideoAd.fulfilled, (state, action) => {
                state.loading = false;
                const updatedAd = action.payload;
                const index = state.ads.findIndex(
                    (ad) => ad.id === updatedAd.id,
                );
                if (index !== -1) {
                    state.ads[index] = updatedAd;
                } else {
                    state.ads.push(updatedAd);
                }

                if (state.currentAd && state.currentAd.id === updatedAd.id) {
                    state.currentAd = updatedAd;
                }
            })
            .addCase(activateVideoAd.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(extendExpirationDate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(extendExpirationDate.fulfilled, (state, action) => {
                state.loading = false;
                const updatedAd = action.payload;
                const index = state.ads.findIndex(
                    (ad) => ad.id === updatedAd.id,
                );
                if (index !== -1) {
                    state.ads[index] = updatedAd;
                }
            })
            .addCase(extendExpirationDate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default videoAdSlice.reducer;
