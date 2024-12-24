import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styles from './AuthorDetailPage.module.scss';
import { Sidebar } from '@widgets/Sidebar/index.js';
import { selectNewsList, selectNewsLoading } from '@entities/news/model/newsSelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';
import { NewsCard } from '@widgets/NewsCard/index.js';
import defaultAvatar from '@assets/default-avatar.jpg';
import { Loader } from '@shared/ui/Loader/index.js';
import { AvatarModal } from '@features/userProfile/components/AvatarModal.jsx';

const AuthorDetailPage = React.memo(() => {
    const { authorId } = useParams();
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const newsList = useSelector(selectNewsList);
    const categories = useSelector(selectCategories);
    const loading = useSelector(selectNewsLoading);

    const authorNews = newsList.filter(news =>
        news.authorDetails && news.authorDetails.id === parseInt(authorId, 10)
    );

    const authorInfo = authorNews.length > 0 ? authorNews[0].authorDetails : null;

    useEffect(() => {
        if (newsList.length === 0) {
            dispatch(fetchAllNews());
        }
    }, [dispatch]);

    const handleAvatarClick = () => {
        setIsModalOpen(true);
    };

    if (!authorInfo) {
        return <div className={styles.error}>Автор не найден</div>;
    }

    if (loading) {
        return <div className={styles.loader}><Loader /></div>
    }

    return (
        <div className={styles.authorDetailPage}>
            <div className={styles.authorContainer}>
                <div className={styles.authorInfo}>
                    {authorInfo.avatarUrl && (
                        <div
                            className={styles.avatarContainer}
                            onClick={handleAvatarClick}
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={authorInfo.avatarUrl || defaultAvatar}
                                alt={authorInfo.username}
                                className={styles.avatarImage}
                            />
                        </div>
                    )}
                    <div className={styles.adminDetails}>
                        <h2>{authorInfo.username}</h2>
                        <p className={styles.adminRole}>Автор</p>
                        <p className={styles.adminRole}>Количество новостей от автора: {authorNews.length}</p>
                    </div>
                </div>

                <div className={styles.newsSection}>
                    <h2>Опубликованные новости</h2>
                    {authorNews.length > 0 ? (
                        <div className={styles.newsList}>
                            {authorNews.map((news) => (
                                <div key={news.id} className={styles.newsItem}>
                                    <NewsCard showDate={true} news={news} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noNews}>
                            Нет опубликованных новостей.
                        </div>
                    )}
                </div>
            </div>
            <Sidebar
                newsList={newsList}
                categories={categories}
            />
            <AvatarModal
                isModalOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                avatarUrl={authorInfo.avatarUrl}
            />
        </div>
    );
});

export default AuthorDetailPage;