const router = require('express').Router();
const { News, User } = require('../models');
const { generateRssFeed } = require('../utils/rssGenerator');

router.get("/", async (req, res) => {
    try {
        const newsItems = await News.findAll({
            include: [
                {
                    model: User,
                    as: 'authorDetails',
                    attributes: ['username'],
                }
            ],
            order: [['publishDate', 'DESC']],
            limit: 20,
        });
        const rssFeed = generateRssFeed(newsItems);
        res.set("Content-Type", "application/xml");
        res.send(rssFeed);
    } catch (error) {
        console.error("Ошибка генерации RSS:", error);
        res.status(500).send("Ошибка сервера");
    }
});

module.exports = router;
