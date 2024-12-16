import React, { memo, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import { selectLatestNews } from '@entities/news/model/newsSelectors';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';
import defaultImage from '@assets/default.jpg';
import styles from './MainNews.module.scss';

export const MainNews = memo(() => {
    const latestNews = useSelector(selectLatestNews, shallowEqual);

    if (!latestNews) {
        return <div className={styles.mainNews}>Новостей нет</div>;
    }

    const videoMedia = useMemo(() => {
        return latestNews.mediaFiles?.find((media) => media.type === 'video') || null;
    }, [latestNews.mediaFiles]);

    const imageMedia = useMemo(() => {
        return latestNews.mediaFiles?.find((media) => media.type === 'image') || null;
    }, [latestNews.mediaFiles]);

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
        let content = DOMPurify.sanitize(latestNews.content);
        content = highlightKeywordsInHtml(content, '');
        content = DOMPurify.sanitize(content);
        return content;
    }, [latestNews.content]);

    const otherMediaFiles = useMemo(() => {
        return latestNews.mediaFiles?.filter(
            (m) => m.type === 'image' && m.url !== imageUrl
        ) || [];
    }, [latestNews.mediaFiles, imageUrl]);

    return (
        <div className={styles.mainNewsContainer}>
            <Link className={styles.mainNewsLink} to={`/news/${latestNews.id}`}>
                <div className={styles.mainNews}>
                    <div className={styles.mediaContainer}>
                        {embedUrl ? (
                            <div className={styles.videoWrapper}>
                                <iframe
                                    width="560"
                                    height="315"
                                    src={embedUrl}
                                    className={styles.mainNewsImage}
                                    frameBorder="0"
                                    allowFullScreen
                                    title="Видео"
                                ></iframe>
                            </div>
                        ) : (
                            <div className={styles.imageWrapper}>
                                <img
                                    src={imageUrl}
                                    alt={latestNews.title}
                                    className={styles.mainNewsImage}
                                    loading="lazy"
                                    onError={(e) => (e.target.src = defaultImage)}
                                />
                                {videoMedia && (
                                    <div className={styles.playButton}>
                                        <FaPlayCircle size={70} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles.mainNewsContent}>
                        <h2 className={styles.mainNewsTitle}>
                            {latestNews.title}
                        </h2>
                        <div
                            className={styles.mainNewsDescription}
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                        <div className={styles.readMoreButton}>
                            Читать полностью
                        </div>
                    </div>
                </div>
            </Link>

            {embedUrl && otherMediaFiles.length > 0 && (
                <div className={styles.otherMediaWrapper}>
                    {otherMediaFiles.map((media) => (
                        <div key={media.id} className={styles.imageWrapper}>
                            <img
                                src={media.url}
                                alt={latestNews.title}
                                className={styles.mainNewsImage}
                                loading="lazy"
                                onError={(e) => (e.target.src = defaultImage)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
