require('dotenv').config();

process.env.TZ = 'Europe/Moscow';

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

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads');

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

const imagesDir = path.join(uploadDir, 'images');
const videoAdDir = path.join(uploadDir, 'videoAd');
const audioDir = path.join(uploadDir, 'audio');
const avatarDir = path.join(uploadDir, 'avatars');
const publicDir = path.join(__dirname, '../public');


const app = express();
const PORT = process.env.PORT || 5000;

// Импорт утилиты для проверки IP-адресов роботов Яндекса
// Добавлены новые IP-адреса и подсети роботов Яндекса для вайтлиста
// Подробности: client/server/utils/yandexIPWhitelist.js
const { isYandexBotIP, getClientIP } = require('./utils/yandexIPWhitelist');

/**
 * Проверяет, является ли запрос запросом от бота
 * Проверяет как по User-Agent, так и по IP-адресу (для новых роботов Яндекса)
 */
const isBot = (req) => {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const clientIP = getClientIP(req);
    
    // Проверяем по User-Agent
    const isBotByUA = userAgent.includes('bot') ||
        userAgent.includes('spider') ||
        userAgent.includes('crawler') ||
        userAgent.includes('yandex') ||
        userAgent.includes('googlebot');
    
    // Проверяем по IP-адресу (новые роботы Яндекса)
    // IP-адреса: 217.20.158.64/26, 217.20.158.252/30, 5.101.41.0/29
    const isYandexIP = isYandexBotIP(clientIP);
    
    return isBotByUA || isYandexIP;
};

app.use((req, res, next) => {
    // Логируем только важные запросы (API, новости, RSS) и боты
    const isApiRequest = req.url.startsWith('/api/');
    const isImportantRequest = req.url.startsWith('/news/') || req.url.startsWith('/rss');
    const clientIP = getClientIP(req);
    const isYandexBot = isYandexBotIP(clientIP);
    
    // Логируем только ботов и важные запросы (не статические файлы)
    if (isYandexBot && (isApiRequest || isImportantRequest)) {
        const moscowTime = new Date().toLocaleString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        logger.info(`🤖 Yandex Bot: ${req.method} ${req.url} (IP: ${clientIP})`);
    }
    // Остальные запросы не логируем (слишком много шума)
    next();
});

// Добавляем заголовки для поддержки iframe
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: function (origin, callback) {
        // Разрешенные домены для интеграций
        const integrationDomains = [
            'https://ya.ru',
            'https://yandex.ru',
            'https://docs.google.com',
            'https://www.google.com',
            'https://rutube.ru',
            'https://player.smotrim.ru'
        ];

        if (process.env.NODE_ENV === 'development') {
            const allowedDev = [
                'https://localhost:5173',
                'http://localhost:5173',
                'https://127.0.0.1:5173',
                'http://127.0.0.1:5173',
                ...allowedOrigins,
                ...integrationDomains
            ];
            if (!origin || allowedDev.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`🚫 CORS заблокирован для: ${origin}`);
                callback(new Error('Blocked by CORS'));
            }
        } else {
            // В продакшене более строгие правила
            const allowedProd = [
                ...allowedOrigins,
                ...integrationDomains
            ];

            if (!origin || allowedProd.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`🚫 CORS заблокирован для: ${origin}`);
                // В продакшене возвращаем ошибку вместо блокировки
                callback(new Error('CORS policy violation'));
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
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", 'https://ingushetiatv.ru', 'https://player.smotrim.ru', 'https://yastatic.net', process.env.BASE_URL],
                connectSrc: ["'self'", 'https://ingushetiatv.ru', 'https://player.smotrim.ru', 'https://yastatic.net', process.env.BASE_URL],
                imgSrc: ["'self'", 'data:', 'blob:', 'https://ingushetiatv.ru', 'https://player.smotrim.ru', 'https://yastatic.net', 'https://rutube.ru', process.env.BASE_URL],
                mediaSrc: ["'self'", 'https://ingushetiatv.ru', 'https://player.smotrim.ru', 'https://yastatic.net', process.env.BASE_URL],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://ingushetiatv.ru',
                    'https://player.smotrim.ru',
                    'https://yastatic.net',
                    process.env.BASE_URL,
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://ingushetiatv.ru',
                    'https://player.smotrim.ru',
                    'https://yastatic.net',
                    process.env.BASE_URL,
                ],
                fontSrc: ["'self'", 'https://ingushetiatv.ru', 'https://player.smotrim.ru', 'https://yastatic.net', 'data:', process.env.BASE_URL],
                childSrc: [
                    "'self'",
                    'https://www.youtube.com',
                    'https://www.youtu.be',
                    'https://www.youtube-nocookie.com',
                    'https://rutube.ru',
                    'https://rutube.ru/play/embed',
                    'https://player.smotrim.ru',
                    'https://vk.com',
                    'https://vk.ru',
                    'https://vkvideo.ru',
                    'https://m.vk.com',
                    process.env.BASE_URL,
                ],
                frameSrc: [
                    "'self'",
                    'https://www.youtube.com',
                    'https://www.youtu.be',
                    'https://www.youtube-nocookie.com',
                    'https://rutube.ru',
                    'https://rutube.ru/play/embed',
                    'https://player.smotrim.ru',
                    'https://vk.com',
                    'https://vk.ru',
                    'https://vkvideo.ru',
                    'https://m.vk.com',
                    process.env.BASE_URL,
                ],
                objectSrc: ["'none'"],
            },
        },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        featurePolicy: {
            geolocation: ["'none'"],
        },
    }),
);

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // Уменьшил до 10 минут
    max: process.env.NODE_ENV === 'development' ? 10000000 : 1500, // Увеличил до 1500 запросов за 10 минут
    message: 'Слишком много запросов с этого IP, попробуйте позже.',
    handler: (req, res, next) => {
        const moscowTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        logger.warn(`🚫 [${moscowTime}] Rate limit exceeded for IP: ${req.ip} - URL: ${req.url}`);
        res.status(429).json({
            status: 'error',
            message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
            retryAfter: Math.ceil(limiter.windowMs / 1000),
        });
    },
    skip: (req, res) => {
        return isBot(req) ||
            req.path === '/api/users/csrf-token' ||
            req.path.includes('/rss') ||
            req.path === '/robots.txt' ||
            req.path === '/sitemap.xml' ||
            req.path.startsWith('/uploads/') ||
            req.path.includes('.js') ||
            req.path.includes('.css') ||
            req.path.includes('.png') ||
            req.path.includes('.jpg') ||
            req.path.includes('.jpeg') ||
            req.path.includes('.gif') ||
            req.path.includes('.webp') ||
            req.path.includes('/favicon.ico');
    },
});
app.use(limiter);

