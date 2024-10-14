const { posix } = require("path");
const { Op } = require("sequelize");
const {
  News,
  User,
  Category,
  Comment,
  Tag,
  Media,
  Author,
  sequelize,
} = require("../models");

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "authorDetails" },
        { model: Category, as: "category" },
        { model: Comment, as: "comments" },
        { model: Tag, as: "tags" },
        { model: Media, as: "mediaFiles" },
        { model: Author, as: "author" },
      ],
    });
    res.json(news);
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка получения новостей: ${err.message}` });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id, {
      include: [
        { model: Category, as: "category" },
        { model: User, as: "authorDetails" },
        { model: Comment, as: "comments" },
        { model: Tag, as: "tags" },
        { model: Media, as: "mediaFiles" },
        { model: Author, as: "author", attributes: ["id", "name", "bio"] },
      ],
    });
    if (!news) return res.status(404).json({ message: "Новость не найдена" });

    await news.increment("views");
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: `Ошибка получения новости: ${err.message}` });
  }
};

exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Media.findAll({
      where: { type: "video" },
      include: [
        {
          model: News,
          as: "news",
        },
      ],
    });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: `Ошибка получения видео: ${err.message}` });
  }
};

exports.getNewsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Не указана дата." });
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const news = await News.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [
        { model: User, as: "authorDetails" },
        { model: Category, as: "category" },
        { model: Comment, as: "comments" },
        { model: Tag, as: "tags" },
        { model: Media, as: "mediaFiles" },
        { model: Author, as: "author" },
      ],
    });

    if (!news || news.length === 0) {
      return res
        .status(404)
        .json({ message: "Новости на эту дату не найдены." });
    }

    res.json(news);
  } catch (err) {
    res
      .status(500)
      .json({ error: `Ошибка получения новостей по дате: ${err.message}` });
  }
};
exports.createNews = async (req, res) => {
  const { title, content, categoryId } = req.body;
  const mediaFiles = req.files;

  const authorId = req.user.id;

  if (!title) {
    return res.status(400).json({ error: "Пожалуйста, заполните заголовок" });
  }

  if (!content) {
    return res
      .status(400)
      .json({ error: "Пожалуйста, заполните поле с содержанием новости" });
  }

  if (!authorId) {
    return res
      .status(400)
      .json({ error: "Не указан пользователь, добавивший новость" });
  }

  const categoryExists = await Category.findByPk(categoryId);
  if (!categoryExists) {
    return res.status(400).json({ error: "Категория не существует." });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();

    const news = await News.create(
      {
        title,
        content,
        authorId,
        categoryId,
      },
      { transaction }
    );

    if (mediaFiles) {
      const mediaInstances = [];

      if (mediaFiles.images) {
        for (let file of mediaFiles.images) {
          const media = await Media.create({
            url: posix.join("uploads", "images", file.filename),
            type: "image",
          });
          mediaInstances.push(media);
        }
      }

      if (mediaFiles.videos) {
        for (let file of mediaFiles.videos) {
          const media = await Media.create({
            url: posix.join("uploads", "videos", file.filename),
            type: "video",
          });
          mediaInstances.push(media);
        }
      }

      await news.addMediaFiles(mediaInstances, { transaction });
    }

    await transaction.commit();
    res.status(201).json(news);
  } catch (err) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: `Ошибка создания новости: ${err.message}` });
  }
};

exports.updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, content, categoryId, tags } = req.body;
  const mediaFiles = req.files;

  const authorId = req.user.id;

  if (!title || !content) {
    return res
      .status(400)
      .json({ error: "Пожалуйста, заполните заголовок и содержание" });
  }

  try {
    const news = await News.findByPk(id, {
      include: [{ model: Media, as: "mediaFiles" }],
    });

    if (!news) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    const categoryExists = await Category.findByPk(categoryId);
    if (!categoryExists) {
      return res.status(400).json({ error: "Категория не существует." });
    }

    let transaction;
    try {
      transaction = await sequelize.transaction();

      await news.update(
        {
          title,
          content,
          categoryId,
          authorId,
        },
        { transaction }
      );

      if (mediaFiles && (mediaFiles.images || mediaFiles.videos)) {
        const mediaInstances = [];

        if (mediaFiles.images) {
          for (let file of mediaFiles.images) {
            const media = await Media.create({
              url: posix.join("uploads", "images", file.filename),
              type: "image",
            });
            mediaInstances.push(media);
          }
        }

        if (mediaFiles.videos) {
          for (let file of mediaFiles.videos) {
            const media = await Media.create({
              url: posix.join("uploads", "videos", file.filename),
              type: "video",
            });
            mediaInstances.push(media);
          }
        }

        await news.setMediaFiles(mediaInstances, { transaction });
      }

      await transaction.commit();
      res.status(200).json({ message: "Новость успешно обновлена", news });
    } catch (err) {
      if (transaction) await transaction.rollback();
      res
        .status(500)
        .json({ error: `Ошибка обновления новости: ${err.message}` });
    }
  } catch (err) {
    res.status(500).json({ error: `Ошибка: ${err.message}` });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    await News.destroy({ where: { id } });
    res.json({ message: "Новость удалена" });
  } catch (err) {
    res.status(500).json({ error: `Ошибка удаления новости${err}` });
  }
};
