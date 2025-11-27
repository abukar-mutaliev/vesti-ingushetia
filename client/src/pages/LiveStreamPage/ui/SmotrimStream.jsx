import styles from './LiveStreamPage.module.scss';

const SmotrimStream = ({ streamId }) => {
    const iframeSrc = `https://player.smotrim.ru/iframe/live/uid/${streamId}/start_zoom/true/showZoomBtn/false/isPlay/false/`;

    return (
        <div className={styles.iframeContainer}>
            <div style={{ maxWidth: '100%', position: 'relative', width: '100%', paddingBottom: '56%' }}>
                <iframe
                    allowfullscreen
                    frameborder="0"
                    style={{ width: '100%', height: '100%', position: 'absolute' }}
                    name={`smotrim_player_${streamId}`}
                    src={iframeSrc}
                />
            </div>
        </div>
    );
};

export default SmotrimStream;
