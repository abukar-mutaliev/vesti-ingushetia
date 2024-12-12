import styles from '../ui/UserProfile.module.scss';
import defaultAvatar from '@assets/default-avatar.jpg';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export const RepliesList = ({ replies }) => {

    return (
        <div className={styles.repliesSection}>
            <h3>Ответы на ваши комментарии</h3>
            {replies?.length > 0 ? (
                <div className={styles.repliesList}>
                    {replies.map((reply) => (
                        <div key={reply.id} className={styles.reply}>
                            <div className={styles.replyHeader}>
                                <img
                                    src={
                                        reply.author && reply.author.avatarUrl
                                            ? `${reply.author.avatarUrl}`
                                            : defaultAvatar
                                    }
                                    alt="Аватар автора"
                                    className={styles.replyAvatar}
                                />
                                <div className={styles.replyInfo}>
                                    <p className={styles.replyAuthor}>
                                        {reply.author
                                            ? reply.author.username
                                            : reply.authorName || 'Аноним'}
                                    </p>
                                    <p className={styles.replyDate}>
                                        {formatDistanceToNow(
                                            new Date(reply.createdAt),
                                            {
                                                addSuffix: true,
                                                locale: ru,
                                            },
                                        )}
                                    </p>
                                </div>
                            </div>
                            <p className={styles.replyContent}>
                                {reply.content}
                            </p>
                            <a
                                href={`/news/${reply.newsId}`}
                                className={styles.replyLink}
                            >
                                Перейти к новости
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <p>У вас нет новых ответов.</p>
            )}
        </div>
    );
};
