const { body, param } = require('express-validator');

exports.createRadioValidation = [
    body('title')
        .notEmpty()
        .withMessage('Название обязательно')
        .isLength({ max: 100 })
        .withMessage('Название не должно превышать 100 символов'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Описание не должно превышать 500 символов'),
];

exports.updateRadioValidation = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID должен быть положительным целым числом'),
    body('title')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Название не должно превышать 100 символов'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Описание не должно превышать 500 символов'),
];

exports.getRadioByIdValidation = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID должен быть положительным целым числом'),
];

exports.deleteRadioValidation = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID должен быть положительным целым числом'),
];
