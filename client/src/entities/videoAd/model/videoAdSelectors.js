import { createSelector } from '@reduxjs/toolkit';

export const selectVideoAdState = (state) => {
    return state.videoAd;
};

export const selectAllVideoAds = createSelector(
    [selectVideoAdState],
    (videoAdState) => videoAdState.ads,
);

export const selectCurrentVideoAd = createSelector(
    [selectVideoAdState],
    (videoAdState) => videoAdState.currentAd,
);

export const selectVideoAdLoading = createSelector(
    [selectVideoAdState],
    (videoAdState) => videoAdState.loading,
);

export const selectVideoAdError = createSelector(
    [selectVideoAdState],
    (videoAdState) => videoAdState.error,
);
