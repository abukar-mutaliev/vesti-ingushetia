import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import styles from './HomePage.module.scss';
import { SideMenu } from '@widgets/SideMenu/';
import { MainNews } from '@widgets/MainNews/';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar/';
import { fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { VideoSlider } from '@widgets/VideoSlider/index.js';
import { NewsCardDetailPage } from '@widgets/NewsCardDetailPage/index.js';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { FaTimes } from 'react-icons/fa';
import { SlArrowRight } from 'react-icons/sl';
import ReactPaginate from 'react-paginate';

const HomePage = () => {
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const newsList = useSelector(selectNewsList, shallowEqual);
    const categories = useSelector(selectCategories);

    const loadNews = useCallback(() => {
        if (!newsList.length) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, newsList.length]);

    const loadCategories = useCallback(() => {
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    useEffect(() => {
        loadNews();
        loadCategories();
    }, [loadNews, loadCategories]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 6;

    const pageCount = Math.ceil(newsList.length / itemsPerPage);

    const currentNews = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return newsList.slice(start, start + itemsPerPage);
    }, [currentPage, newsList, itemsPerPage]);

    const newsContainerRef = useRef(null);

    const handlePageClick = useCallback(({ selected }) => {
        setCurrentPage(selected);
        if (newsContainerRef.current) {
            const topOffset = newsContainerRef.current.offsetTop - 150;
            window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
    }, []);

    return (
        <div>
            <div className={styles.homePage}>
                {isMenuOpen && (
                    <div className={styles.backdrop} onClick={closeMenu}></div>
                )}

                <div
                    className={`${styles.sideMenu} ${isMenuOpen ? styles.open : ''}`}
                >
                    <button className={styles.closeButton} onClick={closeMenu}>
                        <FaTimes size={20} />
                    </button>
                    <SideMenu onCategoryClick={closeMenu} />
                </div>
                <div className={styles.mainContent}>
                    <div className={styles.mobileMenuIcon}>
                        <SlArrowRight size={20} onClick={toggleMenu} />
                    </div>
                    <MainNews />
                    <NewsList newsList={newsList} />
                </div>
                <Sidebar categories={categories} newsList={newsList} />
            </div>
            <div className={styles.videoSliderContainer}>
                <VideoSlider />
            </div>
            <div className={styles.newsCardContainer} ref={newsContainerRef}>
                <h2>Также читайте</h2>
                <div className={styles.newsGrid}>
                    {currentNews.map((newsItem) => (
                        <NewsCardDetailPage key={newsItem.id} news={newsItem} />
                    ))}
                </div>
                {pageCount > 1 && (
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
};

export default HomePage;
