require('dotenv').config();
const helmet = require('helmet');
const http = require('https');
const logger = require('./logger');
const express = require('express');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models/index');
const router = require('./routes/index');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
require('./middlewares/cronJobs');
const botBlocker = require('./middlewares/botBlocker');
const fs = require('fs');
const rssRouter = require("./routes/rss");
const { News, User, Media } = require('./models');

const privateKey = fs.readFileSync(path.join(__dirname, 'cf', 'private-key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'cf', 'certificate.pem'), 'utf8');
const ca = fs.readFileSync(path.join(__dirname, 'cf', 'csr.pem'), 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
};

const uploadDir =
    process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '../uploads');

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

const imagesDir = path.join(uploadDir, 'images');
const videoAdDir = path.join(uploadDir, 'videoAd');
const audioDir = path.join(uploadDir, 'audio');
const avatarDir = path.join(uploadDir, 'avatars');

const app = express();
app.use(botBlocker);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());



app.get('/news/:id', async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const isYandexBot = userAgent.includes('YandexBot');

        if (!isYandexBot) {
            return res.sendFile(path.join(__dirname, '../dist/index.html'));
        }

        const { id } = req.params;

        const news = await News.findByPk(id, {
            include: [
                { model: User, as: 'authorDetails' },
                { model: Media, as: 'mediaFiles' }
            ]
        });

        if (!news) {
            return res.status(404).send('Новость не найдена');
        }

        const indexHtml = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf-8');

        const mainImage = news.mediaFiles?.find(media => media.type === 'image')?.url
            || `${process.env.BASE_URL}/logo.jpg`;
        const formattedDate = new Date(news.publishDate || news.createdAt).toISOString();

        const safeContent = news.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const safeTitle = news.title
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const html = indexHtml
            .replace(/<title>Вести Ингушетии<\/title>/, `<title>${safeTitle} - Вести Ингушетии</title>`)
            .replace(/%TITLE%/g, safeTitle)
            .replace(/%CONTENT%/g, safeContent)
            .replace(/%PUBLISH_DATE%/g, formattedDate)
            .replace(/%AUTHOR%/g, news.authorDetails?.username || 'Редакция')
            .replace(/%NEWS_ID%/g, id)
            .replace(/%IMAGE_URL%/g, mainImage)
            .replace(/display:\s*none;/, 'display: block;');

        res.send(html);
    } catch (error) {
        console.error('Error processing news for Yandex:', error, error.stack);
        res.status(500).send('Внутренняя ошибка сервера');
    }
});

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS'));
        }
    },
    methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
        'Authorization',
        'Content-Type',
        'Accept',
        'Origin',
        'x-csrf-token',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use("/rss", rssRouter);

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", 'https://ingushetiatv.ru'],
                connectSrc: ["'self'", 'https://ingushetiatv.ru'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https://ingushetiatv.ru'],
                mediaSrc: ["'self'", 'https://ingushetiatv.ru'],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://ingushetiatv.ru',
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://ingushetiatv.ru',
                ],
                fontSrc: ["'self'", 'https://ingushetiatv.ru', 'data:'],
                frameSrc: [
                    "'self'",
                    'https://www.youtube.com',
                    'https://www.youtu.be',
                    'https://www.youtube-nocookie.com',
                    'https://rutube.ru',
                ],
                objectSrc: ["'none'"],
            },
        },
        referrerPolicy: { policy: 'no-referrer' },
        featurePolicy: {
            geolocation: ["'none'"],
        },
    }),
);

app.use(
    csurf({
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            name: 'csrf-token',
        },
    }),
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000000,
    message: 'Слишком много запросов с этого IP, попробуйте позже.',
    handler: (req, res, next) => {
        res.status(429).json({
            status: 'error',
            message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
            retryAfter: Math.ceil(limiter.windowMs / 1000),
        });
    },
    skip: (req, res) => req.path === '/api/users/csrf-token',
});
app.use(limiter);

app.use((req, res, next) => {
    logger.info(`Получен запрос: ${req.method} ${req.url}`);
    next();
});

app.use('/api', router);

const safePath = path.normalize(path.join(__dirname, '../uploads'));

app.use('../uploads', (req, res, next) => {
    let filePath = path.join(__dirname, req.path);

    if (filePath.startsWith(safePath)) {
        return next();
    }
    return res.status(400).send('Invalid path');
});

app.use(
    '/uploads/images',
    express.static(imagesDir, {
        setHeaders: (res, path, stat) => {
            res.setHeader('Cache-Control', 'no-store');
        },
    }),
);
app.use(
    '/uploads/videoAd',
    express.static(videoAdDir, {
        setHeaders: (res, path, stat) => {
            res.setHeader('Cache-Control', 'no-store');
        },
    }),
);
app.use(
    '/uploads/audio',
    express.static(audioDir, {
        setHeaders: (res, path, stat) => {
            res.setHeader('Cache-Control', 'no-store');
        },
    }),
);
app.use(
    '/uploads/avatars',
    express.static(avatarDir, {
        setHeaders: (res, path, stat) => {
            res.setHeader('Cache-Control', 'no-store');
        },
    }),
);

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ error: 'Недействительный CSRF токен' });
    }
    next(err);
});

app.use((err, req, res, next) => {
    if (err.status === 429) {
        return res.status(429).json({
            status: 'error',
            message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
            retryAfter: err.retryAfter || null,
        });
    }

    logger.error(`Ошибка: ${err.message}`);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});
const distDir = path.join(__dirname, '../dist');

app.use(express.static(distDir));

app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
});
sequelize
    .sync()
    .then(() => {
        logger.info('Все модели были синхронизированы с базой данных.');
        http.createServer(credentials, app).listen(PORT, () => {
            logger.info(`HTTPS сервер запущен на порту ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error(
            'Ошибка при синхронизации моделей с базой данных: ' + err.message,
        );
    });
