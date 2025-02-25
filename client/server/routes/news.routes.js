const express = require('express');
const router = express.Router();
const csrfProtection = require('../middlewares/csrfProtection.middleware');

const {
    createNews,
    getAllNews,
    getNewsById,
    getNewsByDate,
    updateNews,
    deleteNews,
} = require('../controllers/news.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const {
    handleMulterErrors,
    upload,
} = require('../middlewares/uploads.middleware');
const { validate } = require('../middlewares/validation.middleware');

const {
    createNewsValidator,
    updateNewsValidator,
    getNewsByDateValidator,
    getNewsByIdValidator,
    deleteNewsValidator,
} = require('../validation/newsValidation');

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    upload,
    createNewsValidator,
    validate,
    handleMulterErrors,
    createNews,
);

router.get('/all', getAllNews);

router.get('/date', validate, getNewsByDateValidator, getNewsByDate);

router.get('/:id', (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.includes('YandexBot') || userAgent.includes('bot')) {
        console.log('Обнаружен бот для API-запроса новости:', req.params.id);

        req.isBot = true;
    }
    next();
}, getNewsByIdValidator, validate, getNewsById);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    upload,
    updateNewsValidator,
    validate,
    handleMulterErrors,
    updateNews,
);

router.delete(
    '/delete/:id',
    authenticateAdmin,
    csrfProtection,
    deleteNewsValidator,
    validate,
    deleteNews,
);

module.exports = router;
