// middlewares/securityProtection.middleware.js
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../logger');

// Хранилище для отслеживания попыток входа
const failedAttempts = new Map();
const suspiciousIPs = new Set();

/**
 * Очистка старых записей каждый час
 */
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const [key, data] of failedAttempts.entries()) {
        if (data.lastAttempt < oneHourAgo) {
            failedAttempts.delete(key);
        }
    }
}, 60 * 60 * 1000);

/**
 * Middleware для защиты от брутфорса при входе
 */
const bruteForceProtection = (req, res, next) => {
    const key = `${req.ip}:${req.body.email || 'unknown'}`;
    const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: 0 };

    // Если слишком много попыток
    if (attempts.count >= 5) {
        const timeDiff = Date.now() - attempts.lastAttempt;
        const waitTime = Math.min(Math.pow(2, attempts.count - 5) * 60000, 30 * 60000); // Экспоненциальная задержка, максимум 30 минут

        if (timeDiff < waitTime) {
            console.log(`[SECURITY] Блокировка брутфорса для ${key}`, {
                attempts: attempts.count,
                blockedFor: Math.ceil((waitTime - timeDiff) / 1000),
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            return res.status(429).json({
                error: 'Слишком много неудачных попыток входа. Попробуйте позже.',
                retryAfter: Math.ceil((waitTime - timeDiff) / 1000)
            });
        }
    }

    // Сохраняем оригинальный метод json для отслеживания результата
    const originalJson = res.json;
    res.json = function(data) {
        // Если вход неудачный
        if (res.statusCode === 401 || (data && data.errors)) {
            attempts.count++;
            attempts.lastAttempt = Date.now();
            failedAttempts.set(key, attempts);

            // Добавляем IP в подозрительные после 3 неудачных попыток
            if (attempts.count >= 3) {
                suspiciousIPs.add(req.ip);
                console.log(`[SECURITY] IP ${req.ip} добавлен в список подозрительных`, {
                    attempts: attempts.count,
                    email: req.body.email,
                    timestamp: new Date().toISOString()
                });
            }
        } else if (res.statusCode === 200 && data && data.message === 'Успешная авторизация') {
            // Успешный вход - сбрасываем счетчик
            failedAttempts.delete(key);
            suspiciousIPs.delete(req.ip);
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * Замедление запросов для подозрительных IP
 */
const suspiciousIPSlowdown = slowDown({
    windowMs: 15 * 60 * 1000, // 15 минут
    delayAfter: 1, // начинаем замедлять после 1 запроса
    delayMs: () => 500, // функция, возвращающая 500мс задержки
    maxDelayMs: 5000, // максимальная задержка 5 секунд
    skip: (req) => !suspiciousIPs.has(req.ip),
    validate: {
        delayMs: false // отключаем предупреждение
    }
});

/**
 * Строгие ограничения для административных действий
 */
const adminActionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 50, // максимум 50 административных действий в час
    message: {
        error: 'Превышен лимит административных действий. Попробуйте через час.'
    },
    keyGenerator: (req) => req.user?.id || req.ip,
    skip: (req) => !req.user?.isAdmin,
});

/**
 * Защита от спама регистраций
 */
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3, // максимум 3 регистрации с одного IP в час
    message: {
        error: 'Превышен лимит регистраций с этого IP. Попробуйте через час.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Middleware для обнаружения подозрительных паттернов
 */
const detectSuspiciousPatterns = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /burp/i,
        /havij/i,
        /masscan/i,
        /nmap/i,
        /python-requests/i,
        /curl/i,
        /wget/i
    ];

    // Проверяем User-Agent на подозрительные паттерны
    const isSuspiciousUA = suspiciousPatterns.some(pattern => pattern.test(userAgent));

    // Проверяем на подозрительные заголовки
    const suspiciousHeaders = [
        'x-forwarded-for',
        'x-real-ip',
        'x-originating-ip'
    ];

    const hasSuspiciousHeaders = suspiciousHeaders.some(header =>
        req.headers[header] && req.headers[header].split(',').length > 3
    );

    // Проверяем на слишком быстрые запросы
    const requestKey = `requests:${req.ip}`;
    const now = Date.now();
    const requests = failedAttempts.get(requestKey) || { times: [], count: 0 };

    requests.times.push(now);
    requests.times = requests.times.filter(time => now - time < 10000); // Последние 10 секунд

    if (requests.times.length > 20) { // Более 20 запросов за 10 секунд
        console.log(`[SECURITY] Обнаружена подозрительная активность от ${req.ip}`, {
            requestsIn10s: requests.times.length,
            userAgent: userAgent,
            endpoint: req.path,
            timestamp: new Date().toISOString()
        });

        suspiciousIPs.add(req.ip);
    }

    failedAttempts.set(requestKey, requests);

    if (isSuspiciousUA || hasSuspiciousHeaders) {
        console.log(`[SECURITY] Подозрительный запрос от ${req.ip}`, {
            userAgent: userAgent,
            suspiciousUA: isSuspiciousUA,
            suspiciousHeaders: hasSuspiciousHeaders,
            endpoint: req.path,
            timestamp: new Date().toISOString()
        });

        suspiciousIPs.add(req.ip);

        // Для очень подозрительных запросов возвращаем 403
        if (isSuspiciousUA) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }
    }

    next();
};

