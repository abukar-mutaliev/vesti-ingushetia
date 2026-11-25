import styles from '../ui/UserProfile.module.scss';
import defaultAvatar from '@assets/default-avatar.jpg';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const RepliesList = ({ replies }) => {
    return (
        <section className={styles.repliesSection}>
            <header className={styles.repliesHeader}>
                <h2>Ответы на комментарии</h2>
                <p>Сообщения, которые оставили под вашими комментариями</p>
            </header>
            {replies?.length > 0 ? (
                <div className={styles.repliesList}>
                    {replies.map((reply) => (
                        <article key={reply.id} className={styles.reply}>
                            <div className={styles.replyHeader}>
                                <img
                                    src={
                                        reply.author?.avatarUrl || defaultAvatar
                                    }
                                    alt=""
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
                            <p className={styles.replyContent}>{reply.content}</p>
                            <Link
                                to={`/news/${reply.newsId}`}
                                className={styles.replyLink}
                            >
                                Перейти к новости
                            </Link>
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyReplies}>
                    <p className={styles.emptyTitle}>Ответов пока нет</p>
                    <p>
                        Оставьте комментарий под новостью — ответы появятся в
                        этом блоке.
                    </p>
                    <Link to="/news">Перейти к новостям</Link>
                </div>
            )}
        </section>
    );
};
