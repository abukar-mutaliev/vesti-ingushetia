import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    selectArticlesNews,
    selectNewsLoading,
    selectError, selectInitialLoad,
} from '@entities/news/model/newsSelectors';
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
    const initialLoad = useSelector(selectInitialLoad);

    useEffect(() => {
        if (!initialLoad && !loading && !error) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, initialLoad, loading, error]);

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div>Ошибка загрузки новостей: {error}</div>;
    }

    if (articlesNews.length === 0) {
        return <div> </div>;
    }

    return (
        <ul className={styles.newsList}>
            {articlesNews.map((news) => (
                <li key={news.id} className={styles.newsItem}>
                    <Link to={`/news/${news.id}`} className={styles.newsLink}>
                        {truncateHtmlToSentences(news.title, 1)}
                    </Link>
                </li>
            ))}
        </ul>
    );
};
