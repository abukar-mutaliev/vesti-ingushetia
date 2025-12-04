const winston = require('winston');
const path = require('path');
const fs = require('fs');

const moscowTimestamp = () => {
    return new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => moscowTimestamp()
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        if (stack) {
            logMessage += `\n${stack}`;
        }

        const metaKeys = Object.keys(meta);
        if (metaKeys.length > 0) {
            const filteredMeta = Object.fromEntries(
                metaKeys
                    .filter(key => !['level', 'message', 'timestamp'].includes(key))
                    .map(key => [key, meta[key]])
            );

            if (Object.keys(filteredMeta).length > 0) {
                logMessage += ` ${JSON.stringify(filteredMeta)}`;
            }
        }

        return logMessage;
    })
);

const consoleFormat = winston.format.combine(
    winston.format.colorize({
        all: true,
        colors: {
            info: 'cyan',
            warn: 'yellow',
            error: 'red',
            debug: 'blue'
        }
    }),
    winston.format.timestamp({
        format: () => moscowTimestamp()
    }),
    winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: {
        service: 'vesti-ingushetia',
        timezone: 'Europe/Moscow'
    },
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: () => moscowTimestamp()
                }),
                winston.format.json()
            )
        }),

        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: () => moscowTimestamp()
                }),
                winston.format.json()
            )
        }),

        new winston.transports.File({
            filename: path.join(logsDir, 'scheduler.log'),
            level: 'info',
            maxsize: 2097152, // 2MB
            maxFiles: 3,
            format: winston.format.combine(
                winston.format.timestamp({
                    format: () => moscowTimestamp()
                }),
                winston.format.json(),
                winston.format((info) => {
                    if (info.message && (
                        info.message.includes('планировщик') ||
                        info.message.includes('Планировщик') ||
                        info.message.includes('отложенн') ||
                        info.message.includes('📰') ||
                        info.message.includes('🚀') ||
                        info.message.includes('⏰')
                    )) {
                        return info;
                    }
                    return false;
                })()
            )
        })
    ],
});

// Всегда добавляем Console transport для PM2 (даже в production)
// PM2 может видеть только логи, которые выводятся в stdout/stderr
logger.add(new winston.transports.Console({
    format: consoleFormat,
    handleExceptions: true,
    handleRejections: true
}));

logger.scheduler = (message, meta = {}) => {
    logger.info(`🔄 [SCHEDULER] ${message}`, {
        component: 'scheduler',
        moscowTime: moscowTimestamp(),
        ...meta
    });
};

logger.video = (message, meta = {}) => {
    logger.info(`🎥 [VIDEO] ${message}`, {
        component: 'video',
        moscowTime: moscowTimestamp(),
        ...meta
    });
};

logger.media = (message, meta = {}) => {
    logger.info(`📁 [MEDIA] ${message}`, {
        component: 'media',
        moscowTime: moscowTimestamp(),
        ...meta
    });
};

logger.auth = (message, meta = {}) => {
    logger.info(`🔐 [AUTH] ${message}`, {
        component: 'auth',
        moscowTime: moscowTimestamp(),
        ...meta
    });
};

logger.request = (method, url, meta = {}) => {
    logger.info(`🌐 [${method}] ${url}`, {
        component: 'request',
        method,
        url,
        moscowTime: moscowTimestamp(),
        ...meta
    });
};

logger.performance = (operation, duration, meta = {}) => {
    logger.info(`⚡ [PERF] ${operation} завершено за ${duration}ms`, {
        component: 'performance',
        operation,
        duration,
        moscowTime: moscowTimestamp(),
        ...meta
    });
};

logger.scheduleTime = (title, scheduledDate, authorId) => {
    const moscowTime = new Date(scheduledDate).toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow'
    });

    logger.scheduler(`Новость запланирована: "${title}"`, {
        scheduledDate: new Date(scheduledDate).toISOString(),
        scheduledMoscowTime: moscowTime,
        authorId,
        action: 'schedule'
    });
};

logger.publish = (title, newsId, meta = {}) => {
    logger.info(`📰 [PUBLISH] Опубликована новость: "${title}" (ID: ${newsId})`, {
        component: 'publish',
        newsId,
        title,
        moscowTime: moscowTimestamp(),
        ...meta
    });
};

logger.critical = (message, error = null, meta = {}) => {
    const errorInfo = error ? {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name
    } : {};

    logger.error(`🚨 [CRITICAL] ${message}`, {
        component: 'critical',
        moscowTime: moscowTimestamp(),
        ...errorInfo,
        ...meta
    });
};

logger.exceptions.handle(
    new winston.transports.File({
        filename: path.join(logsDir, 'exceptions.log'),
        format: winston.format.combine(
            winston.format.timestamp({
                format: () => moscowTimestamp()
            }),
            winston.format.json()
        )
    })
);

logger.rejections.handle(
    new winston.transports.File({
        filename: path.join(logsDir, 'rejections.log'),
        format: winston.format.combine(
            winston.format.timestamp({
                format: () => moscowTimestamp()
            }),
            winston.format.json()
        )
    })
);

logger.info('Logger инициализирован', {
    component: 'logger',
    timezone: 'Europe/Moscow',
    moscowTime: moscowTimestamp(),
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeEnv: process.env.NODE_ENV || 'development'
});

module.exports = logger;