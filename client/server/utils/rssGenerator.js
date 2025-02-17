const { XMLBuilder } = require("fast-xml-parser");


const formatDateRFC822 = (date) => {
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        timeZone: 'UTC',
    };
    return new Date(date).toLocaleString('en-US', options).replace(',', '');
};

export const generateRssFeed = (newsItems) => {
    const feed = {
        rss: {
            "@_version": "2.0",
            "@_xmlns:dc": "http://purl.org/dc/elements/1.1/",
            "@_xmlns:yandex": "http://news.yandex.ru",
            channel: {
                title: "Новости ГТРК Ингушетия",
                link: "https://ingushetiatv.ru/",
                description: "Последние новости с сайта ВЕСТИ ИНГУШЕТИИ",
                language: "ru",
                lastBuildDate: new Date().toUTCString(),
                item: newsItems.map((news) => ({
                    title: news.title,
                    link: `https://ingushetiatv.ru/news/${news.id}`,
                    description: news.description,
                    pubDate: formatDateRFC822(news.publishDate),
                    "dc:creator": news.author || "Редакция",
                    "yandex:full-text": news.content || "",
                })),
            },
        },
    };

    const builder = new XMLBuilder({ format: true });
    return builder.build(feed);
};