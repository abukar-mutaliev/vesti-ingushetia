const { XMLBuilder } = require("fast-xml-parser");

const generateRssFeed = (newsItems) => {
    const feed = {
        rss: {
            "@_version": "2.0",
            "@_xmlns:dc": "http://purl.org/dc/elements/1.1/",
            channel: {
                title: "Новости ГТРК Ингушетия",
                link: "https://ingushetiatv.ru:5000/",
                description: "Последние новости с сайта ВЕСТИ ИНГУШЕТИИ",
                language: "ru",
                lastBuildDate: new Date().toUTCString(),
                item: newsItems.map((news) => ({
                    title: news.title,
                    link: `https://ingushetiatv.ru:5000/api/news/${news.id}`,
                    description: news.description,
                    pubDate: new Date(news.published_at).toUTCString(),
                    "dc:creator": news.author || "Редакция",
                })),
            },
        },
    };

    const builder = new XMLBuilder({ format: true });
    return builder.build(feed);
};

module.exports = { generateRssFeed };
