require('dotenv').config();

// КРИТИЧЕСКИ ВАЖНО: Устанавливаем временную зону в самом начале
process.env.TZ = 'Europe/Moscow';

// Логируем временную зону при запуске
console.log(`🌍 Системная временная зона установлена: ${process.env.TZ}`);
console.log(`🕐 Серверное время UTC: ${new Date().toISOString()}`);
console.log(`🕐 Московское время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`);
console.log(`📊 Смещение временной зоны: ${new Date().getTimezoneOffset()} минут от UTC`);

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
const botHandler = require('./middlewares/botHandler.middleware');
const fs = require('fs');

const privateKey = fs.readFileSync(path.join(__dirname, 'cf', 'private-key.pem'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'cf', 'certificate.pem'), 'utf8');
const ca = fs.readFileSync(path.join(__dirname, 'cf', 'csr.pem'), 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
};

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '../uploads');

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

const imagesDir = path.join(uploadDir, 'images');
const videoAdDir = path.join(uploadDir, 'videoAd');
const audioDir = path.join(uploadDir, 'audio');
const avatarDir = path.join(uploadDir, 'avatars');
const publicDir = path.join(__dirname, '../public');

const app = express();
const PORT = process.env.PORT || 5000;

const isBot = (req) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    return userAgent.includes('bot') ||
        userAgent.includes('spider') ||
        userAgent.includes('crawler') ||
        userAgent.includes('yandex') ||
        userAgent.includes('googlebot');
};

// Middleware для логирования времени запросов
app.use((req, res, next) => {
    const moscowTime = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Логируем только важные запросы, не статику
    if (!req.url.includes('/uploads/') && !req.url.includes('.js') && !req.url.includes('.css')) {
        logger.info(`[${moscowTime}] ${req.method} ${req.url}`);
    }
    next();
});

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: function (origin, callback) {
        // В development режиме разрешаем localhost
        if (process.env.NODE_ENV === 'development') {
            const allowedDev = [
                'https://localhost:5173',
                'http://localhost:5173',
                'https://127.0.0.1:5173',
                'http://127.0.0.1:5173',
                ...allowedOrigins
            ];
            if (!origin || allowedDev.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`🚫 CORS заблокирован для: ${origin}`);
                callback(new Error('Blocked by CORS'));
            }
        } else {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`🚫 CORS заблокирован для: ${origin}`);
                callback(new Error('Blocked by CORS'));
            }
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

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", 'https://ingushetiatv.ru', process.env.BASE_URL],
                connectSrc: ["'self'", 'https://ingushetiatv.ru', process.env.BASE_URL],
                imgSrc: ["'self'", 'data:', 'blob:', 'https://ingushetiatv.ru', process.env.BASE_URL],
                mediaSrc: ["'self'", 'https://ingushetiatv.ru', process.env.BASE_URL],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://ingushetiatv.ru',
                    process.env.BASE_URL,
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://ingushetiatv.ru',
                    process.env.BASE_URL,
                ],
                fontSrc: ["'self'", 'https://ingushetiatv.ru', 'data:', process.env.BASE_URL],
                frameSrc: [
                    "'self'",
                    'https://www.youtube.com',
                    'https://www.youtu.be',
                    'https://www.youtube-nocookie.com',
                    'https://rutube.ru',
                    'https://rutube.ru/play/embed',
                    process.env.BASE_URL,
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

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 10000000 : 100, // В разработке больше лимит
    message: 'Слишком много запросов с этого IP, попробуйте позже.',
    handler: (req, res, next) => {
        const moscowTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        logger.warn(`🚫 [${moscowTime}] Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            status: 'error',
            message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
            retryAfter: Math.ceil(limiter.windowMs / 1000),
        });
    },
    skip: (req, res) => {
        return isBot(req) || req.path === '/api/users/csrf-token' ||
            req.path.includes('/rss') || req.path === '/robots.txt' ||
            req.path === '/sitemap.xml';
    },
});
app.use(limiter);

app.use('/api/rss', require('./routes/rss'));
app.use('/rss', (req, res) => {
    res.redirect('/api/rss');
});

app.use(express.static(publicDir));

app.use((req, res, next) => {
    if (isBot(req) || req.path.includes('/rss') || req.path === '/robots.txt' ||
        req.path === '/sitemap.xml') {
        return next();
    }

    csurf({
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            name: 'csrf-token',
        },
    })(req, res, next);
});

app.get('/robots.txt', (req, res) => {
    const domain = process.env.NODE_ENV === 'production' ? 'ingushetiatv.ru' : req.get('host');
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Allow: /api/rss
Allow: /rss
Disallow: /login
Disallow: /register

User-agent: Yandex
Allow: /
Disallow: /admin/
Disallow: /api/
Allow: /api/rss
Allow: /rss
Disallow: /login
Disallow: /register
Clean-param: utm_source&utm_medium&utm_campaign&utm_term&utm_content
Host: ${domain}

Sitemap: https://${domain}/sitemap.xml
`;
    res.type('text/plain');
    res.send(robotsTxt);
});

app.get('/sitemap.xml', async (req, res) => {
    try {
        const News = require('./models').News;
        const Category = require('./models').Category;

        const news = await News.findAll({
            attributes: ['id', 'createdAt', 'updatedAt', 'publishDate']
        });

        const categories = await Category.findAll({
            attributes: ['id']
        });

        const domain = process.env.NODE_ENV === 'production' ? 'ingushetiatv.ru' : req.get('host');
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'https';

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        xml += '  <url>\n';
        xml += `    <loc>${protocol}://${domain}/</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        news.forEach(item => {
            const pubDate = item.publishDate || item.createdAt;
            const lastMod = item.updatedAt || pubDate;

            xml += '  <url>\n';
            xml += `    <loc>${protocol}://${domain}/news/${item.id}</loc>\n`;
            xml += `    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>monthly</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        });

        categories.forEach(category => {
            xml += '  <url>\n';
            xml += `    <loc>${protocol}://${domain}/category/${category.id}</loc>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.7</priority>\n';
            xml += '  </url>\n';
        });

        xml += '</urlset>';

        res.type('application/xml');
        res.send(xml);
    } catch (error) {
        logger.error(`Ошибка при генерации sitemap: ${error.message}`);
        res.status(500).send('Ошибка генерации sitemap');
    }
});

