import { createSelector } from 'reselect';

const asRadioList = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.radio)) return value.radio;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    return [];
};

const selectRadioState = (state) => state.radio;

export const selectRadioList = createSelector(
    [selectRadioState],
    (radioState) => asRadioList(radioState?.radio),
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
