import { createSelector } from 'reselect';

export const selectTvProgramState = (state) => state.tvProgram;

export const selectAllTvPrograms = createSelector(
    [selectTvProgramState],
    (tvProgramState) => tvProgramState.tvPrograms,
);

export const selectTvProgramById = (id) =>
    createSelector([selectAllTvPrograms], (tvPrograms) =>
        tvPrograms.find((program) => program.id === id),
    );

export const selectTvProgramStatus = createSelector(
    [selectTvProgramState],
    (tvProgramState) => tvProgramState.status,
);

export const selectTvProgramError = createSelector(
    [selectTvProgramState],
    (tvProgramState) => tvProgramState.error,
);
