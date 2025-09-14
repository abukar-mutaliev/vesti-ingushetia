import { useState } from 'react';
import styles from './LiveStreamPage.module.scss';
import SmotrimStream from './SmotrimStream';

const LiveStreamPage = () => {
    const [activeStream, setActiveStream] = useState('russia1');

    // Конфигурация доступных трансляций
    const streams = {
        russia1: {
            name: 'Россия 1. Назрань',
            component: 'smotrim',
            streamId: '0ef99435-a317-425d-8413-baad29f19bd3'
        },
        russia24: {
            name: 'Россия 24. Назрань',
            component: 'smotrim',
            streamId: 'fbe71f00-0d62-42a9-9b30-257276b8f887'
        }
    };

    const renderActiveStream = () => {
        const stream = streams[activeStream];

        if (stream.component === 'smotrim') {
            return (
                <SmotrimStream
                    streamId={stream.streamId}
                />
            );
        }

        return null;
    };

    return (
        <div className={styles.liveStreamPage}>
            <div className={styles.streamSelector}>
                {Object.entries(streams).map(([key, stream]) => (
                    <button
                        key={key}
                        className={`${styles.streamButton} ${activeStream === key ? styles.active : ''}`}
                        onClick={() => setActiveStream(key)}
                    >
                        {stream.name}
                    </button>
                ))}
            </div>

            <div className={styles.liveStreamContainer}>
                {renderActiveStream()}
            </div>
        </div>
    );
};
export default LiveStreamPage;
