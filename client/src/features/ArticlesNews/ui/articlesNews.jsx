import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectArticlesNews, selectNewsLoading, selectError } from '@entities/news/model/newsSelectors';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml.js';
import styles from './ArticlesNewsList.module.scss';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { Link } from 'react-router-dom';
import { Loader } from '@shared/ui/Loader/index.js';

export const ArticlesNewsList = () => {
    const dispatch = useDispatch();
    const articlesNews = useSelector(selectArticlesNews);
    const loading = useSelector(selectNewsLoading);
    const error = useSelector(selectError);

    useEffect(() => {
        if (articlesNews.length === 0 && !loading && !error) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, articlesNews.length, loading, error]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div>Ошибка загрузки новостей: {error}</div>;
    }

    if (articlesNews.length === 0) {
        return <div>Нет новостей в категории "Статьи".</div>;
    }

    return (
        <ul className={styles.newsList}>
            {articlesNews.map((news) => (
                <Link key={news.id} to={`/news/${news.id}`} className={styles.newsLink}>
                    <li className={styles.newsItem}>
                        {truncateHtmlToSentences(news.title, 1)}
                    </li>
                </Link>
            ))}
        </ul>
    );
};