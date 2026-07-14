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
const newsScheduler = require('../schedulers/newsScheduler');
const logger = require('../logger');
const MoscowTimeUtils = require('../utils/moscowTimeUtils');

const path = require('path');

const parseBooleanField = (value) => {
    if (value === undefined || value === null || value === '') return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        return value === 'true' || value === '1';
    }
    return Boolean(value);
};

const SAFE_USER_ATTRIBUTES = ['id', 'username', 'avatarUrl', 'createdAt'];

const ADMIN_USER_ATTRIBUTES = ['id', 'username', 'email', 'avatarUrl', 'isAdmin', 'createdAt'];

// 3. Исправленная функция formatMediaUrls в newsController.js

const formatMediaUrls = (newsItems) => {
    return newsItems.map((item) => {
        const newsObj = item.toJSON();

        if (newsObj.mediaFiles) {
            newsObj.mediaFiles = newsObj.mediaFiles.map((media) => {
                const mediaObj = { ...media };

                // Если это уже полный URL (http/https), оставляем как есть
                if (/^https?:\/\//i.test(mediaObj.url)) {
                    return mediaObj;
                }

                // Если URL уже содержит базовый домен, оставляем как есть
                if (mediaObj.url.includes(baseUrl)) {
                    return mediaObj;
                }

                // Формируем полный URL
                let fullUrl;
                if (mediaObj.url.startsWith('uploads/')) {
                    // URL уже в правильном формате uploads/images/filename
                    fullUrl = `${baseUrl}/${mediaObj.url}`;
                } else if (mediaObj.url.startsWith('/uploads/')) {
                    // URL начинается со слеша
                    fullUrl = `${baseUrl}${mediaObj.url}`;
                } else {
                    // Предполагаем что это просто имя файла
                    fullUrl = `${baseUrl}/uploads/images/${mediaObj.url}`;
                }

                mediaObj.url = fullUrl;

                return mediaObj;
            });
        }

        // Обрабатываем аватар автора
        if (newsObj.authorDetails && newsObj.authorDetails.avatarUrl) {
            const originalAvatarUrl = newsObj.authorDetails.avatarUrl;

            if (/^https?:\/\//i.test(originalAvatarUrl)) {
                // Уже полный URL
                newsObj.authorDetails.avatarUrl = originalAvatarUrl;
            } else if (originalAvatarUrl.includes(baseUrl)) {
                // Уже содержит baseUrl
                newsObj.authorDetails.avatarUrl = originalAvatarUrl;
            } else {
                // Формируем полный URL для аватара
                if (originalAvatarUrl.startsWith('/')) {
                    newsObj.authorDetails.avatarUrl = `${baseUrl}${originalAvatarUrl}`;
                } else {
                    newsObj.authorDetails.avatarUrl = `${baseUrl}/${originalAvatarUrl}`;
                }
            }
        }

        return newsObj;
    });
};


exports.getElectionsNews = async (req, res) => {
    try {
        const news = await News.findAll({
            where: {
                isElections: true,
                publishDate: {
                    [Op.lte]: new Date(),
                },
            },
            order: [['publishDate', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'authorDetails',
                    attributes: SAFE_USER_ATTRIBUTES,
                },
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] },
                },
                { model: Media, as: 'mediaFiles' },
            ],
        });

        res.json(formatMediaUrls(news));
    } catch (err) {
        res.status(500).json({
            error: `Ошибка получения новостей раздела «Выборы»: ${err.message}`,
        });
    }
};

