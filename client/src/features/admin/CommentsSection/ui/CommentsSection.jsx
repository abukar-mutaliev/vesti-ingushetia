import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from './CommentsSection.module.scss';
import { Link } from 'react-router-dom';

import { selectCommentsGroupedByNews } from '@entities/comments/model/commentSelectors.js';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { fetchAllComments } from '@entities/comments/model/commentsSlice.js';
import { CommentItem } from '@entities/comments/ui/CommentItem/';

export const CommentsSection = () => {
    const dispatch = useDispatch();
    const commentsByNews = useSelector(selectCommentsGroupedByNews);
    const newsList = useSelector(selectNewsList);

    useEffect(() => {
        dispatch(fetchAllComments());
        dispatch(fetchAllNews());
    }, [dispatch]);

    const newsWithComments = Object.keys(commentsByNews)
        .filter((newsId) => commentsByNews[newsId].length > 0)
        .map((newsId) => {
            const newsItem = newsList.find(
                (news) => news.id.toString() === newsId,
            );
            return {
                newsId,
                title: newsItem ? newsItem.title : `Новость ID: ${newsId}`,
                comments: commentsByNews[newsId],
            };
        });

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Комментарии</h1>
            </div>
            <div className={styles.commentsList}>
                {newsWithComments.length > 0 ? (
                    newsWithComments.map(({ newsId, title, comments }) => (
                        <div key={newsId} className={styles.newsSection}>
                            <Link
                                to={`/news/${newsId}`}
                                className={styles.newsTitleLink}
                            >
                                <h3 className={styles.newsTitle}>
                                    Новость: {title}
                                </h3>
                            </Link>
                            <div className={styles.comments}>
                                {comments.map((comment) => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        newsId={newsId}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.notComment}>
                        <p>Нет комментариев.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
