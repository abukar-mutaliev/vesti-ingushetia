import { memo, useEffect } from 'react';
import styles from './NewsDetailPage.module.scss';
import { Sidebar } from '@widgets/Sidebar';
import { NewsDetail } from '@features/newsDetail';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchNewsById, fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { useParams } from 'react-router-dom';

import {
    selectNewsList,
    selectNewsByIdLoading,
    selectNewsLoading,
    selectNewsById,
} from '@entities/news/model/newsSelectors';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import { selectCommentsByNewsId } from '@entities/comments/model/commentSelectors.js';
import { fetchCommentsForNews } from '@entities/comments/model/commentsSlice.js';
import { Loader } from '@shared/ui/Loader/index.js';
import { ProjectsSlider } from '@features/projects/ProjectsSlider/index.js';

const NewsDetailPage = memo(() => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const newsId = id;

    const currentNews = useSelector((state) => selectNewsById(state, newsId), shallowEqual);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loadingNews = useSelector(selectNewsLoading, shallowEqual);
    const loadingNewsById = useSelector(selectNewsByIdLoading, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);
    const comments = useSelector((state) => selectCommentsByNewsId(state, newsId), shallowEqual);

    useEffect(() => {
        if (id && (!currentNews || currentNews.id !== parseInt(newsId, 10))) {
            dispatch(fetchNewsById(newsId));
        }
        if (newsList.length === 0) {
            dispatch(fetchAllNews());
        }
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
        if (comments.length === 0) {
            dispatch(fetchCommentsForNews(newsId));
        }
    }, [dispatch, newsId, currentNews, newsList.length, categories.length, comments.length]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!currentNews || loadingNewsById || loadingNews) {
        return <Loader />;
    }

    return (
        <div className={styles.newsDetailPage}>
            <div className={styles.newsDetailPageContainer}>
                <NewsDetail
                    newsId={newsId}
                    news={currentNews}
                    loading={loadingNewsById}
                    comments={comments}
                />
                <div className={styles.sidebarContainer}>
                    <Sidebar
                        newsList={newsList.filter(news => news.id !== parseInt(newsId, 10))}
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
export default NewsDetailPage;
