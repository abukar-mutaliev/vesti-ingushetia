import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authorsApi from '../api/authorsApi.js';

const initialState = {
    authors: [],
    loading: false,
    error: null,
    author: null,
    newsByAuthor: [],
};

export const fetchNewsByAuthor = createAsyncThunk(
    'author/fetchNewsByAuthor',
    async (id, { rejectWithValue }) => {
        try {
            const response = await authorsApi.fetchNewsByAuthorApi(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    },
);

export const fetchAuthorById = createAsyncThunk(
    'author/fetchAuthorById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await authorsApi.fetchAuthorByIdApi(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    },
);

export const createAuthor = createAsyncThunk(
    'authors/create',
    async (author, { rejectWithValue }) => {
        try {
            const response = await authorsApi.createAuthorApi(author);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

export const fetchAuthors = createAsyncThunk(
    'authors/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authorsApi.fetchAuthorsApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

const authorSlice = createSlice({
    name: 'author',
    reducers: {},
    initialState,
    extraReducers: (builder) => {
        builder
            .addCase(fetchNewsByAuthor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNewsByAuthor.fulfilled, (state, action) => {
                state.newsByAuthor = action.payload;
                state.loading = false;
            })
            .addCase(fetchNewsByAuthor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAuthorById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAuthorById.fulfilled, (state, action) => {
                state.author = action.payload;
                state.loading = false;
            })
            .addCase(fetchAuthorById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchAuthors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAuthors.fulfilled, (state, action) => {
                state.loading = false;
                state.authors = action.payload;
            })
            .addCase(fetchAuthors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createAuthor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createAuthor.fulfilled, (state, action) => {
                state.loading = false;
                state.authors.push(action.payload);
            })
            .addCase(createAuthor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default authorSlice.reducer;
