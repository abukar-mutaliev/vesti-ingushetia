import { createSelector } from 'reselect';

export const selectProjectState = (state) => state.projects;

export const selectProjectList = createSelector(
    [selectProjectState],
    (projectState) => projectState.projectList || [],
);

export const selectCurrentProject = createSelector(
    [selectProjectState],
    (projectState) => projectState.currentProject,
);

export const selectProjectLoading = createSelector(
    [selectProjectState],
    (projectState) => projectState.loading,
);
