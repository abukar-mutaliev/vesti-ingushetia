const path = require('path');
const fs = require('fs');
const uploadDir =
    process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

const RUTUBE_VIDEO_ID_REGEX = /^[A-Za-z0-9_-]+$/;
const VK_VIDEO_PART_REGEX = /^-?\d+$/;
const VIDEO_PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="Видео недоступно">
    <rect width="1200" height="675" fill="#101828" />
    <rect x="465" y="247" width="270" height="180" rx="24" fill="#ffffff" fill-opacity="0.12" />
    <polygon points="560,292 560,382 650,337" fill="#ffffff" />
    <text x="600" y="470" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="34">
        Превью видео недоступно
    </text>
</svg>
`.trim();

const checkFileExists = (filePath) => {
    return fs.existsSync(filePath);
};

const getFetchHeaders = (accept) => ({
    Accept: accept,
    'User-Agent': 'Mozilla/5.0',
});

const sendVideoPlaceholder = (res) => {
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.status(404).send(VIDEO_PLACEHOLDER_SVG);
};

const getRutubeVideoMetadata = async (videoId) => {
    const response = await fetch(`https://rutube.ru/api/video/${videoId}/`, {
        headers: getFetchHeaders('application/json'),
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
};

const sendImage = (res, contentType, imageBuffer) => {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=21600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    return res.status(200).send(imageBuffer);
};

