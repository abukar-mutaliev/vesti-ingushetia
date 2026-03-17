import { useEffect, useMemo, useState } from 'react';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import { getVideoThumbnailUrl } from '@shared/lib/getVideoThumbnailUrl/getVideoThumbnailUrl.js';
import PropTypes from 'prop-types';
import styles from './MediaElement.module.scss';

export const MediaElement = ({
                                 imageUrl = null,
                                 videoUrl = null,
                                 alt,
                                 className = '',
                                 playIconSize = 30,
                                 showPlayIcon = true,
                                 onError = () => {},
                             }) => {
    const hasVideo = useMemo(() => Boolean(videoUrl), [videoUrl]);
    const [useHighQuality, setUseHighQuality] = useState(true);
    const [imageLoadError, setImageLoadError] = useState(false);

    const videoPosterUrl = useMemo(() => {
        return hasVideo ? getVideoThumbnailUrl(videoUrl) : null;
    }, [hasVideo, videoUrl]);

    const processedImageUrl = useMemo(() => {
        if (!imageUrl) return null;

        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }

        if (imageUrl.startsWith('uploads/')) {
            const cleanPath = imageUrl.replace(/^\/+/, '');
            return `${window.location.origin}/${cleanPath}`;
        }

        if (!imageUrl.startsWith('/uploads/')) {
            return `${window.location.origin}/uploads/images/${imageUrl}`;
        }

        return `${window.location.origin}${imageUrl}`;
    }, [imageUrl]);

    useEffect(() => {
        if (hasVideo && videoPosterUrl) {
            const img = new Image();
            img.src = videoPosterUrl.highQuality;
        }
    }, [hasVideo, videoPosterUrl]);

    const src = useMemo(() => {
        if (hasVideo && videoPosterUrl) {
            return useHighQuality ? videoPosterUrl.highQuality : videoPosterUrl.fallback;
        }
        return processedImageUrl || defaultImage;
    }, [hasVideo, videoPosterUrl, processedImageUrl, useHighQuality]);

    const handleImageError = (e) => {
        if (hasVideo && useHighQuality) {
            setUseHighQuality(false);
            return;
        }

        if (!imageLoadError) {
            setImageLoadError(true);

            if (imageUrl && !imageUrl.startsWith('http')) {
                const alternativeUrls = [
                    `${window.location.origin}/${imageUrl}`,
                    `${window.location.origin}/uploads/${imageUrl}`,
                    `${window.location.origin}/uploads/images/${imageUrl.replace('uploads/images/', '')}`,
                ];

                if (alternativeUrls[0] !== e.target.src) {
                    e.target.src = alternativeUrls[0];
                    return;
                }
            }
        }

        e.target.src = defaultImage;
        onError(e);
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
            {hasVideo && videoPosterUrl && showPlayIcon && (
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