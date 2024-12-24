import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setPage } from '@entities/news/model/newsSlice';
import {
    selectPaginatedNewsExcludingLast,
    selectPageCountExcludingLast,
    selectPaginatedNewsWithVideosExcludingLast,
    selectPageCountWithVideosExcludingLast,
    selectLoading,
    selectNewsPerPage,
    selectPaginatedNewsWithVideos,
    selectPaginatedNews,
    selectPageCountWithVideos, selectPageCount,
} from '@entities/news/model/newsSelectors';
import { NewsCard } from '@widgets/NewsCard';
import ReactPaginate from 'react-paginate';
import styles from './NewsList.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';

export const NewsList = React.memo(
    ({ newsList, selectedDate, onlyWithVideos = false, excludeLastNews = true }) => {
        const dispatch = useDispatch();
        const newsPerPage = useSelector(selectNewsPerPage);
        const currentPage = useSelector(state => state.news.currentPage);
        const isLoading = useSelector(selectLoading);
        const newsListRef = useRef(null);

        const paginatedNews = useSelector(
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

        const pageCount = useSelector(
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
                const startIndex = currentPage * newsPerPage;
                const endIndex = startIndex + newsPerPage;
                return newsList.slice(startIndex, endIndex);
            }
            return paginatedNews;
        }, [newsList, currentPage, newsPerPage, paginatedNews]);

        const getCustomPageCount = useCallback(() => {
            if (newsList) {
                return Math.ceil(newsList.length / newsPerPage);
            }
            return pageCount;
        }, [newsList, newsPerPage, pageCount]);

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
            if (selectedDate) {
                dispatch(setPage(0));
            }
        }, [selectedDate, dispatch]);

        const formatDate = useCallback((dateString) => {
            if (!dateString) return 'ВСЕ НОВОСТИ';
            const date = new Date(dateString);
            return `НОВОСТИ ЗА ${date
            .toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })
            .toUpperCase()}`;
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