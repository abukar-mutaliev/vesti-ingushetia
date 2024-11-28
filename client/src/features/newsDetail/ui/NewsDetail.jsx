import React, { useEffect, useMemo } from 'react';
import styles from './NewsDetail.module.scss';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { VideoPlayer } from '@shared/ui/VideoPlayer';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { SocialIcons } from '@shared/ui/SocialIcons';
import { CommentSection } from '@entities/comments/ui/CommentSection';
import { selectCommentsByNewsId } from '@entities/comments/model/commentSelectors';
import { fetchCommentsForNews } from '@entities/comments/model/commentsSlice.js';
import DOMPurify from 'dompurify';
import { Loader } from '@shared/ui/Loader/index.js';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';

export const NewsDetail = React.memo(
    ({ news, loading, newsId, userId, authorName }) => {
        const dispatch = useDispatch();
        const comments = useSelector(selectCommentsByNewsId(newsId));

        useEffect(() => {
            if (!news) {
                dispatch(fetchAllNews());
            }
            dispatch(fetchCommentsForNews(newsId));
        }, [dispatch, newsId, news]);

        if (loading || !news) {
            return <Loader />;
        }

        const { firstImage, firstVideo, otherMediaFiles } = useMemo(() => {
            let firstImage = null;
            let firstVideo = null;
            const otherMediaFiles = [];

            for (const media of news.mediaFiles || []) {
                if (!firstVideo && media.type === 'video') {
                    firstVideo = media;
                } else if (!firstImage && media.type === 'image') {
                    firstImage = media;
                } else {
                    otherMediaFiles.push(media);
                }
            }

            return { firstImage, firstVideo, otherMediaFiles };
        }, [news.mediaFiles]);

        const processedContent = useMemo(() => {
            let content = DOMPurify.sanitize(news.content);
            content = highlightKeywordsInHtml(content, '');
            content = DOMPurify.sanitize(content);
            return content;
        }, [news.content]);

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
                            videoUrl={firstVideo.url}
                            posterUrl={firstImage?.url || ''}
                        />
                    </div>
                ) : (
                    firstImage && (
                        <div className={styles.imageWrapper}>
                            <img
                                src={firstImage.url}
                                alt={news.title}
                                className={styles.newsImage}
                            />
                        </div>
                    )
                )}

                <div className={styles.newsContentWrapper}>
                    <SocialIcons />
                    <div className={styles.content}>
                        <div
                            className={styles.paragraph}
                            dangerouslySetInnerHTML={{
                                __html: processedContent,
                            }}
                        />

                        <div className={styles.otherMediaWrapper}>
                            {otherMediaFiles.map((media) => {
                                if (media.type === 'image') {
                                    return (
                                        <div
                                            key={media.id}
                                            className={styles.imageWrapper}
                                        >
                                            <img
                                                src={media.url}
                                                alt={news.title}
                                                className={styles.newsImage}
                                            />
                                        </div>
                                    );
                                } else if (media.type === 'video') {
                                    return (
                                        <div
                                            key={media.id}
                                            className={styles.videoWrapper}
                                        >
                                            <VideoPlayer
                                                videoUrl={media.url}
                                                posterUrl={media.poster || ''}
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
