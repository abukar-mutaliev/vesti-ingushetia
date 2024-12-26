const { User, Comment, News, CommentLike } = require('../models');
const baseUrl = process.env.BASE_URL;


const formatComment = (comment, currentUserId) => {
    const commentJson = comment.toJSON();
    const likesCount = commentJson.likedBy.length;
    const likedByCurrentUser = currentUserId
        ? commentJson.likedBy.some((user) => user.id === currentUserId)
        : false;
    const authorDetails = commentJson.user
        ? {
              ...commentJson.user,
              avatarUrl: commentJson.user.avatarUrl
                  ? `${baseUrl}/${commentJson.user.avatarUrl}`
                  : null,
          }
        : null;

    const formattedReplies = commentJson.replies.map((reply) => ({
        ...reply,
        likesCount: reply.likedBy.length,
        likedByCurrentUser: currentUserId
            ? reply.likedBy.some((user) => user.id === currentUserId)
            : false,
        authorDetails: reply.user
            ? {
                  ...reply.user,
                  avatarUrl: reply.user.avatarUrl
                      ? `${baseUrl}/${reply.user.avatarUrl}`
                      : null,
              }
            : null,
    }));

    return {
        ...commentJson,
        likesCount,
        likedByCurrentUser,
        authorDetails,
        replies: formattedReplies,
    };
};

exports.createComment = async (req, res) => {
    const { content, newsId, authorName } = req.body;
    const userId = req.user ? req.user.id : null;

    try {
        const news = await News.findByPk(newsId);
        if (!news) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }

        const comment = await Comment.create({
            content,
            userId,
            newsId,
            authorName,
        });

        res.status(201).json(comment);
    } catch (err) {
        console.error('Ошибка создания комментария:', err);
        res.status(500).json({ error: 'Ошибка добавления комментария' });
    }
};

exports.getCommentsForNews = async (req, res) => {
    const { newsId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    try {
        const news = await News.findByPk(newsId);
        if (!news) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }

        const comments = await Comment.findAll({
            where: { newsId, parentCommentId: null },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatarUrl'],
                },
                {
                    model: User,
                    as: 'likedBy',
                    attributes: ['id'],
                    through: { attributes: [] },
                },
                {
                    model: Comment,
                    as: 'replies',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username', 'avatarUrl'],
                        },
                        {
                            model: User,
                            as: 'likedBy',
                            attributes: ['id'],
                            through: { attributes: [] },
                        },
                    ],
                },
            ],
            order: [
                ['createdAt', 'DESC'],
                [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC'],
            ],
        });

        const commentsData = comments.map((comment) =>
            formatComment(comment, currentUserId),
        );

        res.json(commentsData);
    } catch (err) {
        console.error('Ошибка получения комментариев:', err);
        res.status(500).json({
            error: `Ошибка получения комментариев: ${err.message}`,
        });
    }
};

exports.getAllComments = async (req, res) => {
    const currentUserId = req.user ? req.user.id : null;

    try {
        const comments = await Comment.findAll({
            include: [
                {
                    model: News,
                    as: 'news',
                    attributes: ['id', 'title'],
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatarUrl'],
                },
                {
                    model: Comment,
                    as: 'replies',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'username', 'avatarUrl'],
                        },
                        {
                            model: User,
                            as: 'likedBy',
                            attributes: ['id'],
                            through: { attributes: [] },
                        },
                    ],
                },
                {
                    model: User,
                    as: 'likedBy',
                    attributes: ['id'],
                    through: { attributes: [] },
                },
            ],
            order: [
                ['createdAt', 'DESC'],
                [{ model: Comment, as: 'replies' }, 'createdAt', 'ASC'],
            ],
        });

        const commentsData = comments.map((comment) =>
            formatComment(comment, currentUserId),
        );

        res.json(commentsData);
    } catch (err) {
        console.error('Ошибка получения всех комментариев:', err);
        res.status(500).json({
            error: `Ошибка получения комментариев: ${err.message}`,
        });
    }
};

exports.deleteComment = async (req, res) => {
    const { commentId } = req.params;

    try {
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Комментарий не найден' });
        }

        await comment.destroy();
        res.status(200).json({ message: 'Комментарий успешно удален' });
    } catch (err) {
        console.error('Ошибка удаления комментария:', err);
        res.status(500).json({ error: 'Ошибка удаления комментария' });
    }
};

exports.likeComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Вы не авторизованы' });
    }

    try {
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Комментарий не найден' });
        }

        const [like, created] = await CommentLike.findOrCreate({
            where: { commentId, userId },
        });

        let message, likedByCurrentUser;
        if (!created) {
            await like.destroy();
            message = 'Лайк удален';
            likedByCurrentUser = false;
        } else {
            message = 'Комментарий лайкнут';
            likedByCurrentUser = true;
        }

        const likesCount = await CommentLike.count({ where: { commentId } });

        res.json({
            message,
            likesCount,
            likedByCurrentUser,
        });
    } catch (err) {
        console.error('Ошибка лайка комментария:', err);
        res.status(500).json({
            error: `Ошибка лайка комментария: ${err.message}`,
        });
    }
};

exports.replyToComment = async (req, res) => {
    const { content } = req.body;
    const { parentCommentId } = req.params;

    const authorName = req.user ? req.user.username : req.body.authorName;
    const userId = req.user ? req.user.id : null;

    try {
        const parentComment = await Comment.findByPk(parentCommentId);
        if (!parentComment) {
            return res
                .status(404)
                .json({ error: 'Родительский комментарий не найден' });
        }

        const replyComment = await Comment.create({
            content,
            userId,
            authorName,
            newsId: parentComment.newsId,
            parentCommentId: parentComment.id,
        });

        res.status(201).json(replyComment);
    } catch (err) {
        console.error('Ошибка добавления ответа на комментарий:', err);
        res.status(500).json({
            error: 'Ошибка добавления ответа на комментарий',
        });
    }
};
