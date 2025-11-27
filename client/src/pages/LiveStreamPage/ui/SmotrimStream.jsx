import styles from './LiveStreamPage.module.scss';

const SmotrimStream = ({ streamId }) => {
    const iframeSrc = `https://player.smotrim.ru/iframe/live/uid/${streamId}/start_zoom/true/showZoomBtn/false/isPlay/false/`;

    return (
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
                    bottom: 0
                }}
                name={`smotrim_player_${streamId}`}
                src={iframeSrc}
                className={styles.iframeContainer}
            />
        </div>
    );
};

export default SmotrimStream;
