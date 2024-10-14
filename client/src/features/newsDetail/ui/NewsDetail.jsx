import React, { useEffect } from 'react';
import styles from './NewsDetail.module.scss';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { VideoPlayer } from '../../../shared/ui/VideoPlayer';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { SocialIcons } from '@shared/ui/SocialIcons';
import { CommentSection } from '@entities/comments/ui/CommentSection';
import { selectCommentsByNewsId } from '@entities/comments/model/commentSelectors';
import { fetchCommentsForNews } from '@entities/comments/model/commentsSlice.js';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';

export const NewsDetail = React.memo(
    ({ news, loading, newsId, userId, authorName }) => {
        const dispatch = useDispatch();
        const comments = useSelector(selectCommentsByNewsId(newsId));

        useEffect(() => {
            dispatch(fetchAllNews());
            dispatch(fetchCommentsForNews(newsId));
        }, [dispatch, newsId]);

        if (!news) {
            return (
                <div
                    style={{
                        color: 'black',
                        marginTop: '15%',
                        width: '100rem',
                        textAlign: 'center',
                    }}
                >
                    Новость не найдена. Пожалуйста, вернитесь назад и попробуйте
                    снова.
                </div>
            );
        }

        const firstImage = news.mediaFiles?.find(
            (media) => media.type === 'image',
        );
        const firstVideo = news.mediaFiles?.find(
            (media) => media.type === 'video',
        );
        const otherMediaFiles = news.mediaFiles?.filter(
            (media) => media !== firstImage && media !== firstVideo,
        );

        return (
            <div className={styles.newsDetail}>
                <h1 className={styles.title}>{news.title}</h1>
                <div className={styles.meta}>
                    <span>
                        Автор:{' '}
                        {news.authorDetails ? (
                            <Link to={`/author/${news.authorDetails.id}`}>
                                {news.authorDetails.username}
                            </Link>
                        ) : (
                            'Неизвестный'
                        )}
                    </span>
                    <Link to={`/`}>Вести Ингушетии</Link>
                    <span>
                        {new Date(news.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </span>
                    <div className={styles.views}>
                        <FaEye size={10} /> {news.views}
                    </div>
                </div>

                {firstVideo ? (
                    <div className={styles.videoWrapper}>
                        <VideoPlayer
                            videoUrl={`http://localhost:5000/${firstVideo.url}`}
                            posterUrl={`http://localhost:5000/${firstImage?.url || ''}`}
                        />
                    </div>
                ) : (
                    firstImage && (
                        <div className={styles.imageWrapper}>
                            <img
                                src={`http://localhost:5000/${firstImage.url}`}
                                alt={news.title}
                                className={styles.newsImage}
                            />
                        </div>
                    )
                )}

                <div className={styles.newsContentWrapper}>
                    <SocialIcons />
                    <div className={styles.content}>
                        <div className={styles.paragraph}>
                            {highlightKeywordsInHtml(news.content, '')}
                        </div>

                        <div className={styles.otherMediaWrapper}>
                            {otherMediaFiles?.map((media, index) => {
                                if (media.type === 'image') {
                                    return (
                                        <div
                                            key={index}
                                            className={styles.imageWrapper}
                                        >
                                            <img
                                                src={`http://localhost:5000/${media.url}`}
                                                alt={news.title}
                                                className={styles.newsImage}
                                            />
                                        </div>
                                    );
                                } else if (media.type === 'video') {
                                    return (
                                        <div
                                            key={index}
                                            className={styles.videoWrapper}
                                        >
                                            <VideoPlayer
                                                videoUrl={`http://localhost:5000/${media.url}`}
                                                posterUrl={`http://localhost:5000/${media.poster || ''}`}
                                            />
                                        </div>
                                    );
                                } else {
                                    return null;
                                }
                            })}
                        </div>
                    </div>
                </div>

                <CommentSection
                    comments={comments}
                    newsId={newsId}
                    authorName={authorName}
                    userId={userId}
                />
            </div>
        );
    },
);
