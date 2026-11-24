import { useEffect, useMemo, useState } from 'react';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import { getVideoThumbnailUrl } from '@shared/lib/getVideoThumbnailUrl/getVideoThumbnailUrl.js';
import PropTypes from 'prop-types';
import styles from './MediaElement.module.scss';

const resolveUploadedImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    if (
        imageUrl.startsWith('http://') ||
        imageUrl.startsWith('https://') ||
        imageUrl.startsWith('data:') ||
        imageUrl.startsWith('blob:')
    ) {
        return imageUrl;
    }

    if (imageUrl.startsWith('uploads/')) {
        return `${window.location.origin}/${imageUrl.replace(/^\/+/, '')}`;
    }

    if (imageUrl.startsWith('/uploads/')) {
        return `${window.location.origin}${imageUrl}`;
    }

    if (imageUrl.startsWith('/')) {
        return imageUrl;
    }

    return `${window.location.origin}/uploads/images/${imageUrl}`;
};

export const MediaElement = ({
    imageUrl = null,
    videoUrl = null,
    alt,
    className = '',
    playIconSize = 30,
    showPlayIcon = true,
    onError = () => {},
}) => {
    const hasVideo = Boolean(videoUrl);
    const videoPosterUrl = useMemo(
        () => (hasVideo ? getVideoThumbnailUrl(videoUrl) : null),
        [hasVideo, videoUrl],
    );
    const processedImageUrl = useMemo(
        () => resolveUploadedImageUrl(imageUrl),
        [imageUrl],
    );
    const [stage, setStage] = useState(videoPosterUrl ? 'poster' : 'manual');

    useEffect(() => {
        setStage(videoPosterUrl ? 'poster' : 'manual');
    }, [videoPosterUrl, processedImageUrl]);

    const src = useMemo(() => {
        if (stage === 'poster' && videoPosterUrl) {
            return videoPosterUrl.highQuality;
        }
        if (stage === 'posterFallback' && videoPosterUrl) {
            return videoPosterUrl.fallback;
        }
        if (stage === 'manual') {
            return processedImageUrl || defaultImage;
        }
        return defaultImage;
    }, [stage, videoPosterUrl, processedImageUrl]);

    const handleImageError = (event) => {
        const canTryLowerQuality =
            stage === 'poster' &&
            videoPosterUrl?.fallback &&
            videoPosterUrl.fallback !== videoPosterUrl.highQuality;

        if (canTryLowerQuality) {
            setStage('posterFallback');
            return;
        }

        if (stage !== 'manual' && stage !== 'default' && processedImageUrl) {
            setStage('manual');
            return;
        }

        if (stage !== 'default' && processedImageUrl) {
            setStage('default');
            return;
        }

        event.currentTarget.onerror = null;
        if (event.currentTarget.src !== defaultImage) {
            event.currentTarget.src = defaultImage;
        }
        onError(event);
    };

    return (
        <div className={`${styles.mediaContainer} ${className}`}>
            <img
                src={src}
                alt={alt}
                className={styles.mediaImage}
                loading="lazy"
                onError={handleImageError}
            />
            {hasVideo && showPlayIcon && (
                <div className={styles.playIcon}>
                    <FaPlayCircle size={playIconSize} />
                </div>
            )}
        </div>
    );
};

MediaElement.propTypes = {
    imageUrl: PropTypes.string,
    videoUrl: PropTypes.string,
    alt: PropTypes.string.isRequired,
    className: PropTypes.string,
    playIconSize: PropTypes.number,
    showPlayIcon: PropTypes.bool,
    onError: PropTypes.func,
};
