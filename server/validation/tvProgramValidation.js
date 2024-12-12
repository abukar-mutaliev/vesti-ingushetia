const { body, param } = require('express-validator');

exports.createTvProgramValidator = [
    body('program')
        .notEmpty()
        .withMessage('Поле программы обязательно')
        .isString()
        .withMessage('Поле программы должно быть строкой'),
];

exports.updateTvProgramValidator = [
    param('id').isInt().withMessage('ID программы должен быть числом'),
    body('program')
        .optional()
        .isString()
        .withMessage('Поле программы должно быть строкой'),
];

exports.getTvProgramByIdValidator = [
    param('id').isInt().withMessage('ID программы должен быть числом'),
];

exports.deleteTvProgramValidator = [
    param('id').isInt().withMessage('ID программы должен быть числом'),
];
