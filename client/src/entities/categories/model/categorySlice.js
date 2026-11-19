import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    createCategoryApi,
    deleteCategoryApi,
    fetchCategoriesApi,
    fetchNewsByCategoryApi,
    updateCategoryApi,
} from '../api/categoriesApi';

const asList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.categories)) return value.categories;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    if (Array.isArray(value?.news)) return value.news;
    return [];
};

const isListPayload = (value) =>
    Array.isArray(value) ||
    Array.isArray(value?.categories) ||
    Array.isArray(value?.data) ||
    Array.isArray(value?.rows) ||
    Array.isArray(value?.news);

const ensureCategories = (state) => {
    if (!Array.isArray(state.categories)) {
        state.categories = asList(state.categories);
    }
};

const initialState = {
    categories: [],
    newsByCategory: {},
    categoriesLastFetched: null,
    newsLastFetched: {},
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
            return rejectWithValue(
                err.response?.data || 'Ошибка при загрузке категорий',
            );
        }
    },
    {
        condition: (_, { getState }) => {
            const { categories, categoriesLastFetched } = getState().categories;
            if (Array.isArray(categories) && categories.length > 0) {
                return false;
            }
            if (categoriesLastFetched) {
                const now = Date.now();
                const diff = now - categoriesLastFetched;
                if (diff < import.meta.env.VITE_CACHE_DURATION) {
                    return false;
                }
            }
            return true;
        },
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
            return { categoryId, news: response.data };
        } catch (error) {
            return rejectWithValue(
                error.response?.data || 'Ошибка при загрузке новостей',
            );
        }
    },
    {
        condition: (categoryId, { getState }) => {
            const { newsLastFetched } = getState().categories;
            const lastFetched = newsLastFetched[categoryId];
            if (lastFetched) {
                const now = Date.now();
                const diff = now - lastFetched;
                if (diff < import.meta.env.VITE_CACHE_DURATION) {
                    return false;
                }
            }
            return true;
        },
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
                if (!isListPayload(action.payload)) {
                    state.categories = [];
                    state.error = 'Некорректный ответ сервера';
                    return;
                }
                state.categories = asList(action.payload);
                state.error = null;
                state.categoriesLastFetched = Date.now();
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })
            .addCase(fetchNewsByCategory.pending, (state) => {
                state.newsLoading = true;
                state.error = null;
            })
            .addCase(fetchNewsByCategory.fulfilled, (state, action) => {
                const { categoryId, news } = action.payload || {};
                state.newsByCategory[categoryId] = asList(news);
                state.newsLastFetched[categoryId] = Date.now();
                state.newsLoading = false;
            })
            .addCase(fetchNewsByCategory.rejected, (state, action) => {
                state.newsLoading = false;
                state.error = action.payload || action.error.message;
            })
            .addCase(createCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createCategory.fulfilled, (state, action) => {
                state.loading = false;
                ensureCategories(state);
                if (action.payload && typeof action.payload === 'object') {
                    state.categories.push(action.payload);
                }
                state.categoriesLastFetched = Date.now();
            })
            .addCase(createCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })
            .addCase(deleteCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.loading = false;
                ensureCategories(state);
                state.categories = state.categories.filter(
                    (category) => category.id !== action.payload,
                );
                state.categoriesLastFetched = Date.now();
            })
            .addCase(deleteCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            })
            .addCase(updateCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                state.loading = false;
                ensureCategories(state);
                const index = state.categories.findIndex(
                    (category) => category.id === action.payload?.id,
                );
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
                state.categoriesLastFetched = Date.now();
            })
            .addCase(updateCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || action.error.message;
            });
    },
});

export default categorySlice.reducer;
