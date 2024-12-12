import React, { useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
    fetchAuthorById,
    fetchNewsByAuthor,
} from '@entities/authors/model/authorSlice';
import {
    selectAuthor,
    selectNewsByAuthor,
    selectAuthorLoading,
} from '@entities/authors/model/authorSelectors';
import styles from './AuthorDetailPage.module.scss';
import { Sidebar } from '@widgets/Sidebar/index.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { NewsCard } from '@widgets/NewsCard/index.js';

const AuthorDetailPage = React.memo(() => {
    const { authorId } = useParams();
    const dispatch = useDispatch();

    const author = useSelector(selectAuthor, shallowEqual);
    const newsByAuthor = useSelector(selectNewsByAuthor, shallowEqual);
    const loading = useSelector(selectAuthorLoading);
    const newsList = useSelector(selectNewsList, shallowEqual);
    const categories = useSelector(selectCategories, shallowEqual);

    useEffect(() => {
        if (!author || author.id !== authorId) {
            dispatch(fetchAuthorById(authorId));
        }
        if (newsByAuthor.length === 0) {
            dispatch(fetchNewsByAuthor(authorId));
        }
        if (newsList.length === 0) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, authorId, author, newsByAuthor, newsList]);

    if (!author) {
        return <div className={styles.error}>Автор не найден</div>;
    }

    return (
        <div className={styles.authorDetailPage}>
            <div className={styles.authorContainer}>
                <div className={styles.authorInfo}>
                    <h2>{author.name}</h2>
                    <p>{author.bio || 'Информация об авторе отсутствует.'}</p>
                </div>
                <div className={styles.newsSection}>
                    <h2>Новости автора</h2>
                    {newsByAuthor && newsByAuthor.length > 0 ? (
                        <div className={styles.newsList}>
                            {newsByAuthor.map((news) => (
                                <div key={news.id} className={styles.newsItem}>
                                    <NewsCard showDate={true} news={news} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noNews}>
                            У данного автора пока нет новостей.
                        </div>
                    )}
                </div>
            </div>
            <Sidebar
                newsList={newsList}
                categories={categories}
                loading={loading}
            />
        </div>
    );
});
export default AuthorDetailPage;
