import React from 'react';
import styles from './LiveStreamWidget.module.scss';

export const LiveStreamWidget = () => {
    const channelId = '537'; // Россия 1. Назрань
    const iframeSrc = `https://embed.smotrim.ru/iframe/channel/id/${channelId}/isPlay/true/mute/true`;

    return (
        <div className={styles.liveStreamWidget}>
            <div className={styles.streamContainer}>
                <div className={styles.liveIndicator}>
                    <div className={styles.liveDot}></div>
                    LIVE
                </div>
                <iframe
                    allowFullScreen
                    frameBorder="0"
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        border: 'none'
                    }}
                    name={`smotrim_player_channel_${channelId}`}
                    src={iframeSrc}
                    title="Прямая трансляция Россия 1. Назрань"
                />
            </div>
        </div>
    );
};
