import React, { useEffect, useMemo } from 'react';
import styles from './NewsDetailPage.module.scss';
import { Sidebar } from '@widgets/Sidebar';
import { NewsDetail } from '@features/newsDetail';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchNewsById, fetchAllNews } from '@entities/news/model/newsSlice';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { useParams } from 'react-router-dom';

import {
    selectCurrentNews,
    selectNewsList,
    selectNewsByIdLoading,
    selectNewsLoading,
} from '@entities/news/model/newsSelectors';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import { VideoSlider } from '@widgets/VideoSlider/index.js';
import { NewsCardDetailPage } from '@widgets/NewsCardDetailPage/index.js';
import { selectCommentsByNewsId } from '@entities/comments/model/commentSelectors.js';
import { fetchCommentsForNews } from '@entities/comments/model/commentsSlice.js';
import { Loader } from '@shared/ui/Loader/index.js';

export const NewsDetailPage = React.memo(() => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const newsId = id;
    const currentNews = useSelector(selectCurrentNews, shallowEqual);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loadingNews = useSelector(selectNewsLoading, shallowEqual);
    const loadingNewsById = useSelector(selectNewsByIdLoading, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);
    const comments = useSelector(selectCommentsByNewsId(newsId));

    useEffect(() => {
        if (id && (!currentNews || currentNews.id !== newsId)) {
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
    }, [dispatch, newsId]);

    const shuffledNewsList = useMemo(() => {
        const newsListCopy = [...newsList];
        for (let i = newsListCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newsListCopy[i], newsListCopy[j]] = [
                newsListCopy[j],
                newsListCopy[i],
            ];
        }
        return newsListCopy.slice(0, 9);
    }, [newsList]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!newsList || loadingNewsById) {
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
                        newsList={newsList}
                        loading={loadingNews}
                        categories={categories}
                    />
                </div>
            </div>
            <div className={styles.videoSliderContainer}>
                <VideoSlider />
            </div>
            <div className={styles.newsCardContainer}>
                <h3>Так же читайте</h3>
                <div className={styles.newsGrid}>
                    {shuffledNewsList.map((newsItem) => (
                        <NewsCardDetailPage key={newsItem.id} news={newsItem} />
                    ))}
                </div>
            </div>
        </div>
    );
});
