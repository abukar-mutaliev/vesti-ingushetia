import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { fetchAllProjects } from '@entities/projects/model/projectSlice';
import styles from './ProjectsPage.module.scss';
import { ProjectCard } from '@entities/projects/ui/ProjectCard/index.js';
import { selectProjectList } from '@entities/projects/model/projectSelectors.js';
import { Sidebar } from '@widgets/Sidebar/index.js';
import {
    selectNewsList,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { fetchCategories } from '@entities/categories/model/categorySlice.js';
import { Loader } from '@shared/ui/Loader/index.js';
import { Link } from 'react-router-dom';

const ProjectsPage = () => {
    const dispatch = useDispatch();
    const projects = useSelector(selectProjectList, shallowEqual);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loadingNews = useSelector(selectNewsLoading, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);
    const memoizedNewsList = useMemo(() => newsList, [newsList]);

    useEffect(() => {
        if (!projects.length) {
            dispatch(fetchAllProjects());
        }
        if (!newsList.length && !loadingNews) {
            dispatch(fetchAllNews());
        }
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [dispatch]);

    if (!projects.length || loadingNews) {
        return <Loader />;
    }

    return (
        <div className={styles.projectsPage}>
            <div className={styles.projectsPageContainer}>
                <h2 className={styles.projectsTitle}>Наши проекты</h2>
                <div className={styles.projectsGrid}>
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                        >
                            <ProjectCard key={project.id} project={project} />
                        </Link>
                    ))}
                </div>
            </div>
            <div className={styles.sidebarContainer}>
                <Sidebar
                    newsList={memoizedNewsList}
                    loading={loadingNews}
                    categories={categories}
                />
            </div>
        </div>
    );
};
export default ProjectsPage;
