const { XMLBuilder } = require("fast-xml-parser");

const generateRssFeed = (newsItems) => {
    const formatDateRFC822 = (date) => {
        const d = new Date(date);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[d.getUTCDay()];

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const monthName = months[d.getUTCMonth()];

        const day = d.getUTCDate().toString().padStart(2, '0');
        const year = d.getUTCFullYear();
        const hours = d.getUTCHours().toString().padStart(2, '0');
        const minutes = d.getUTCMinutes().toString().padStart(2, '0');
        const seconds = d.getUTCSeconds().toString().padStart(2, '0');

        return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} +0300`;
    };

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
                lastBuildDate: formatDateRFC822(new Date()),
                item: newsItems.map((news) => ({
                    title: news.title,
                    link: `https://ingushetiatv.ru/news/${news.id}`,
                    description: news.description || stripHtml(news.content),
                    pubDate: formatDateRFC822(news.publishDate || new Date()),
                    "dc:creator": news.authorDetails?.username || "Редакция",
                    "yandex:full-text": news.content || "",
                })),
            },
        },
    };

    const builder = new XMLBuilder({
        format: true,
        ignoreAttributes: false,
        suppressEmptyNode: true
    });

    return builder.build(feed);
};

module.exports = { generateRssFeed };
