const express = require('express');
const router = express.Router();
const { News, User, Category, Media } = require('../models');
const { generateRssFeed } = require('../utils/rssGenerator');
const logger = require('../logger');

router.get("/", async (req, res) => {
    try {
        logger.info("Запрос RSS-фида");
        logger.info(`Заголовки: User-Agent=${req.headers['user-agent']}`);

        const newsItems = await News.findAll({
            include: [
                { model: User, as: 'authorDetails', attributes: ['username'] },
                { model: Category, as: 'categories', through: { attributes: [] } },
                { model: Media, as: 'mediaFiles' }
            ],
            order: [['publishDate', 'DESC']],
            limit: 20,
        });

        if (!newsItems || newsItems.length === 0) {
            logger.warn("Нет новостей для RSS-фида");
            return res.status(200).send('<rss version="2.0"><channel><title>Новости ГТРК Ингушетия</title><link>https://ingushetiatv.ru/</link><description>Нет новостей</description></channel></rss>');
        }

        const rssFeed = await generateRssFeed(newsItems, req);

        res.set({
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800'
        });

        res.send(rssFeed);
        logger.info('RSS-фид успешно сгенерирован');
    } catch (error) {
        logger.error(`Ошибка генерации RSS: ${error.message}`);
        if (!res.headersSent) {
            res.status(500).send("Ошибка сервера при генерации RSS");
        }
    }
});

router.get("/*", (req, res) => {
    res.redirect('/api/rss');
});

module.exports = router;