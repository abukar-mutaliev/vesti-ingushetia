require('dotenv').config();
const { Op } = require('sequelize');
const {
    News,
    User,
    Category,
    Comment,
    Media,
    Author,
    sequelize,
} = require('../models');
const fs = require('fs');
const baseUrl = process.env.BASE_URL;

const path = require('path');

const formatMediaUrls = (newsItems) => {
    return newsItems.map((item) => {
        const newsObj = item.toJSON();
        newsObj.mediaFiles = newsObj.mediaFiles.map((media) => {
            const mediaObj = { ...media };

            if (/^https?:\/\//i.test(mediaObj.url)) {
                mediaObj.url = mediaObj.url;
            } else {
                mediaObj.url = mediaObj.url.startsWith(baseUrl)
                    ? mediaObj.url
                    : `${baseUrl}/${mediaObj.url}`;
            }

            return mediaObj;
        });
        return newsObj;
    });
};



exports.getAllNews = async (req, res) => {
    try {
        const news = await News.findAll({

            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'authorDetails' },
                { model: Category, as: 'category' },
                { model: Comment, as: 'comments' },
                { model: Author, as: 'author' },
                {
                    model: Media,
                    as: 'mediaFiles',
                },
            ],
        });

        const modifiedNews = formatMediaUrls(news);

        res.json(modifiedNews);
    } catch (err) {
        res.status(500).json({
            error: `Ошибка получения новостей: ${err.message}`,
        });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findByPk(id, {
            include: [
                { model: Category, as: 'category' },
                { model: User, as: 'authorDetails' },
                { model: Comment, as: 'comments' },
                {
                    model: Media,
                    as: 'mediaFiles',
                },
                {
                    model: Author,
                    as: 'author',
                    attributes: ['id', 'name', 'bio'],
                },
            ],
        });
        if (!news)
            return res.status(404).json({ message: 'Новость не найдена' });

        await news.increment('views');

        const modifiedNews = formatMediaUrls([news])[0];

        res.json(modifiedNews);
    } catch (err) {
        res.status(500).json({
            error: `Ошибка получения новости: ${err.message}`,
        });
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
                { model: User, as: 'authorDetails' },
                { model: Category, as: 'category' },
                { model: Comment, as: 'comments' },
                { model: Media, as: 'mediaFiles' },
                { model: Author, as: 'author' },
            ],
        });

        if (!news || news.length === 0)
            return res
            .status(404)
            .json({ message: 'Новости на эту дату не найдены.' });

        const modifiedNews = formatMediaUrls(news);
        res.json(modifiedNews);
    } catch (err) {
        res.status(500).json({
            error: `Ошибка получения новостей по дате: ${err.message}`,
        });
    }
};

exports.createNews = async (req, res) => {
    const { title, content, categoryId, videoUrl, publishDate } = req.body;
    const mediaFiles = req.files;
    const authorId = req.user.id;

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const newsData = {
            title,
            content,
            authorId,
            categoryId,
        };

        if (publishDate) {
            const date = new Date(publishDate);
            if (!isNaN(date)) {
                newsData.publishDate = date;
            } else {
                throw new Error('Неверный формат даты');
            }
        }

        const news = await News.create(newsData, { transaction });

        const mediaInstances = [];

        if (mediaFiles && mediaFiles.images) {
            for (let file of mediaFiles.images) {
                const imageUrl = path.posix.join(
                    'uploads',
                    'images',
                    file.filename
                );
                const media = await Media.create(
                    {
                        url: imageUrl,
                        type: 'image',
                    },
                    { transaction },
                );
                mediaInstances.push(media);
            }
        }

        if (videoUrl) {
            const media = await Media.create(
                {
                    url: videoUrl,
                    type: 'video',
                },
                { transaction },
            );
            mediaInstances.push(media);
        }

        if (mediaInstances.length > 0) {
            await news.addMediaFiles(mediaInstances, { transaction });
        }

        await transaction.commit();
        res.status(201).json(news);
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error('Ошибка создания новости:', err);
        res.status(500).json({
            error: `Ошибка создания новости: ${err.message}`,
        });
    }
};

