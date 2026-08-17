const { body, param } = require('express-validator');

exports.createPdfValidation = [
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Название документа не может быть пустым')
        .isLength({ max: 500 })
        .withMessage('Название не должно превышать 500 символов'),
];

exports.uploadPdfValidation = [
    param('id').isInt({ min: 1 }).withMessage('Неверный идентификатор PDF'),
    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Название документа не может быть пустым')
        .isLength({ max: 500 })
        .withMessage('Название не должно превышать 500 символов'),
];

exports.updatePdfTitleValidation = [
    param('id').isInt({ min: 1 }).withMessage('Неверный идентификатор PDF'),
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Название документа обязательно')
        .isLength({ max: 500 })
        .withMessage('Название не должно превышать 500 символов'),
];

exports.deletePdfValidation = [
    param('id').isInt({ min: 1 }).withMessage('Неверный идентификатор PDF'),
];

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
