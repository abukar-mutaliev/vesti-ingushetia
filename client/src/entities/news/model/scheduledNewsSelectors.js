import { createSelector } from 'reselect';

export const selectScheduledNewsState = (state) => state.scheduledNews;

export const selectMyScheduledNews = createSelector(
    [selectScheduledNewsState],
    (scheduledNewsState) => scheduledNewsState.myScheduledNews || []
);

export const selectAllScheduledNews = createSelector(
    [selectScheduledNewsState],
    (scheduledNewsState) => scheduledNewsState.scheduledNews || []
);

export const selectScheduledNewsStats = createSelector(
    [selectScheduledNewsState],
    (scheduledNewsState) => scheduledNewsState.stats
);

export const selectScheduledNewsLoading = createSelector(
    [selectScheduledNewsState],
    (scheduledNewsState) => scheduledNewsState.loading
);

export const selectScheduledNewsError = createSelector(
    [selectScheduledNewsState],
    (scheduledNewsState) => scheduledNewsState.error
);

// Получить отложенные новости со статусом "scheduled"
export const selectScheduledNewsOnly = createSelector(
    [selectMyScheduledNews],
    (myScheduledNews) => myScheduledNews.filter(news => news.status === 'scheduled')
);

// Получить отложенные новости с ошибками
export const selectScheduledNewsWithErrors = createSelector(
    [selectMyScheduledNews],
    (myScheduledNews) => myScheduledNews.filter(news => news.status === 'error')
);

// Получить отмененные отложенные новости
export const selectCancelledScheduledNews = createSelector(
    [selectMyScheduledNews],
    (myScheduledNews) => myScheduledNews.filter(news => news.status === 'cancelled')
);

// Получить количество отложенных новостей
export const selectScheduledNewsCount = createSelector(
    [selectScheduledNewsOnly],
    (scheduledNews) => scheduledNews.length
);

// Получить отложенные новости, готовые к публикации (дата прошла)
export const selectOverdueScheduledNews = createSelector(
    [selectScheduledNewsOnly],
    (scheduledNews) => {
        const now = new Date();
        return scheduledNews.filter(news => 
            news && news.publishDate && new Date(news.publishDate) <= now
        );
    }
);

// Получить предстоящие отложенные новости
export const selectUpcomingScheduledNews = createSelector(
    [selectScheduledNewsOnly],
    (scheduledNews) => {
        const now = new Date();
        return scheduledNews
            .filter(news => news && news.publishDate && new Date(news.publishDate) > now)
            .sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
    }
); 