const { body } = require('express-validator');

exports.uploadPdfValidation = [];

exports.updateBannerValidation = [
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Заголовок не может быть пустым')
        .isLength({ max: 100 })
        .withMessage('Заголовок не должен превышать 100 символов'),
    body('isVisible')
        .optional()
        .isBoolean()
        .withMessage('Поле isVisible должно быть булевым значением')
        .toBoolean(),
];

exports.uploadBannerValidation = [];
