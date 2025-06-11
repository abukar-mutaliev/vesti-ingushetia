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

export const selectActiveScheduledNews = createSelector(
    [selectMyScheduledNews, selectAllScheduledNews],
    (myScheduledNews, allScheduledNews) => {

        return allScheduledNews.length > 0 ? allScheduledNews : myScheduledNews;
    }
);

export const selectScheduledNewsOnly = createSelector(
    [selectActiveScheduledNews],
    (scheduledNews) => scheduledNews.filter(news => news.status === 'scheduled')
);

export const selectScheduledNewsWithErrors = createSelector(
    [selectActiveScheduledNews],
    (scheduledNews) => scheduledNews.filter(news => news.status === 'error')
);

export const selectCancelledScheduledNews = createSelector(
    [selectActiveScheduledNews],
    (scheduledNews) => scheduledNews.filter(news => news.status === 'cancelled')
);

export const selectScheduledNewsCount = createSelector(
    [selectScheduledNewsOnly],
    (scheduledNews) => scheduledNews.length
);

export const selectOverdueScheduledNews = createSelector(
    [selectScheduledNewsOnly],
    (scheduledNews) => {
        const now = new Date();
        return scheduledNews.filter(news => {
            if (!news) return false;

            const publishDate = news.publishDate || news.scheduledDate;
            if (!publishDate) return false;

            try {
                const newsDate = new Date(publishDate);
                return !isNaN(newsDate.getTime()) && newsDate <= now;
            } catch (error) {
                console.error('Ошибка парсинга даты:', publishDate, error);
                return false;
            }
        });
    }
);

export const selectUpcomingScheduledNews = createSelector(
    [selectScheduledNewsOnly],
    (scheduledNews) => {
        const now = new Date();
        return scheduledNews
            .filter(news => {
                if (!news) return false;

                const publishDate = news.publishDate || news.scheduledDate;
                if (!publishDate) return false;

                try {
                    const newsDate = new Date(publishDate);
                    return !isNaN(newsDate.getTime()) && newsDate > now;
                } catch (error) {
                    console.error('Ошибка парсинга даты:', publishDate, error);
                    return false;
                }
            })
            .sort((a, b) => {
                const dateA = new Date(a.publishDate || a.scheduledDate);
                const dateB = new Date(b.publishDate || b.scheduledDate);
                return dateA - dateB;
            });
    }
);

export const selectScheduledNewsWithTimeInfo = createSelector(
    [selectScheduledNewsOnly],
    (scheduledNews) => {
        const now = new Date();

        return scheduledNews.map(news => {
            const publishDate = news.publishDate || news.scheduledDate;
            const newsDate = publishDate ? new Date(publishDate) : null;

            return {
                ...news,
                isOverdue: newsDate && newsDate <= now,
                timeUntilPublication: newsDate ? newsDate.getTime() - now.getTime() : null,
                publishDateTime: newsDate,
                formattedPublishDate: newsDate ? newsDate.toLocaleString('ru-RU', {
                    timeZone: 'Europe/Moscow',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Не указана'
            };
        });
    }
);

export const selectScheduledNewsGroupedByStatus = createSelector(
    [selectActiveScheduledNews],
    (scheduledNews) => {
        const grouped = scheduledNews.reduce((acc, news) => {
            const status = news.status || 'unknown';
            if (!acc[status]) acc[status] = [];
            acc[status].push(news);
            return acc;
        }, {});

        return {
            scheduled: grouped.scheduled || [],
            error: grouped.error || [],
            cancelled: grouped.cancelled || [],
            published: grouped.published || [],
            counts: {
                scheduled: (grouped.scheduled || []).length,
                error: (grouped.error || []).length,
                cancelled: (grouped.cancelled || []).length,
                published: (grouped.published || []).length,
                total: scheduledNews.length
            }
        };
    }
);

export const selectUpcomingIn24Hours = createSelector(
    [selectUpcomingScheduledNews],
    (upcomingNews) => {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        return upcomingNews.filter(news => {
            const publishDate = news.publishDate || news.scheduledDate;
            if (!publishDate) return false;

            const newsDate = new Date(publishDate);
            return newsDate <= next24Hours;
        });
    }
);