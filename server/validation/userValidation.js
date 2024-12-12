const { body, param, cookie } = require('express-validator');

exports.registerUserValidator = [
    body('username')
        .notEmpty()
        .withMessage('Имя пользователя обязательно')
        .isLength({ min: 3 })
        .withMessage('Имя пользователя должно содержать не менее 3 символов'),
    body('email')
        .notEmpty()
        .withMessage('Email обязателен')
        .isEmail()
        .withMessage('Некорректный формат email'),
    body('password')
        .notEmpty()
        .withMessage('Пароль обязателен')
        .isLength({ min: 6 })
        .withMessage('Пароль должен содержать не менее 6 символов'),
];

exports.loginUserValidator = [
    body('email')
        .notEmpty()
        .withMessage('Email обязателен')
        .isEmail()
        .withMessage('Некорректный формат email'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
];

exports.updateUserValidator = [
    param('id').isInt().withMessage('ID пользователя должен быть числом'),
    body('username')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Имя пользователя должно содержать не менее 3 символов'),
    body('email').optional().isEmail().withMessage('Некорректный формат email'),
];

exports.updateUserRoleValidator = [
    param('id').isInt().withMessage('ID пользователя должен быть числом'),
    body('isAdmin')
        .notEmpty()
        .withMessage('Роль обязательна')
        .isBoolean()
        .withMessage('Роль должна быть булевым значением'),
];

exports.updateAvatarValidator = [
    body('avatar')
        .optional()
        .isString()
        .withMessage('Файл аватара должен быть строкой'),
];

exports.refreshTokenValidator = [
    cookie('refresh_token').notEmpty().withMessage('Refresh token обязателен'),
];
