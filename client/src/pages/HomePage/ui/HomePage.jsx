import { useEffect, useCallback } from 'react';
import styles from './HomePage.module.scss';
import { SideMenu } from '@widgets/SideMenu/';
import { MainNews } from '@widgets/MainNews/';
import { NewsList } from '@features/newsList';
import { Sidebar } from '@widgets/Sidebar/';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import {
    selectNewsList,
    selectNewsLoading,
    selectNewsListExcludingLast,
    selectRandomizedNewsList,
} from '@entities/news/model/newsSelectors.js';

import { useDispatch, useSelector } from 'react-redux';
import { ProjectsSlider } from '@features/projects/ProjectsSlider/';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { Loader } from '@shared/ui/Loader/index.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';

const HomePage = () => {
    const dispatch = useDispatch();

    const newsList = useSelector(selectNewsList);
    const newsListExcludingLast = useSelector(selectNewsListExcludingLast);
    const randomizedNewsList = useSelector(selectRandomizedNewsList);
    const categories = useSelector(selectCategories);
    const loading = useSelector(selectNewsLoading);

    const loadCategories = useCallback(() => {
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    useEffect(() => {
        loadCategories();
        dispatch(fetchAllNews());
    }, [loadCategories, dispatch]);

    if (loading && newsList.length === 0) {
        return (
            <div className={styles.homePageLoader}>
                <Loader />
            </div>
        );
    }

    return (
        <div className={styles.homePage}>
            <div className={styles.homePageContainer}>
                <SideMenu />
                <div className={styles.mainContent}>
                    {newsList.length > 0 && (
                        <MainNews news={newsList[0]}/>
                    )}
                    <NewsList
                        newsList={newsListExcludingLast}
                        excludeLastNews={true}
                    />
                </div>
                <div className={styles.sidebarContainer}>
                    <Sidebar
                        categories={categories}
                        newsList={randomizedNewsList}
                        showElectionsBanner
                    />
                </div>
            </div>
            <div className={styles.projectsSliderContainer}>
                <ProjectsSlider/>
            </div>
        </div>
    );
};

export default HomePage;
