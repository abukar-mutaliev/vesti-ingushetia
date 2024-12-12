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
];

exports.getProjectByIdValidator = [
    param('id').isInt().withMessage('ID проекта должен быть числом'),
];

exports.deleteProjectValidator = [
    param('id').isInt().withMessage('ID проекта должен быть числом'),
];
