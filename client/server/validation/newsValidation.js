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
    body('categoryId')
        .notEmpty()
        .withMessage('ID категории обязателен')
        .isInt()
        .withMessage('ID категории должен быть числом'),
    body('videoUrl').optional().custom(isSupportedVideoUrl),
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
    body('categoryId')
        .optional()
        .isInt()
        .withMessage('ID категории должен быть числом'),
    body('videoUrl').optional().custom(isSupportedVideoUrl),
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
