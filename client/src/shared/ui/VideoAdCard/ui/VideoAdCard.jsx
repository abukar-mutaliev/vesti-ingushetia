import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import styles from './VideoAdCard.module.scss';

export const VideoAdCard = React.memo(({ ad }) => {
    const hasVideo = Boolean(ad.url);

    return (
        <li className={styles.adItem}>
            <Link to={`/video-ads/${ad.id}`} className={styles.adLink}>
                {hasVideo ? (
                    <div className={styles.videoContainer}>
                        <video
                            src={ad.url}
                            className={styles.adImage}
                            preload="metadata"
                            loop
                            autoPlay
                            muted
                        />
                        <div className={styles.playButton}>
                            <FaPlayCircle size={50} />
                        </div>
                    </div>
                ) : (
                    <img
                        src={defaultImage}
                        alt={ad.title}
                        className={styles.adImage}
                    />
                )}

                <div className={styles.adOverlay}>
                    <p className={styles.adTitle}>{ad.title}</p>
                </div>
            </Link>
        </li>
    );
});