const proxyRemoteImage = async (imageUrl, res, cacheKey = null) => {
    const response = await fetch(imageUrl, {
        headers: getFetchHeaders(
            'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        ),
        signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
        return sendVideoPlaceholder(res);
    }

    const contentType = response.headers.get('content-type') || 'image/webp';
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    if (cacheKey) {
        rememberVkThumbnail(cacheKey, contentType, imageBuffer);
    }

    return sendImage(res, contentType, imageBuffer);
};

const VK_API_VERSION = '5.199';
const VK_THUMBNAIL_TTL_MS = 6 * 60 * 60 * 1000;
const VK_THUMBNAIL_CACHE_LIMIT = 100;
const vkThumbnailCache = new Map();

const getVkEmbedHtml = async (oid, id) => {
    const response = await fetch(
        `https://vk.com/video_ext.php?oid=${oid}&id=${id}`,
        {
            headers: getFetchHeaders('text/html,application/xhtml+xml'),
            signal: AbortSignal.timeout(8000),
        },
    );

    if (!response.ok) {
        return null;
    }

    return response.text();
};

const readVkThumbnailCache = (key) => {
    const cached = vkThumbnailCache.get(key);
    if (!cached) {
        return null;
    }

    if (cached.expiresAt <= Date.now()) {
        vkThumbnailCache.delete(key);
        return null;
    }

    return cached;
};

const rememberVkThumbnail = (key, contentType, buffer) => {
    if (vkThumbnailCache.size >= VK_THUMBNAIL_CACHE_LIMIT) {
        const oldestKey = vkThumbnailCache.keys().next().value;
        vkThumbnailCache.delete(oldestKey);
    }

    vkThumbnailCache.set(key, {
        contentType,
        buffer,
        expiresAt: Date.now() + VK_THUMBNAIL_TTL_MS,
    });
};

const extractVkAnonymousToken = (html) => {
    const match = html?.match(/"access_token"\s*:\s*"(anonym\.[^"]+)"/);
    return match?.[1] || null;
};

const pickPreviewImageUrl = (images) => {
    if (!Array.isArray(images)) {
        return null;
    }

    const valid = images.filter((image) => image?.url);
    if (valid.length === 0) {
        return null;
    }

    const sorted = [...valid].sort((a, b) => (b.width || 0) - (a.width || 0));
    const cardSize = sorted.find((image) => {
        const width = image.width || 0;
        return width >= 320 && width <= 1280;
    });

    return (cardSize || sorted[0]).url;
};

// Embed-страница больше не содержит кадр ролика. Анонимный токен с неё
// позволяет запросить video.get и взять обложку из ответа.
const getVkThumbnailFromApi = async (oid, id, token) => {
    const apiUrl = new URL('https://api.vk.com/method/video.get');
    apiUrl.searchParams.set('videos', `${oid}_${id}`);
    apiUrl.searchParams.set('access_token', token);
    apiUrl.searchParams.set('v', VK_API_VERSION);

    const response = await fetch(apiUrl, {
        headers: {
            ...getFetchHeaders('application/json'),
            Referer: 'https://vk.com/',
        },
        signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    const item = data?.response?.items?.[0];
    if (!item) {
        return null;
    }

    return pickPreviewImageUrl(item.image) || pickPreviewImageUrl(item.first_frame);
};

const pickLargestImageUrl = (images) => {
    if (!Array.isArray(images)) {
        return null;
    }

    const valid = images.filter((image) => image?.url);
    if (valid.length === 0) {
        return null;
    }

    return valid.sort((a, b) => (b.width || 0) - (a.width || 0))[0].url;
};

// VK периодически меняет разметку embed-страницы (video_ext.php), поэтому
// порядок ключей и расположение превью нестабильны. Пробуем несколько способов.
const extractVkThumbnailUrl = (html) => {
    if (!html) {
        return null;
    }

    const tryImageArrays = (regex) => {
        for (const match of html.matchAll(regex)) {
            try {
                const url = pickLargestImageUrl(JSON.parse(match[1]));
                if (url) {
                    return url;
                }
            } catch (error) {
                // Невалидный JSON в этом совпадении — пробуем следующее.
            }
        }
        return null;
    };

    const fromImage = tryImageArrays(/"image":(\[\{[\s\S]*?\}\])/g);
    if (fromImage) {
        return fromImage;
    }

    const fromFirstFrame = tryImageArrays(/"first_frame":(\[\{[\s\S]*?\}\])/g);
    if (fromFirstFrame) {
        return fromFirstFrame;
    }

    const rawUrlMatch = html.match(
        /https?:\\?\/\\?\/[^"'\\\s]*(?:getVideoPreview|userapi\.com[^"'\\\s]*\.jpg)[^"'\\\s]*/i,
    );
    if (rawUrlMatch) {
        return rawUrlMatch[0].replace(/\\\//g, '/');
    }

    const ogImageMatch = html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );
    return ogImageMatch?.[1] || null;
};

exports.getRutubeThumbnail = async (req, res) => {
    const { videoId } = req.params;

    if (!videoId || !RUTUBE_VIDEO_ID_REGEX.test(videoId)) {
        return sendVideoPlaceholder(res);
    }

    try {
        const videoMetadata = await getRutubeVideoMetadata(videoId);
        const thumbnailUrl = videoMetadata?.thumbnail_url;

        if (!thumbnailUrl) {
            return sendVideoPlaceholder(res);
        }

        return await proxyRemoteImage(thumbnailUrl, res);
    } catch (error) {
        return sendVideoPlaceholder(res);
    }
};

exports.getVkThumbnail = async (req, res) => {
    const { oid, id } = req.params;

    if (!VK_VIDEO_PART_REGEX.test(oid || '') || !VK_VIDEO_PART_REGEX.test(id || '')) {
        return sendVideoPlaceholder(res);
    }

    const cacheKey = `${oid}_${id}`;
    const cached = readVkThumbnailCache(cacheKey);
    if (cached) {
        return sendImage(res, cached.contentType, cached.buffer);
    }

    try {
        const embedHtml = await getVkEmbedHtml(oid, id);
        let thumbnailUrl = extractVkThumbnailUrl(embedHtml);

        if (!thumbnailUrl) {
            const token = extractVkAnonymousToken(embedHtml);
            if (token) {
                thumbnailUrl = await getVkThumbnailFromApi(oid, id, token);
            }
        }

        if (!thumbnailUrl) {
            return sendVideoPlaceholder(res);
        }

        return await proxyRemoteImage(thumbnailUrl, res, cacheKey);
    } catch (error) {
        return sendVideoPlaceholder(res);
    }
};

exports.getMediaFile = (req, res) => {
    const { type, filename } = req.params;

    if (!filename) {
        return res.status(400).json({ error: 'Имя файла не указано' });
    }

    const allowedTypes = ['images', 'videos'];
    if (!allowedTypes.includes(type)) {
        return res.status(400).json({ error: 'Недопустимый тип файла' });
    }

    const filePath = path.resolve(uploadDir, type, filename);

    if (!checkFileExists(filePath)) {
        return res.status(404).json({ error: 'Файл не найден' });
    }

    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(500).json({ error: 'Ошибка при отправке файла' });
        }
    });
};
