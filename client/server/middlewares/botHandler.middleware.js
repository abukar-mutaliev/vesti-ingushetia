const path = require('path');
const fs = require('fs');
const logger = require('../logger');
const { News, Category } = require('../models'); // Импортируем модели

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
    logger.info(`Бот запрашивает страницу новости ${newsId}, UA: ${userAgent}`);

    try {
        const news = await News.findByPk(newsId, {
            include: [{ model: Category, attributes: ['name'] }],
        });

        if (!news) {
            logger.warn(`Новость ${newsId} не найдена для бота ${userAgent}`);
            return next();
        }

        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;
        const imageUrl = news.mediaFiles?.find(m => m.type === 'image')?.url || `${baseUrl}/default.jpg`;
        const author = news.authorDetails?.username || 'Редакция';
        const publishDate = news.publishDate || news.createdAt;
        const plainContent = news.content?.replace(/<[^>]*>?/gm, '') || '';

        const seoHtmlPath = path.join(__dirname, '../../dist/seo.html');
        if (!fs.existsSync(seoHtmlPath)) {
            logger.error(`SEO шаблон не найден по пути: ${seoHtmlPath}`);
            return next();
        }

        let htmlTemplate = fs.readFileSync(seoHtmlPath, 'utf8');

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

        logger.info(`Отправляю SEO HTML для бота ${userAgent}, новость ${newsId}`);
        return res.send(htmlTemplate);
    } catch (error) {
        logger.error(`Ошибка при обработке запроса бота: ${error.message}`);
        return next();
    }
};

module.exports = botHandler;