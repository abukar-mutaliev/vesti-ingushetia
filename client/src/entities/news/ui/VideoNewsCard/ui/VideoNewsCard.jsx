import React from 'react';
import { Link } from 'react-router-dom';
import styles from './VideoNewsCard.module.scss';
import { FaPlayCircle } from 'react-icons/fa';

export const VideoNewsCard = ({ news }) => {
    const video = news.mediaFiles?.find((media) => media.type === 'video');

    if (!video) {
        return null;
    }

    const videoUrl = `http://localhost:5000/${video.url}`;

    return (
        <div className={styles.videoNewsCard}>
            <Link to={`/news/${news.id}`} className={styles.link}>
                <div className={styles.videoContainer}>
                    <video
                        src={videoUrl}
                        className={styles.video}
                        preload="metadata"
                        muted
                        onLoadedMetadata={(e) => {
                            e.target.currentTime = 0;
                            e.target.pause();
                        }}
                    />
                    <div className={styles.playButton}>
                        <FaPlayCircle size={50} />
                    </div>
                </div>
                <h3 className={styles.title}>{news.title}</h3>
            </Link>
        </div>
    );
};
