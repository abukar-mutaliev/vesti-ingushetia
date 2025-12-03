const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const { News, Media, User } = require('../models');
const sharp = require('sharp');
const { isYandexBotIP, getClientIP } = require('../utils/yandexIPWhitelist');

const formatMediaUrls = (newsItem, baseUrl) => {
    const newsObj = newsItem.toJSON();
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
    return newsObj;
};

const getLargestValidImage = async (mediaFiles, baseUrl) => {
    if (!mediaFiles || mediaFiles.length === 0) {
        return null;
    }

    const images = mediaFiles.filter(m => m.type === 'image');
    if (images.length === 0) {
        return null;
    }

    // Сначала пробуем найти изображение с валидными размерами
    for (const image of images) {
        // Формируем полный URL для изображения
        let imageUrl = image.url;
        if (!imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('/')) {
                imageUrl = `${baseUrl}${imageUrl}`;
            } else {
                imageUrl = `${baseUrl}/${imageUrl}`;
            }
        }

        // Пробуем найти файл в разных местах
        const filename = path.basename(image.url);
        const pathVariants = [
            path.join(__dirname, '../../../uploads/images', filename),
            path.join(__dirname, '../../uploads/images', filename),
        ];

        // Если путь относительный, пробуем найти по полному пути
        if (!image.url.startsWith('/') && !image.url.startsWith('http')) {
            const relativePath = path.join(__dirname, '../../..', image.url);
            pathVariants.push(relativePath);
        }

        let imagePath = null;
        for (const variant of pathVariants) {
            if (fs.existsSync(variant)) {
                imagePath = variant;
                break;
            }
        }

        try {
            if (imagePath && fs.existsSync(imagePath)) {
                const metadata = await sharp(imagePath).metadata();

                // Принимаем изображения любого размера (требования Яндекс могут быть разными)
                return {
                    url: imageUrl,
                    length: metadata.size || 0,
                    type: metadata.format ? `image/${metadata.format}` : 'image/jpeg'
                };
            }
        } catch (error) {
            logger.warn(`Ошибка проверки изображения ${imageUrl}: ${error.message}`);
        }
    }

    // Если не нашли локальный файл, возвращаем первое изображение с URL
    if (images.length > 0) {
        const firstImage = images[0];
        let imageUrl = firstImage.url;
        if (!imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('/')) {
                imageUrl = `${baseUrl}${imageUrl}`;
            } else {
                imageUrl = `${baseUrl}/${imageUrl}`;
            }
        }
        logger.info(`Используем изображение без локальной проверки: ${imageUrl}`);
        return {
            url: imageUrl,
            length: 0,
            type: 'image/jpeg'
        };
    }

    return null;
};

