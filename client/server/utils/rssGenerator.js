const { XMLBuilder } = require("fast-xml-parser");
const sharp = require('sharp');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');

const stripHtml = (html = "") => {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&[a-z]+;/gi, '')
        .trim();
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
    if (!mediaFiles || mediaFiles.length === 0) {
        logger.info('Нет связанных mediaFiles');
        return null;
    }

    const images = mediaFiles.filter(m => m.type === 'image');
    if (images.length === 0) {
        logger.info('Нет изображений в mediaFiles');
        return null;
    }

    for (const image of images) {
        const imageUrl = image.url.startsWith('http') ? image.url : `${baseUrl}/${image.url}`;
        const imagePath = path.join(__dirname, '../../../uploads/images', path.basename(image.url));

        logger.info(`Проверка изображения: ${imageUrl}, путь: ${imagePath}`);

        try {
            if (fs.existsSync(imagePath)) {
                const metadata = await sharp(imagePath).metadata();
                logger.info(`Размеры изображения ${imageUrl}: ${metadata.width}x${metadata.height}`);

                if (metadata.width >= 400 && metadata.height >= 800) {
                    return {
                        url: imageUrl,
                        length: metadata.size,
                        type: 'image/jpeg'
                    };
                } else {
                    logger.warn(
                        `Изображение ${imageUrl} не соответствует требованиям:
                         ${metadata.width}x${metadata.height}`
                    );
                }
            } else {
                logger.warn(`Файл изображения не найден: ${imagePath}`);
            }
        } catch (error) {
            logger.warn(`Ошибка проверки изображения ${imageUrl}: ${error.message}`);
        }
    }

    logger.info('Подходящее изображение не найдено, используется дефолтное');
    return null;
};

const generateRssFeed = async (newsItems, req) => {
    logger.info(`Генерация RSS для ${newsItems.length} новостей`);
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

    const feed = {
        '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
        rss: {
            '@_version': '2.0',
            '@_xmlns:dc': 'http://purl.org/dc/elements/1.1/',
            '@_xmlns:yandex': 'http://news.yandex.ru',
            channel: {
                title: 'Новости ГТРК Ингушетия',
                link: 'https://ingushetiatv.ru/',
                description: 'Последние новости с сайта ВЕСТИ ИНГУШЕТИИ',
                language: 'ru',
                lastBuildDate: formatDateRFC822(new Date()),
                item: await Promise.all(newsItems.map(async (news, index) => {
                    logger.info(`Обработка новости #${index + 1}: ${news.title || 'Без заголовка'}`);
                    const item = {
                        title: news.title || 'Без заголовка',
                        link: `https://ingushetiatv.ru/news/${news.id}`,
                        // Очищаем описание от HTML, включая &nbsp;
                        description: stripHtml(news.description || news.content || ''),
                        pubDate: formatDateRFC822(news.publishDate || news.createdAt || new Date()),
                        'dc:creator': news.authorDetails?.username || 'Редакция',
                        // Оставляем HTML в full-text, но убираем &nbsp;
                        'yandex:full-text': (news.content || '')
                            .replace(/&nbsp;/g, ' ') // Заменяем &nbsp; на обычный пробел
                            .replace(/&[a-z]+;/gi, '') // Удаляем другие сущности, если нужно
                    };

                    const image = await getLargestValidImage(news.mediaFiles, baseUrl);
                    if (image) {
                        logger.info(`Добавлено изображение: ${image.url}`);
                        item.enclosure = {
                            '@_url': image.url,
                            '@_length': image.length,
                            '@_type': image.type
                        };
                    } else {
                        logger.warn(`Изображение для новости ${news.title || 'Без заголовка'} не найдено, используется дефолтное`);
                        const defaultImagePath = path.join(__dirname, '../../public/default.png');
                        if (fs.existsSync(defaultImagePath)) {
                            const metadata = await sharp(defaultImagePath).metadata();
                            item.enclosure = {
                                '@_url': `${baseUrl}/default.png`,
                                '@_length': metadata.size,
                                '@_type': 'image/png'
                            };
                        } else {
                            logger.error(`Дефолтное изображение не найдено: ${defaultImagePath}`);
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
        suppressEmptyNode: true,
        processEntities: false
    });

    const xml = builder.build(feed);
    if (!xml || xml.trim() === '') {
        logger.error('Сгенерированный XML пустой');
        throw new Error('Сгенерированный XML пустой');
    }
    logger.info(`Сгенерированный XML (первые 200 символов): ${xml.substring(0, 200)}...`);
    return xml;
};

module.exports = { generateRssFeed };