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
} from '@entities/news/model/newsSelectors';
import { NewsCard } from '@widgets/NewsCard';
import ReactPaginate from 'react-paginate';
import styles from './NewsList.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';

export const NewsList = React.memo(
    ({ newsList, selectedDate, onlyWithVideos = false }) => {
        const dispatch = useDispatch();

        const newsPerPage = useSelector(selectNewsPerPage);

        const paginatedNews = useSelector(
            (state) =>
                onlyWithVideos
                    ? selectPaginatedNewsWithVideosExcludingLast(state, newsPerPage)
                    : selectPaginatedNewsExcludingLast(state, newsPerPage),
            shallowEqual,
        );

        const pageCount = useSelector(
            (state) =>
                onlyWithVideos
                    ? selectPageCountWithVideosExcludingLast(state, newsPerPage)
                    : selectPageCountExcludingLast(state, newsPerPage),
            shallowEqual,
        );

        const isLoading = useSelector(selectLoading);

        const displayNewsList = newsList || paginatedNews;

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

        const newsListRef = useRef(null);

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

                    {!isLoading && pageCount > 1 && (
                        <ReactPaginate
                            previousLabel={'← Предыдущая'}
                            nextLabel={'Следующая →'}
                            breakLabel={'...'}
                            pageCount={pageCount}
                            marginPagesDisplayed={2}
                            pageRangeDisplayed={3}
                            onPageChange={handlePageClick}
                            containerClassName={styles.pagination}
                            activeClassName={styles.activePage}
                            pageLinkClassName={styles.pageLink}
                            previousLinkClassName={styles.pageLink}
                            nextLinkClassName={styles.pageLink}
                            breakLinkClassName={styles.pageLink}
                        />
                    )}
                </div>
            </div>
        );
    },
);
