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
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    return res.status(200).send(VIDEO_PLACEHOLDER_SVG);
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

const proxyRemoteImage = async (imageUrl, res) => {
    const response = await fetch(imageUrl, {
        headers: getFetchHeaders(
            'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        ),
    });

    if (!response.ok) {
        return sendVideoPlaceholder(res);
    }

    const contentType = response.headers.get('content-type') || 'image/webp';
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=21600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    return res.status(200).send(imageBuffer);
};

const getVkEmbedHtml = async (oid, id) => {
    const response = await fetch(
        `https://vk.com/video_ext.php?oid=${oid}&id=${id}`,
        {
            headers: getFetchHeaders('text/html,application/xhtml+xml'),
        },
    );

    if (!response.ok) {
        return null;
    }

    return response.text();
};

const extractVkThumbnailUrl = (html) => {
    if (!html) {
        return null;
    }

    const imageBlockMatch = html.match(/"image":(\[[\s\S]*?\]),"first_frame"/);
    if (!imageBlockMatch?.[1]) {
        return null;
    }

    try {
        const images = JSON.parse(imageBlockMatch[1]);
        if (!Array.isArray(images) || images.length === 0) {
            return null;
        }

        const largestImage = images
            .filter((image) => image?.url)
            .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

        return largestImage?.url || null;
    } catch (error) {
        return null;
    }
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

    try {
        const embedHtml = await getVkEmbedHtml(oid, id);
        const thumbnailUrl = extractVkThumbnailUrl(embedHtml);

        if (!thumbnailUrl) {
            return sendVideoPlaceholder(res);
        }

        return await proxyRemoteImage(thumbnailUrl, res);
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
