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
    cleanupOrphanedFiles,
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

router.post(
    '/schedule',
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

router.get('/:id', getNewsByIdValidator, validate, getNewsById);

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

router.post(
    '/cleanup-files',
    authenticateAdmin,
    csrfProtection,
    cleanupOrphanedFiles,
);

module.exports = router;
