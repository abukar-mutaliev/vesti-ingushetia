import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    createRadioApi,
    fetchAllRadioApi,
    fetchRadioByIdApi,
    updateRadioApi,
    deleteRadioApi,
} from '../api/radioApi';

const asRadioList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.radio)) return value.radio;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    return [];
};

const ensureRadioList = (state) => {
    if (!Array.isArray(state.radio)) {
        state.radio = asRadioList(state.radio);
    }
};

export const createRadio = createAsyncThunk(
    'radio/createRadio',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await createRadioApi(formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка создания радио');
        }
    },
);

export const fetchAllRadio = createAsyncThunk(
    'radio/fetchAllRadio',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchAllRadioApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка загрузки радио');
        }
    },
);

export const fetchRadioById = createAsyncThunk(
    'radio/fetchRadioById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetchRadioByIdApi(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка загрузки записи');
        }
    },
);

export const updateRadio = createAsyncThunk(
    'radio/updateRadio',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await updateRadioApi(id, formData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка изменения радио');
        }
    },
);

export const deleteRadio = createAsyncThunk(
    'radio/deleteRadio',
    async (id, { rejectWithValue }) => {
        try {
            await deleteRadioApi(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка удаления радио');
        }
    },
);

const radioSlice = createSlice({
    name: 'radio',
    initialState: {
        radio: [],
        currentRadio: null,
        status: 'idle',
        error: null,
    },
    reducers: {
        stop(state) {
            state.currentRadio = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createRadio.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createRadio.fulfilled, (state, action) => {
                state.status = 'succeeded';
                ensureRadioList(state);
                if (action.payload && typeof action.payload === 'object') {
                    state.radio.push(action.payload);
                }
            })
            .addCase(createRadio.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchAllRadio.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAllRadio.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.radio = asRadioList(action.payload);
                state.error = null;
            })
            .addCase(fetchAllRadio.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchRadioById.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchRadioById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentRadio = action.payload;
            })
            .addCase(fetchRadioById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateRadio.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateRadio.fulfilled, (state, action) => {
                state.status = 'succeeded';
                ensureRadioList(state);
                const index = state.radio.findIndex(
                    (radio) => radio.id === action.payload?.id,
                );
                if (index !== -1) {
                    state.radio[index] = action.payload;
                }
            })
            .addCase(updateRadio.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteRadio.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteRadio.fulfilled, (state, action) => {
                state.status = 'succeeded';
                ensureRadioList(state);
                state.radio = state.radio.filter(
                    (radio) => radio.id !== action.meta.arg,
                );
            })
            .addCase(deleteRadio.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            });
    },
});
export const { stop } = radioSlice.actions;
export default radioSlice.reducer;
