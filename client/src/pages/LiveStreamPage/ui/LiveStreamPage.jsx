import styles from './LiveStreamPage.module.scss';
import SmotrimStream from './SmotrimStream';

const LiveStreamPage = () => {
    const streamId = '0ef99435-a317-425d-8413-baad29f19bd3'; // Россия 1. Назрань

    return (
        <div className={styles.liveStreamPage}>
            <div className={styles.liveStreamContainer}>
                <SmotrimStream streamId={streamId} />
            </div>
        </div>
    );
};
export default LiveStreamPage;
