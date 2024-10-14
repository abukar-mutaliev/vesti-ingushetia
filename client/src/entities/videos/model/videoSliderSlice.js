import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as videoApi from '../api/videoApi.js';

export const fetchVideos = createAsyncThunk('videos/fetchAll', async () => {
    const response = await videoApi.fetchVideosApi();
    return response.data;
});

const videoSliderSlice = createSlice({
    name: 'videoSlider',
    initialState: {
        videos: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchVideos.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchVideos.fulfilled, (state, action) => {
                state.videos = action.payload;
                state.loading = false;
            })
            .addCase(fetchVideos.rejected, (state) => {
                state.loading = false;
            });
    },
});

export default videoSliderSlice.reducer;
