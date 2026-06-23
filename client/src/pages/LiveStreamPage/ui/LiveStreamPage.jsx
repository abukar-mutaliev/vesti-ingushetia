import styles from './LiveStreamPage.module.scss';
import SmotrimStream from './SmotrimStream';

const LiveStreamPage = () => {
    const channelId = '537'; // Россия 1. Назрань

    return (
        <div className={styles.liveStreamPage}>
            <div className={styles.liveStreamContainer}>
                <SmotrimStream channelId={channelId} />
            </div>
        </div>
    );
};
export default LiveStreamPage;
