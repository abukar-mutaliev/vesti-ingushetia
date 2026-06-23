import styles from './LiveStreamPage.module.scss';

const SmotrimStream = ({ channelId = '537' }) => {
    const iframeSrc = `https://embed.smotrim.ru/iframe/channel/id/${channelId}/isPlay/true/mute/true`;

    return (
        <div style={{
            maxWidth: '100%',
            width: '100%',
            margin: '0 auto'
        }}>
            <iframe
                allowFullScreen
                frameBorder="0"
                style={{
                    width: '100%',
                    height: '100%',
                    aspectRatio: '16 / 9'
                }}
                name={`smotrim_player_channel_${channelId}`}
                src={iframeSrc}
                className={styles.iframeContainer}
            />
        </div>
    );
};

export default SmotrimStream;
