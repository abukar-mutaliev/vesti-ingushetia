import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    fetchTvProgramsApi,
    createTvProgramApi,
    updateTvProgramApi,
    deleteTvProgramApi,
} from '@entities/tvProgram/api/tvProgramApi';

export const fetchAllTvPrograms = createAsyncThunk(
    'tvProgram/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchTvProgramsApi();
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Ошибка получения телепрограмм',
            );
        }
    },
);

export const createTvProgram = createAsyncThunk(
    'tvProgram/create',
    async (programData, { rejectWithValue }) => {
        try {
            const response = await createTvProgramApi(programData);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Ошибка создания телепрограммы',
            );
        }
    },
);

export const updateTvProgram = createAsyncThunk(
    'tvProgram/update',
    async ({ id, program }, { rejectWithValue }) => {
        try {
            const response = await updateTvProgramApi(id, program);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Ошибка обновления телепрограммы',
            );
        }
    },
);

export const deleteTvProgram = createAsyncThunk(
    'tvProgram/delete',
    async (id, { rejectWithValue }) => {
        try {
            await deleteTvProgramApi(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                    'Ошибка удаления телепрограммы',
            );
        }
    },
);

const tvProgramSlice = createSlice({
    name: 'tvProgram',
    initialState: {
        tvPrograms: [],
        currentProgram: null,
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllTvPrograms.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAllTvPrograms.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.tvPrograms = action.payload;
            })
            .addCase(fetchAllTvPrograms.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(createTvProgram.fulfilled, (state, action) => {
                if (action.payload && action.payload.id) {
                    state.tvPrograms.push(action.payload);
                } else {
                    state.status = 'failed';
                    state.error = 'Не удалось добавить телепрограмму';
                }
            })
            .addCase(updateTvProgram.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.tvPrograms.findIndex(
                    (program) => program.id === action.payload.id,
                );
                if (index !== -1) {
                    state.tvPrograms[index] = action.payload;
                }
            })
            .addCase(updateTvProgram.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(deleteTvProgram.fulfilled, (state, action) => {
                state.tvPrograms = state.tvPrograms.filter(
                    (program) => program.id !== action.payload,
                );
            })
            .addCase(deleteTvProgram.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addMatcher(
                (action) =>
                    action.type.startsWith('tvProgram/') &&
                    action.type.endsWith('/pending'),
                (state) => {
                    state.status = 'loading';
                    state.error = null;
                },
            )
            .addMatcher(
                (action) =>
                    action.type.startsWith('tvProgram/') &&
                    action.type.endsWith('/rejected'),
                (state, action) => {
                    state.status = 'failed';
                    state.error = action.payload;
                },
            );
    },
});

export default tvProgramSlice.reducer;
