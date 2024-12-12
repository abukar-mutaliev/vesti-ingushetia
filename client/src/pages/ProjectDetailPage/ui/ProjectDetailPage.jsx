import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchProjectById } from '@entities/projects/model/projectSlice';
import { Sidebar } from '@widgets/Sidebar';
import { selectCurrentProject } from '@entities/projects/model/projectSelectors';
import { fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { ProjectDetail } from '@features/ProjectDetail';
import styles from './ProjectDetailPage.module.scss';
import {
    selectNewsList,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';

const ProjectDetailPage = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const project = useSelector(selectCurrentProject, shallowEqual);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loadingNews = useSelector(selectNewsLoading, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        if (id && (!project || project.id !== id)) {
            dispatch(fetchProjectById(id));
        }
        if (newsList.length === 0) {
            dispatch(fetchAllNews());
        }
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, id, project]);

    if (!project) {
        return (
            <div className={styles.notFound}>
                Проект не найден. Пожалуйста, вернитесь назад и попробуйте
                снова.
            </div>
        );
    }

    return (
        <div className={styles.projectDetailPage}>
            <div className={styles.mainContent}>
                <ProjectDetail project={project} />
            </div>
            <div className={styles.sidebarContainer}>
                <Sidebar
                    newsList={newsList}
                    loading={loadingNews}
                    categories={categories}
                />
            </div>
        </div>
    );
};
export default ProjectDetailPage;
