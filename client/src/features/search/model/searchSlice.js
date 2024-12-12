import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchNews } from '../api/searchNewsApi.js';

const initialState = {
    searchResults: [],
    loading: false,
    error: null,
};

export const fetchSearchResults = createAsyncThunk(
    'search/fetchSearchResults',
    async (query, { rejectWithValue }) => {
        try {
            const response = await searchNews(query);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    },
);

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSearchResults.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSearchResults.fulfilled, (state, action) => {
                state.loading = false;
                state.searchResults = action.payload;
            })
            .addCase(fetchSearchResults.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Ошибка при выполнении поиска';
            });
    },
});

export default searchSlice.reducer;
