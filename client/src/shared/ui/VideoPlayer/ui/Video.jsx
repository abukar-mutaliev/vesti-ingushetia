import React, { useState } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import styles from './VideoPlayer.module.scss';

export const VideoPlayer = ({ videoUrl, posterUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = () => {
        setIsPlaying(true);
    };

    return (
        <div className={styles.videoPlayerWrapper}>
            <Plyr
                source={{
                    type: 'video',
                    sources: [
                        {
                            src: videoUrl,
                            provider: 'html5',
                        },
                    ],
                    poster: posterUrl,
                }}
                options={{ autoplay: isPlaying }}
            />
            {!isPlaying && (
                <div onClick={handlePlay} className={styles.playOverlay} />
            )}
        </div>
    );
};
