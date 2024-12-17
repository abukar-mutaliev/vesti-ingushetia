import { useMemo } from 'react';
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

    const videoPosterUrl = useMemo(() => {
        return hasVideo ? getVideoThumbnailUrl(videoUrl) : null;
    }, [hasVideo, videoUrl]);

    const src = useMemo(() => {
        if (hasVideo && videoPosterUrl) {
            return videoPosterUrl;
        }
        return imageUrl || defaultImage;
    }, [hasVideo, videoPosterUrl, imageUrl]);

    return (
        <div className={`${styles.mediaContainer} ${className}`}>
            <img
                src={src}
                alt={alt}
                className={styles.mediaImage}
                loading="lazy"
                onError={onError}
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
