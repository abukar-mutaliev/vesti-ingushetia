const { posix } = require("path");
require("dotenv").config();
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
const fs = require("fs");
const path = require("path");
const baseUrl = process.env.BASE_URL;

function formatMediaUrls(newsItems) {
  return newsItems.map((item) => ({
    ...item.toJSON(),
    mediaFiles: item.mediaFiles.map((media) => ({
      ...media.toJSON(),
      url: media.url.startsWith(baseUrl)
        ? media.url
        : `${baseUrl}/uploads/${media.url}`,
    })),
  }));
}

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

    const modifiedNews = formatMediaUrls(news);
    res.json(modifiedNews);
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

    const modifiedNews = {
      ...news.toJSON(),
      mediaFiles: news.mediaFiles.map((media) => ({
        ...media.toJSON(),
        url: media.url.startsWith(baseUrl)
          ? media.url
          : `${baseUrl}/${media.url}`,
      })),
    };

    res.json(modifiedNews);
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

    const modifiedVideos = videos.map((video) => ({
      ...video.toJSON(),
      url: video.url.startsWith(baseUrl)
        ? video.url
        : `${baseUrl}/${video.url}`,
    }));

    res.json(modifiedVideos);
  } catch (err) {
    res.status(500).json({ error: `Ошибка получения видео: ${err.message}` });
  }
};

exports.getNewsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const news = await News.findAll({
      where: { createdAt: { [Op.between]: [startOfDay, endOfDay] } },
      include: [
        { model: User, as: "authorDetails" },
        { model: Category, as: "category" },
        { model: Comment, as: "comments" },
        { model: Tag, as: "tags" },
        { model: Media, as: "mediaFiles" },
        { model: Author, as: "author" },
      ],
    });

    if (!news || news.length === 0)
      return res
        .status(404)
        .json({ message: "Новости на эту дату не найдены." });

    const modifiedNews = formatMediaUrls(news);
    res.json(modifiedNews);
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

  let transaction;
  try {
    transaction = await sequelize.transaction();

    const news = await News.create(
      { title, content, authorId, categoryId },
      { transaction }
    );

    if (mediaFiles) {
      const mediaInstances = [];

      if (mediaFiles.images) {
        for (let file of mediaFiles.images) {
          const media = await Media.create(
            {
              url: posix.join("uploads", "images", file.filename),
              type: "image",
            },
            { transaction }
          );
          mediaInstances.push(media);
        }
      }

      if (mediaFiles.videos) {
        for (let file of mediaFiles.videos) {
          const media = await Media.create(
            {
              url: posix.join("uploads", "videos", file.filename),
              type: "video",
            },
            { transaction }
          );
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
  const { title, content, categoryId, existingMedia } = req.body;
  const mediaFiles = req.files;
  const authorId = req.user.id;

  try {
    const news = await News.findByPk(id, {
      include: [{ model: Media, as: "mediaFiles" }],
    });
    if (!news) return res.status(404).json({ error: "Новость не найдена" });

    let transaction;
    try {
      transaction = await sequelize.transaction();

      await news.update(
        { title, content, categoryId, authorId },
        { transaction }
      );

      const existingMediaIds = JSON.parse(existingMedia || "[]");

      const mediaToDelete = news.mediaFiles.filter(
        (media) => !existingMediaIds.includes(media.id)
      );

      for (let media of mediaToDelete) {
        const mediaPath = path.join(
          __dirname,
          "..",
          media.url.replace(`${baseUrl}/`, "")
        );
        fs.unlink(mediaPath, (err) => {
          if (err) {
            console.error("Ошибка удаления медиафайла:", err);
          }
        });
      }

      await Media.destroy({
        where: { id: mediaToDelete.map((media) => media.id) },
        transaction,
      });

      const mediaInstances = [];

      if (mediaFiles.images) {
        for (let file of mediaFiles.images) {
          const media = await Media.create(
            {
              url: posix.join("uploads", "images", file.filename),
              type: "image",
            },
            { transaction }
          );
          mediaInstances.push(media);
        }
      }

      if (mediaFiles.videos) {
        for (let file of mediaFiles.videos) {
          const media = await Media.create(
            {
              url: posix.join("uploads", "videos", file.filename),
              type: "video",
            },
            { transaction }
          );
          mediaInstances.push(media);
        }
      }

      await news.addMediaFiles(mediaInstances, { transaction });

      await transaction.commit();

      const updatedNews = await News.findByPk(id, {
        include: [{ model: Media, as: "mediaFiles" }],
      });

      const modifiedNews = {
        ...updatedNews.toJSON(),
        mediaFiles: updatedNews.mediaFiles.map((media) => ({
          ...media.toJSON(),
          url: media.url.startsWith(baseUrl)
            ? media.url
            : `${baseUrl}/${media.url}`,
        })),
      };

      res
        .status(200)
        .json({ message: "Новость успешно обновлена", news: modifiedNews });
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
    const news = await News.findByPk(id, {
      include: [{ model: Media, as: "mediaFiles" }],
    });

    if (!news) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    for (let media of news.mediaFiles) {
      const mediaPath = path.join(
        __dirname,
        "..",
        media.url.replace(`${baseUrl}/`, "")
      );
      fs.unlink(mediaPath, (err) => {
        if (err) {
          console.error("Ошибка удаления медиафайла:", err);
        }
      });
    }

    await Media.destroy({
      where: { id: news.mediaFiles.map((media) => media.id) },
    });

    await news.destroy();

    res.json({ message: "Новость удалена" });
  } catch (err) {
    res.status(500).json({ error: `Ошибка удаления новости: ${err.message}` });
  }
};