/**
 * Middleware для проверки геолокации (опционально)
 */
const geoLocationCheck = (req, res, next) => {
    // Если у вас есть API для проверки геолокации, можно добавить здесь
    // Например, блокировать запросы из определенных стран

    // Пример простой проверки по заголовкам CloudFlare
    const country = req.headers['cf-ipcountry'];
    const blockedCountries = process.env.BLOCKED_COUNTRIES?.split(',') || [];

    if (country && blockedCountries.includes(country)) {
        console.log(`[SECURITY] Заблокирован запрос из страны ${country}`, {
            ip: req.ip,
            endpoint: req.path,
            timestamp: new Date().toISOString()
        });

        return res.status(403).json({ error: 'Доступ из вашей страны ограничен' });
    }

    next();
};

/**
 * Middleware для логирования всех неудачных запросов
 */
const logFailedRequests = (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
        // Логируем все ошибки 4xx и 5xx
        if (res.statusCode >= 400) {
            console.log(`[SECURITY] Неудачный запрос ${res.statusCode}: ${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                userId: req.user?.id || 'anonymous',
                statusCode: res.statusCode,
                error: data.error || data.message,
                timestamp: new Date().toISOString(),
                referer: req.get('Referer'),
                body: req.method === 'POST' ? Object.keys(req.body) : undefined
            });
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * Получение статистики безопасности (только для админов)
 */
const getSecurityStats = (req, res) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const stats = {
        suspiciousIPs: Array.from(suspiciousIPs),
        failedAttemptsCount: failedAttempts.size,
        topFailedAttempts: Array.from(failedAttempts.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([key, data]) => ({
                key,
                attempts: data.count,
                lastAttempt: new Date(data.lastAttempt).toISOString()
            }))
    };

    res.json(stats);
};

// Middleware для дополнительной безопасности
const securityProtection = (req, res, next) => {
    // Логирование подозрительных запросов
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
        /sqlmap/i,
        /nmap/i,
        /nikto/i,
        /dirbuster/i,
        /burpsuite/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious) {
        logger.warn('Подозрительный User-Agent обнаружен', {
            userAgent,
            ip: req.ip,
            url: req.url,
            method: req.method
        });
    }

    // Проверка на SQL injection паттерны в параметрах
    const params = { ...req.query, ...req.body };
    const sqlInjectionPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
        /((\%27)|(\'))union/i
    ];

    for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string') {
            const containsSqlInjection = sqlInjectionPatterns.some(pattern => pattern.test(value));
            if (containsSqlInjection) {
                logger.warn('Возможная SQL injection попытка', {
                    parameter: key,
                    value: value.substring(0, 100),
                    ip: req.ip,
                    userAgent
                });
                return res.status(400).json({ error: 'Недопустимые символы в запросе' });
            }
        }
    }

    next();
};

module.exports = {
    bruteForceProtection,
    suspiciousIPSlowdown,
    adminActionLimiter,
    registrationLimiter,
    detectSuspiciousPatterns,
    geoLocationCheck,
    logFailedRequests,
    getSecurityStats,
    securityProtection
};