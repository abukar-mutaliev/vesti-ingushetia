import { memo, useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectLatestNews } from '@entities/news/model/newsSelectors';
import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';
import DOMPurify from 'dompurify';
import defaultImage from '@assets/default.jpg';
import styles from './MainNews.module.scss';
import { truncateHtmlToSentences } from '@shared/lib/TruncateHtml/truncateHtml';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';

export const MainNews = memo(() => {
    const latestNews = useSelector(selectLatestNews, shallowEqual);

    if (!latestNews) {
        return <div className={styles.mainNews}>Новостей нет</div>;
    }

    const videoMedia = useMemo(() => {
<<<<<<< HEAD
        return latestNews.mediaFiles?.find((media) => media.type === 'video') || null;
    }, [latestNews.mediaFiles]);

    const imageMedia = useMemo(() => {
        return latestNews.mediaFiles?.find((media) => media.type === 'image') || null;
    }, [latestNews.mediaFiles]);
=======
        return (
            latestNews?.mediaFiles?.find((media) => media.type === 'video') ||
            null
        );
    }, [latestNews?.mediaFiles]);

    const imageMedia = useMemo(() => {
        return (
            latestNews?.mediaFiles?.find((media) => media.type === 'image') ||
            null
        );
    }, [latestNews?.mediaFiles]);
>>>>>>> parent of d965d87 (revert commit  Removed saving data to local storage, minor bugs fixed)

    const imageUrl = useMemo(() => {
        return imageMedia?.url || defaultImage;
    }, [imageMedia]);


    const processedContent = useMemo(() => {
        let content = DOMPurify.sanitize(latestNews.content);
        content = highlightKeywordsInHtml(content, '');
        content = DOMPurify.sanitize(content);

        const truncatedContent = truncateHtmlToSentences(content, 1);
        return truncatedContent;
<<<<<<< HEAD
    }, [latestNews.content]);

    const otherMediaFiles = useMemo(() => {
        return latestNews.mediaFiles?.filter(
            (m) => m.type === 'image' && m.url !== imageUrl
        ) || [];
    }, [latestNews.mediaFiles, imageUrl]);
=======
    }, [latestNews]);

    const otherMediaFiles = useMemo(() => {
        return (
            latestNews?.mediaFiles?.filter(
                (m) => m.type === 'image' && m.url !== imageUrl,
            ) || []
        );
    }, [latestNews?.mediaFiles, imageUrl]);

    if (!latestNews) {
        return <div className={styles.mainNews}>Новостей нет</div>;
    }
>>>>>>> parent of d965d87 (revert commit  Removed saving data to local storage, minor bugs fixed)

    return (
        <div className={styles.mainNewsContainer}>
            <Link className={styles.mainNewsLink} to={`/news/${latestNews.id}`}>
                <div className={styles.mainNews}>
                        <MediaElement
                            imageUrl={imageUrl}
                            videoUrl={videoMedia?.url || null}
                            alt={latestNews.title}
                            className={styles.mainNewsMedia}
                            playIconSize={70}
                            showPlayIcon={true}
                            onError={(e) => (e.target.src = defaultImage)}
                        />
                    <div className={styles.mainNewsContent}>
                        <h2 className={styles.mainNewsTitle}>
                            {latestNews.title}
                        </h2>
                        <div
                            className={styles.mainNewsDescription}
                            dangerouslySetInnerHTML={{
                                __html: processedContent,
                            }}
                        />
                        <div className={styles.readMoreButton}>
                            Читать полностью
                        </div>
                    </div>
                </div>
            </Link>

            {videoMedia && otherMediaFiles.length > 0 && (
                <div>
                    {otherMediaFiles.map((media) => (
                        <div key={media.id} className={styles.imageWrapper}>
                            <MediaElement
                                imageUrl={media.url}
                                videoUrl={null}
                                alt={latestNews.title}
                                className={styles.mainNewsImage}
                                onError={(e) => (e.target.src = defaultImage)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
