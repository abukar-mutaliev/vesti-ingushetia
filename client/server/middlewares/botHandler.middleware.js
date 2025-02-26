const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const { News, Media } = require('../models');

const formatMediaUrls = (newsItem) => {
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

const botHandler = async (req, res, next) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    logger.info(`User-Agent запроса: ${userAgent}`);

    const isBot = userAgent.includes('bot') ||
        userAgent.includes('spider') ||
        userAgent.includes('crawler') ||
        userAgent.includes('yandex') ||
        userAgent.includes('googlebot');

    if (!isBot) {
        logger.info(`Не бот, пропускаю: ${req.path}`);
        return next();
    }

    const newsMatch = req.path.match(/^\/news\/(\d+)$/);
    if (!newsMatch) {
        logger.info(`Путь ${req.path} не /news/:id, пропускаю`);
        return next();
    }

    const newsId = newsMatch[1];
    logger.info(`Бот запрашивает /news/${newsId}`);

    try {
        const news = await News.findByPk(newsId, {
            include: [{ model: Media, as: 'mediaFiles' }], // Загружаем mediaFiles
        });
        if (!news) {
            logger.warn(`Новость ${newsId} не найдена`);
            return next();
        }

        const modifiedNews = formatMediaUrls(news);
        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const imageUrl = modifiedNews.mediaFiles?.find(m => m.type === 'image')?.url || `${baseUrl}/default.jpg`;
        const author = modifiedNews.authorDetails?.username || 'Редакция';
        const publishDate = modifiedNews.publishDate || modifiedNews.createdAt;
        const plainContent = modifiedNews.content?.replace(/<[^>]*>?/gm, '') || '';

        const seoHtmlPath = path.join(__dirname, '../../dist/seo.html');
        logger.info(`Ищу SEO-шаблон по пути: ${seoHtmlPath}`);
        logger.info(`Шаблон существует: ${fs.existsSync(seoHtmlPath)}`);

        if (!fs.existsSync(seoHtmlPath)) {
            logger.error(`SEO-шаблон не найден: ${seoHtmlPath}`);
            return next();
        }

        let htmlTemplate = fs.readFileSync(seoHtmlPath, 'utf8');
        logger.info(`SEO-шаблон успешно прочитан`);

        htmlTemplate = htmlTemplate
            .replace(/%TITLE%/g, modifiedNews.title)
            .replace(/%DESCRIPTION%/g, modifiedNews.description || modifiedNews.title.substring(0, 150))
            .replace(/%FULLTEXT%/g, plainContent)
            .replace(/%NEWS_ID%/g, newsId)
            .replace(/%IMAGE_URL%/g, imageUrl)
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

        logger.info(`Отправляю SEO-HTML для бота, новость ${newsId}, imageUrl: ${imageUrl}`);
        return res.send(htmlTemplate);
    } catch (error) {
        logger.error(`Ошибка в botHandler: ${error.message}`);
        return next();
    }
};

module.exports = botHandler;