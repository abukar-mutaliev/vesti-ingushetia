import { createSelector } from 'reselect';

const selectElectionsState = (state) => state.elections;

export const selectElectionPdfs = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.electionPdfs,
);

export const selectCurrentElectionPdf = selectElectionPdfs;

export const selectPdfStatus = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.pdfStatus,
);

export const selectPdfError = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.pdfError,
);

export const selectCurrentElectionBanner = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.currentBanner,
);

export const selectBannerStatus = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.bannerStatus,
);

export const selectBannerError = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.bannerError,
);

export const selectElectionsNews = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.electionsNews,
);

export const selectElectionsNewsStatus = createSelector(
    [selectElectionsState],
    (electionsState) => electionsState.electionsNewsStatus,
);

// Backward compatibility for existing imports
export const selectElectionsStatus = selectPdfStatus;
export const selectElectionsError = selectPdfError;
