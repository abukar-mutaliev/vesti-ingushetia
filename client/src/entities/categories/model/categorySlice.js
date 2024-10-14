import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    createCategoryApi,
    deleteCategoryApi,
    fetchCategoriesApi,
    fetchNewsByCategoryApi,
    updateCategoryApi,
} from '../api/categoriesApi';

const initialState = {
    categories: [],
    newsByCategory: {},
    loading: false,
    newsLoading: false,
    error: null,
};

export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchCategoriesApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

export const createCategory = createAsyncThunk(
    'categories/create',
    async (category, { rejectWithValue }) => {
        try {
            const response = await createCategoryApi(category);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

export const deleteCategory = createAsyncThunk(
    'categories/delete',
    async (id, { rejectWithValue }) => {
        try {
            await deleteCategoryApi(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

export const updateCategory = createAsyncThunk(
    'categories/update',
    async ({ id, category }, { rejectWithValue }) => {
        try {
            const response = await updateCategoryApi(id, category);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    },
);

export const fetchNewsByCategory = createAsyncThunk(
    'news/fetchNewsByCategory',
    async (categoryId, { rejectWithValue }) => {
        try {
            const response = await fetchNewsByCategoryApi(categoryId);
            return { categoryId, categories: response.data };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    },
);

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchNewsByCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNewsByCategory.fulfilled, (state, action) => {
                const { categoryId, categories } = action.payload;
                state.newsByCategory[categoryId] = categories;
                state.loading = false;
            })
            .addCase(fetchNewsByCategory.rejected, (state, action) => {
                state.loading = false;
                state.error =
                    action.error.message || 'Ошибка получения новостей';
            })
            .addCase(createCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.categories.push(action.payload);
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = state.categories.filter(
                    (category) => category.id !== action.payload,
                );
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.categories.findIndex(
                    (category) => category.id === action.payload.id,
                );
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default categorySlice.reducer;
