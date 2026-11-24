import { TvProgramList } from '@features/tvProgramList/ui/TvProgramList';
import styles from '@pages/TvProgramsPage/ui/TvProgramsPage.module.scss';
import { SlArrowRight } from 'react-icons/sl';
import { FaTimes } from 'react-icons/fa';
import { SideMenu } from '@widgets/SideMenu/index.js';
import { Sidebar } from '@widgets/Sidebar/index.js';
import { useEffect, useState } from 'react';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import {
    selectNewsList,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors.js';

const TvProgramsPage = () => {
    const dispatch = useDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const categories = useSelector(selectCategories, shallowEqual);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loadingNews = useSelector(selectNewsLoading);

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
        if (!newsList.length && !loadingNews) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, categories.length, newsList.length, loadingNews]);


    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <div className={styles.TvProgramsPage}>
            {isMenuOpen && (
                <div className={styles.backdrop} onClick={closeMenu}></div>
            )}
            <div className={styles.mobileMenuIcon}>
                <SlArrowRight size={20} onClick={toggleMenu} />
            </div>
            <div
                className={`${styles.sideMenu} ${isMenuOpen ? styles.open : ''}`}
            >
                <button className={styles.closeButton} onClick={closeMenu}>
                    <FaTimes size={20} />
                </button>
                <SideMenu onCategoryClick={closeMenu} />
            </div>
            <div className={styles.content}>
                <div className={styles.programColumn}>
                    <TvProgramList />
                </div>
                <div className={styles.sidebarWrapper}>
                    <Sidebar
                        categories={categories}
                        newsList={newsList}
                        showElectionsBanner
                    />
                </div>
            </div>
        </div>
    );
};
export default TvProgramsPage;
