const { body } = require('express-validator');

const { param } = require('express-validator');
const { ELECTION_PDF_DOCUMENT_KEYS } = require('../constants/electionPdfDocuments');

exports.uploadPdfValidation = [
    param('documentKey')
        .isIn(ELECTION_PDF_DOCUMENT_KEYS)
        .withMessage('Неверный тип PDF-документа'),
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
