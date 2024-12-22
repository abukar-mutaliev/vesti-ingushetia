import { memo, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useParams } from 'react-router-dom';
import styles from './ProjectDetailPage.module.scss';
import { Sidebar } from '@widgets/Sidebar';
import { ProjectDetail } from '@features/projectDetail';
import {
    fetchProjectById,
    fetchAllProjects,
} from '@entities/projects/model/projectSlice';
import { fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import {
    selectCurrentProject,
    selectProjectList,
    selectProjectsLoading,
} from '@entities/projects/model/projectSelectors';
import {
    selectNewsList,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import { Loader } from '@shared/ui/Loader';
import { ProjectsSlider } from '@features/projects/ProjectsSlider';

const ProjectDetailPage = memo(() => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const projectId = id;

    const currentProject = useSelector(selectCurrentProject, shallowEqual);
    const projectList = useSelector(selectProjectList, shallowEqual);
    const loadingProjects = useSelector(selectProjectsLoading, shallowEqual);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loadingNews = useSelector(selectNewsLoading, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        if (projectId) {
            dispatch(fetchProjectById(projectId));
        }
    }, [dispatch, projectId]);

    useEffect(() => {
        if (projectList.length === 0 && !loadingProjects) {
            dispatch(fetchAllProjects());
        }
    }, [dispatch, projectList, loadingProjects]);

    useEffect(() => {
        if (newsList.length === 0 && !loadingNews) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, newsList, loadingNews]);

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (loadingProjects || !currentProject) {
        return <Loader />;
    }

    return (
        <div className={styles.projectDetailPage}>
            <div className={styles.projectDetailPageContainer}>
                <ProjectDetail
                    project={currentProject}
                    loading={loadingProjects}
                />
                <div className={styles.sidebarContainer}>
                    <Sidebar
                        newsList={newsList}
                        loading={loadingNews}
                        categories={categories}
                    />
                </div>
            </div>
            <div className={styles.videoSliderContainer}>
                <ProjectsSlider />
            </div>
        </div>
    );
});

export default ProjectDetailPage;
