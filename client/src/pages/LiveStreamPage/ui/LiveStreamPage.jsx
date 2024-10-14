import React from 'react';
import styles from './LiveStreamPage.module.scss';
export const LiveStreamPage = () => {
    const handlePlay = () => {
        const videoElement = document.getElementById('live-stream');
        if (videoElement) {
            videoElement
                .play()
                .catch((error) => console.warn('Autoplay error:', error));
        }
    };

    return (
        <div className={styles.liveStreamPage}>
            <h1>Прямой эфир ГТРК Ингушетия</h1>
            <div className={styles.liveStreamPageContainer}>
                <div onClick={handlePlay}>
                    <iframe
                        id="live-stream"
                        src="https://playercdn.cdnvideo.ru/aloha/players/iframe_gtrkingushetia_player.html"
                        width="100%"
                        height="450"
                        style={{ maxWidth: '800px', border: 'none' }}
                        allowFullScreen
                        title="Прямой эфир GTR Kingushetia"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};
