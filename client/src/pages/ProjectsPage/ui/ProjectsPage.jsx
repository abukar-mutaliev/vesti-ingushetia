import React, { useEffect } from 'react';
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

export const ProjectsPage = () => {
    const dispatch = useDispatch();
    const projects = useSelector(selectProjectList);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loadingNews = useSelector(selectNewsLoading, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        if (projects.length === 0) {
            dispatch(fetchAllProjects());
        }
        if (newsList.length === 0) {
            dispatch(fetchAllNews());
        }
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch]);

    return (
        <div className={styles.projectsPage}>
            <div className={styles.projectsPageContainer}>
                <h2 className={styles.projectsTitle}>Наши проекты</h2>
                <div className={styles.projectsGrid}>
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
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
