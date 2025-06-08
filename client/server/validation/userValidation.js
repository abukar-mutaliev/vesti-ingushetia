const { body, param, cookie } = require('express-validator');

const FORBIDDEN_USERNAMES = [
    'admin', 'administrator', 'root', 'system', 'api', 'null', 'undefined',
    'test', 'guest', 'anonymous', 'user', 'moderator', 'support'
];

const sanitizeInput = (value) => {
    if (typeof value !== 'string') return value;

    const dangerous = [
        '<script',
        '</script>',
        'javascript:',
        'onload=',
        'onerror=',
        'SELECT ',
        'INSERT ',
        'UPDATE ',
        'DELETE ',
        'DROP ',
        'UNION ',
        '--',
        ';--',
        'xp_',
        'sp_'
    ];

    let cleaned = value;
    dangerous.forEach(pattern => {
        while (cleaned.toLowerCase().includes(pattern.toLowerCase())) {
            cleaned = cleaned.toLowerCase().replace(pattern.toLowerCase(), '');
        }
    });

    return cleaned.trim();
};

const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase &&
        hasNumbers && hasSpecialChar;
};

const isValidUsername = (username) => {
    const lowercaseUsername = username.toLowerCase();
    return !FORBIDDEN_USERNAMES.includes(lowercaseUsername);
};

exports.registerUserValidator = [
    body('username')
        .notEmpty()
        .withMessage('Имя пользователя обязательно')
        .isLength({ min: 3, max: 30 })
        .withMessage('Имя пользователя должно содержать от 3 до 30 символов')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Имя пользователя может содержать только буквы, цифры и символ подчеркивания')
        .custom((value) => {
            const sanitized = sanitizeInput(value);
            if (sanitized !== value) {
                throw new Error('Имя пользователя содержит недопустимые символы');
            }
            if (!isValidUsername(value)) {
                throw new Error('Данное имя пользователя запрещено');
            }
            return true;
        }),

    body('email')
        .notEmpty()
        .withMessage('Email обязателен')
        .isEmail()
        .withMessage('Некорректный формат email')
        .normalizeEmail()
        .isLength({ max: 254 })
        .withMessage('Email слишком длинный')
        .custom((value) => {
            const sanitized = sanitizeInput(value);
            if (sanitized !== value) {
                throw new Error('Email содержит недопустимые символы');
            }
            return true;
        }),

    body('password')
        .notEmpty()
        .withMessage('Пароль обязателен')
        .isLength({ min: 8, max: 128 })
        .withMessage('Пароль должен содержать от 8 до 128 символов')
        .custom((value) => {
            if (!isStrongPassword(value)) {
                throw new Error('Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы');
            }
            return true;
        }),
];

exports.loginUserValidator = [
    body('email')
        .notEmpty()
        .withMessage('Email обязателен')
        .isEmail()
        .withMessage('Некорректный формат email')
        .normalizeEmail()
        .custom((value) => {
            const sanitized = sanitizeInput(value);
            if (sanitized !== value) {
                throw new Error('Email содержит недопустимые символы');
            }
            return true;
        }),

    body('password')
        .notEmpty()
        .withMessage('Пароль обязателен')
        .isLength({ min: 1, max: 128 })
        .withMessage('Пароль не может быть пустым или слишком длинным'),
];

exports.updateUserValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID пользователя должен быть положительным числом')
        .toInt(),

    body('username')
        .optional()
        .isLength({ min: 3, max: 30 })
        .withMessage('Имя пользователя должно содержать от 3 до 30 символов')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Имя пользователя может содержать только буквы, цифры и символ подчеркивания')
        .custom((value) => {
            if (value) {
                const sanitized = sanitizeInput(value);
                if (sanitized !== value) {
                    throw new Error('Имя пользователя содержит недопустимые символы');
                }
                if (!isValidUsername(value)) {
                    throw new Error('Данное имя пользователя запрещено');
                }
            }
            return true;
        }),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Некорректный формат email')
        .normalizeEmail()
        .isLength({ max: 254 })
        .withMessage('Email слишком длинный')
        .custom((value) => {
            if (value) {
                const sanitized = sanitizeInput(value);
                if (sanitized !== value) {
                    throw new Error('Email содержит недопустимые символы');
                }
            }
            return true;
        }),
];

exports.updateUserRoleValidator = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID пользователя должен быть положительным числом')
        .toInt(),

    body('isAdmin')
        .notEmpty()
        .withMessage('Роль обязательна')
        .isBoolean()
        .withMessage('Роль должна быть булевым значением')
        .toBoolean(),
];

exports.updateAvatarValidator = [
    body('avatar')
        .optional()
        .isString()
        .withMessage('Файл аватара должен быть строкой'),
];

exports.refreshTokenValidator = [
    cookie('refresh_token')
        .notEmpty()
        .withMessage('Refresh token обязателен')
        .isJWT()
        .withMessage('Некорректный формат refresh token'),
];

exports.registerAdminValidator = [
    body('username')
        .notEmpty()
        .withMessage('Имя пользователя обязательно')
        .isLength({ min: 3, max: 30 })
        .withMessage('Имя пользователя должно содержать от 3 до 30 символов')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Имя пользователя может содержать только буквы, цифры и символ подчеркивания')
        .custom((value) => {
            const sanitized = sanitizeInput(value);
            if (sanitized !== value) {
                throw new Error('Имя пользователя содержит недопустимые символы');
            }
            return true;
        }),

    body('email')
        .notEmpty()
        .withMessage('Email обязателен')
        .isEmail()
        .withMessage('Некорректный формат email')
        .normalizeEmail()
        .custom((value) => {
            const sanitized = sanitizeInput(value);
            if (sanitized !== value) {
                throw new Error('Email содержит недопустимые символы');
            }
            return true;
        }),

    body('password')
        .notEmpty()
        .withMessage('Пароль обязателен')
        .isLength({ min: 10, max: 128 })
        .withMessage('Пароль администратора должен содержать минимум 10 символов')
        .custom((value) => {
            if (!isStrongPassword(value)) {
                throw new Error('Пароль администратора должен быть особенно сильным: минимум 10 символов, заглавные и строчные буквы, цифры и специальные символы');
            }
            return true;
        }),
];

exports.changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Текущий пароль обязателен'),

    body('newPassword')
        .notEmpty()
        .withMessage('Новый пароль обязателен')
        .isLength({ min: 8, max: 128 })
        .withMessage('Новый пароль должен содержать от 8 до 128 символов')
        .custom((value) => {
            if (!isStrongPassword(value)) {
                throw new Error('Новый пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы');
            }
            return true;
        }),

    body('confirmPassword')
        .notEmpty()
        .withMessage('Подтверждение пароля обязательно')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Пароли не совпадают');
            }
            return true;
        }),
];