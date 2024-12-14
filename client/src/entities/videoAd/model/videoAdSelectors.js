import { createSelector } from '@reduxjs/toolkit';

export const selectVideoAdState = (state) => state.videoAd;

export const selectAllVideoAds = createSelector(
    [selectVideoAdState],
    (videoAdState) => videoAdState.ads || []
);

export const selectAllActiveVideoAds = createSelector(
    [selectAllVideoAds],
    (ads) =>
        Array.isArray(ads)
            ? ads.filter(
                (ad) =>
                    ad.status === 'active' && new Date(ad.expirationDate) > new Date()
            )
            : []
);

export const selectVideoAdLoading = createSelector(
    [selectVideoAdState],
    (videoAdState) => videoAdState.loading,
);

export const selectVideoAdError = createSelector(
    [selectVideoAdState],
    (videoAdState) => videoAdState.error,
);
