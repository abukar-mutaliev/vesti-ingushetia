
const { body, param, query } = require('express-validator');

const isSupportedVideoUrl = (value) => {
    if (!value) return true;

    const rutubeRegex = /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
    const youtubeRegex = /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;

    if (rutubeRegex.test(value) || youtubeRegex.test(value)) {
        return true;
    }
    throw new Error('Видео ссылка должна быть URL от Rutube или YouTube');
};

exports.createNewsValidator = [
    body('title')
        .notEmpty()
        .withMessage('Заголовок обязателен')
        .isLength({ min: 5 })
        .withMessage('Заголовок должен содержать не менее 5 символов'),
    body('content')
        .notEmpty()
        .withMessage('Содержание обязательно')
        .isLength({ min: 20 })
        .withMessage('Содержание должно содержать не менее 20 символов'),
    body('categoryIds')
        .custom((value) => {
            let categories;
            if (typeof value === 'string') {
                categories = value.startsWith('[') ? JSON.parse(value) : value.split(',').map(Number);
            } else if (Array.isArray(value)) {
                categories = value.map(Number);
            } else {
                throw new Error('Категории должны быть массивом или строкой JSON');
            }

            if (!categories.length) {
                throw new Error('Необходимо выбрать хотя бы одну категорию');
            }

            if (!categories.every((id) => Number.isInteger(id) && id > 0)) {
                throw new Error('Каждый ID категории должен быть положительным числом');
            }

            return true;
        }),
    body('videoUrl').optional().custom(isSupportedVideoUrl),
    body('scheduleForLater')
        .optional()
        .isBoolean()
        .withMessage('Поле scheduleForLater должно быть булевым значением'),
    body('publishDate')
        .optional()
        .isISO8601()
        .withMessage('Дата публикации должна быть в формате ISO8601')
        .custom((value, { req }) => {
            if (req.body.scheduleForLater && value) {
                const scheduledDate = new Date(value);
                const now = new Date();

                if (scheduledDate <= now) {
                    throw new Error('Дата отложенной публикации должна быть в будущем');
                }

                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

                if (scheduledDate > oneYearFromNow) {
                    throw new Error('Дата отложенной публикации не может быть более чем через год');
                }
            }

            return true;
        }),
];

exports.updateNewsValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID новости должен быть положительным числом'),
    body('title')
        .optional()
        .isLength({ min: 5, max: 200 })
        .withMessage('Заголовок должен содержать от 5 до 200 символов'),
    body('content')
        .optional()
        .isLength({ min: 20, max: 50000 })
        .withMessage('Содержание должно содержать от 20 до 50000 символов'),
    body('categoryIds')
        .optional()
        .custom((value) => {
            if (value === undefined || value === null || value === '') {
                return true;
            }

            let categories;
            try {
                if (typeof value === 'string') {
                    categories = value.startsWith('[') ? JSON.parse(value) : value.split(',').map(Number);
                } else if (Array.isArray(value)) {
                    categories = value.map(Number);
                } else {
                    throw new Error('Категории должны быть массивом или строкой JSON');
                }

                if (!categories.every((id) => Number.isInteger(id) && id > 0)) {
                    throw new Error('Каждый ID категории должен быть положительным числом');
                }

                return true;
            } catch (e) {
                throw new Error(`Ошибка обработки категорий: ${e.message}`);
            }
        }),
    body('videoUrl')
        .optional({ checkFalsy: true })
        .custom(isSupportedVideoUrl),
    body('existingMedia')
        .optional()
        .custom((value) => {
            if (value === undefined || value === null || value === '') {
                return true;
            }

            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) {
                    throw new Error('existingMedia должен быть массивом');
                }

                if (!parsed.every(id => Number.isInteger(id) && id > 0)) {
                    throw new Error('Все ID существующих медиафайлов должны быть положительными числами');
                }

                return true;
            } catch (e) {
                if (e instanceof SyntaxError) {
                    throw new Error('existingMedia должен быть валидным JSON массивом');
                }
                throw e;
            }
        }),
    body('publishDate')
        .optional({ checkFalsy: true })
        .isISO8601()
        .withMessage('Дата публикации должна быть в формате ISO8601')
        .custom((value) => {
            if (!value) return true;

            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Неверный формат даты');
            }

            const hundredYearsAgo = new Date();
            hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);

            if (date < hundredYearsAgo) {
                throw new Error('Дата публикации не может быть более 100 лет назад');
            }

            const tenYearsFromNow = new Date();
            tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

            if (date > tenYearsFromNow) {
                throw new Error('Дата публикации не может быть более чем через 10 лет');
            }

            return true;
        }),
];

exports.getNewsByDateValidator = [
    query('date')
        .notEmpty()
        .withMessage('Дата обязательна')
        .isISO8601()
        .withMessage('Дата должна быть в формате ISO8601')
        .custom((value) => {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
                throw new Error('Неверный формат даты');
            }

            const futureLimit = new Date();
            futureLimit.setFullYear(futureLimit.getFullYear() + 1);

            if (date > futureLimit) {
                throw new Error('Дата не может быть более чем через год');
            }

            return true;
        }),
];

exports.getNewsByIdValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID новости должен быть положительным числом'),
];

exports.deleteNewsValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID новости должен быть положительным числом'),
];

exports.validateMediaFiles = (req, res, next) => {
    try {
        if (req.files && req.files.images) {
            const images = req.files.images;

            if (images.length > 5) {
                return res.status(400).json({
                    error: 'Максимально можно загрузить 5 изображений за раз'
                });
            }

            for (const file of images) {
                if (file.size > 10 * 1024 * 1024) { // 10MB
                    return res.status(400).json({
                        error: `Файл ${file.originalname} слишком большой (максимум 10MB)`
                    });
                }

                if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
                    return res.status(400).json({
                        error: `Файл ${file.originalname} имеет неподдерживаемый формат`
                    });
                }
            }
        }

        if (req.files && req.files.avatar) {
            const avatar = req.files.avatar[0];

            if (avatar.size > 5 * 1024 * 1024) { // 5MB
                return res.status(400).json({
                    error: 'Размер аватара не должен превышать 5MB'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Ошибка валидации медиафайлов:', error);
        return res.status(500).json({
            error: 'Ошибка валидации файлов'
        });
    }
};