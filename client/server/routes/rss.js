const express = require("express");
const { News } = require("../models");
const { generateRssFeed } = require("../utils/rssGenerator");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const newsItems = await News.findAll({
            order: [["published_at", "DESC"]],
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
