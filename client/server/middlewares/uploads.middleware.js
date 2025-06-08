const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const avatarsDir = path.join(uploadDir, 'avatars');
const imagesDir = path.join(uploadDir, 'images');

[uploadDir, avatarsDir, imagesDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const maxAvatarSize = parseInt(process.env.MAX_AVATAR_SIZE || '5242880', 10); // 5 MB (уменьшено)
const maxImageSize = parseInt(process.env.MAX_IMAGE_SIZE || '10485760', 10); // 10 MB

// БЕЗОПАСНОСТЬ: Только самые безопасные MIME типы (убираем GIF и WebP)
const ALLOWED_MIME_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png'
};

// БЕЗОПАСНОСТЬ: Исключаем все потенциально опасные форматы
const FORBIDDEN_EXTENSIONS = [
    'svg', 'xml', 'html', 'htm', 'js', 'php', 'asp', 'jsp', 'exe', 'bat', 'cmd',
    'gif', 'webp', 'bmp', 'tiff', 'ico' // Убираем GIF, WebP и другие потенциально опасные
];

// Магические байты только для безопасных форматов
const FILE_SIGNATURES = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]]
};

/**
 * Проверяет файл по магическим байтам
 */
const validateFileSignature = (buffer, mimeType) => {
    const signatures = FILE_SIGNATURES[mimeType];
    if (!signatures) return false;

    return signatures.some(signature => {
        if (buffer.length < signature.length) return false;
        return signature.every((byte, index) => buffer[index] === byte);
    });
};

/**
 * Сканирует содержимое файла на наличие вредоносного кода
 */
const scanFileContent = (buffer, filename) => {
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));

    // Опасные паттерны
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /onclick\s*=/i,
        /onmouseover\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /data:text\/html/i,
        /data:application\/javascript/i,
        /<svg.*onload/i,
        /<svg.*onerror/i,
        /<?php/i,
        /<\?=/i,
        /<%/i
    ];

    const foundPattern = dangerousPatterns.find(pattern => pattern.test(content));
    if (foundPattern) {
        console.error(`[SECURITY] Обнаружен вредоносный код в файле ${filename}:`, {
            pattern: foundPattern.toString(),
            timestamp: new Date().toISOString()
        });
        return false;
    }

    return true;
};

/**
 * Генерирует безопасное имя файла
 */
