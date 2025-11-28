import React from 'react';
import styles from './LiveStreamWidget.module.scss';

export const LiveStreamWidget = () => {
    const streamId = '0ef99435-a317-425d-8413-baad29f19bd3'; // Россия 1. Назрань
    const iframeSrc = `https://player.smotrim.ru/iframe/live/uid/${streamId}/start_zoom/true/showZoomBtn/false/isPlay/true/autoplay/true/`;

    return (
        <div className={styles.liveStreamWidget}>
            <div className={styles.streamContainer}>
                <div className={styles.liveIndicator}>
                    <div className={styles.liveDot}></div>
                    LIVE
                </div>
                <div style={{
                    maxWidth: '100%',
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '56.25%',
                    margin: '0 auto'
                }}>
                    <iframe
                        allowfullscreen="true"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        frameborder="0"
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '4px'
                        }}
                        name={`smotrim_player_${streamId}`}
                        src={iframeSrc}
                        title="Прямая трансляция Россия 1. Назрань"
                    />
                </div>
            </div>
        </div>
    );
};
