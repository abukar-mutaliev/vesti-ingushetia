import { useEffect, useState, useCallback } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchCategories, fetchNewsByCategory } from '@entities/categories/model/categorySlice.js';
import { Sidebar } from '@widgets/Sidebar';
import styles from './CategoryPage.module.scss';
import {
    selectNewsByCategory,
    selectCategories,
} from '@entities/categories/model/categorySelectors.js';
import { NewsCard } from '@widgets/NewsCard/index.js';
import {
    selectNewsList,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import ReactPaginate from 'react-paginate';
import { SideMenu } from '@widgets/SideMenu/index.js';
import { FaTimes } from 'react-icons/fa';
import { SlArrowRight } from 'react-icons/sl';
import { Loader } from '@shared/ui/Loader/index.js';

const CategoryPage = () => {
    const { categoryId } = useParams();
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const newsByCategory = useSelector(
        (state) => selectNewsByCategory(state, categoryId),
        shallowEqual,
    );

    const categories = useSelector(selectCategories, shallowEqual);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loading = useSelector(selectNewsLoading, shallowEqual);

    const currentCategory = categories.find(
        (cat) => cat.id === parseInt(categoryId),
    );
    const [currentPage, setCurrentPage] = useState(0);
    const newsPerPage = 10;

    const pageCount = Math.ceil(newsByCategory.length / newsPerPage);

    const handlePageClick = useCallback(({ selected }) => {
        setCurrentPage(selected);
        window.scrollTo(0, 0);
    }, []);

    const currentNews = [...newsByCategory]
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(currentPage * newsPerPage, (currentPage + 1) * newsPerPage);

    useEffect(() => {
        if (newsList.length === 0) {
            dispatch(fetchAllNews());
        }

        dispatch(fetchNewsByCategory(categoryId));
    }, [dispatch, categoryId, newsList.length]);

    useEffect(() => {
        setCurrentPage(0);
    }, [categoryId]);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const isLoading = loading || !categories || !newsList;

    const noNewsMessage = !isLoading && newsByCategory.length === 0;

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className={styles.categoryPage}>
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
            <div className={styles.content}>
                <div className={styles.mobileMenuIcon}>
                    <SlArrowRight size={20} onClick={toggleMenu} />
                </div>
                <h1>
                    {currentCategory
                        ? currentCategory.name
                        : 'Новости категории'}
                </h1>
                <div className={styles.newsList}>
                    {noNewsMessage ? (
                        <div>Новостей в этой категории пока нет.</div>
                    ) : (
                        currentNews.map((news) => (
                            <NewsCard key={news.id} news={news} />
                        ))
                    )}
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
                        forcePage={currentPage}
                        containerClassName={styles.pagination}
                        activeClassName={styles.activePage}
                        pageLinkClassName={styles.pageLink}
                        previousLinkClassName={styles.pageLink}
                        nextLinkClassName={styles.pageLink}
                        breakLinkClassName={styles.pageLink}
                    />
                )}
            </div>

            {!isLoading && (
                <Sidebar
                    newsList={newsList}
                    categories={categories}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default CategoryPage;
