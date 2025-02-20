import { memo, useEffect, useMemo } from 'react';
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
import styles from './NewsDetail.module.scss';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';
import { Helmet } from 'react-helmet-async';
import defaultOgImage from '@assets/default.jpg';

export const NewsDetail = memo(
    ({ news, loading, newsId, userId, authorName }) => {
        const dispatch = useDispatch();
        const comments = useSelector((state) =>
            selectCommentsByNewsId(state, newsId),
        );

        useEffect(() => {
            if (!news) {
                dispatch(fetchAllNews());
            }
            dispatch(fetchCommentsForNews(newsId));
        }, [dispatch, newsId, news]);

        const videoMedia = useMemo(() => {
            return (
                news?.mediaFiles?.find((media) => media.type === 'video') ||
                null
            );
        }, [news?.mediaFiles]);

        const imageMedia = useMemo(() => {
            return (
                news?.mediaFiles?.find((media) => media.type === 'image') ||
                null
            );
        }, [news?.mediaFiles]);

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
            let content = DOMPurify.sanitize(news?.content || '');
            content = highlightKeywordsInHtml(content, '');
            content = DOMPurify.sanitize(content);
            return content;
        }, [news?.content]);

        const otherMediaFiles = useMemo(() => {
            return (
                news?.mediaFiles?.filter(
                    (m) => m.type === 'image' && m.id !== imageMedia?.id,
                ) || []
            );
        }, [news?.mediaFiles, imageMedia]);

        const displayDate = useMemo(() => {
            if (news?.publishDate) {
                const date = new Date(news.publishDate);
                if (!isNaN(date)) {
                    return date;
                }
            }
            return news?.createdAt ? new Date(news.createdAt) : new Date();
        }, [news?.publishDate, news?.createdAt]);

        const formattedDate = useMemo(() => {
            return displayDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }, [displayDate]);

        const ogImage = useMemo(() => {
            if (imageMedia?.url) {
                return new URL(imageMedia.url, window.location.origin).toString();
            }
            return new URL(defaultOgImage, window.location.origin).toString();
        }, [imageMedia]);

        if (loading || !news) {
            return <Loader />;
        }

        return (
            <>
                <Helmet>
                    {/* Оставляем только уникальные метатеги */}
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <title>{news.title} - Вести Ингушетии</title>
                </Helmet>
                <article
                    className={styles.newsDetail}
                    itemScope
                    itemType="http://schema.org/NewsArticle"
                >
                    <meta
                        itemProp="datePublished"
                        content={news.publishDate || news.createdAt}
                    />
                    <meta
                        itemProp="dateModified"
                        content={
                            news.updatedAt || news.publishDate || news.createdAt
                        }
                    />
                    <meta
                        itemProp="author"
                        content={news.authorDetails?.username || 'Редакция'}
                    />

                    <h1 className={styles.title} itemProp="headline">
                        {news.title}
                    </h1>

                    <div className={styles.newsDetail}>
                        <div className={styles.meta}>
                            <span>
                                Автор:{' '}
                                {news.authorDetails ? (
                                    <Link
                                        to={`/author/${news.authorDetails.id}`}
                                    >
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
                                <MediaElement
                                    imageUrl={imageMedia?.url}
                                    videoUrl={videoMedia?.url}
                                    alt={news.title}
                                    className={styles.newsImage}
                                    playIconSize={70}
                                    showPlayIcon={false}
                                />
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
                                            <div
                                                key={media.id}
                                                className={styles.imageWrapper}
                                            >
                                                <MediaElement
                                                    imageUrl={media.url}
                                                    alt={news.title}
                                                    className={styles.newsImage}
                                                    showPlayIcon={false}
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
                </article>
            </>
        );
    },
);