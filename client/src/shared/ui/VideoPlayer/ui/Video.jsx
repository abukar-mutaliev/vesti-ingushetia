import { memo, useRef, useCallback } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';
import styles from './VideoPlayer.module.scss';

export const VideoPlayer = memo(({ videoUrl, posterUrl }) => {
    const playerRef = useRef(null);

    const handlePlay = useCallback(() => {
        if (playerRef.current) {
            playerRef.current.plyr.play();
        }
    }, []);

    return (
        <div className={styles.videoPlayerWrapper}>
            <Plyr
                ref={playerRef}
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
                options={{
                    autoplay: false,
                    controls: ['play', 'progress', 'volume', 'fullscreen'],
                }}
            />
            <div className={styles.playOverlay} onClick={handlePlay}></div>
        </div>
    );
});
