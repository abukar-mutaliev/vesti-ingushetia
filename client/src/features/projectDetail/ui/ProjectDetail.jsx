import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { VideoPlayer } from '@shared/ui/VideoPlayer';
import { SocialIcons } from '@shared/ui/SocialIcons';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';
import styles from './ProjectDetail.module.scss';

export const ProjectDetail = ({ project }) => {
    const {
        title,
        categoryId,
        categoryName,
        createdAt,
        views,
        mediaFiles,
        content,
    } = project;

    const firstImage = mediaFiles?.find((media) => media.type === 'image');
    const firstVideo = mediaFiles?.find((media) => media.type === 'video');
    const otherMediaFiles = mediaFiles?.filter(
        (media) => media !== firstImage && media !== firstVideo,
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
                <div className={styles.views}>
                    <FaEye size={10} /> {views || 0}
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
                            alt={title}
                            className={styles.projectImage}
                        />
                    </div>
                )
            )}

            <div className={styles.projectContentWrapper}>
                <div className={styles.socialIcons}>
                    <SocialIcons />
                </div>
                <div className={styles.content}>
                    <div
                        className={styles.paragraph}
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />
                    <div className={styles.otherMediaWrapper}>
                        {otherMediaFiles?.map((media, index) =>
                            media.type === 'image' ? (
                                <div
                                    key={index}
                                    className={styles.imageWrapper}
                                >
                                    <img
                                        src={media.url}
                                        alt={title}
                                        className={styles.projectImage}
                                    />
                                </div>
                            ) : (
                                <div
                                    key={index}
                                    className={styles.videoWrapper}
                                >
                                    <VideoPlayer videoUrl={media.url} />
                                </div>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
