const express = require('express');
const router = express.Router();
const { News, User, Category, Media } = require('../models');
const { generateRssFeed } = require('../utils/rssGenerator');
const logger = require('../logger');

router.get("/", async (req, res) => {
    try {
        const newsItems = await News.findAll({
            include: [
                {
                    model: User,
                    as: 'authorDetails',
                    attributes: ['username'],
                },
                {
                    model: Category,
                    as: 'categories',
                    through: { attributes: [] },
                },
                {
                    model: Media,
                    as: 'mediaFiles',
                }
            ],
            order: [['publishDate', 'DESC']],
            limit: 20,
        });

        const rssFeed = generateRssFeed(newsItems, req);

        res.set({
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800' // кэширование на 30 минут
        });

        res.send(rssFeed);
        logger.info('RSS-фид успешно сгенерирован');
    } catch (error) {
        logger.error(`Ошибка генерации RSS: ${error.message}`);
        res.status(500).send("Ошибка сервера");
    }
});

router.get("/", (req, res) => {
    res.redirect('/api/rss');
});

module.exports = router;