import { TvProgramList } from '@features/tvProgramList/ui/TvProgramList';
import styles from '@pages/TvProgramsPage/ui/TvProgramsPage.module.scss';
import { SideMenu } from '@widgets/SideMenu/index.js';
import { Sidebar } from '@widgets/Sidebar/index.js';
import { useEffect } from 'react';
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

    return (
        <div className={styles.TvProgramsPage}>
            <SideMenu />
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