const generateSecureFilename = (originalName, fieldname) => {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${fieldname}-${timestamp}-${randomBytes}${ext}`;
};

const fileDestination = (req, file, cb) => {
    const destMap = {
        avatar: avatarsDir,
        images: imagesDir,
    };

    const destination = destMap[file.fieldname];
    if (destination) {
        cb(null, destination);
    } else {
        cb(new Error('Неверное имя поля файла'));
    }
};

const storage = multer.diskStorage({
    destination: fileDestination,
    filename: (req, file, cb) => {
        const secureFilename = generateSecureFilename(file.originalname, file.fieldname);
        cb(null, secureFilename);
    },
});

/**
 * Расширенная проверка файлов
 */
const advancedFileFilter = (req, file, cb) => {
    try {
        // 1. Проверка MIME типа
        if (!ALLOWED_MIME_TYPES[file.mimetype]) {
            return cb(new Error(`Недопустимый MIME тип: ${file.mimetype}. Разрешены только: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`));
        }

        // 2. Проверка расширения файла
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        const expectedExt = ALLOWED_MIME_TYPES[file.mimetype];

        if (ext !== expectedExt) {
            return cb(new Error(`Несоответствие расширения файла: ожидается .${expectedExt}, получено .${ext}`));
        }

        // 3. Проверка на запрещенные расширения
        if (FORBIDDEN_EXTENSIONS.includes(ext)) {
            return cb(new Error(`Запрещенное расширение файла: .${ext}`));
        }

        // 4. Проверка имени файла на подозрительные паттерны
        const suspiciousFilenamePatterns = [
            /\.php\./i,
            /\.asp\./i,
            /\.jsp\./i,
            /\.js\./i,
            /\.html?\./i,
            /\.svg\./i,
            /\.\./,
            /[<>:"|?*]/,
            /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i
        ];

        if (suspiciousFilenamePatterns.some(pattern => pattern.test(file.originalname))) {
            return cb(new Error('Подозрительное имя файла'));
        }

        // 5. Ограничение размера в зависимости от типа
        const maxSize = file.fieldname === 'avatar' ? maxAvatarSize : maxImageSize;
        if (file.size > maxSize) {
            return cb(new Error(`Файл слишком большой. Максимальный размер: ${Math.round(maxSize / 1024 / 1024)}MB`));
        }

        cb(null, true);
    } catch (error) {
        cb(new Error(`Ошибка проверки файла: ${error.message}`));
    }
};

/**
 * Middleware для дополнительной проверки после загрузки
 */
const postUploadValidation = async (req, res, next) => {
    try {
        if (!req.files && !req.file) {
            return next();
        }

        const files = [];
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                if (Array.isArray(fileArray)) {
                    files.push(...fileArray);
                } else {
                    files.push(fileArray);
                }
            });
        }
        if (req.file) {
            files.push(req.file);
        }

        for (const file of files) {
            try {
                // Читаем первые байты файла для проверки сигнатуры
                const buffer = fs.readFileSync(file.path);

                // 1. Проверка магических байтов
                if (!validateFileSignature(buffer, file.mimetype)) {
                    fs.unlinkSync(file.path);
                    return res.status(400).json({
                        error: `Файл ${file.originalname} не соответствует заявленному типу`
                    });
                }

                // 2. Сканирование содержимого на вредоносный код
                if (!scanFileContent(buffer, file.originalname)) {
                    fs.unlinkSync(file.path);
                    return res.status(400).json({
                        error: `Файл ${file.originalname} содержит потенциально опасный код`
                    });
                }

                // 3. Дополнительная проверка размера (файл уже загружен)
                const stats = fs.statSync(file.path);
                const maxSize = file.fieldname === 'avatar' ? maxAvatarSize : maxImageSize;

                if (stats.size > maxSize) {
                    fs.unlinkSync(file.path);
                    return res.status(400).json({
                        error: `Файл слишком большой: ${Math.round(stats.size / 1024 / 1024)}MB. Максимум: ${Math.round(maxSize / 1024 / 1024)}MB`
                    });
                }

                console.log(`[SECURITY] Файл успешно проверен: ${file.originalname}`, {
                    fieldname: file.fieldname,
                    mimetype: file.mimetype,
                    size: stats.size,
                    userId: req.user?.id,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error(`[SECURITY] Ошибка при проверке файла ${file.originalname}:`, error);

                // Удаляем файл при ошибке
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }

                return res.status(400).json({
                    error: `Ошибка при обработке файла ${file.originalname}`
                });
            }
        }

        next();
    } catch (error) {
        console.error('[SECURITY] Ошибка в postUploadValidation:', error);
        return res.status(500).json({ error: 'Ошибка обработки файлов' });
    }
};

const uploadsMiddleware = multer({
    storage,
    limits: {
        fileSize: maxImageSize,
        files: 10, // максимум 10 файлов за раз
        fields: 10, // максимум 10 полей
        parts: 20  // максимум 20 частей
    },
    fileFilter: advancedFileFilter,
}).fields([
    { name: 'images', maxCount: 5 }, // уменьшено с 10 до 5
    { name: 'avatar', maxCount: 1 },
]);

/**
 * Обработчик ошибок Multer с дополнительным логированием
 */
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        console.error('[SECURITY] Ошибка Multer:', {
            error: err.message,
            code: err.code,
            field: err.field,
            userId: req.user?.id,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        const errorMessages = {
            'LIMIT_FILE_SIZE': 'Файл слишком большой',
            'LIMIT_FILE_COUNT': 'Слишком много файлов',
            'LIMIT_FIELD_KEY': 'Слишком длинное имя поля',
            'LIMIT_FIELD_VALUE': 'Слишком большое значение поля',
            'LIMIT_FIELD_COUNT': 'Слишком много полей',
            'LIMIT_UNEXPECTED_FILE': 'Неожиданный файл',
            'LIMIT_PART_COUNT': 'Слишком много частей'
        };

        const message = errorMessages[err.code] || `Ошибка загрузки: ${err.message}`;
        return res.status(400).json({ error: message });

    } else if (err) {
        console.error('[SECURITY] Ошибка загрузки файлов:', {
            error: err.message,
            userId: req.user?.id,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        return res.status(400).json({ error: err.message });
    }

    next();
};

/**
 * Middleware для логирования всех попыток загрузки
 */
const logUploadAttempts = (req, res, next) => {
    if (req.files || req.file) {
        console.log('[SECURITY] Попытка загрузки файлов:', {
            userId: req.user?.id || 'anonymous',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

module.exports = {
    upload: uploadsMiddleware,
    handleMulterErrors,
    postUploadValidation,
    logUploadAttempts,
    ALLOWED_MIME_TYPES,
    FORBIDDEN_EXTENSIONS
};