app.use('/api/rss', require('./routes/rss'));
app.use('/rss', (req, res) => {
    res.redirect('/api/rss');
});

app.use(express.static(publicDir));

const logStaticFileRequests = (req, res, next) => {
    if (req.url.startsWith('/uploads/')) {
        const requestedFile = path.resolve(__dirname, '..', req.url);

        if (!fs.existsSync(requestedFile)) {
            const alternatives = [
                path.resolve(uploadDir, req.url.replace('/uploads/', '')),
                path.resolve(__dirname, '../uploads', req.url.replace('/uploads/', '')),
                path.resolve(__dirname, '../../uploads', req.url.replace('/uploads/', '')),
            ];

            for (const alt of alternatives) {
                if (fs.existsSync(alt) && !res.headersSent) {
                    return res.sendFile(alt);
                }
            }
            
            // Логируем только если файл не найден
            logger.warn(`Файл не найден: ${req.url}`);
        }
    }
    next();
};

app.use(logStaticFileRequests);

// НАСТРОЙКА СТАТИЧЕСКИХ ФАЙЛОВ
app.use('/uploads/images', express.static(imagesDir, {
    setHeaders: (res, filePath, stat) => {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 часа
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
}));

app.use('/uploads/videoAd', express.static(videoAdDir, {
    setHeaders: (res, filePath, stat) => {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
    },
}));

app.use('/uploads/audio', express.static(audioDir, {
    setHeaders: (res, filePath, stat) => {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
    },
}));

app.use('/uploads/avatars', express.static(avatarDir, {
    setHeaders: (res, filePath, stat) => {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
    },
}));

// Папка temp для отложенных новостей (scheduled-* файлы)
const tempDir = path.join(__dirname, 'temp');
app.use('/uploads/temp', express.static(tempDir, {
    setHeaders: (res, filePath, stat) => {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
    },
}));

app.use('/uploads', express.static(uploadDir, {
    setHeaders: (res, filePath, stat) => {
        console.log(`📂 [Static Uploads] Отдаем файл: ${filePath}`);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
}));

app.get('/api/check-file/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(imagesDir, filename);

    console.log(`🔍 Проверка файла: ${filename}`);
    console.log(`   Полный путь: ${filePath}`);
    console.log(`   Существует: ${fs.existsSync(filePath)}`);

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        res.json({
            exists: true,
            size: stats.size,
            modified: stats.mtime,
            path: filePath,
            url: `/uploads/images/${filename}`,
            fullUrl: `${req.protocol}://${req.get('host')}/uploads/images/${filename}`
        });
    } else {
        res.status(404).json({
            exists: false,
            path: filePath,
            message: 'Файл не найден'
        });
    }
});

