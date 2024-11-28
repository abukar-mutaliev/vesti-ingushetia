import React, { useEffect, useRef } from 'react';
import styles from './LiveStreamPage.module.scss';
import Hls from 'hls.js';

export const LiveStreamPage = () => {
    const videoRef = useRef(null);
    const hlsStreamUrl =
        'https://live-gtrkingushetia.cdnvideo.ru/gtrkingushetia/gtrkingushetia.sdp/playlist.m3u8';

    useEffect(() => {
        const video = videoRef.current;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(hlsStreamUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Сетевая ошибка');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Ошибка медиа');
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });

            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Для браузеров с поддержкой HLS (например, Safari)
            video.src = hlsStreamUrl;
            video.addEventListener('loadedmetadata', () => {
                video.play();
            });
        } else {
            console.error('Ваш браузер не поддерживает HLS');
        }
    }, [hlsStreamUrl]);

    return (
        <div className={styles.liveStreamPage}>
            <video
                ref={videoRef}
                controls
                autoPlay
                muted
                width="100%"
                height="500"
                className={styles.videoPlayer}
            >
                Ваш браузер не поддерживает тег video.
            </video>
        </div>
    );
};
