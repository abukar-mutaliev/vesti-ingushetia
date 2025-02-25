require('dotenv').config();
const { Op } = require('sequelize');
const {
    News,
    User,
    Category,
    Comment,
    Media,
    sequelize,
} = require('../models');
const fs = require('fs');
const baseUrl = process.env.BASE_URL;
const he = require('he');
const path = require('path');

const formatMediaUrls = (newsItems) => {
    return newsItems.map((item) => {
        const newsObj = item.toJSON();

        if (newsObj.mediaFiles) {
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
        }

        if (newsObj.authorDetails && newsObj.authorDetails.avatarUrl) {
            if (/^https?:\/\//i.test(newsObj.authorDetails.avatarUrl)) {
                newsObj.authorDetails.avatarUrl = newsObj.authorDetails.avatarUrl;
            } else {
                newsObj.authorDetails.avatarUrl = newsObj.authorDetails.avatarUrl.startsWith(baseUrl)
                    ? newsObj.authorDetails.avatarUrl
                    : `${baseUrl}/${newsObj.authorDetails.avatarUrl}`;
            }
        }

        return newsObj;
    });
};

exports.getAllNews = async (req, res) => {
    try {
        const news = await News.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'authorDetails',
                    attributes: ['id', 'username', 'email', 'avatarUrl', 'isAdmin']
                },
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] },
                },
                { model: Comment, as: 'comments' },
                { model: Media, as: 'mediaFiles' },
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

