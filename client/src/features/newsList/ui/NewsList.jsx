import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setPage } from '@entities/news/model/newsSlice';
import {
    selectPaginatedNews,
    selectPaginatedNewsWithVideos,
    selectPageCount,
    selectPageCountWithVideos,
} from '@entities/news/model/newsSelectors';
import { NewsCard } from '@widgets/NewsCard';
import ReactPaginate from 'react-paginate';
import styles from './NewsList.module.scss';

export const NewsList = React.memo(
    ({ selectedDate, onlyWithVideos = false }) => {
        const dispatch = useDispatch();

        const newsPerPage = 8;

        const currentNewsList = useSelector(
            (state) =>
                onlyWithVideos
                    ? selectPaginatedNewsWithVideos(state, newsPerPage)
                    : selectPaginatedNews(state, newsPerPage),
            shallowEqual,
        );

        const pageCount = useSelector(
            (state) =>
                onlyWithVideos
                    ? selectPageCountWithVideos(state, newsPerPage)
                    : selectPageCount(state, newsPerPage),
            shallowEqual,
        );

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
                    {currentNewsList.length > 0 ? (
                        currentNewsList.map((news) => (
                            <NewsCard key={news.id} news={news} />
                        ))
                    ) : (
                        <div>Новостей нет</div>
                    )}
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
                </div>
            </div>
        );
    },
);
