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

const SAFE_USER_ATTRIBUTES = ['id', 'username', 'avatarUrl', 'createdAt'];

const ADMIN_USER_ATTRIBUTES = ['id', 'username', 'email', 'avatarUrl', 'isAdmin', 'createdAt'];

// 3. Исправленная функция formatMediaUrls в newsController.js

const formatMediaUrls = (newsItems) => {
    return newsItems.map((item) => {
        const newsObj = item.toJSON();

        if (newsObj.mediaFiles) {
            console.log(`🔍 [formatMediaUrls] Обработка медиафайлов для новости "${newsObj.title}" (ID: ${newsObj.id}):`);

            newsObj.mediaFiles = newsObj.mediaFiles.map((media) => {
                const mediaObj = { ...media };

                console.log(`   📁 Исходный URL: ${mediaObj.url}`);

                // Если это уже полный URL (http/https), оставляем как есть
                if (/^https?:\/\//i.test(mediaObj.url)) {
                    console.log(`   ✅ Полный URL оставлен: ${mediaObj.url}`);
                    return mediaObj;
                }

                // Если URL уже содержит базовый домен, оставляем как есть
                if (mediaObj.url.includes(baseUrl)) {
                    console.log(`   ✅ URL с baseUrl оставлен: ${mediaObj.url}`);
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
                console.log(`   🔧 Преобразован в: ${mediaObj.url}`);

                return mediaObj;
            });

            console.log(`   ✅ Финальные URL для новости "${newsObj.title}":`);
            newsObj.mediaFiles.forEach((media, index) => {
                console.log(`      ${index + 1}. ${media.type}: ${media.url}`);
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

        if (req.isBot) {
            try {
                const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
                const seoHtmlPath = path.join(__dirname, '../../public/seo.html');
                console.log(`Ищу SEO-шаблон по пути: ${seoHtmlPath}`);
                console.log(`Шаблон существует: ${fs.existsSync(seoHtmlPath)}`);

                if (fs.existsSync(seoHtmlPath)) {
                    console.log('SEO-шаблон успешно прочитан');

                    let html = fs.readFileSync(seoHtmlPath, 'utf8');

                    const imageMedia = modifiedNews.mediaFiles?.find(media => media.type === 'image');
                    const imageUrl = imageMedia
                        ? (imageMedia.url.startsWith('http') ? imageMedia.url : `${baseUrl}${imageMedia.url}`)
                        : `${baseUrl}/default.png`;

                    const author = modifiedNews.authorDetails?.username || 'Редакция';
                    const publishDate = modifiedNews.publishDate || modifiedNews.createdAt;
                    const plainContent = modifiedNews.content?.replace(/<[^>]*>?/gm, '') || '';

                    html = html
                        .replace(/%TITLE%/g, modifiedNews.title)
                        .replace(/%DESCRIPTION%/g, modifiedNews.description || modifiedNews.title.substring(0, 150))
                        .replace(/%FULLTEXT%/g, plainContent)
                        .replace(/%NEWS_ID%/g, id)
                        .replace(/%IMAGE_URL%/g, imageUrl)
                        .replace(/%PUBLISH_DATE%/g, publishDate)
                        .replace(/%AUTHOR%/g, author)
                        .replace(/%CONTENT%/g, modifiedNews.content || '')
                        .replace(/\${baseUrl}/g, baseUrl)
                        .replace(/%BASE_URL%/g, baseUrl);

                    const publisherMarkup = `
                        <div itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
                            <meta itemprop="name" content="Вести Ингушетии" />
                            <div itemprop="logo" itemscope itemtype="http://schema.org/ImageObject">
                                <meta itemprop="url" content="${baseUrl}/logo.png" />
                            </div>
                        </div>
                    `;
                    html = html.replace(/%PUBLISHER_MARKUP%/g, publisherMarkup);

                    return res.send(html);
                }
                console.error('Полный путь к файлу:', path.resolve(seoHtmlPath));

            } catch (error) {
                console.error('Ошибка при чтении SEO-шаблона:', error);
                console.error('Ошибка при генерации SEO HTML:', error);
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
    const mediaFiles = req.files;
    const authorId = req.user.id;

    // НОВОЕ: детальное логирование файлов
    console.log('📰 Создание новости - детальная информация:', {
        userId: authorId,
        title: title,
        hasMediaFiles: !!mediaFiles,
        mediaFilesKeys: mediaFiles ? Object.keys(mediaFiles) : null,
        scheduleForLater: scheduleForLater,
        publishDate: publishDate
    });

    if (mediaFiles) {
        console.log('📁 Анализ загруженных файлов:');
        console.log('  Структура mediaFiles:', JSON.stringify(mediaFiles, null, 2));

        if (mediaFiles.images) {
            console.log(`  📷 Найдено ${mediaFiles.images.length} изображений:`);
            mediaFiles.images.forEach((file, index) => {
                console.log(`    ${index + 1}. ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
                console.log(`       Path: ${file.path}`);
                console.log(`       Filename: ${file.filename}`);
            });
        } else {
            console.log('  ⚠️ Массив images отсутствует в mediaFiles');
        }
    } else {
        console.log('📁 Файлы не были загружены');
    }

    if (scheduleForLater && publishDate) {
        try {
            let scheduledDate = new Date(publishDate);

            if (isNaN(scheduledDate.getTime())) {
                console.error('❌ Неверный формат даты:', publishDate);
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

            console.log('🕐 Анализ времени планирования:');
            console.log(`   Получено от клиента: ${publishDate}`);
            console.log(`   Парсится как: ${scheduledDate.toISOString()}`);
            console.log(`   Московское время: ${scheduledDate.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`);
            console.log(`   Текущее время UTC: ${now.toISOString()}`);
            console.log(`   Текущее московское: ${now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`);

            const minFutureTime = new Date(now.getTime() + 60 * 1000);

            if (scheduledDate <= minFutureTime) {
                console.log('❌ Дата в прошлом или слишком близко');
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

            console.log('✅ Валидация времени прошла успешно');

            // ИСПРАВЛЕНО: правильная обработка файлов для отложенных новостей
            const newsData = {
                title,
                content,
                categoryIds: JSON.parse(categoryIds || '[]'),
                videoUrl,
                publishDate: scheduledDate,
                mediaFiles: [] // Инициализируем пустым массивом
            };

            // Обрабатываем изображения для отложенной публикации
            if (mediaFiles && mediaFiles.images && mediaFiles.images.length > 0) {
                console.log(`📷 Обработка ${mediaFiles.images.length} изображений для отложенной публикации`);

                newsData.mediaFiles = mediaFiles.images.map(file => {
                    console.log(`   Обрабатываем файл: ${file.originalname}`);
                    console.log(`     Путь: ${file.path}`);
                    console.log(`     Filename: ${file.filename}`);
                    console.log(`     MIME: ${file.mimetype}`);
                    console.log(`     Размер: ${file.size}`);
                    
                    return {
                        type: file.mimetype.startsWith('image/') ? 'image' : 'other',
                        filename: file.filename,
                        originalname: file.originalname,
                        path: file.path, // ВАЖНО: сохраняем полный путь к файлу
                        mimetype: file.mimetype,
                        size: file.size
                    };
                });

                console.log(`✅ Подготовлено ${newsData.mediaFiles.length} файлов для планировщика`);
            } else {
                console.log('ℹ️ Новые изображения отсутствуют для отложенной публикации');
            }

            // Обрабатываем существующие изображения (при редактировании)
            const existingMediaUrls = req.body.existingMediaUrls;
            if (existingMediaUrls) {
                try {
                    const parsedUrls = JSON.parse(existingMediaUrls);
                    if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
                        console.log(`📷 Добавление ${parsedUrls.length} существующих изображений`);
                        
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
                        console.log(`✅ Всего изображений после добавления существующих: ${newsData.mediaFiles.length}`);
                    }
                } catch (e) {
                    console.error('Ошибка парсинга existingMediaUrls:', e);
                }
            }

            console.log('📋 Финальные данные для планировщика:', {
                title: newsData.title,
                categoryIds: newsData.categoryIds,
                hasVideoUrl: !!newsData.videoUrl,
                mediaFilesCount: newsData.mediaFiles.length,
                publishDate: newsData.publishDate.toISOString()
            });

            console.log('🔄 Вызов newsScheduler.scheduleNews...');
            const scheduledNews = await newsScheduler.scheduleNews(
                newsData,
                scheduledDate,
                authorId
            );

            console.log('✅ Планировщик завершил работу успешно:', {
                id: scheduledNews.id,
                title: scheduledNews.title,
                status: scheduledNews.status
            });

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
            console.error('❌ Ошибка в createNews при планировании:', {
                error: error.message,
                stack: error.stack,
                publishDate,
                authorId
            });

            // ИСПРАВЛЕНО: Очищаем загруженные файлы при ошибке
            cleanupUploadedFiles(mediaFiles);

            logger.error('❌ Ошибка создания отложенной новости:', error);

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

    // НЕМЕДЛЕННАЯ ПУБЛИКАЦИЯ - тоже добавим логирование
    console.log('📝 Немедленная публикация новости...');

    let transaction;
    try {
        transaction = await sequelize.transaction();

        const newsData = {
            title,
            content,
            authorId,
        };

        if (publishDate && !scheduleForLater) {
            const finalDate = new Date(publishDate);
            if (!isNaN(finalDate.getTime())) {
                newsData.publishDate = finalDate;
            } else {
                throw new Error('Неверный формат даты');
            }
        }

        console.log('💾 Создание записи в базе данных...');
        const news = await News.create(newsData, { transaction });
        console.log(`✅ Новость создана с ID: ${news.id}`);

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
            console.log('🏷️ Добавление категорий...');
            const categories = await Category.findAll({
                where: { id: parsedCategoryIds },
                transaction,
            });

            if (categories.length !== parsedCategoryIds.length) {
                throw new Error('Некоторые категории не найдены');
            }

            await news.addCategories(categories, { transaction });
            console.log(`✅ Добавлено ${categories.length} категорий`);
        } else {
            throw new Error('Необходимо выбрать хотя бы одну категорию');
        }

        const mediaInstances = [];

        // ИСПРАВЛЕНО: детальное логирование обработки изображений
        if (mediaFiles && mediaFiles.images && mediaFiles.images.length > 0) {
            console.log(`📷 Обработка ${mediaFiles.images.length} изображений для немедленной публикации...`);

            for (let [index, file] of mediaFiles.images.entries()) {
                console.log(`  Обрабатываем файл ${index + 1}:`, {
                    originalname: file.originalname,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size,
                    path: file.path
                });

                try {
                    const imageUrl = path.posix.join('uploads', 'images', file.filename);
                    console.log(`    Создаем URL: ${imageUrl}`);

                    const media = await Media.create({
                        url: imageUrl,
                        type: 'image',
                    }, { transaction });

                    mediaInstances.push(media);
                    console.log(`    ✅ Медиа создано с ID: ${media.id}`);
                } catch (mediaError) {
                    console.error(`    ❌ Ошибка создания медиа для файла ${file.originalname}:`, mediaError);
                    throw mediaError;
                }
            }
            console.log(`✅ Обработано ${mediaInstances.length} изображений`);
        } else {
            console.log('ℹ️ Изображения отсутствуют для немедленной публикации');
        }

        if (videoUrl) {
            console.log('🎥 Добавление видео...');
            const media = await Media.create({
                url: videoUrl,
                type: 'video',
            }, { transaction });
            mediaInstances.push(media);
            console.log('✅ Видео добавлено');
        }

        if (mediaInstances.length > 0) {
            console.log(`🔗 Связывание ${mediaInstances.length} медиафайлов с новостью...`);
            await news.addMediaFiles(mediaInstances, { transaction });
            console.log(`✅ Связано ${mediaInstances.length} медиафайлов`);
        }

        console.log('💾 Коммит транзакции...');
        await transaction.commit();

        console.log('📖 Получение созданной новости...');
        const createdNews = await News.findByPk(news.id, {
            include: [
                { model: Category, as: 'categories' },
                { model: Media, as: 'mediaFiles' }
            ],
        });

        console.log('✅ Финальная новость:', {
            id: createdNews.id,
            title: createdNews.title,
            mediaFilesCount: createdNews.mediaFiles?.length || 0,
            categoriesCount: createdNews.categories?.length || 0
        });

        logger.info(`✅ Создана новость: ${title}`, {
            authorId,
            newsId: news.id,
            publishDate: newsData.publishDate,
            immediate: !scheduleForLater
        });

        console.log('✅ Новость успешно создана и возвращается клиенту');
        res.status(201).json(createdNews);

    } catch (err) {
        if (transaction) {
            console.log('🔄 Откат транзакции...');
            await transaction.rollback();
        }

        console.error('❌ Ошибка создания новости:', {
            error: err.message,
            stack: err.stack
        });

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
    const mediaFiles = req.files;
    const authorId = req.user.id;

    console.log('🔄 [UPDATE] Начало обновления новости:', {
        newsId: id,
        hasNewFiles: !!(mediaFiles && mediaFiles.images),
        newFilesCount: mediaFiles && mediaFiles.images ? mediaFiles.images.length : 0,
        existingMedia: existingMedia,
        videoUrl: videoUrl ? 'присутствует' : 'отсутствует'
    });

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

        console.log('📰 [UPDATE] Текущая новость найдена:', {
            title: news.title,
            currentMediaCount: news.mediaFiles.length,
            currentMediaIds: news.mediaFiles.map(m => ({ id: m.id, type: m.type, url: m.url }))
        });

        // 2. Начинаем транзакцию
        transaction = await sequelize.transaction();

        // 3. Обновляем основные данные новости
        const updateData = { title, content, authorId };
        if (publishDate) {
            const date = new Date(publishDate);
            if (!isNaN(date)) {
                updateData.publishDate = date;
            } else {
                throw new Error('Неверный формат даты');
            }
        }

        await news.update(updateData, { transaction });
        console.log('✅ [UPDATE] Основные данные новости обновлены');

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
            console.log('✅ [UPDATE] Категории обновлены');
        }

        // 5. Обрабатываем существующие медиафайлы
        let existingMediaIds = [];
        try {
            existingMediaIds = existingMedia ? JSON.parse(existingMedia) : [];
            if (!Array.isArray(existingMediaIds)) {
                existingMediaIds = [];
            }
        } catch (e) {
            console.warn('⚠️ [UPDATE] Ошибка парсинга existingMedia, используем пустой массив');
            existingMediaIds = [];
        }

        console.log('📋 [UPDATE] Анализ существующих медиафайлов:', {
            existingMediaIds,
            currentImageFiles: news.mediaFiles.filter(m => m.type === 'image').map(m => m.id)
        });

        // 6. Определяем какие изображения нужно удалить
        const currentImageFiles = news.mediaFiles.filter(media => media.type === 'image');
        const imagesToDelete = currentImageFiles.filter(media => !existingMediaIds.includes(media.id));

        console.log('🗑️ [UPDATE] Изображения для удаления:', imagesToDelete.map(m => ({
            id: m.id,
            url: m.url
        })));

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
            console.log(`✅ [UPDATE] Удалено ${imagesToDelete.length} записей медиафайлов из БД`);
        }

        // 9. Добавляем новые изображения
        const newMediaInstances = [];
        if (mediaFiles && mediaFiles.images && mediaFiles.images.length > 0) {
            console.log(`📁 [UPDATE] Добавляем ${mediaFiles.images.length} новых изображений`);

            for (const file of mediaFiles.images) {
                uploadedFiles.push(file.path); // Отслеживаем загруженные файлы

                const imageUrl = path.posix.join('uploads', 'images', file.filename);
                const media = await Media.create({
                    url: imageUrl,
                    type: 'image',
                }, { transaction });

                newMediaInstances.push(media);
                console.log(`📷 [UPDATE] Создано новое изображение: ${imageUrl} (ID: ${media.id})`);
            }

            if (newMediaInstances.length > 0) {
                await news.addMediaFiles(newMediaInstances, { transaction });
                console.log(`✅ [UPDATE] Добавлено ${newMediaInstances.length} новых изображений к новости`);
            }
        }

        // 10. Обрабатываем видео отдельно
        await handleVideoUpdate(news, videoUrl, transaction);

        // 11. Коммитим транзакцию
        await transaction.commit();
        transaction = null; // Помечаем что транзакция успешна
        console.log('✅ [UPDATE] Транзакция успешно завершена');

        // 12. Получаем обновленную новость
        const updatedNews = await News.findByPk(id, {
            include: [
                { model: Media, as: 'mediaFiles' },
                { model: Category, as: 'categories' },
            ],
        });

        const modifiedNews = formatMediaUrls([updatedNews])[0];

        console.log('📊 [UPDATE] Финальные медиафайлы:', modifiedNews.mediaFiles.map(m => ({
            id: m.id,
            type: m.type,
            url: m.url
        })));

        res.status(200).json({
            message: 'Новость успешно обновлена',
            news: modifiedNews,
        });

    } catch (err) {
        // Откатываем транзакцию если она активна
        if (transaction) {
            console.log('🔄 [UPDATE] Транзакция отменена из-за ошибки');
            await transaction.rollback();
        }

        // Удаляем загруженные файлы при ошибке
        cleanupUploadedFiles(mediaFiles);

        console.error('❌ [UPDATE] Ошибка обновления новости:', {
            error: err.message,
            stack: err.stack,
            newsId: id
        });

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
                console.log(`✅ [DELETE] Файл удален: ${mediaPath}`);
                fileDeleted = true;
                break;
            }
        } catch (err) {
            console.error(`❌ [DELETE] Ошибка удаления файла ${mediaPath}:`, err.message);
        }
    }

    if (!fileDeleted) {
        // Не логируем как ошибку, если файл уже удален - это нормально
        console.log(`ℹ️ [DELETE] Файл уже удален или не найден: ${media.url}`);
    }

    return fileDeleted;
}

// 3. Вспомогательная функция для обработки видео
async function handleVideoUpdate(news, videoUrl, transaction) {
    const existingVideo = news.mediaFiles.find(m => m.type === 'video');

    if (videoUrl && videoUrl.trim() !== '') {
        console.log('🎥 [UPDATE] Обновляем видео URL:', videoUrl.trim());

        if (existingVideo) {
            // Обновляем существующее видео
            await existingVideo.update({ url: videoUrl.trim() }, { transaction });
            console.log('✅ [UPDATE] Видео URL обновлен');
        } else {
            // Создаем новое видео
            const newVideo = await Media.create({
                url: videoUrl.trim(),
                type: 'video',
            }, { transaction });
            await news.addMediaFiles([newVideo], { transaction });
            console.log('✅ [UPDATE] Новое видео добавлено');
        }
    } else {
        // Удаляем видео если URL пустой
        if (existingVideo) {
            await news.removeMediaFiles([existingVideo], { transaction });
            await Media.destroy({
                where: { id: existingVideo.id },
                transaction,
            });
            console.log('✅ [UPDATE] Видео удалено');
        }
    }
}

// 4. Функция очистки загруженных файлов при ошибке (ИСПРАВЛЕНО)
function cleanupUploadedFiles(mediaFiles) {
    if (!mediaFiles || !mediaFiles.images) return;

    console.log('🗑️ [CLEANUP] Очистка загруженных файлов при ошибке...');

    for (const file of mediaFiles.images) {
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
                console.log(`🗑️ [CLEANUP] Удален загруженный файл при ошибке: ${file.path}`);
            }
        } catch (err) {
            console.error(`❌ [CLEANUP] Ошибка удаления файла ${file.path}:`, err.message);
        }
    }
}

// 5. Утилита для очистки осиротевших файлов
exports.cleanupOrphanedFiles = async (req, res) => {
    try {
        console.log('🧹 [CLEANUP] Начинаю очистку осиротевших файлов...');

        const uploadsDir = path.join(__dirname, '../uploads/images');
        if (!fs.existsSync(uploadsDir)) {
            return res.json({
                message: 'Папка uploads/images не существует',
                deletedCount: 0,
                skippedCount: 0
            });
        }

        const files = fs.readdirSync(uploadsDir);
        console.log(`📁 [CLEANUP] Найдено файлов в папке: ${files.length}`);

        // Получаем все используемые файлы из БД
        const mediaUrls = await Media.findAll({
            where: { type: 'image' },
            attributes: ['url']
        });

        const usedFilenames = mediaUrls.map(media => path.basename(media.url));
        console.log(`📋 [CLEANUP] Используемых файлов в БД: ${usedFilenames.length}`);

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
                        console.log(`🗑️ [CLEANUP] Удален осиротевший файл: ${file}`);
                    } else {
                        skippedCount++;
                        console.log(`⏭️ [CLEANUP] Пропущен новый файл: ${file} (возраст: ${Math.round(fileAge / 60000)} мин)`);
                    }
                } catch (error) {
                    console.error(`❌ [CLEANUP] Ошибка удаления файла ${file}:`, error.message);
                    skippedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        console.log(`✅ [CLEANUP] Очистка завершена. Удалено: ${deletedCount}, пропущено: ${skippedCount}`);

        res.json({
            message: 'Очистка осиротевших файлов завершена',
            totalFiles: files.length,
            deletedCount,
            skippedCount,
            deletedFiles: deletedFiles.slice(0, 10),
            note: 'Удаляются только файлы старше 1 часа'
        });

    } catch (error) {
        console.error('❌ [CLEANUP] Ошибка при очистке файлов:', error);
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

                    let fileDeleted = false;
                    
                    for (const mediaPath of pathVariants) {
                        try {
                            if (fs.existsSync(mediaPath)) {
                                await fs.promises.unlink(mediaPath);
                                console.log(`✅ Медиа файл удален при удалении: ${mediaPath}`);
                                fileDeleted = true;
                                break;
                            }
                        } catch (err) {
                            if (err.code !== 'ENOENT') {
                                console.error(`Ошибка удаления медиа файла ${mediaPath}:`, err);
                            }
                        }
                    }

                    if (!fileDeleted) {
                        // Не логируем как ошибку, если файл уже удален - это нормально
                        console.log(`ℹ️ Медиа файл уже удален или не найден: ${media.url}`);
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
                    console.error(`Ошибка удаления файла ${file}:`, error);
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
        console.error('Ошибка при очистке файлов:', error);
        res.status(500).json({
            error: `Ошибка при очистке файлов: ${error.message}`
        });
    }
};

