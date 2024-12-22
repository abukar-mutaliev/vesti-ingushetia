import { createSelector } from 'reselect';

const selectRadioState = (state) => state.radio;

export const selectRadioList = createSelector(
    [selectRadioState],
    (radioState) => radioState.radio,
);

export const selectCurrentRadio = createSelector(
    [selectRadioState],
    (radioState) => radioState.currentRadio,
);

export const selectRadioStatus = createSelector(
    [selectRadioState],
    (radioState) => radioState.status,
);

export const selectRadioError = createSelector(
    [selectRadioState],
    (radioState) => radioState.error,
);
