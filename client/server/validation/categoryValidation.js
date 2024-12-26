const { body, param } = require('express-validator');

exports.addCategoryValidation = [
    body('name')
        .notEmpty()
        .withMessage('Название категории обязательно')
        .isLength({ max: 100 })
        .withMessage('Название категории не должно превышать 100 символов'),
];

exports.updateCategoryValidation = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID категории должен быть положительным целым числом'),
    body('name')
        .optional()
        .notEmpty()
        .withMessage('Название категории не может быть пустым')
        .isLength({ max: 100 })
        .withMessage('Название категории не должно превышать 100 символов'),
    body('categoryIds')
    .isArray({ min: 1 })
    .withMessage('Категории должны быть переданы в виде массива')
    .custom((value) => value.every((id) => Number.isInteger(id)))
    .withMessage('Каждый элемент массива категорий должен быть числом')

];

exports.getNewsByCategoryValidation = [
    param('categoryId')
        .isInt({ gt: 0 })
        .withMessage('ID категории должен быть положительным целым числом'),
];

exports.deleteCategoryValidation = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('ID категории должен быть положительным целым числом'),
];
