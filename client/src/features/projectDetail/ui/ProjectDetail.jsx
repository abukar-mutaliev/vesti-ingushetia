import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { VideoPlayer } from '@shared/ui/VideoPlayer';
import { SocialIcons } from '@shared/ui/SocialIcons';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';
import styles from './ProjectDetail.module.scss';
import defaultImage from '@assets/default.jpg';

export const ProjectDetail = ({ project }) => {
    const {
        title,
        categoryId,
        categoryName,
        createdAt,
        mediaFiles,
        content,
    } = project;

    const firstImage = mediaFiles?.find((media) => media.type === 'image');
    const firstVideo = mediaFiles?.find((media) => media.type === 'video');

    const otherMediaFiles = mediaFiles?.filter(
        (media) => media.id !== firstImage?.id
    );


    const processedContent = useMemo(() => {
        let sanitizedContent = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: [
                'b',
                'i',
                'em',
                'strong',
                'p',
                'ul',
                'ol',
                'li',
                'a',
                'img',
                'span',
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'style'],
        });

        sanitizedContent = highlightKeywordsInHtml(sanitizedContent, '');

        sanitizedContent = DOMPurify.sanitize(sanitizedContent);

        return sanitizedContent;
    }, [content]);

    const getVideoEmbedUrl = (videoUrl) => {
        if (!videoUrl) return null;

        const isYouTube =
            videoUrl.includes('youtube.com/watch?v=') ||
            videoUrl.includes('youtu.be/');
        if (isYouTube) {
            let videoId = '';
            if (videoUrl.includes('watch?v=')) {
                try {
                    const urlObj = new URL(videoUrl);
                    videoId = urlObj.searchParams.get('v');
                } catch (error) {
                    console.error('Некорректный YouTube URL:', videoUrl);
                }
            } else {
                const parts = videoUrl.split('/');
                videoId = parts.pop();
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }

        const isRutube = videoUrl.includes('rutube.ru/video/');
        if (isRutube) {
            const parts = videoUrl.split('/').filter(Boolean);
            const videoId = parts[parts.length - 1];
            return videoId ? `https://rutube.ru/play/embed/${videoId}` : null;
        }

        return null;
    };

    const embedUrl = useMemo(() => {
        return getVideoEmbedUrl(firstVideo?.url);
    }, [firstVideo]);

    const isExternalVideo = useMemo(() => {
        return embedUrl !== null;
    }, [embedUrl]);

    const otherMediaImages = useMemo(() => {
        return otherMediaFiles?.filter((media) => media.type === 'image') || [];
    }, [otherMediaFiles]);

    const otherMediaVideos = useMemo(() => {
        return otherMediaFiles?.filter((media) => media.type === 'video') || [];
    }, [otherMediaFiles]);

    return (
        <div className={styles.projectDetail}>
            <h1 className={styles.title}>{title}</h1>

            <div className={styles.meta}>
                <span>
                    <Link to={`/category/${categoryId}`}>{categoryName}</Link>
                </span>
                <span>
                    {new Date(createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                </span>
            </div>

            <div className={styles.mediaSection}>

                {firstImage && (
                    <div className={styles.imageWrapper}>
                        <img
                            src={firstImage.url}
                            alt={title}
                            className={styles.projectImage}
                            loading="lazy"
                            onError={(e) => (e.target.src = defaultImage)}
                        />
                    </div>
                )}
            </div>

            <div className={styles.projectContentWrapper}>
                <SocialIcons />
                <div className={styles.content}>
                    <div
                        className={styles.paragraph}
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />

                    {otherMediaImages.length > 0 && (
                        <div className={styles.otherMediaWrapper}>
                            {otherMediaImages.map((media) => (
                                <div
                                    key={media.id}
                                    className={styles.imageWrapper}
                                >
                                    <img
                                        src={media.url}
                                        alt={title}
                                        className={styles.projectImage}
                                        loading="lazy"
                                        onError={(e) =>
                                            (e.target.src = defaultImage)
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {otherMediaVideos.length > 0 && (
                        <div className={styles.otherMediaWrapper}>
                            {otherMediaVideos.map((media) => {
                                const embedUrl = getVideoEmbedUrl(media.url);
                                const isExternal = embedUrl !== null;

                                return isExternal ? (
                                    <div
                                        key={media.id}
                                        className={styles.videoWrapper}
                                    >
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={embedUrl}
                                            className={styles.projectVideo}
                                            frameBorder="0"
                                            allowFullScreen
                                            title="Видео"
                                        ></iframe>
                                    </div>
                                ) : (
                                    <div
                                        key={media.id}
                                        className={styles.videoWrapper}
                                    >
                                        <VideoPlayer videoUrl={media.url} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
