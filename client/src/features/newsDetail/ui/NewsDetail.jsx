import React, { memo, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { SocialIcons } from '@shared/ui/SocialIcons';
import { CommentSection } from '@entities/comments/ui/CommentSection';
import { selectCommentsByNewsId } from '@entities/comments/model/commentSelectors';
import { fetchCommentsForNews } from '@entities/comments/model/commentsSlice.js';
import DOMPurify from 'dompurify';
import { Loader } from '@shared/ui/Loader/index.js';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import defaultImage from '@assets/default.jpg';
import styles from './NewsDetail.module.scss';

export const NewsDetail = memo(
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

        const videoMedia = useMemo(() => {
            return news.mediaFiles?.find((media) => media.type === 'video') || null;
        }, [news.mediaFiles]);

        const imageMedia = useMemo(() => {
            return news.mediaFiles?.find((media) => media.type === 'image') || null;
        }, [news.mediaFiles]);

        const imageUrl = useMemo(() => {
            return imageMedia?.url || defaultImage;
        }, [imageMedia]);

        const getVideoEmbedUrl = (videoUrl) => {
            if (!videoUrl) return null;

            const isYouTube =
                videoUrl.includes('youtube.com/watch?v=') ||
                videoUrl.includes('youtu.be/');
            if (isYouTube) {
                let videoId = '';
                if (videoUrl.includes('watch?v=')) {
                    const urlObj = new URL(videoUrl);
                    videoId = urlObj.searchParams.get('v');
                } else {
                    const parts = videoUrl.split('/');
                    videoId = parts.pop();
                }
                return `https://www.youtube.com/embed/${videoId}`;
            }

            const isRutube = videoUrl.includes('rutube.ru/video/');
            if (isRutube) {
                const parts = videoUrl.split('/').filter(Boolean);
                const videoId = parts[parts.length - 1];
                return `https://rutube.ru/play/embed/${videoId}`;
            }
            return null;
        };

        const embedUrl = useMemo(() => {
            return getVideoEmbedUrl(videoMedia?.url);
        }, [videoMedia]);

        const processedContent = useMemo(() => {
            let content = DOMPurify.sanitize(news.content);
            content = highlightKeywordsInHtml(content, '');
            content = DOMPurify.sanitize(content);
            return content;
        }, [news.content]);

        const otherMediaFiles = useMemo(() => {
            return news.mediaFiles?.filter((m) => m.type === 'image') || [];
        }, [news.mediaFiles]);

        const displayDate = useMemo(() => {
            if (news.publishDate) {
                const date = new Date(news.publishDate);
                if (!isNaN(date)) {
                    return date;
                }
            }
            return new Date(news.createdAt);
        }, [news.publishDate, news.createdAt]);

        const formattedDate = useMemo(() => {
            return displayDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }, [displayDate]);

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
                    <span>{formattedDate}</span>
                    <div className={styles.views}>
                        <FaEye size={10} /> {news.views}
                    </div>
                </div>

                <div className={styles.mediaSection}>
                    {embedUrl ? (
                        <div className={styles.videoWrapper}>
                            <iframe
                                width="560"
                                height="315"
                                src={embedUrl}
                                className={styles.newsImage}
                                frameBorder="0"
                                allowFullScreen
                                title="Видео"
                            ></iframe>
                        </div>
                    ) : (
                        <div className={styles.imageWrapper}>
                            <img
                                src={imageUrl}
                                alt={news.title}
                                className={styles.newsImage}
                                loading="lazy"
                                onError={(e) => (e.target.src = defaultImage)}
                            />
                        </div>
                    )}
                </div>

                <div className={styles.newsContentWrapper}>
                    <SocialIcons />
                    <div className={styles.content}>
                        <div
                            className={styles.paragraph}
                            dangerouslySetInnerHTML={{
                                __html: processedContent,
                            }}
                        />

                        {otherMediaFiles.length > 0 && (
                            <div className={styles.otherMediaWrapper}>
                                {otherMediaFiles.map((media) => (
                                    <div key={media.id} className={styles.imageWrapper}>
                                        <img
                                            src={media.url}
                                            alt={news.title}
                                            className={styles.newsImage}
                                            loading="lazy"
                                            onError={(e) => (e.target.src = defaultImage)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
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
    }
);
