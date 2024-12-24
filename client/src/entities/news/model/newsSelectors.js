import { createSelector } from 'reselect';

export const selectNewsState = (state) => state.news;

export const selectNewsList = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsList || [],
);

export const selectNewsById = (state, id) => {
    return state.news.newsList.find((news) => news.id === parseInt(id, 10));
};

export const selectNewsWithVideos = createSelector(
    [selectNewsList],
    (newsList) =>
        newsList.filter((news) =>
            news.mediaFiles?.some((media) => media.type === 'video'),
        ),
);

export const selectLatestNews = createSelector([selectNewsList], (newsList) =>
    newsList.length > 0 ? newsList[0] : null,
);

export const selectNewsListExcludingLast = createSelector(
    [selectNewsList],
    (newsList) => {
        if (newsList.length === 0) return [];
        return newsList.slice(1);
    }
);

export const selectCurrentPage = createSelector(
    [selectNewsState],
    (newsState) => newsState.currentPage,
);

export const selectNewsPerPage = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsPerPage,
);

export const selectFilteredNews = createSelector(
    [selectNewsState],
    (newsState) => newsState.filteredNews || newsState.newsList || [],
);

export const selectFilteredNewsWithVideos = createSelector(
    [selectNewsState],
    (newsState) => newsState.filteredNewsWithVideos || [],
);

export const selectFilteredNewsExcludingLast = createSelector(
    [selectFilteredNews, selectLatestNews],
    (filteredNews, latestNews) => {
        if (!latestNews) return filteredNews;
        return filteredNews.filter((news) => news.id !== latestNews.id);
    }
);

export const selectFilteredNewsWithVideosExcludingLast = createSelector(
    [selectFilteredNewsWithVideos, selectLatestNews],
    (filteredNewsWithVideos, latestNews) => {
        if (!latestNews) return filteredNewsWithVideos;
        return filteredNewsWithVideos.filter((news) => news.id !== latestNews.id);
    }
);

export const selectPaginatedNewsExcludingLast = createSelector(
    [selectFilteredNewsExcludingLast, selectCurrentPage, selectNewsPerPage],
    (filteredNews, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNews.slice(start, end);
    },
);

export const selectPageCountExcludingLast = createSelector(
    [selectFilteredNewsExcludingLast, selectNewsPerPage],
    (filteredNews, newsPerPage) => {
        return Math.ceil(filteredNews.length / newsPerPage);
    },
);

export const selectPaginatedNewsWithVideosExcludingLast = createSelector(
    [selectFilteredNewsWithVideosExcludingLast, selectCurrentPage, selectNewsPerPage],
    (filteredNewsWithVideos, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNewsWithVideos.slice(start, end);
    },
);

export const selectPageCountWithVideosExcludingLast = createSelector(
    [selectFilteredNewsWithVideosExcludingLast, selectNewsPerPage],
    (filteredNewsWithVideos, newsPerPage) => {
        return Math.ceil(filteredNewsWithVideos.length / newsPerPage);
    },
);

export const selectNewsLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.loading,
);

export const selectError = createSelector(
    [selectNewsState],
    (newsState) => newsState.error,
);

export const selectArticlesNews = createSelector([selectNewsList], (newsList) =>
    newsList.filter((news) => news.category?.name === 'Статьи'),
);

export const selectLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.loading || newsState.newsLoading
);

export const selectNewsByIdLoading = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsByIdLoading,
);

export const selectNewsLoadingAll = createSelector(
    [selectNewsState],
    (newsState) => newsState.newsLoading
);

export const selectIsLoading = createSelector(
    [selectNewsLoading, selectNewsLoadingAll],
    (loading, newsLoading) => loading || newsLoading
);


export const selectPaginatedNews = createSelector(
    [selectFilteredNews, selectCurrentPage, selectNewsPerPage],
    (filteredNews, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNews.slice(start, end);
    }
);

export const selectPageCount = createSelector(
    [selectFilteredNews, selectNewsPerPage],
    (filteredNews, newsPerPage) => {
        return Math.ceil(filteredNews.length / newsPerPage);
    }
);

export const selectPaginatedNewsWithVideos = createSelector(
    [selectFilteredNewsWithVideos, selectCurrentPage, selectNewsPerPage],
    (filteredNewsWithVideos, currentPage, newsPerPage) => {
        const start = currentPage * newsPerPage;
        const end = start + newsPerPage;
        return filteredNewsWithVideos.slice(start, end);
    }
);

export const selectPageCountWithVideos = createSelector(
    [selectFilteredNewsWithVideos, selectNewsPerPage],
    (filteredNewsWithVideos, newsPerPage) => {
        return Math.ceil(filteredNewsWithVideos.length / newsPerPage);
    }
);