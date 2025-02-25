const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const { News } = require('../models');

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
        const news = await News.findByPk(newsId);
        if (!news) {
            logger.warn(`Новость ${newsId} не найдена`);
            return next();
        }

        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const imageUrl = news.mediaFiles?.find(m => m.type === 'image')?.url || `${baseUrl}/default.jpg`;
        const author = news.authorDetails?.username || 'Редакция';
        const publishDate = news.publishDate || news.createdAt;
        const plainContent = news.content?.replace(/<[^>]*>?/gm, '') || '';

        const seoHtmlPath = path.join(__dirname, '../../client/dist/seo.html');
        logger.info(`Ищу SEO-шаблон по пути: ${seoHtmlPath}`);
        logger.info(`Шаблон существует: ${fs.existsSync(seoHtmlPath)}`);

        if (!fs.existsSync(seoHtmlPath)) {
            logger.error(`SEO-шаблон не найден: ${seoHtmlPath}`);
            return next();
        }

        let htmlTemplate = fs.readFileSync(seoHtmlPath, 'utf8');
        logger.info(`SEO-шаблон успешно прочитан`);

        htmlTemplate = htmlTemplate
            .replace(/%TITLE%/g, news.title)
            .replace(/%DESCRIPTION%/g, news.description || news.title.substring(0, 150))
            .replace(/%FULLTEXT%/g, plainContent)
            .replace(/%NEWS_ID%/g, newsId)
            .replace(/%IMAGE_URL%/g, imageUrl)
            .replace(/%PUBLISH_DATE%/g, publishDate.toISOString())
            .replace(/%AUTHOR%/g, author)
            .replace(/%CONTENT%/g, news.content || '')
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

        logger.info(`Отправляю SEO-HTML для бота, новость ${newsId}`);
        return res.send(htmlTemplate);
    } catch (error) {
        logger.error(`Ошибка в botHandler: ${error.message}`);
        return next();
    }
};

module.exports = botHandler;