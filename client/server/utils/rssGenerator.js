const { XMLBuilder } = require("fast-xml-parser");
const sharp = require('sharp');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');

const SITE_URL = process.env.BASE_URL || 'https://ingushetiatv.ru';
const MIN_COVER_WIDTH = 700;

const stripHtml = (html = "") => {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/ /g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[\t\r\n]+/g, ' ')
        .trim();
};

const truncateToTwoSentences = (text = "") => {
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    if (sentences.length === 0) {
        return text.trim();
    }
    const truncated = sentences.slice(0, 2).join('. ') + '.';
    return truncated.trim();
};

const formatDateRFC822 = (dateInput) => {
    const date = new Date(dateInput);
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Moscow',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = Object.fromEntries(
        formatter.formatToParts(date)
            .filter(part => part.type !== 'literal')
            .map(part => [part.type, part.value])
    );

    return `${parts.weekday}, ${parts.day} ${parts.month} ${parts.year} ${parts.hour}:${parts.minute}:${parts.second} +0300`;
};

const resolveMediaUrl = (url, baseUrl = SITE_URL) => {
    if (!url) {
        return '';
    }

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    if (url.startsWith('//')) {
        return `https:${url}`;
    }

    if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
    }

    return `${baseUrl}/${url.replace(/^\//, '')}`;
};

const resolveLocalImagePath = (imageUrl) => {
    const filename = path.basename(imageUrl);
    const candidates = [
        path.join(__dirname, '../../../uploads/images', filename),
        path.join(__dirname, '../../uploads/images', filename),
        path.join(__dirname, '../uploads/images', filename),
    ];

    return candidates.find(candidatePath => fs.existsSync(candidatePath)) || null;
};

const getFileSize = (filePath) => {
    try {
        return fs.statSync(filePath).size;
    } catch (error) {
        logger.warn(`Не удалось получить размер файла ${filePath}: ${error.message}`);
        return 0;
    }
};

const getImageMimeType = (filePath) => {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
    };

    return mimeTypes[extension] || 'image/jpeg';
};

const getCoverImage = async (mediaFiles, baseUrl) => {
    if (!mediaFiles || mediaFiles.length === 0) {
        return null;
    }

    const images = mediaFiles.filter(media => media.type === 'image');
    if (images.length === 0) {
        return null;
    }

    let bestImage = null;

    for (const image of images) {
        const imageUrl = resolveMediaUrl(image.url, baseUrl);
        const imagePath = resolveLocalImagePath(image.url);

        try {
            if (!imagePath) {
                continue;
            }

            const metadata = await sharp(imagePath).metadata();
            if (metadata.width >= MIN_COVER_WIDTH && (!bestImage || metadata.width > bestImage.width)) {
                bestImage = {
                    url: imageUrl,
                    length: getFileSize(imagePath),
                    type: getImageMimeType(imagePath),
                    width: metadata.width,
                };
            }
        } catch (error) {
            logger.warn(`Ошибка проверки обложки ${imageUrl}: ${error.message}`);
        }
    }

    return bestImage;
};

const getDefaultCoverImage = async (baseUrl) => {
    const defaultImagePath = path.join(__dirname, '../../public/default.png');

    if (!fs.existsSync(defaultImagePath)) {
        logger.error(`Дефолтное изображение не найдено: ${defaultImagePath}`);
        return null;
    }

    try {
        const metadata = await sharp(defaultImagePath).metadata();
        if (metadata.width < MIN_COVER_WIDTH) {
            logger.warn(`Дефолтное изображение уже ${metadata.width}px, требуется минимум ${MIN_COVER_WIDTH}px`);
        }

        return {
            url: `${baseUrl}/default.png`,
            length: getFileSize(defaultImagePath),
            type: 'image/png',
        };
    } catch (error) {
        logger.error(`Ошибка чтения дефолтного изображения: ${error.message}`);
        return null;
    }
};

