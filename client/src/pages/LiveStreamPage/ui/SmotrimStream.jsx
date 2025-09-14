import styles from './LiveStreamPage.module.scss';

const SmotrimStream = ({ streamId }) => {
    const iframeSrc = `https://player.smotrim.ru/iframe/live/uid/${streamId}/start_zoom/true/showZoomBtn/false/isPlay/false/`;

    return (
        <div className={styles.iframeContainer}>
            <div className={styles.iframeWrapper}>
            <iframe
                allowFullScreen
                frameBorder="0"
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    height: 'auto',
                    minHeight: '400px',
                    display: 'block',
                    margin: '0 auto'
                }}
                name={`smotrim_player_${streamId}`}
                src={iframeSrc}
                className={styles.liveStreamIframe}
                title="Трансляция"
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-presentation allow-forms"
            />
            </div>
        </div>
    );
};

export default SmotrimStream;