exports.getAllNews = async (req, res) => {
    try {
        const isAdmin = req.user && req.user.isAdmin;
        const userAttributes = isAdmin ? ADMIN_USER_ATTRIBUTES : SAFE_USER_ATTRIBUTES;

        const news = await News.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    as: 'authorDetails',
                    attributes: userAttributes
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

exports.generateSchemaForYandex = (news) => {
    const baseUrl = process.env.BASE_URL || 'https://ingushetiatv.ru';

    const articleSchema = {
        "@context": "http://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${baseUrl}/news/${news.id}`
        },
        "headline": news.title,
        "description": news.description || news.title.substring(0, 150),
        "image": [],
        "author": {
            "@type": "Person",
            "name": news.authorDetails?.username || "Редакция"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Вести Ингушетии",
            "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/logo.png`,
                "width": 600,
                "height": 60
            }
        },
        "datePublished": news.publishDate || news.createdAt,
        "dateModified": news.updatedAt || news.publishDate || news.createdAt,
        "keywords": news.categories?.map(cat => cat.name).join(', ') || "новости, Ингушетия, ГТРК"
    };

    if (news.mediaFiles && news.mediaFiles.length > 0) {
        const imageMedia = news.mediaFiles.filter(media => media.type === 'image');
        if (imageMedia.length > 0) {
            articleSchema.image = imageMedia.map(media => {
                const imageUrl = media.url.startsWith('http')
                    ? media.url
                    : `${baseUrl}${media.url}`;

                return imageUrl;
            });
        } else {
            articleSchema.image = [`${baseUrl}/default.png`];
        }
    }

    if (news.content) {
        const plainText = news.content.replace(/<[^>]*>?/gm, '');
        articleSchema.articleBody = plainText;
    }

    return JSON.stringify(articleSchema);
};

exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;

        const isAdmin = req.user && req.user.isAdmin;
        const userAttributes = isAdmin ? ADMIN_USER_ATTRIBUTES : SAFE_USER_ATTRIBUTES;

        const news = await News.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] },
                },
                {
                    model: User,
                    as: 'authorDetails',
                    attributes: userAttributes
                },
                { model: Comment, as: 'comments' },
                {
                    model: Media,
                    as: 'mediaFiles',
                },
            ],
        });
        if (!news)
            return res.status(404).json({ message: 'Новость не найдена' });

        await news.increment('views');

        const modifiedNews = formatMediaUrls([news])[0];

        // Проверяем, является ли запрос запросом от бота (на случай, если botHandler не сработал)
        const userAgent = req.headers['user-agent']?.toLowerCase() || '';
        const isBot = userAgent.includes('bot') ||
            userAgent.includes('spider') ||
            userAgent.includes('crawler') ||
            userAgent.includes('yandex') ||
            userAgent.includes('googlebot') ||
            req.isBot;

        if (isBot) {
            try {
                const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
                const seoHtmlPath = path.join(__dirname, '../../public/seo.html');
                
                if (fs.existsSync(seoHtmlPath)) {
                    let html = fs.readFileSync(seoHtmlPath, 'utf8');

                    const imageMedia = modifiedNews.mediaFiles?.find(media => media.type === 'image');
                    const imageUrl = imageMedia
                        ? (imageMedia.url.startsWith('http') ? imageMedia.url : `${baseUrl}${imageMedia.url.startsWith('/') ? '' : '/'}${imageMedia.url}`)
                        : `${baseUrl}/default.png`;

                    const author = modifiedNews.authorDetails?.username || 'Редакция';
                    const publishDate = modifiedNews.publishDate || modifiedNews.createdAt;
                    const plainContent = modifiedNews.content?.replace(/<[^>]*>?/gm, '') || '';
                    
                    // Описание для мета-тегов (первые 150-160 символов)
                    const description = plainContent.length > 0 
                        ? plainContent.substring(0, 160).trim() 
                        : modifiedNews.title.substring(0, 150);

                    // Экранируем HTML для безопасной вставки в мета-теги
                    const escapeHtml = (text) => {
                        if (!text) return '';
                        return String(text)
                            .replace(/&/g, '&amp;')
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/"/g, '&quot;')
                            .replace(/'/g, '&#039;');
                    };

                    html = html
                        .replace(/%TITLE%/g, escapeHtml(modifiedNews.title))
                        .replace(/%DESCRIPTION%/g, escapeHtml(description))
                        .replace(/%FULLTEXT%/g, escapeHtml(plainContent))
                        .replace(/%NEWS_ID%/g, id)
                        .replace(/%IMAGE_URL%/g, escapeHtml(imageUrl))
                        .replace(/%IMAGE_LENGTH%/g, '0')
                        .replace(/%IMAGE_TYPE%/g, 'image/jpeg')
                        .replace(/%PUBLISH_DATE%/g, publishDate ? new Date(publishDate).toISOString() : new Date().toISOString())
                        .replace(/%AUTHOR%/g, escapeHtml(author))
                        .replace(/%CONTENT%/g, modifiedNews.content || '') // HTML контент вставляем как есть
                        .replace(/\${baseUrl}/g, baseUrl)
                        .replace(/%BASE_URL%/g, escapeHtml(baseUrl));

                    const publisherMarkup = `
                        <div itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
                            <meta itemprop="name" content="Вести Ингушетии" />
                            <div itemprop="logo" itemscope itemtype="http://schema.org/ImageObject">
                                <meta itemprop="url" content="${baseUrl}/logo.png" />
                            </div>
                        </div>
                    `;
                    html = html.replace(/%PUBLISHER_MARKUP%/g, publisherMarkup)
                        .replace(/%[A-Z_]+%/g, '');

                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    return res.send(html);
                }

            } catch (error) {
                logger.error('Ошибка при генерации SEO HTML в getNewsById:', error);
            }
        }

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

        const isAdmin = req.user && req.user.isAdmin;
        const userAttributes = isAdmin ? ADMIN_USER_ATTRIBUTES : SAFE_USER_ATTRIBUTES;

        const news = await News.findAll({
            where: { createdAt: { [Op.between]: [startOfDay, endOfDay] } },
            include: [
                {
                    model: User,
                    as: 'authorDetails',
                    attributes: userAttributes
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


// Добавьте это логирование в метод createNews для отладки изображений

exports.createNews = async (req, res) => {
    const { title, content, categoryIds, videoUrl, publishDate, scheduleForLater } = req.body;
    const isElections = parseBooleanField(req.body.isElections);
    const mediaFiles = req.files;
    const authorId = req.user.id;

    if (scheduleForLater && publishDate) {
        try {
            let scheduledDate = new Date(publishDate);

            if (isNaN(scheduledDate.getTime())) {
                return res.status(400).json({
                    errors: [{
                        type: "field",
                        msg: "Неверный формат даты",
                        path: "publishDate",
                        location: "body"
                    }]
                });
            }

            const now = new Date();
            const minFutureTime = new Date(now.getTime() + 60 * 1000);

            if (scheduledDate <= minFutureTime) {
                // ИСПРАВЛЕНО: Очищаем загруженные файлы при ошибке
                cleanupUploadedFiles(mediaFiles);
                return res.status(400).json({
                    errors: [{
                        type: "field",
                        value: publishDate,
                        msg: "Дата отложенной публикации должна быть в будущем",
                        path: "publishDate",
                        location: "body"
                    }]
                });
            }

            // ИСПРАВЛЕНО: правильная обработка файлов для отложенных новостей
            const newsData = {
                title,
                content,
                categoryIds: JSON.parse(categoryIds || '[]'),
                videoUrl,
                publishDate: scheduledDate,
                isElections,
                mediaFiles: [] // Инициализируем пустым массивом
            };

            // Обрабатываем изображения для отложенной публикации
            if (mediaFiles && mediaFiles.images && mediaFiles.images.length > 0) {
                newsData.mediaFiles = mediaFiles.images.map(file => ({
                        type: file.mimetype.startsWith('image/') ? 'image' : 'other',
                        filename: file.filename,
                        originalname: file.originalname,
                        path: file.path, // ВАЖНО: сохраняем полный путь к файлу
                        mimetype: file.mimetype,
                        size: file.size
                }));
            }

            // Обрабатываем существующие изображения (при редактировании)
            const existingMediaUrls = req.body.existingMediaUrls;
            if (existingMediaUrls) {
                try {
                    const parsedUrls = JSON.parse(existingMediaUrls);
                    if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
                        const existingMedia = parsedUrls.map(url => {
                            // Извлекаем имя файла из URL
                            const filename = url.split('/').pop();
                            return {
                                type: 'image',
                                filename: filename,
                                url: url,
                                isExisting: true
                            };
                        });
                        
                        newsData.mediaFiles = [...newsData.mediaFiles, ...existingMedia];
                    }
                } catch (e) {
                    // игнорируем невалидный JSON existingMediaUrls
                }
            }

            const scheduledNews = await newsScheduler.scheduleNews(
                newsData,
                scheduledDate,
                authorId
            );

            logger.info(`✅ Создана отложенная новость: ${title}`, {
                authorId,
                scheduledDate: scheduledDate.toISOString(),
                scheduledDateMoscow: scheduledDate.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
                newsId: scheduledNews.id
            });

            return res.status(201).json({
                message: 'Новость запланирована для отложенной публикации',
                scheduledNews: {
                    id: scheduledNews.id,
                    title: scheduledNews.title,
                    scheduledDate: scheduledNews.scheduledDate,
                    scheduledDateMoscow: new Date(scheduledNews.scheduledDate).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
                    status: scheduledNews.status
                }
            });

        } catch (error) {
            cleanupUploadedFiles(mediaFiles);

            logger.error('Ошибка создания отложенной новости:', error);

            return res.status(400).json({
                errors: [{
                    type: "field",
                    msg: `Ошибка создания отложенной новости: ${error.message}`,
                    path: "publishDate",
                    location: "body"
                }]
            });
        }
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const newsData = {
            title,
            content,
            authorId,
            isElections,
        };

        if (publishDate && !scheduleForLater) {
            const finalDate = new Date(publishDate);
            if (!isNaN(finalDate.getTime())) {
                newsData.publishDate = finalDate;
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

        // ИСПРАВЛЕНО: детальное логирование обработки изображений
        if (mediaFiles && mediaFiles.images && mediaFiles.images.length > 0) {
            for (const file of mediaFiles.images) {
                try {
                    const imageUrl = path.posix.join('uploads', 'images', file.filename);

                    const media = await Media.create({
                        url: imageUrl,
                        type: 'image',
                    }, { transaction });

                    mediaInstances.push(media);
                } catch (mediaError) {
                    logger.error(`Ошибка создания медиа для файла ${file.originalname}:`, mediaError);
                    throw mediaError;
                }
            }
        }

        if (videoUrl) {
            const media = await Media.create({
                url: videoUrl,
                type: 'video',
            }, { transaction });
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

        logger.info(`✅ Создана новость: ${title}`, {
            authorId,
            newsId: news.id,
            publishDate: newsData.publishDate,
            immediate: !scheduleForLater
        });

        res.status(201).json(createdNews);

    } catch (err) {
        if (transaction) {
            await transaction.rollback();
        }

        logger.error('Ошибка создания новости:', err);

        res.status(400).json({
            error: `Ошибка создания новости: ${err.message}`,
            errors: [{
                location: "body",
                msg: err.message,
                path: "general",
                type: "field"
            }]
        });
    }
};

exports.updateNews = async (req, res) => {
    const { id } = req.params;
    let { title, content, categoryIds, videoUrl, existingMedia, publishDate } = req.body;
    const isElections = parseBooleanField(req.body.isElections);
    const mediaFiles = req.files;
    const authorId = req.user.id;

    let transaction;
    const uploadedFiles = []; // Для отслеживания загруженных файлов

    try {
        // 1. Получаем текущую новость с медиафайлами
        const news = await News.findByPk(id, {
            include: [
                { model: Media, as: 'mediaFiles' },
                { model: Category, as: 'categories' },
            ],
        });

        if (!news) {
            // Удаляем загруженные файлы если новость не найдена
            cleanupUploadedFiles(mediaFiles);
            return res.status(404).json({ error: 'Новость не найдена' });
        }

        transaction = await sequelize.transaction();

        // 3. Обновляем основные данные новости
        const updateData = { title, content, authorId, isElections };
        if (publishDate) {
            const date = new Date(publishDate);
            if (!isNaN(date)) {
                updateData.publishDate = date;
            } else {
                throw new Error('Неверный формат даты');
            }
        }

        await news.update(updateData, { transaction });

        // 4. Обновляем категории
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

        // 5. Обрабатываем существующие медиафайлы
        let existingMediaIds = [];
        try {
            existingMediaIds = existingMedia ? JSON.parse(existingMedia) : [];
            if (!Array.isArray(existingMediaIds)) {
                existingMediaIds = [];
            }
        } catch (e) {
            existingMediaIds = [];
        }

        // 6. Определяем какие изображения нужно удалить
        const currentImageFiles = news.mediaFiles.filter(media => media.type === 'image');
        const imagesToDelete = currentImageFiles.filter(media => !existingMediaIds.includes(media.id));

        // 7. Удаляем файлы из файловой системы
        for (const media of imagesToDelete) {
            await deleteMediaFile(media);
        }

        // 8. Удаляем записи из базы данных
        if (imagesToDelete.length > 0) {
            await Media.destroy({
                where: {
                    id: imagesToDelete.map(media => media.id)
                },
                transaction,
            });
        }

        // 9. Добавляем новые изображения
        const newMediaInstances = [];
        if (mediaFiles && mediaFiles.images && mediaFiles.images.length > 0) {
            for (const file of mediaFiles.images) {
                uploadedFiles.push(file.path); // Отслеживаем загруженные файлы

                const imageUrl = path.posix.join('uploads', 'images', file.filename);
                const media = await Media.create({
                    url: imageUrl,
                    type: 'image',
                }, { transaction });

                newMediaInstances.push(media);
            }

            if (newMediaInstances.length > 0) {
                await news.addMediaFiles(newMediaInstances, { transaction });
            }
        }

        // 10. Обрабатываем видео отдельно
        await handleVideoUpdate(news, videoUrl, transaction);

        // 11. Коммитим транзакцию
        await transaction.commit();
        transaction = null; // Помечаем что транзакция успешна

        // 12. Получаем обновленную новость
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
        // Откатываем транзакцию если она активна
        if (transaction) {
            await transaction.rollback();
        }

        // Удаляем загруженные файлы при ошибке
        cleanupUploadedFiles(mediaFiles);

        logger.error('Ошибка обновления новости:', err);

        res.status(500).json({
            error: `Ошибка обновления новости: ${err.message}`,
        });
    }
};

// 2. Вспомогательная функция для удаления медиафайла
async function deleteMediaFile(media) {
    const pathVariants = [
        path.resolve(__dirname, '../../uploads/images/', path.basename(media.url)),
        path.resolve(__dirname, '../uploads/images/', path.basename(media.url)),
        path.resolve(__dirname, '../../', media.url.replace(/\/+/g, path.sep)),
        path.resolve(__dirname, '../', media.url.replace(/\/+/g, path.sep))
    ];

    let fileDeleted = false;

    for (const mediaPath of pathVariants) {
        try {
            if (fs.existsSync(mediaPath)) {
                await fs.promises.unlink(mediaPath);
                fileDeleted = true;
                break;
            }
        } catch (err) {
            logger.error(`Ошибка удаления файла ${mediaPath}:`, err.message);
        }
    }

    return fileDeleted;
}

// 3. Вспомогательная функция для обработки видео
async function handleVideoUpdate(news, videoUrl, transaction) {
    const existingVideo = news.mediaFiles.find(m => m.type === 'video');

    if (videoUrl && videoUrl.trim() !== '') {
        if (existingVideo) {
            await existingVideo.update({ url: videoUrl.trim() }, { transaction });
        } else {
            // Создаем новое видео
            const newVideo = await Media.create({
                url: videoUrl.trim(),
                type: 'video',
            }, { transaction });
            await news.addMediaFiles([newVideo], { transaction });
        }
    } else {
        if (existingVideo) {
            await news.removeMediaFiles([existingVideo], { transaction });
            await Media.destroy({
                where: { id: existingVideo.id },
                transaction,
            });
        }
    }
}

// 4. Функция очистки загруженных файлов при ошибке (ИСПРАВЛЕНО)
function cleanupUploadedFiles(mediaFiles) {
    if (!mediaFiles || !mediaFiles.images) return;

    for (const file of mediaFiles.images) {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (err) {
            logger.error(`Ошибка удаления файла ${file.path}:`, err.message);
        }
    }
}

// 5. Утилита для очистки осиротевших файлов
exports.cleanupOrphanedFiles = async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads/images');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                message: 'Папка uploads/images не существует',
                deletedCount: 0,
                skippedCount: 0
            });
        }

        const files = fs.readdirSync(uploadsDir);

        // Получаем все используемые файлы из БД
        const mediaUrls = await Media.findAll({
            where: { type: 'image' },
            attributes: ['url']
        });

        const usedFilenames = mediaUrls.map(media => path.basename(media.url));

        let deletedCount = 0;
        let skippedCount = 0;
        const deletedFiles = [];

        for (const file of files) {
            if (!usedFilenames.includes(file)) {
                const filePath = path.join(uploadsDir, file);
                try {
                    // Проверяем возраст файла (удаляем только файлы старше 1 часа)
                    const stats = fs.statSync(filePath);
                    const fileAge = Date.now() - stats.mtime.getTime();
                    const oneHour = 60 * 60 * 1000;

                    if (fileAge > oneHour) {
                        await fs.promises.unlink(filePath);
                        deletedCount++;
                        deletedFiles.push(file);
                    } else {
                        skippedCount++;
                    }
                } catch (error) {
                    logger.error(`Ошибка удаления файла ${file}:`, error.message);
                    skippedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        res.json({
            message: 'Очистка осиротевших файлов завершена',
            totalFiles: files.length,
            deletedCount,
            skippedCount,
            deletedFiles: deletedFiles.slice(0, 10),
            note: 'Удаляются только файлы старше 1 часа'
        });

    } catch (error) {
        logger.error('Ошибка при очистке файлов:', error);
        res.status(500).json({
            error: `Ошибка при очистке файлов: ${error.message}`
        });
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
                if (media.type === 'image' || media.type === 'audio') {
                    const pathVariants = [
                        path.resolve(__dirname, '../../', media.url.replace(/\/+/g, path.sep)),
                        path.resolve(__dirname, '../', media.url.replace(/\/+/g, path.sep)),
                        path.resolve(__dirname, '../../uploads/images/', path.basename(media.url)),
                        path.resolve(__dirname, '../uploads/images/', path.basename(media.url))
                    ];

                    for (const mediaPath of pathVariants) {
                        try {
                            if (fs.existsSync(mediaPath)) {
                                await fs.promises.unlink(mediaPath);
                                break;
                            }
                        } catch (err) {
                            if (err.code !== 'ENOENT') {
                                logger.error(`Ошибка удаления медиа файла ${mediaPath}:`, err);
                            }
                        }
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
            logger.error('Ошибка при удалении новости:', err);
            return res.status(500).json({
                error: `Ошибка удаления новости: ${err.message}`,
            });
        }
    } catch (err) {
        logger.error('Внутренняя ошибка сервера:', err);
        return res.status(500).json({
            error: `Внутренняя ошибка сервера: ${err.message}`,
        });
    }
};

exports.cleanupOrphanedFiles = async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads/images');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({ 
                message: 'Папка uploads/images не существует',
                deletedCount: 0,
                skippedCount: 0
            });
        }

        const files = fs.readdirSync(uploadsDir);

        const mediaUrls = await Media.findAll({
            where: { type: 'image' },
            attributes: ['url']
        });

        const usedFilenames = mediaUrls.map(media => path.basename(media.url));

        let deletedCount = 0;
        let skippedCount = 0;
        const deletedFiles = [];

        for (const file of files) {
            if (!usedFilenames.includes(file)) {
                const filePath = path.join(uploadsDir, file);
                try {
                    await fs.promises.unlink(filePath);
                    deletedCount++;
                    deletedFiles.push(file);
                } catch (error) {
                    logger.error(`Ошибка удаления файла ${file}:`, error);
                }
            } else {
                skippedCount++;
            }
        }

        res.json({
            message: 'Очистка неиспользуемых файлов завершена',
            totalFiles: files.length,
            deletedCount,
            skippedCount,
            deletedFiles: deletedFiles.slice(0, 10)
        });

    } catch (error) {
        logger.error('Ошибка при очистке файлов:', error);
        res.status(500).json({
            error: `Ошибка при очистке файлов: ${error.message}`
        });
    }
};

