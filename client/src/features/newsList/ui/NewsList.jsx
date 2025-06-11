import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { filterNewsByDate, setPage } from '@entities/news/model/newsSlice';
import {
    selectPaginatedNewsExcludingLast,
    selectPageCountExcludingLast,
    selectPaginatedNewsWithVideosExcludingLast,
    selectPageCountWithVideosExcludingLast,
    selectNewsLoading,
    selectNewsPerPage,
    selectPaginatedNewsWithVideos,
    selectPaginatedNews,
    selectPageCountWithVideos,
    selectPageCount,
    selectSelectedDate,
} from '@entities/news/model/newsSelectors';
import { NewsCard } from '@widgets/NewsCard';
import ReactPaginate from 'react-paginate';
import styles from './NewsList.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import {formatMoscowTime} from "@shared/lib/TimeUtils/timeUtils.js";

export const NewsList = React.memo(
    ({ newsList, selectedDate, onlyWithVideos = false, excludeLastNews = true }) => {
        const dispatch = useDispatch();
        const newsPerPage = useSelector(selectNewsPerPage);
        const currentPage = useSelector(state => state.news.currentPage);
        const isLoading = useSelector(selectNewsLoading);
        const stateSelectedDate = useSelector(selectSelectedDate);
        const newsListRef = useRef(null);

        const effectiveDate = selectedDate || stateSelectedDate;

        const reduxPaginatedNews = useSelector(
            (state) => {
                if (!excludeLastNews) {
                    return onlyWithVideos
                        ? selectPaginatedNewsWithVideos(state)
                        : selectPaginatedNews(state);
                }
                return onlyWithVideos
                    ? selectPaginatedNewsWithVideosExcludingLast(state)
                    : selectPaginatedNewsExcludingLast(state);
            },
            shallowEqual,
        );

        const reduxPageCount = useSelector(
            (state) => {
                if (!excludeLastNews) {
                    return onlyWithVideos
                        ? selectPageCountWithVideos(state)
                        : selectPageCount(state);
                }
                return onlyWithVideos
                    ? selectPageCountWithVideosExcludingLast(state)
                    : selectPageCountExcludingLast(state);
            },
            shallowEqual,
        );

        const getPaginatedNewsList = useCallback(() => {
            if (newsList) {
                const sortedNewsList = [...newsList].sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
                const startIndex = currentPage * newsPerPage;
                const endIndex = startIndex + newsPerPage;
                return sortedNewsList.slice(startIndex, endIndex);
            }
            return reduxPaginatedNews;
        }, [newsList, currentPage, newsPerPage, reduxPaginatedNews]);

        const getCustomPageCount = useCallback(() => {
            if (newsList) {
                return Math.ceil(newsList.length / newsPerPage);
            }
            return reduxPageCount;
        }, [newsList, newsPerPage, reduxPageCount]);

        const handlePageClick = useCallback(
            ({ selected }) => {
                dispatch(setPage(selected));
                if (newsListRef.current) {
                    const topOffset = newsListRef.current.offsetTop - 150;
                    window.scrollTo({ top: topOffset, behavior: 'smooth' });
                }
            },
            [dispatch],
        );

        useEffect(() => {
            if (effectiveDate && !newsList) {
                dispatch(filterNewsByDate(effectiveDate));
            }
        }, [effectiveDate, dispatch, newsList]);

        const formatDate = useCallback((dateString) => {
            if (!dateString) return 'ВСЕ НОВОСТИ';

            return `НОВОСТИ ЗА ${formatMoscowTime(dateString, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).toUpperCase()}`;
        }, []);

        const displayNewsList = getPaginatedNewsList();
        const actualPageCount = getCustomPageCount();

        return (
            <div className={styles.newsListContainer}>
                <div className={styles.newsList} ref={newsListRef}>
                    <h3>{formatDate(selectedDate)}</h3>

                    {isLoading ? (
                        <div className={styles.newsListLoader}>
                            <Loader />
                        </div>
                    ) : displayNewsList.length > 0 ? (
                        displayNewsList.map((news) => (
                            <NewsCard key={news.id} news={news} />
                        ))
                    ) : (
                        <div className={styles.newsListLoader}>Новостей нет</div>
                    )}

                    {!isLoading && actualPageCount > 1 && (
                        <ReactPaginate
                            previousLabel={'← Предыдущая'}
                            nextLabel={'Следующая →'}
                            breakLabel={'...'}
                            pageCount={actualPageCount}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={3}
                            onPageChange={handlePageClick}
                            containerClassName={styles.pagination}
                            activeClassName={styles.activePage}
                            pageLinkClassName={styles.pageLink}
                            previousLinkClassName={styles.pageLink}
                            nextLinkClassName={styles.pageLink}
                            breakLinkClassName={styles.pageLink}
                            forcePage={currentPage}
                        />
                    )}
                </div>
            </div>
        );
    },
);