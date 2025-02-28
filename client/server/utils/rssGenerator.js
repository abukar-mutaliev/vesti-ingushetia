const { XMLBuilder } = require("fast-xml-parser");
const sharp = require('sharp');
const logger = require('../logger');
const path = require("node:path");

const stripHtml = (html = "") => {
    return html.replace(/<[^>]*>/g, '');
};

const formatDateRFC822 = (date) => {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[d.getUTCDay()];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[d.getUTCMonth()];
    const day = d.getUTCDate().toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    const seconds = d.getUTCSeconds().toString().padStart(2, '0');
    return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} +0300`;
};

const getLargestValidImage = async (mediaFiles, baseUrl) => {
    if (!mediaFiles || mediaFiles.length === 0) return null;

    const images = mediaFiles.filter(m => m.type === 'image');
    if (images.length === 0) return null;

    for (const image of images) {
        const imageUrl = image.url.startsWith('http') ? image.url : `${baseUrl}/${image.url}`;
        const imagePath = path.join(__dirname, '../../uploads/images', path.basename(image.url));

        try {
            if (fs.existsSync(imagePath)) {
                const metadata = await sharp(imagePath).metadata();
                if (metadata.width >= 400 && metadata.height >= 800) {
                    return {
                        url: imageUrl,
                        length: metadata.size,
                        type: 'image/jpeg'
                    };
                }
            }
        } catch (error) {
            logger.warn(`Ошибка проверки изображения ${imageUrl}: ${error.message}`);
        }
    }

    return null;
};

const generateRssFeed = async (newsItems, req) => {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

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
                item: await Promise.all(newsItems.map(async (news) => {
                    const item = {
                        title: news.title,
                        link: `https://ingushetiatv.ru/news/${news.id}`,
                        description: news.description || stripHtml(news.content),
                        pubDate: formatDateRFC822(news.publishDate || new Date()),
                        "dc:creator": news.authorDetails?.username || "Редакция",
                        "yandex:full-text": news.content || "",
                    };

                    const image = await getLargestValidImage(news.mediaFiles, baseUrl);
                    if (image) {
                        item.enclosure = {
                            "@_url": image.url,
                            "@_length": image.length,
                            "@_type": image.type
                        };
                    } else {
                        const defaultImagePath = path.join(__dirname, '../../client/public/default.jpg');
                        if (fs.existsSync(defaultImagePath)) {
                            const metadata = await sharp(defaultImagePath).metadata();
                            if (metadata.width >= 400 && metadata.height >= 800) {
                                item.enclosure = {
                                    "@_url": `${baseUrl}/default.jpg`,
                                    "@_length": metadata.size,
                                    "@_type": 'image/jpeg'
                                };
                            }
                        }
                    }

                    return item;
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