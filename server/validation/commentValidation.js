const { body, param } = require('express-validator');

exports.createCommentValidation = [
    body('content')
        .notEmpty()
        .withMessage('Содержимое комментария обязательно')
        .isLength({ max: 1000 })
        .withMessage('Комментарий не должен превышать 1000 символов'),
    body('newsId')
        .notEmpty()
        .withMessage('ID новости обязателен')
        .isInt({ gt: 0 })
        .withMessage('ID новости должен быть положительным целым числом'),
    body('authorName')
        .notEmpty()
        .withMessage('Имя автора обязательно')
        .isLength({ max: 100 })
        .withMessage('Имя автора не должно превышать 100 символов'),
];

exports.replyToCommentValidation = [
    param('parentCommentId')
        .isInt({ gt: 0 })
        .withMessage(
            'ID родительского комментария должен быть положительным целым числом',
        ),
    body('content')
        .notEmpty()
        .withMessage('Содержимое ответа обязательно')
        .isLength({ max: 1000 })
        .withMessage('Ответ не должен превышать 1000 символов'),
    body('authorName')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Имя автора не должно превышать 100 символов'),
];

exports.getCommentsForNewsValidation = [
    param('newsId')
        .isInt({ gt: 0 })
        .withMessage('ID новости должен быть положительным целым числом'),
];

exports.deleteCommentValidation = [
    param('commentId')
        .isInt({ gt: 0 })
        .withMessage('ID комментария должен быть положительным целым числом'),
];

exports.likeCommentValidation = [
    param('commentId')
        .isInt({ gt: 0 })
        .withMessage('ID комментария должен быть положительным целым числом'),
];
