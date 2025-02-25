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

        // Определить категории для schema.org
        const schemaCategories = useMemo(() => {
            return news?.categories?.map(cat => cat.name).join(', ') || 'Новости';
        }, [news?.categories]);

        if (loading || !news) {
            return <Loader />;
        }

        return (
            <>
                <Helmet>
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <meta name="description" content={news.description || news.title} />
                    <meta name="keywords" content={`новости, Ингушетия, ГТРК, ${schemaCategories}`} />
                    <meta property="og:title" content={news.title} />
                    <meta property="og:description" content={news.description || news.title} />
                    <meta property="og:image" content={ogImage} />
                    <meta property="og:type" content="article" />
                    <meta property="og:locale" content="ru_RU" />
                    <meta property="article:published_time" content={news.publishDate || news.createdAt} />
                    <meta property="article:author" content={news.authorDetails?.username || 'Редакция'} />
                    <title>{news.title} - Вести Ингушетии</title>

                    {/* Yandex-specific meta tags */}
                    <meta name="yandex-verification" content="ваш-код-верификации" />
                    <link rel="canonical" href={`${window.location.origin}/news/${newsId}`} />
                </Helmet>

                {/* Расширенный Schema.org разметка для Яндекс */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "http://schema.org",
                        "@type": "NewsArticle",
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": `${window.location.origin}/news/${newsId}`
                        },
                        "headline": news.title,
                        "description": news.description || news.title,
                        "image": imageMedia?.url ? [new URL(imageMedia.url, window.location.origin).toString()] :
                            [new URL(defaultOgImage, window.location.origin).toString()],
                        "author": {
                            "@type": "Person",
                            "name": news.authorDetails?.username || "Редакция"
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "Вести Ингушетии",
                            "logo": {
                                "@type": "ImageObject",
                                "url": `${window.location.origin}/logo.png`,
                                "width": 600,
                                "height": 60
                            }
                        },
                        "datePublished": news.publishDate || news.createdAt,
                        "dateModified": news.updatedAt || news.publishDate || news.createdAt,
                        "articleBody": news.content?.replace(/<[^>]*>?/gm, '') || "",
                        "articleSection": schemaCategories,
                        "keywords": `новости, Ингушетия, ГТРК, ${schemaCategories}`
                    })}
                </script>

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
                        content={news.updatedAt || news.publishDate || news.createdAt}
                    />
                    <meta
                        itemProp="author"
                        content={news.authorDetails?.username || 'Редакция'}
                    />
                    <meta
                        itemProp="publisher"
                        content="Вести Ингушетии"
                    />
                    <meta
                        itemProp="articleSection"
                        content={schemaCategories}
                    />
                    <meta
                        itemProp="keywords"
                        content={`новости, Ингушетия, ГТРК, ${schemaCategories}`}
                    />
                    <link
                        itemProp="mainEntityOfPage"
                        href={`${window.location.origin}/news/${newsId}`}
                    />

                    <h1 className={styles.title} itemProp="headline">
                        {news.title}
                    </h1>

                    <div className={styles.newsDetail}>
                        <div className={styles.meta}>
                            <span>
                                Автор:{' '}
                                {news.authorDetails ? (
                                    <Link to={`/author/${news.authorDetails.id}`}>
                                        <span itemProp="author">{news.authorDetails.username}</span>
                                    </Link>
                                ) : (
                                    <span itemProp="author">Редакция</span>
                                )}
                            </span>
                            <Link to={`/`}><span itemProp="publisher">Вести Ингушетии</span></Link>
                            <span itemProp="datePublished" content={news.publishDate || news.createdAt}>
                                {formattedDate}
                            </span>
                            <div className={styles.views}>
                                <FaEye size={10} /> <span itemProp="interactionCount" content={`UserPageVisits:${news.views}`}>{news.views}</span>
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
                                        itemProp="video"
                                    ></iframe>
                                </div>
                            ) : (
                                imageMedia?.url && (
                                    <div itemProp="image" itemScope itemType="https://schema.org/ImageObject">
                                        <link itemProp="url" href={new URL(imageMedia.url, window.location.origin).toString()} />
                                        <meta itemProp="width" content="1200" />
                                        <meta itemProp="height" content="630" />
                                        <MediaElement
                                            imageUrl={imageMedia.url}
                                            videoUrl={videoMedia?.url}
                                            alt={news.title}
                                            className={styles.newsImage}
                                            playIconSize={70}
                                            showPlayIcon={false}
                                        />
                                    </div>
                                )
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
                                    itemProp="articleBody"
                                />

                                {otherMediaFiles.length > 0 && (
                                    <div className={styles.otherMediaWrapper}>
                                        {otherMediaFiles.map((media) => (
                                            <div
                                                key={media.id}
                                                className={styles.imageWrapper}
                                                itemProp="image"
                                                itemScope
                                                itemType="https://schema.org/ImageObject"
                                            >
                                                <link itemProp="url" href={new URL(media.url, window.location.origin).toString()} />
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

                        <div itemProp="comment">
                            <CommentSection
                                comments={comments}
                                newsId={newsId}
                                authorName={authorName}
                                userId={userId}
                            />
                        </div>
                    </div>
                </article>
            </>
        );
    }
);