const normalizeContentHtml = (html = '', baseUrl) => {
    let normalized = html.trim();

    normalized = normalized.replace(/src=(["'])(?!https?:|\/\/|data:|#)([^"']+)\1/gi, (_, quote, src) => {
        return `src=${quote}${resolveMediaUrl(src, baseUrl)}${quote}`;
    });

    normalized = normalized.replace(/href=(["'])(?!https?:|\/\/|mailto:|tel:|#)([^"']+)\1/gi, (_, quote, href) => {
        return `href=${quote}${resolveMediaUrl(href, baseUrl)}${quote}`;
    });

    normalized = normalized.replace(/<img\b([^>]*?)>/gi, (match, attributes) => {
        const srcMatch = attributes.match(/\bsrc=(["'])(.*?)\1/i);
        const altMatch = attributes.match(/\balt=(["'])(.*?)\1/i);
        const src = srcMatch ? resolveMediaUrl(srcMatch[2], baseUrl) : '';
        const alt = altMatch ? altMatch[2] : '';

        if (!src) {
            return match;
        }

        return `<figure><img src="${src}" alt="${alt}"></figure>`;
    });

    return normalized;
};

const buildFigureFromImage = (imageUrl, altText) => {
    const resolvedUrl = resolveMediaUrl(imageUrl);
    return `<figure><img src="${resolvedUrl}" alt="${altText || ''}"></figure>`;
};

const buildVideoMarkup = (videoUrl) => {
    if (!/\.mp4(?:\?|$)/i.test(videoUrl)) {
        return '';
    }

    const resolvedUrl = resolveMediaUrl(videoUrl);
    return `<video><source src="${resolvedUrl}" type="video/mp4"/></video>`;
};

const buildContentEncoded = (news, baseUrl) => {
    const title = news.title || 'Без заголовка';
    const mediaFiles = news.mediaFiles || [];
    const contentHtml = normalizeContentHtml(news.content || '', baseUrl);

    const imageFiles = mediaFiles.filter(media => media.type === 'image');
    const videoFiles = mediaFiles.filter(media => media.type === 'video');

    const mediaFigures = imageFiles
        .map(image => {
            const resolvedUrl = resolveMediaUrl(image.url, baseUrl);
            const basename = path.basename(image.url);

            if (contentHtml.includes(resolvedUrl) || contentHtml.includes(basename)) {
                return '';
            }

            return buildFigureFromImage(image.url, title);
        })
        .filter(Boolean);

    const videoMarkup = videoFiles
        .map(video => buildVideoMarkup(video.url))
        .filter(Boolean)
        .join('\n');

    return [contentHtml, ...mediaFigures, videoMarkup].filter(Boolean).join('\n');
};

const buildCategories = (news) => {
    const categories = (news.categories || [])
        .map(category => category.name)
        .filter(Boolean);

    if (categories.length === 0) {
        categories.push('Новости');
    }

    categories.push('index');
    categories.push('format-article');

    return categories;
};

const buildNewsLink = (newsId) => `${SITE_URL}/news/${newsId}`;

const generateRssFeed = async (newsItems, req) => {
    const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

    const feed = {
        '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
        rss: {
            '@_version': '2.0',
            '@_xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
            '@_xmlns:media': 'http://search.yahoo.com/mrss/',
            channel: {
                title: 'Новости ГТРК Ингушетия',
                link: `${SITE_URL}/`,
                description: 'Последние новости с сайта ВЕСТИ ИНГУШЕТИИ',
                language: 'ru',
                lastBuildDate: formatDateRFC822(new Date()),
                item: await Promise.all(newsItems.map(async (news) => {
                    const plainText = stripHtml(news.content || '');
                    const link = buildNewsLink(news.id);
                    const authorName = news.authorDetails?.username || 'Редакция';

                    const item = {
                        title: news.title || 'Без заголовка',
                        link,
                        guid: {
                            '@_isPermaLink': 'true',
                            '#text': link,
                        },
                        pubDate: formatDateRFC822(news.publishDate || news.createdAt || new Date()),
                        author: authorName,
                        category: buildCategories(news),
                        contentType: 'news',
                        description: truncateToTwoSentences(plainText || news.title || ''),
                        'content:encoded': {
                            __cdata: buildContentEncoded(news, baseUrl),
                        },
                    };

                    const coverImage = await getCoverImage(news.mediaFiles, baseUrl)
                        || await getDefaultCoverImage(baseUrl);

                    if (coverImage) {
                        item.enclosure = {
                            '@_url': coverImage.url,
                            '@_length': coverImage.length,
                            '@_type': coverImage.type,
                        };
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
        suppressBooleanAttributes: false,
        processEntities: false,
        cdataPropName: '__cdata',
    });

    const xml = builder.build(feed);
    if (!xml || xml.trim() === '') {
        throw new Error('Сгенерированный XML пустой');
    }

    return xml;
};

module.exports = { generateRssFeed };
