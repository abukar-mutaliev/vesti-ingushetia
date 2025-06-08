const { body, param, query } = require('express-validator');

const isSupportedVideoUrl = (value) => {
    if (!value) return true;

    const rutubeRegex =
        /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
    const youtubeRegex =
        /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;

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
            
            // Проверяем, что дата не слишком далеко в будущем (например, не более года)
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
    param('id').isInt().withMessage('ID новости должен быть числом'),
    body('title')
    .optional()
    .isLength({ min: 5 })
    .withMessage('Заголовок должен содержать не менее 5 символов'),
    body('content')
    .optional()
    .isLength({ min: 20 })
    .withMessage('Содержание должно содержать не менее 20 символов'),
    body('categoryIds')
    .optional()
    .custom((value) => {
        let categories;
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
    }),
    body('videoUrl').optional().custom(isSupportedVideoUrl),
    body('publishDate')
    .optional()
    .isISO8601()
    .withMessage('Дата публикации должна быть в формате ISO8601'),
];

exports.getNewsByDateValidator = [
    query('date')
    .notEmpty()
    .withMessage('Дата обязательна')
    .isISO8601()
    .withMessage('Дата должна быть в формате ISO8601'),
];

exports.getNewsByIdValidator = [
    param('id').isInt().withMessage('ID новости должен быть числом'),
];

exports.deleteNewsValidator = [
    param('id').isInt().withMessage('ID новости должен быть числом'),
];
