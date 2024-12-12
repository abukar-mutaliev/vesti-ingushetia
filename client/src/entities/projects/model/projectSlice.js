import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as projectApi from '@entities/projects/api/projectApi';

const CACHE_DURATION  = import.meta.env.CACHE_DURATION ;

const initialState = {
    projectList: [],
    currentProject: null,
    loading: false,
    error: null,
    lastFetched: null,
};

export const fetchAllProjects = createAsyncThunk(
    'projects/fetchAll',
    async (_, { getState, rejectWithValue }) => {
        const state = getState();
        const { lastFetched } = state.projects;

        if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
            return state.projects.projectList;
        }

        try {
            const response = await projectApi.fetchAllProjectsApi();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

export const fetchProjectById = createAsyncThunk(
    'projects/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await projectApi.fetchProjectByIdApi(id);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

export const createProject = createAsyncThunk(
    'projects/create',
    async (projectData, { rejectWithValue }) => {
        try {
            const response = await projectApi.createProject(projectData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateProject = createAsyncThunk(
    'projects/update',
    async ({ id, projectData }, { rejectWithValue }) => {
        try {
            const response = await projectApi.updateProject(id, projectData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteProject = createAsyncThunk(
    'projects/delete',
    async (id, { rejectWithValue }) => {
        try {
            await projectApi.deleteProject(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
);

const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(fetchAllProjects.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchAllProjects.fulfilled, (state, action) => {
            state.loading = false;
            state.projectList = action.payload || [];
            state.lastFetched = Date.now();
        })
        .addCase(fetchAllProjects.rejected, (state, action) => {
            state.loading = false;
            state.error =
                action.error.message || 'Ошибка получения проектов';
        })
        .addCase(fetchProjectById.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchProjectById.fulfilled, (state, action) => {
            state.currentProject = action.payload;
            state.loading = false;
        })
        .addCase(fetchProjectById.rejected, (state, action) => {
            state.loading = false;
            state.error =
                action.error.message || 'Ошибка получения проекта';
        })
        .addCase(createProject.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createProject.fulfilled, (state, action) => {
            state.projectList.push(action.payload);
            state.loading = false;
        })
        .addCase(createProject.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Ошибка создания проекта';
        })
        .addCase(updateProject.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateProject.fulfilled, (state, action) => {
            const index = state.projectList.findIndex(
                (project) => project.id === action.payload.id
            );
            if (index !== -1) {
                state.projectList[index] = action.payload;
            }
            state.loading = false;
        })
        .addCase(updateProject.rejected, (state, action) => {
            state.loading = false;
            state.error =
                action.error.message || 'Ошибка изменения проекта';
        })
        .addCase(deleteProject.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteProject.fulfilled, (state, action) => {
            state.projectList = state.projectList.filter(
                (project) => project.id !== action.payload
            );
            state.loading = false;
        })
        .addCase(deleteProject.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Ошибка удаления проекта';
        });
    },
});

export default projectSlice.reducer;
