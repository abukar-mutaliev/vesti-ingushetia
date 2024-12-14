const { body, param } = require('express-validator');

exports.createVideoAdValidator = [
    body('title')
        .notEmpty()
        .withMessage('Название обязательно')
        .isString()
        .withMessage('Название должно быть строкой'),
    body('expirationDate')
        .notEmpty()
        .withMessage('Дата истечения обязательна')
        .isISO8601()
        .withMessage('Дата истечения должна быть в формате ISO8601'),
    body('description')
        .optional()
        .isString()
        .withMessage('Описание должно быть строкой'),
];

exports.updateVideoAdValidator = [
    param('id').isInt().withMessage('ID видеообъявления должен быть числом'),
    body('title')
        .optional()
        .isString()
        .withMessage('Название должно быть строкой'),
    body('description')
        .optional()
        .isString()
        .withMessage('Описание должно быть строкой'),
    body('expirationDate')
        .optional()
        .isISO8601()
        .withMessage('Дата истечения должна быть в формате ISO8601'),
    body('status')
        .optional()
        .isIn(['active', 'paused'])
        .withMessage("Статус должен быть 'active' или 'paused'"),
];

exports.getVideoAdByIdValidator = [
    param('id').isInt().withMessage('ID видеообъявления должен быть числом'),
];

exports.deleteVideoAdValidator = [
    param('id').isInt().withMessage('ID видеообъявления должен быть числом'),
];

exports.toggleVideoAdStatusValidator = [
    param('id').isInt().withMessage('ID видеообъявления должен быть числом'),
];