exports.updateNews = async (req, res) => {
    const { id } = req.params;
    const { title, content, categoryId, videoUrl, existingMedia, publishDate } = req.body; // Добавлено publishDate
    const mediaFiles = req.files;
    const authorId = req.user.id;

    try {
        const news = await News.findByPk(id, {
            include: [{ model: Media, as: 'mediaFiles' }],
        });
        if (!news) return res.status(404).json({ error: 'Новость не найдена' });

        let transaction;
        try {
            transaction = await sequelize.transaction();

            const updateData = {
                title,
                content,
                categoryId,
                authorId,
            };

            if (publishDate) {
                const date = new Date(publishDate);
                if (!isNaN(date)) {
                    updateData.publishDate = date;
                } else {
                    throw new Error('Неверный формат даты');
                }
            }

            await news.update(updateData, { transaction });

            const existingMediaIds = JSON.parse(existingMedia || '[]');

            const mediaToDelete = news.mediaFiles.filter(
                (media) => !existingMediaIds.includes(media.id)
            );

            for (let media of mediaToDelete) {
                if (media.type === 'image' || media.type === 'audio') {
                    const mediaPath = path.join(__dirname, '../../', media.url.replace(/\/+/g, path.sep));
                    fs.unlink(mediaPath, (err) => {
                        if (err) {
                            console.error('Ошибка удаления медиафайла:', err);
                        }
                    });
                }
            }

            await Media.destroy({
                where: { id: mediaToDelete.map((media) => media.id), type: { [Op.ne]: 'video' } },
                transaction,
            });

            const mediaInstances = [];
            if (mediaFiles && mediaFiles.images) {
                for (let file of mediaFiles.images) {
                    const imageUrl = path.posix.join(
                        'uploads',
                        'images',
                        file.filename
                    );
                    const media = await Media.create(
                        {
                            url: imageUrl,
                            type: 'image',
                        },
                        { transaction },
                    );
                    mediaInstances.push(media);
                }
            }

            const existingVideo = news.mediaFiles.find((m) => m.type === 'video');

            if (videoUrl && videoUrl.trim() !== '') {
                if (existingVideo) {
                    await existingVideo.update({ url: videoUrl.trim() }, { transaction });
                } else {
                    const newVideo = await Media.create(
                        {
                            url: videoUrl.trim(),
                            type: 'video',
                        },
                        { transaction },
                    );
                    mediaInstances.push(newVideo);
                }
            } else {
                if (existingVideo) {
                    await news.removeMediaFiles(existingVideo, { transaction });
                    await Media.destroy({
                        where: { id: existingVideo.id },
                        transaction,
                    });
                }
            }

            if (mediaInstances.length > 0) {
                await news.addMediaFiles(mediaInstances, { transaction });
            }

            await transaction.commit();

            const updatedNews = await News.findByPk(id, {
                include: [{ model: Media, as: 'mediaFiles' }],
            });

            const modifiedNews = formatMediaUrls([updatedNews])[0];

            res.status(200).json({
                message: 'Новость успешно обновлена',
                news: modifiedNews,
            });
        } catch (err) {
            if (transaction) await transaction.rollback();
            console.error('Ошибка обновления новости:', err);
            res.status(500).json({
                error: `Ошибка обновления новости: ${err.message}`,
            });
        }
    } catch (err) {
        console.error('Внешняя ошибка:', err);
        res.status(500).json({ error: `Ошибка: ${err.message}` });
    }
};


exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findByPk(id, {
            include: [{ model: Media, as: 'mediaFiles' }],
        });

        if (!news) {
            return res.status(404).json({ error: 'Новость не найдена' });
        }

        const transaction = await sequelize.transaction();

        try {
            for (let media of news.mediaFiles) {
                const mediaPath = path.resolve(__dirname, '../../', media.url);
                try {
                    await fs.promises.unlink(mediaPath);
                } catch (err) {
                    if (err.code === 'ENOENT') {
                        console.warn(`Файл для удаления не найден: ${mediaPath}`);
                    } else {
                        console.error('Ошибка удаления медиафайла:', err);
                        throw err;
                    }
                }
            }

            const mediaIds = news.mediaFiles.map(media => media.id);
            if (mediaIds.length > 0) {
                await Media.destroy({
                    where: { id: mediaIds },
                    transaction,
                });
            }

            await news.destroy({ transaction });

            await transaction.commit();

            return res.json({ message: 'Новость успешно удалена.' });
        } catch (err) {
            await transaction.rollback();
            console.error('Ошибка при удалении новости:', err);
            return res.status(500).json({
                error: `Ошибка удаления новости: ${err.message}`,
            });
        }
    } catch (err) {
        console.error('Внутренняя ошибка сервера:', err);
        return res.status(500).json({
            error: `Внутренняя ошибка сервера: ${err.message}`,
        });
    }
};