const botHandler = async (req, res, next) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const clientIP = getClientIP(req);

    // Сначала проверяем, является ли это запросом к новости
    const newsMatch = req.path.match(/^\/news\/(\d+)$/);
    if (!newsMatch) {
        return next();
    }

    const newsId = newsMatch[1];

    // Проверяем по User-Agent (расширенный список для ботов Яндекса)
    const isBotByUA = userAgent.includes('bot') ||
        userAgent.includes('spider') ||
        userAgent.includes('crawler') ||
        userAgent.includes('yandex') ||
        userAgent.includes('googlebot') ||
        userAgent.includes('YandexBot') ||
        userAgent.includes('YandexAccessibilityBot') ||
        userAgent.includes('YandexMobileBot') ||
        userAgent.includes('YandexDirect') ||
        userAgent.includes('YandexMetrika') ||
        userAgent.includes('YandexNews') ||
        userAgent.includes('YandexImages') ||
        userAgent.includes('YandexVideo') ||
        userAgent.includes('YandexMedia') ||
        userAgent.includes('YandexBlogs') ||
        userAgent.includes('YandexFavicons') ||
        userAgent.includes('YandexWebmaster') ||
        userAgent.includes('YandexPagechecker') ||
        userAgent.includes('YandexImageResizer') ||
        userAgent.includes('YandexAdNet') ||
        userAgent.includes('YandexDirectDyn') ||
        userAgent.includes('YandexCalendar') ||
        userAgent.includes('YandexSitelinks') ||
        userAgent.includes('YandexMetrika') ||
        userAgent.includes('YandexMarket') ||
        userAgent.includes('YandexVertis') ||
        userAgent.includes('YandexForDomain') ||
        userAgent.includes('YandexRCA') ||
        userAgent.includes('YaDirectFetcher') ||
        userAgent.includes('YandexBot') ||
        userAgent.includes('YandexAccessibilityBot') ||
        userAgent.includes('YandexMobileBot');
    
    // Проверяем по IP-адресу (новые роботы Яндекса)
    const isYandexIP = isYandexBotIP(clientIP);

    // Проверяем специальный заголовок для тестирования (X-SEO-Preview) или query-параметр
    const isTestMode = req.headers['x-seo-preview'] === 'true' || req.query.seo === 'true';

    // Если это не бот и не тестовый режим, пропускаем дальше
    if (!isBotByUA && !isYandexIP && !isTestMode) {
        return next();
    }

    if (isTestMode) {
        logger.info(`🧪 Test mode: Processing news ${newsId} for SEO preview`);
    } else {
        logger.info(`🤖 Bot detected: ${userAgent} (IP: ${clientIP}) - Processing news ${newsId}`);
    }

    try {
        const news = await News.findByPk(newsId, {
            include: [
                { model: Media, as: 'mediaFiles' },
                { 
                    model: User, 
                    as: 'authorDetails',
                    attributes: ['id', 'username']
                }
            ],
        });
        if (!news) {
            logger.warn(`Новость ${newsId} не найдена`);
            return next();
        }

        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const modifiedNews = formatMediaUrls(news, baseUrl);

        let imageData = await getLargestValidImage(modifiedNews.mediaFiles, baseUrl);
        if (!imageData) {
            const defaultImagePath = path.join(__dirname, '../../public/default.png');
            if (fs.existsSync(defaultImagePath)) {
                const metadata = await sharp(defaultImagePath).metadata();
                imageData = {
                    url: `${baseUrl}/default.png`,
                    length: metadata.size,
                    type: 'image/png'
                };
                if (metadata.width < 400 || metadata.height < 800) {
                    logger.warn(`Дефолтное изображение ${defaultImagePath} не соответствует требованиям: ${metadata.width}x${metadata.height}`);
                }
            } else {
                logger.error(`Дефолтное изображение не найдено: ${defaultImagePath}`);
                imageData = {
                    url: `${baseUrl}/default.png`,
                    length: '35878',
                    type: 'image/png'
                };
            }
        }

        const imageUrl = imageData.url;
        const imageLength = imageData.length;
        const imageType = imageData.type;
        const author = modifiedNews.authorDetails?.username || 'Редакция';
        const publishDate = modifiedNews.publishDate || modifiedNews.createdAt;
        
        // Получаем чистый текст для мета-тегов
        const plainContent = modifiedNews.content?.replace(/<[^>]*>?/gm, '') || '';
        
        // Описание для мета-тегов (первые 150-160 символов)
        const description = plainContent.length > 0 
            ? plainContent.substring(0, 160).trim() 
            : modifiedNews.title.substring(0, 150);

        const seoHtmlPath = path.join(__dirname, '../../public/seo.html');
        if (!fs.existsSync(seoHtmlPath)) {
            logger.error(`SEO-шаблон не найден: ${seoHtmlPath}`);
            return next();
        }

        let htmlTemplate = fs.readFileSync(seoHtmlPath, 'utf8');

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

        htmlTemplate = htmlTemplate
            .replace(/%TITLE%/g, escapeHtml(modifiedNews.title))
            .replace(/%DESCRIPTION%/g, escapeHtml(description))
            .replace(/%FULLTEXT%/g, escapeHtml(plainContent))
            .replace(/%NEWS_ID%/g, newsId)
            .replace(/%IMAGE_URL%/g, escapeHtml(imageUrl))
            .replace(/%IMAGE_LENGTH%/g, imageLength)
            .replace(/%IMAGE_TYPE%/g, imageType)
            .replace(/%PUBLISH_DATE%/g, publishDate ? new Date(publishDate).toISOString() : new Date().toISOString())
            .replace(/%AUTHOR%/g, escapeHtml(author))
            .replace(/%CONTENT%/g, modifiedNews.content || '') // HTML контент вставляем как есть
            .replace(/%BASE_URL%/g, escapeHtml(baseUrl))
            .replace(/%PUBLISHER_MARKUP%/g, `
                <div itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
                    <meta itemprop="name" content="Вести Ингушетии" />
                    <div itemprop="logo" itemscope itemtype="http://schema.org/ImageObject">
                        <meta itemprop="url" content="${baseUrl}/logo.png" />
                    </div>
                </div>
            `)
            .replace(/%[A-Z_]+%/g, '');

        logger.info(`✅ SEO HTML generated for news ${newsId}, content length: ${(modifiedNews.content || '').length} chars`);
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(htmlTemplate);
    } catch (error) {
        logger.error(`Ошибка в botHandler: ${error.message}`);
        return next();
    }
};

module.exports = botHandler;