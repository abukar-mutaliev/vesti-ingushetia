const { User, Comment, News, CommentLike } = require("../models");

exports.createComment = async (req, res) => {
  const { content, newsId, authorName } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!content) {
    return res
      .status(400)
      .json({ error: "Необходимо указать содержимое комментария" });
  }

  if (!authorName) {
    return res
      .status(400)
      .json({ error: "Необходимо указать имя пользователя" });
  }

  try {
    const news = await News.findByPk(newsId);
    if (!news) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    const comment = await Comment.create({
      content,
      userId,
      newsId,
      authorName,
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ error: "Ошибка добавления комментария" });
  }
};

exports.getCommentsForNews = async (req, res) => {
  const { newsId } = req.params;

  try {
    const news = await News.findByPk(newsId);
    if (!news) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    const comments = await Comment.findAll({
      where: { newsId, parentCommentId: null },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "avatarUrl"],
        },
        {
          model: User,
          as: "likedBy",
          attributes: ["id"],
          through: { attributes: [] },
        },
        {
          model: Comment,
          as: "replies",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "username", "avatarUrl"],
            },
            {
              model: User,
              as: "likedBy",
              attributes: ["id"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!comments) {
      return res.status(404).json({ error: "Комментариев нету" });
    }

    const commentsData = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      authorName: comment.authorName,
      newsId: comment.newsId,
      userId: comment.userId,
      parentCommentId: comment.parentCommentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likesCount: comment.likedBy.length,
      likedByCurrentUser: req.user
        ? comment.likedBy.some((user) => user.id === req.user.id)
        : false,
      authorDetails: comment.user
        ? {
            id: comment.user.id,
            username: comment.user.username,
            avatarUrl: comment.user.avatarUrl,
          }
        : null,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        authorName: reply.authorName,
        newsId: reply.newsId,
        userId: reply.userId,
        parentCommentId: reply.parentCommentId,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        likesCount: reply.likedBy.length,
        likedByCurrentUser: req.user
          ? reply.likedBy.some((user) => user.id === req.user.id)
          : false,
        authorDetails: reply.user
          ? {
              id: reply.user.id,
              username: reply.user.username,
              avatarUrl: reply.user.avatarUrl,
            }
          : null,
        replies: [],
      })),
    }));

    res.json(commentsData);
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка получения комментариев: ${err.message}` });
  }
};

exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Комментарий не найден" });
    }

    await comment.destroy();
    res.status(200).json({ message: "Комментарий успешно удален" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Ошибка удаления комментария" });
  }
};

exports.likeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Вы не авторизованы" });
  }

  try {
    const [like, created] = await CommentLike.findOrCreate({
      where: { commentId, userId },
    });

    let likesCount;
    let likedByCurrentUser;

    if (!created) {
      await like.destroy();
      likesCount = await CommentLike.count({ where: { commentId } });
      likedByCurrentUser = false;
      return res.json({
        message: "Лайк удален",
        likesCount,
        likedByCurrentUser,
      });
    }

    likesCount = await CommentLike.count({ where: { commentId } });
    likedByCurrentUser = true;

    res.json({
      message: "Комментарий лайкнут",
      likesCount,
      likedByCurrentUser,
    });
  } catch (err) {
    res.status(500).json({ error: `Ошибка лайка комментария: ${err.message}` });
  }
};

exports.replyToComment = async (req, res) => {
  const { content } = req.body;
  const { parentCommentId } = req.params;

  if (!content) {
    return res
      .status(400)
      .json({ error: "Необходимо указать содержимое комментария" });
  }

  const authorName = req.user ? req.user.username : req.body.authorName;
  const userId = req.user ? req.user.id : null;

  if (!authorName) {
    return res
      .status(400)
      .json({ error: "Необходимо указать имя пользователя" });
  }

  try {
    const parentComment = await Comment.findByPk(parentCommentId);
    if (!parentComment) {
      return res
        .status(404)
        .json({ error: "Родительский комментарий не найден" });
    }

    const replyComment = await Comment.create({
      content,
      userId: userId || null,
      authorName,
      newsId: parentComment.newsId,
      parentCommentId: parentComment.id,
    });
    console.log("Создан ответ:", replyComment.dataValues);
    res.status(201).json(replyComment);
  } catch (err) {
    console.error("Error replying to comment:", err);
    res.status(500).json({ error: "Ошибка добавления ответа на комментарий" });
  }
};
