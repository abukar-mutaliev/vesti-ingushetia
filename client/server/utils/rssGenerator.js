const { XMLBuilder } = require('fast-xml-parser');

const formatDateWithTimezone = (date) => {
    const d = new Date(date);

    const timezoneOffset = -d.getTimezoneOffset();
    const sign = timezoneOffset >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
    const minutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');
    const timezoneString = `${sign}${hours}${minutes}`;

    const weekday = d.toLocaleString('en-US', { weekday: 'short' });
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hoursFormatted = String(d.getHours()).padStart(2, '0');
    const minutesFormatted = String(d.getMinutes()).padStart(2, '0');
    const secondsFormatted = String(d.getSeconds()).padStart(2, '0');

    const formattedDate = `${weekday}, ${day} ${month} ${year} ${hoursFormatted}:${minutesFormatted}:${secondsFormatted} ${timezoneString}`;

    return formattedDate;
};

export const generateRssFeed = (newsItems) => {
    const feed = {
        rss: {
            '@_version': '2.0',
            '@_xmlns:dc': 'http://purl.org/dc/elements/1.1/',
            '@_xmlns:yandex': 'http://news.yandex.ru',
            channel: {
                title: 'Новости ГТРК Ингушетия',
                link: 'https://ingushetiatv.ru/',
                description: 'Последние новости с сайта ВЕСТИ ИНГУШЕТИИ',
                language: 'ru',
                lastBuildDate: new Date().toUTCString(),
                item: newsItems.map((news) => ({
                    title: news.title,
                    link: `https://ingushetiatv.ru/news/${news.id}`,
                    description: news.description,
                    pubDate: formatDateWithTimezone(news.publishDate),
                    'dc:creator': news.author || 'Редакция',
                    'yandex:full-text': news.content || '',
                })),
            },
        },
    };

    const builder = new XMLBuilder({ format: true });
    return builder.build(feed);
};

module.exports = { generateRssFeed };
