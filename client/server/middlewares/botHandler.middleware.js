const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const { News, Media } = require('../models');
const sharp = require('sharp');

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
    if (!mediaFiles || mediaFiles.length === 0) return null;

    const images = mediaFiles.filter(m => m.type === 'image');
    if (images.length === 0) return null;

    for (const image of images) {
        const imageUrl = image.url.startsWith('http') ? image.url : `${baseUrl}/${image.url}`;
        const imagePath = path.join(__dirname, '../../uploads/images', path.basename(image.url));

        try {
            if (fs.existsSync(imagePath)) {
                const metadata = await sharp(imagePath).metadata();
                if (metadata.width >= 400 && metadata.height >= 800) {
                    return {
                        url: imageUrl,
                        length: metadata.size,
                        type: 'image/jpeg'
                    };
                }
            }
        } catch (error) {
            logger.warn(`Ошибка проверки изображения ${imageUrl}: ${error.message}`);
        }
    }

    return null;
};

const botHandler = async (req, res, next) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';

    const isBot = userAgent.includes('bot') ||
        userAgent.includes('spider') ||
        userAgent.includes('crawler') ||
        userAgent.includes('yandex') ||
        userAgent.includes('googlebot');

    if (!isBot) {
        return next();
    }

    const newsMatch = req.path.match(/^\/news\/(\d+)$/);
    if (!newsMatch) {
        return next();
    }

    const newsId = newsMatch[1];

    try {
        const news = await News.findByPk(newsId, {
            include: [{ model: Media, as: 'mediaFiles' }],
        });
        if (!news) {
            logger.warn(`Новость ${newsId} не найдена`);
            return next();
        }

        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const modifiedNews = formatMediaUrls(news, baseUrl);

        let imageData = await getLargestValidImage(modifiedNews.mediaFiles, baseUrl);
        if (!imageData) {
            const defaultImagePath = path.join(__dirname, '../../public/default.jpg');
            if (fs.existsSync(defaultImagePath)) {
                const metadata = await sharp(defaultImagePath).metadata();
                imageData = {
                    url: `${baseUrl}/default.jpg`,
                    length: metadata.size || 0,
                    type: 'image/jpeg'
                };
                if (metadata.width < 400 || metadata.height < 800) {
                    logger.warn(`Дефолтное изображение ${defaultImagePath} не соответствует требованиям: ${metadata.width}x${metadata.height}`);
                }
            } else {
                logger.error(`Дефолтное изображение не найдено: ${defaultImagePath}`);
                imageData = {
                    url: `${baseUrl}/default.jpg`,
                    length: '0',
                    type: 'image/jpeg'
                };
            }
        }

        const imageUrl = imageData.url;
        const imageLength = imageData.length;
        const imageType = imageData.type;
        const author = modifiedNews.authorDetails?.username || 'Редакция';
        const publishDate = modifiedNews.publishDate || modifiedNews.createdAt;
        const plainContent = modifiedNews.content?.replace(/<[^>]*>?/gm, '') || '';

        const seoHtmlPath = path.join(__dirname, '../../public/seo.html');
        if (!fs.existsSync(seoHtmlPath)) {
            logger.error(`SEO-шаблон не найден: ${seoHtmlPath}`);
            return next();
        }

        let htmlTemplate = fs.readFileSync(seoHtmlPath, 'utf8');

        htmlTemplate = htmlTemplate
            .replace(/%TITLE%/g, modifiedNews.title)
            .replace(/%DESCRIPTION%/g, modifiedNews.description || modifiedNews.title.substring(0, 150))
            .replace(/%FULLTEXT%/g, plainContent)
            .replace(/%NEWS_ID%/g, newsId)
            .replace(/%IMAGE_URL%/g, imageUrl)
            .replace(/%IMAGE_LENGTH%/g, imageLength)
            .replace(/%IMAGE_TYPE%/g, imageType)
            .replace(/%PUBLISH_DATE%/g, publishDate.toISOString())
            .replace(/%AUTHOR%/g, author)
            .replace(/%CONTENT%/g, modifiedNews.content || '')
            .replace(/%BASE_URL%/g, baseUrl)
            .replace(/%PUBLISHER_MARKUP%/g, `
                <div itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
                    <meta itemprop="name" content="Вести Ингушетии" />
                    <div itemprop="logo" itemscope itemtype="http://schema.org/ImageObject">
                        <meta itemprop="url" content="${baseUrl}/logo.png" />
                    </div>
                </div>
            `)
            .replace(/%[A-Z_]+%/g, '');

        return res.send(htmlTemplate);
    } catch (error) {
        logger.error(`Ошибка в botHandler: ${error.message}`);
        return next();
    }
};

module.exports = botHandler;