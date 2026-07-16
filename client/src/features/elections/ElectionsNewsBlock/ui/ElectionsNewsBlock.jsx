import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactPaginate from 'react-paginate';
import { fetchElectionsNews } from '@entities/elections/model/electionsSlice';
import {
    selectElectionsNews,
    selectElectionsNewsStatus,
} from '@entities/elections/model/electionsSelectors';
import { selectNewsPerPage } from '@entities/news/model/newsSelectors';
import { NewsCard } from '@widgets/NewsCard';
import { Loader } from '@shared/ui/Loader/index.js';
import styles from './ElectionsNewsBlock.module.scss';

export const ElectionsNewsBlock = () => {
    const dispatch = useDispatch();
    const electionsNews = useSelector(selectElectionsNews);
    const newsStatus = useSelector(selectElectionsNewsStatus);
    const newsPerPage = useSelector(selectNewsPerPage);
    const [currentPage, setCurrentPage] = useState(0);
    const newsListRef = useRef(null);

    useEffect(() => {
        dispatch(fetchElectionsNews());
    }, [dispatch]);

    const pageCount = Math.ceil(electionsNews.length / newsPerPage);

    const paginatedNews = useMemo(() => {
        const startIndex = currentPage * newsPerPage;
        return electionsNews.slice(startIndex, startIndex + newsPerPage);
    }, [electionsNews, currentPage, newsPerPage]);

    useEffect(() => {
        if (pageCount > 0 && currentPage >= pageCount) {
            setCurrentPage(pageCount - 1);
        }
    }, [currentPage, pageCount]);

    const handlePageClick = useCallback(({ selected }) => {
        setCurrentPage(selected);

        if (newsListRef.current) {
            const topOffset = newsListRef.current.offsetTop - 150;
            window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
    }, []);

    const isLoading = newsStatus === 'loading' && electionsNews.length === 0;

    return (
        <section className={styles.block} aria-labelledby="elections-news-title">
            <h2 id="elections-news-title" className={styles.title}>
                Новости
            </h2>

            {isLoading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : electionsNews.length > 0 ? (
                <div className={styles.newsList} ref={newsListRef}>
                    {paginatedNews.map((news) => (
                        <NewsCard
                            key={news.id}
                            news={news}
                            showDate
                        />
                    ))}

                    {pageCount > 1 && (
                        <ReactPaginate
                            previousLabel="← Предыдущая"
                            nextLabel="Следующая →"
                            breakLabel="..."
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
                            forcePage={currentPage}
                        />
                    )}
                </div>
            ) : (
                <p className={styles.emptyState}>
                    Новости раздела «Выборы» пока не опубликованы
                </p>
            )}
        </section>
    );
};
