const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { News, User, Category, Media } = require('../models');
const { generateRssFeed } = require('../utils/rssGenerator');
const logger = require('../logger');

const EMPTY_RSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>Новости ГТРК Ингушетия</title>
<link>https://ingushetiatv.ru/</link>
<description>Нет новостей</description>
<language>ru</language>
</channel>
</rss>`;

router.get("/", async (req, res) => {
    try {
        const newsItems = await News.findAll({
            where: {
                [Op.or]: [
                    { publishDate: { [Op.lte]: new Date() } },
                    { publishDate: null },
                ],
            },
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

        if (newsItems.length === 0) {
            res.set({
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=1800',
            });
            return res.status(200).send(EMPTY_RSS_FEED);
        }

        const rssFeed = await generateRssFeed(newsItems, req);

        if (!rssFeed || rssFeed.trim() === '') {
            return res.status(500).send("Ошибка: Сгенерированный RSS пустой");
        }

        res.set({
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800'
        });

        res.send(rssFeed);

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