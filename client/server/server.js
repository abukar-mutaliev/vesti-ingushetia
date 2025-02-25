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

const uploadDir =
    process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '../uploads');

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

const imagesDir = path.join(uploadDir, 'images');
const videoAdDir = path.join(uploadDir, 'videoAd');
const audioDir = path.join(uploadDir, 'audio');
const avatarDir = path.join(uploadDir, 'avatars');

const app = express();
const PORT = process.env.PORT || 5000;


// Функция для определения ботов
const isBot = (req) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    return userAgent.includes('bot') ||
        userAgent.includes('spider') ||
        userAgent.includes('crawler') ||
        userAgent.includes('yandex') ||
        userAgent.includes('googlebot');
};

// Базовые middleware для обработки запросов
app.use(express.json());
app.use(cookieParser());

// Логирование запросов
app.use((req, res, next) => {
    logger.info(`Получен запрос: ${req.method} ${req.url}`);
    next();
});

// Настройка CORS
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

// Защитные middleware

// Helmet для безопасности заголовков
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

// Лимитер запросов
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
    skip: (req, res) => {
        return isBot(req) || req.path === '/api/users/csrf-token' ||
            req.path.includes('/rss') || req.path === '/robots.txt' ||
            req.path === '/sitemap.xml';
    },
});
app.use(limiter);

// CSRF защита (только не для ботов, RSS и определенных путей)
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


// Маршруты для роботов и SEO
app.get('/robots.txt', (req, res) => {
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
Host: ${req.get('host')}

Sitemap: https://${req.get('host')}/sitemap.xml
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

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        xml += '  <url>\n';
        xml += `    <loc>https://${req.get('host')}/</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        news.forEach(item => {
            const pubDate = item.publishDate || item.createdAt;
            const lastMod = item.updatedAt || pubDate;

            xml += '  <url>\n';
            xml += `    <loc>https://${req.get('host')}/news/${item.id}</loc>\n`;
            xml += `    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>monthly</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            xml += '  </url>\n';
        });

        categories.forEach(category => {
            xml += '  <url>\n';
            xml += `    <loc>https://${req.get('host')}/category/${category.id}</loc>\n`;
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

// Настройка RSS маршрутов
app.use('/api/rss', require('./routes/rss'));
app.use('/rss', (req, res) => {
    res.redirect('/api/rss');
});

// API маршруты
app.use('/api', router);

// Обработка загрузок/статических файлов
const safePath = path.normalize(path.join(__dirname, '../uploads'));

app.use('../uploads', (req, res, next) => {
    let filePath = path.join(__dirname, req.path);

    if (filePath.startsWith(safePath)) {
        return next();
    }
    return res.status(400).send('Invalid path');
});

// Статические файлы для загрузок
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

// Middleware для проверки, был ли уже отправлен ответ
app.use((req, res, next) => {
    if (res.headersSent) {
        return;
    }
    next();
});

// Статические файлы для клиентского приложения
const distDir = path.join(__dirname, '../dist');
app.use(express.static(distDir));
app.use(botHandler);


// Обработка ошибок
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

    logger.error(`Ошибка: ${err.message}`);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.get('*', (req, res) => {
    if (!res.headersSent) {
        res.sendFile(path.join(distDir, 'index.html'));
    }
});

// Запуск сервера
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