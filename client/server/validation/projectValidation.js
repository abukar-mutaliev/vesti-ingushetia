const { body, param } = require('express-validator');

exports.createProjectValidator = [
    body('title')
        .notEmpty()
        .withMessage('Заголовок обязателен')
        .isLength({ min: 5 })
        .withMessage('Заголовок должен быть не менее 5 символов'),
    body('content')
        .notEmpty()
        .withMessage('Содержание обязательно')
        .isLength({ min: 20 })
        .withMessage('Содержание должно быть не менее 20 символов'),
    body('videoUrls')
        .optional()
        .toArray()
        .isArray()
        .withMessage('videoUrls должен быть массивом ссылок')
        .bail()
        .custom((urls) => {
            urls.forEach((url) => {
                const rutubeRegex =
                    /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
                const youtubeRegex =
                    /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;
                if (!rutubeRegex.test(url) && !youtubeRegex.test(url)) {
                    throw new Error(
                        'Все видео ссылки должны быть URL от Rutube или YouTube',
                    );
                }
            });
            return true;
        }),
];

exports.updateProjectValidator = [
    param('id').isInt().withMessage('ID проекта должен быть числом'),
    body('title')
        .optional()
        .isLength({ min: 5 })
        .withMessage('Заголовок должен быть не менее 5 символов'),
    body('content')
        .optional()
        .isLength({ min: 20 })
        .withMessage('Содержание должно быть не менее 20 символов'),
    body('videoUrls')
        .optional()
        .toArray()
        .isArray()
        .withMessage('videoUrls должен быть массивом ссылок')
        .bail()
        .custom((urls) => {
            urls.forEach((url) => {
                const rutubeRegex =
                    /^https?:\/\/(?:www\.)?rutube\.ru\/video\/[A-Za-z0-9_-]+\/?$/;
                const youtubeRegex =
                    /^https?:\/\/(?:www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]+/;
                if (!rutubeRegex.test(url) && !youtubeRegex.test(url)) {
                    throw new Error(
                        'Все видео ссылки должны быть URL от Rutube или YouTube',
                    );
                }
            });
            return true;
        }),
];

exports.getProjectByIdValidator = [
    param('id').isInt().withMessage('ID проекта должен быть числом'),
];

exports.deleteProjectValidator = [
    param('id').isInt().withMessage('ID проекта должен быть числом'),
];