app.get('/api/list-uploads', (req, res) => {
    try {
        if (!fs.existsSync(imagesDir)) {
            return res.json({
                error: 'Папка uploads/images не существует',
                directory: imagesDir
            });
        }

        const files = fs.readdirSync(imagesDir);
        const fileDetails = files.map(filename => {
            const filePath = path.join(imagesDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                modified: stats.mtime,
                url: `/uploads/images/${filename}`,
                fullUrl: `${req.protocol}://${req.get('host')}/uploads/images/${filename}`
            };
        }).slice(0, 50);

        res.json({
            directory: imagesDir,
            totalFiles: files.length,
            files: fileDetails
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            directory: imagesDir
        });
    }
});

app.use((req, res, next) => {
    if (isBot(req) || req.path.includes('/rss') || req.path === '/robots.txt' ||
        req.path === '/sitemap.xml' || req.path.startsWith('/uploads/')) {
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

app.get('/api/server-time', (req, res) => {
    const now = new Date();
    res.json({
        utc: now.toISOString(),
        moscow: now.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }),
        timezone: process.env.TZ,
        offset: now.getTimezoneOffset()
    });
});

// Простой тестовый маршрут
app.get('/test', (req, res) => {
    res.json({
        message: 'Тестовый маршрут работает!',
        timestamp: new Date().toISOString(),
        url: req.url,
        method: req.method
    });
});

// Тестовая страница для проверки iframe
app.get('/test-iframe', (req, res) => {
    console.log('=== ЗАПРОС К /test-iframe ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Protocol:', req.protocol);
    console.log('Host:', req.get('host'));
    console.log('Full URL:', `${req.protocol}://${req.get('host')}${req.url}`);

    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест iframe Smotrim.ru</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .test-info {
            background: #f0f0f0;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        iframe {
            width: 100%;
            max-width: 800px;
            height: 450px;
            border: 1px solid #ccc;
            display: block;
            margin: 0 auto;
        }
        .error-message {
            color: red;
            font-weight: bold;
            padding: 10px;
            background: #ffe6e6;
            border: 1px solid #ffcccc;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>Тест iframe Smotrim.ru</h1>
    <div class="test-info">
        <h3>Информация о тесте:</h3>
        <p><strong>URL:</strong> ${req.protocol}://${req.get('host')}</p>
        <p><strong>User-Agent:</strong> ${req.headers['user-agent']}</p>
        <p><strong>Referrer:</strong> ${req.headers.referrer || 'Нет'}</p>
        <p><strong>Origin:</strong> ${req.headers.origin || 'Нет'}</p>
    </div>

    <div class="error-message">
        ⚠️ Если iframe ниже не работает, это означает, что Smotrim.ru блокирует embedding с этого домена.
        Попробуйте открыть iframe напрямую: <a href="https://player.smotrim.ru/iframe/live/uid/0ef99435-a317-425d-8413-baad29f19bd3/start_zoom/true/showZoomBtn/false/isPlay/false/" target="_blank">Ссылка</a>
    </div>

    <h3>Альтернативный тест без sandbox:</h3>
    <iframe
        src="https://player.smotrim.ru/iframe/live/uid/0ef99435-a317-425d-8413-baad29f19bd3/"
        allowfullscreen
        frameborder="0"
        width="640"
        height="360"
        style="border: 1px solid #ccc; display: block; margin: 0 auto;"
    ></iframe>

    <h3>Тест с минимальными параметрами:</h3>
    <iframe
        src="https://player.smotrim.ru/iframe/live/uid/0ef99435-a317-425d-8413-baad29f19bd3"
        width="640"
        height="360"
        style="border: 1px solid #ccc; display: block; margin: 0 auto;"
    ></iframe>

    <h2>Россия 1. Назрань</h2>
    <iframe
        src="https://player.smotrim.ru/iframe/live/uid/0ef99435-a317-425d-8413-baad29f19bd3/start_zoom/true/showZoomBtn/false/isPlay/false/"
        allowfullscreen
        frameborder="0"
        allow="autoplay; encrypted-media; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-presentation allow-forms"
    ></iframe>

    <h2>Россия 24. Назрань</h2>
    <iframe
        src="https://player.smotrim.ru/iframe/live/uid/fbe71f00-0d62-42a9-9b30-257276b8f887/start_zoom/true/showZoomBtn/false/isPlay/false/"
        allowfullscreen
        frameborder="0"
        allow="autoplay; encrypted-media; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-presentation allow-forms"
    ></iframe>
</body>
</html>`;
    res.send(html);
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

app.use((req, res, next) => {
    if (res.headersSent) {
        return;
    }
    next();
});

const distDir = path.join(__dirname, '../dist');

app.get('/news/:id', async (req, res, next) => {
    // Логируем, что маршрут вызван
    logger.info(`📍 Маршрут /news/:id вызван для ${req.path}, UA: ${req.headers['user-agent']?.substring(0, 50) || 'нет'}, IP: ${getClientIP(req)}`);
    
    // Вызываем botHandler
    await botHandler(req, res, (err) => {
        // Если botHandler вызвал next() (не обработал запрос), продолжаем дальше
        if (err) {
            logger.error(`❌ Ошибка в botHandler: ${err.message}`);
            return next(err);
        }
        // Если botHandler отправил ответ (для ботов), ничего не делаем
        if (res.headersSent) {
            logger.info(`✅ botHandler отправил ответ для ${req.path}`);
            return;
        }
        // Если botHandler не обработал запрос, продолжаем дальше
        logger.info(`⏭️ botHandler не обработал запрос ${req.path}, продолжаем дальше`);
        next();
    });
});

// Затем добавляем botHandler как общий middleware для остальных случаев
app.use(botHandler);

app.use(express.static(distDir));

app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        if (isBot(req) || req.path.includes('/rss') || req.path.startsWith('/uploads/')) {
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

// Тестовый маршрут для проверки работы сервера напрямую
app.get('/server-test', (req, res) => {
    res.json({
        message: 'Node.js сервер работает!',
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        headers: req.headers,
        url: req.url,
        originalUrl: req.originalUrl,
        query: req.query,
        routes: [
            '/test-iframe',
            '/test',
            '/api/server-time',
            '/api/*'
        ]
    });
});

// Тестовый маршрут для проверки botHandler
app.get('/test-bot-handler', (req, res) => {
    res.json({
        message: 'Bot handler test',
        url: req.url,
        originalUrl: req.originalUrl,
        query: req.query,
        headers: {
            'user-agent': req.headers['user-agent'],
            'x-seo-preview': req.headers['x-seo-preview'] || req.headers['X-SEO-Preview']
        },
        path: req.path
    });
});

app.get('*', (req, res) => {
    // Логируем запросы к /news/:id, которые попали в fallback (не должны были)
    if (req.path.match(/^\/news\/(\d+)$/)) {
        logger.warn(`⚠️ Запрос к ${req.path} попал в fallback app.get('*') - botHandler не обработал! UA: ${req.headers['user-agent']?.substring(0, 50) || 'нет'}, IP: ${getClientIP(req)}`);
    }
    // Если botHandler уже отправил ответ (для ботов), не отправляем index.html
    if (!res.headersSent) {
        res.sendFile(path.join(distDir, 'index.html'));
    }
});

const startServer = async (retryCount = 0) => {
    const maxRetries = 5;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Экспоненциальная задержка, максимум 30 секунд

    try {
        // Проверяем подключение к БД
        await sequelize.authenticate();
        const currentTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        logger.info(`[${currentTime}] Подключение к базе данных установлено успешно.`);

        // Синхронизируем модели
        await sequelize.sync();
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

        // Запускаем сервер
        http.createServer(credentials, app).listen(PORT, () => {
            logger.info(`[${moscowTime}] HTTPS сервер запущен на порту ${PORT}`);
            logger.info(`🌐 Базовый URL: ${process.env.BASE_URL}`);
            logger.info(`🔗 CORS разрешен для: ${allowedOrigins.join(', ')}`);
            logger.info(`📊 Режим: ${process.env.NODE_ENV}`);
        });

    } catch (err) {
        const moscowTime = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        logger.error(`[${moscowTime}] Ошибка при подключении к базе данных (попытка ${retryCount + 1}/${maxRetries + 1}): ${err.message}`);

        if (retryCount < maxRetries) {
            logger.info(`[${moscowTime}] Повторная попытка подключения через ${retryDelay / 1000} секунд...`);
            setTimeout(() => startServer(retryCount + 1), retryDelay);
        } else {
            logger.error(`[${moscowTime}] Превышено максимальное количество попыток подключения. Сервер не будет запущен.`);
            logger.error(`[${moscowTime}] Детали ошибки:`, err);

            // В продакшене можно отправить уведомление администратору
            if (process.env.NODE_ENV === 'production') {
                logger.error(`[${moscowTime}] КРИТИЧЕСКАЯ ОШИБКА: Сервер не может подключиться к базе данных!`);
            }

            process.exit(1);
        }
    }
};

startServer();