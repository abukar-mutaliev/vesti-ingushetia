require('dotenv').config();
const helmet = require('helmet');
const https = require('https');
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

const privateKey = fs.readFileSync('./cf/private-key.pem', 'utf8');
const certificate = fs.readFileSync('./cf/certificate.pem', 'utf8');
const ca = fs.readFileSync('./cf/csr.pem', 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
};

const uploadDir =
    process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '../uploads');

const corsOrigin = process.env.CORS_ORIGIN || 'https://5.35.92.185';
const imagesDir = path.join(uploadDir, 'images');
const videoAdDir = path.join(uploadDir, 'videoAd');
const audioDir = path.join(uploadDir, 'audio');
const avatarDir = path.join(uploadDir, 'avatars');

const app = express();
app.use(botBlocker);

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: corsOrigin,
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

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", 'http://ingushetiatv.ru'],
                connectSrc: ["'self'", 'http://ingushetiatv.ru'],
                imgSrc: ["'self'", 'data:', 'blob:', 'http://ingushetiatv.ru'],
                mediaSrc: ["'self'", 'http://ingushetiatv.ru'],
                scriptSrc: ["'self'", "'unsafe-inline'", 'http://ingushetiatv.ru'],
                styleSrc: ["'self'", "'unsafe-inline'", 'http://ingushetiatv.ru'],
                fontSrc: ["'self'", 'http://ingushetiatv.ru', 'data:'],
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
    max: 10000,
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
    https.createServer(credentials, app).listen(PORT, () => {
        logger.info(`HTTPS сервер запущен на порту ${PORT}`);
    });
})
.catch((err) => {
    logger.error(
        'Ошибка при синхронизации моделей с базой данных: ' + err.message,
    );
});
