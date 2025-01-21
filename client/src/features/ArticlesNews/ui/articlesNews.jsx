import { useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import {
    selectArticlesNews,
    selectNewsLoading,
    selectError,
    selectInitialLoad,
} from '@entities/news/model/newsSelectors';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml.js';
import styles from './ArticlesNewsList.module.scss';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { Link } from 'react-router-dom';
import { Loader } from '@shared/ui/Loader/index.js';
import {selectCategories} from "@entities/categories/model/categorySelectors.js";

export const ArticlesNewsList = () => {
    const dispatch = useDispatch();
    const articlesNews = useSelector(selectArticlesNews);
    const loading = useSelector(selectNewsLoading);
    const error = useSelector(selectError);
    const initialLoad = useSelector(selectInitialLoad);
    const categories = useSelector(selectCategories, shallowEqual);

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
        return <div>Нет новостей</div>;
    }

    const limitedNews = articlesNews.slice(0, 25);

    const articlesCategory = categories.find(
        (category) => category.name.toLowerCase() === 'статьи'
    );

    return (
        <div className={styles.container}>
            <ul className={styles.newsList}>
                {limitedNews.map((news) => (
                    <li key={news.id} className={styles.newsItem}>
                        <Link to={`/news/${news.id}`} className={styles.newsLink}>
                            {truncateHtmlToSentences(news.title, 1)}
                        </Link>
                    </li>
                ))}
            </ul>
            {articlesCategory && (
                <div className={styles.archiveButton}>
                    <Link
                        to={`/categories/${articlesCategory.id}`}
                        className={styles.archiveLink}
                    >
                        Перейти к архиву статей
                    </Link>
                </div>
            )}
        </div>
    );
};