// Добавим эндпоинт для проверки времени сервера
app.get('/api/server-time', (req, res) => {
    const now = new Date();
    res.json({
        utc: now.toISOString(),
        moscow: now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
        timezone: process.env.TZ,
        offset: now.getTimezoneOffset()
    });
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

app.use((req, res, next) => {
    if (res.headersSent) {
        return;
    }
    next();
});

const distDir = path.join(__dirname, '../dist');

app.use(botHandler);
app.use(express.static(distDir));

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        if (isBot(req) || req.path.includes('/rss')) {
            return next();
        }

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

    const moscowTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    logger.error(`[${moscowTime}] Ошибка: ${err.message}`);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.get('*', (req, res) => {
    if (!res.headersSent) {
        res.sendFile(path.join(distDir, 'index.html'));
    }
});

sequelize
    .sync()
    .then(() => {
        const moscowTime = new Date().toLocaleString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        logger.info(`[${moscowTime}] Все модели были синхронизированы с базой данных.`);

        http.createServer(credentials, app).listen(PORT, () => {
            logger.info(`[${moscowTime}] HTTPS сервер запущен на порту ${PORT}`);
            logger.info(`🌐 Базовый URL: ${process.env.BASE_URL}`);
            logger.info(`🔗 CORS разрешен для: ${allowedOrigins.join(', ')}`);
            logger.info(`📊 Режим: ${process.env.NODE_ENV}`);

            // Проверяем настройки временной зоны
            console.log('\n⏰ Проверка временных зон:');
            console.log(`   UTC время: ${new Date().toISOString()}`);
            console.log(`   Московское время: ${moscowTime}`);
            console.log(`   Временная зона процесса: ${process.env.TZ}`);
            console.log(`   Смещение: ${new Date().getTimezoneOffset()} минут от UTC\n`);
        });
    })
    .catch((err) => {
        const moscowTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        logger.error(`[${moscowTime}] Ошибка при синхронизации моделей с базой данных: ${err.message}`);
    });