const stripHtml = (html) => {
    return he.decode(html)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const formatHtml = (html) => {
    return html
        .replace(/\r?\n/g, '')
        .replace(/\s+/g, ' ')
        .replace(/> </g, '>\n<')
        .replace(/&nbsp;/g, ' ')
        .trim();
};
const shortenDescription = (text) => {
    const cleanText = stripHtml(text).trim();
    const sentences = cleanText.split(/[.!?]/).filter(Boolean);
    const shortened = sentences.slice(0, 2).join('. ');
    return shortened.endsWith('.') ? shortened : shortened + '.';
};

exports.getNewsById = async (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const isBot = userAgent.includes('YandexBot') || userAgent.includes('bot');

    try {
        const { id } = req.params;
        const news = await News.findByPk(id, {
            include: [
                { model: User, as: 'authorDetails', attributes: ['username'] },
                { model: Media, as: 'mediaFiles', attributes: ['type', 'url'] },
            ],
        });

        if (!news) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }

        if (!isBot) {
            return res.sendFile(path.join(__dirname, '../../index.html'));
        }

        const cleanedContent = formatHtml(news.content);
        const safeTitle = stripHtml(news.title);
        const shortDescription = shortenDescription(news.content);

        const imageUrl = news.mediaFiles?.find(media => media.type === 'image')?.url || '/logo.jpg';
        const mainImage = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}/${imageUrl.replace(/^\//, '')}`;

        const author = news.authorDetails?.username || 'Редакция';

        const publisherMarkup = `
            <div itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
                <meta itemprop="name" content="Вести Ингушетии" />
                <div itemprop="logo" itemscope itemtype="http://schema.org/ImageObject">
                    <meta itemprop="url" content="${baseUrl}/logo.jpg" />
                </div>
            </div>
        `;

        const formattedDate = new Date(news.publishDate || news.createdAt).toISOString();

        const template = formatHtml(fs.readFileSync(path.join(__dirname, '../../seo.html'), 'utf-8'));

        let html = template
            .replace(/%TITLE%/g, safeTitle)
            .replace(/%FULLTEXT%/g, cleanedContent)
            .replace(/%DESCRIPTION%/g, shortDescription)
            .replace(/%PUBLISH_DATE%/g, formattedDate)
            .replace(/%AUTHOR%/g, author)
            .replace(/%NEWS_ID%/g, id)
            .replace(/%IMAGE_URL%/g, mainImage)
            .replace(/%MAIN_ENTITY_PAGE%/g, `${baseUrl}/news/${id}`)
            .replace(/%PUBLISHER_MARKUP%/g, publisherMarkup)
            .replace(/\${baseUrl}/g, baseUrl);

        html = formatHtml(html);

        return res.send(html);

    } catch (error) {
        console.error('Ошибка при обработке новости:', error.message);
        res.status(500).json({
            message: 'Внутренняя ошибка сервера',
            error: error.message
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
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] },
                },
                { model: Comment, as: 'comments' },
                { model: Media, as: 'mediaFiles' },
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
    const { title, content, categoryIds, videoUrl, publishDate } = req.body;
    const mediaFiles = req.files;
    const authorId = req.user.id;

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const newsData = {
            title,
            content,
            authorId,
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

        let parsedCategoryIds;
        try {
            parsedCategoryIds = JSON.parse(categoryIds).map(Number);
            if (!Array.isArray(parsedCategoryIds) || parsedCategoryIds.some(id => !Number.isInteger(id))) {
                throw new Error('Неверный формат ID категорий');
            }
        } catch (e) {
            throw new Error('Неверный формат ID категорий');
        }

        if (parsedCategoryIds.length > 0) {
            const categories = await Category.findAll({
                where: { id: parsedCategoryIds },
                transaction,
            });

            if (categories.length !== parsedCategoryIds.length) {
                throw new Error('Некоторые категории не найдены');
            }

            await news.addCategories(categories, { transaction });
        } else {
            throw new Error('Необходимо выбрать хотя бы одну категорию');
        }

        const mediaInstances = [];

        if (mediaFiles && mediaFiles.images) {
            for (let file of mediaFiles.images) {
                const imageUrl = path.posix.join(
                    'uploads',
                    'images',
                    file.filename,
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
        const createdNews = await News.findByPk(news.id, {
            include: [
                { model: Category, as: 'categories' },
                { model: Media, as: 'mediaFiles' }
            ],
        });
        res.status(201).json(createdNews);
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error('Ошибка создания новости:', err);
        res.status(400).json({
            error: `Ошибка создания новости: ${err.message}`,
            errors: [{
                location: "body",
                msg: err.message,
                path: "categoryIds",
                type: "field"
            }]
        });
    }
};

exports.updateNews = async (req, res) => {
    const { id } = req.params;
    let { title, content, categoryIds, videoUrl, existingMedia, publishDate } =
        req.body;
    const mediaFiles = req.files;
    const authorId = req.user.id;

    try {
        const news = await News.findByPk(id, {
            include: [
                { model: Media, as: 'mediaFiles' },
                { model: Category, as: 'categories' },
            ],
        });
        if (!news) return res.status(404).json({ error: 'Новость не найдена' });

        let transaction;
        try {
            transaction = await sequelize.transaction();

            const updateData = {
                title,
                content,
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

            if (typeof categoryIds === 'string') {
                categoryIds = JSON.parse(categoryIds);
            }

            if (Array.isArray(categoryIds)) {
                const categories = await Category.findAll({
                    where: { id: categoryIds },
                    transaction,
                });
                await news.setCategories(categories, { transaction });
            }

            const existingMediaIds = JSON.parse(existingMedia || '[]');

            const mediaToDelete = news.mediaFiles.filter(
                (media) => !existingMediaIds.includes(media.id),
            );

            for (let media of mediaToDelete) {
                if (media.type === 'image' || media.type === 'audio') {
                    const mediaPath = path.join(
                        __dirname,
                        '../../',
                        media.url.replace(/\/+/g, path.sep),
                    );
                    fs.unlink(mediaPath, (err) => {
                        if (err) {
                            console.error('Ошибка удаления медиафайла:', err);
                        }
                    });
                }
            }

            await Media.destroy({
                where: {
                    id: mediaToDelete.map((media) => media.id),
                    type: { [Op.ne]: 'video' },
                },
                transaction,
            });

            const mediaInstances = [];
            if (mediaFiles && mediaFiles.images) {
                for (let file of mediaFiles.images) {
                    const imageUrl = path.posix.join(
                        'uploads',
                        'images',
                        file.filename,
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

            const existingVideo = news.mediaFiles.find(
                (m) => m.type === 'video',
            );

            if (videoUrl && videoUrl.trim() !== '') {
                if (existingVideo) {
                    await existingVideo.update(
                        { url: videoUrl.trim() },
                        { transaction },
                    );
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
                include: [
                    { model: Media, as: 'mediaFiles' },
                    { model: Category, as: 'categories' },
                ],
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
                        console.warn(
                            `Файл для удаления не найден: ${mediaPath}`,
                        );
                    } else {
                        console.error('Ошибка удаления медиафайла:', err);
                        throw err;
                    }
                }
            }

            const mediaIds = news.mediaFiles.map((media) => media.id);
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
