import { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllProjects } from '@entities/projects/model/projectSlice';
import styles from './ProjectsPage.module.scss';
import { ProjectCard } from '@entities/projects/ui/ProjectCard/index.js';
import {
    selectProjectList,
    selectProjectsLoading,
    selectProjectsError,
} from '@entities/projects/model/projectSelectors.js';
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
    const projects = useSelector(selectProjectList);
    const newsList = useSelector(selectNewsList);
    const loadingNews = useSelector(selectNewsLoading);
    const categories = useSelector(selectCategories);
    const projectsLoading = useSelector(selectProjectsLoading);
    const projectsError = useSelector(selectProjectsError);
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
    }, [
        dispatch,
        projects.length,
        newsList.length,
        loadingNews,
        categories.length,
    ]);

    if (projectsLoading || loadingNews) {
        return <Loader />;
    }

    if (projectsError) {
        return <div className={styles.error}>{projectsError}</div>;
    }

    return (
        <div className={styles.projectsPage}>
            <div className={styles.projectsPageContainer}>
                <h2 className={styles.projectsTitle}>Наши проекты</h2>
                <div className={styles.projectsGrid}>
                    {projects.length > 0 ? (
                        projects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className={styles.projectLink}
                            >
                                <ProjectCard project={project} />
                            </Link>
                        ))
                    ) : (
                        <div>Проекты не найдены</div>
                    )}
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
