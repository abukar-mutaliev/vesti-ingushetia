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

    const videoPosterUrl = useMemo(() => {
        return hasVideo ? getVideoThumbnailUrl(videoUrl) : null;
    }, [hasVideo, videoUrl]);

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
        return imageUrl || defaultImage;
    }, [hasVideo, videoPosterUrl, imageUrl, useHighQuality]);

    const handleImageError = (e) => {
        if (hasVideo && useHighQuality) {
            setUseHighQuality(false);
            return;
        }
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