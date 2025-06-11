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
    debugScheduledNews,
} = require('../controllers/news.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const {
    handleMulterErrors,
    upload,
    postUploadValidation,
    logUploadAttempts
} = require('../middlewares/uploads.middleware');
const { validate } = require('../middlewares/validation.middleware');

const {
    createNewsValidator,
    updateNewsValidator,
    getNewsByDateValidator,
    getNewsByIdValidator,
    deleteNewsValidator,
} = require('../validation/newsValidation');

const logNewsOperation = (operation) => (req, res, next) => {
    console.log(`📰 ${operation} новости:`, {
        userId: req.user?.id,
        newsId: req.params?.id,
        hasFiles: !!(req.files || req.file),
        timestamp: new Date().toISOString()
    });
    next();
};

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    logNewsOperation('Создание'),
    logUploadAttempts,
    upload,
    handleMulterErrors,
    postUploadValidation,
    createNewsValidator,
    validate,
    createNews,
);

router.post(
    '/schedule',
    authenticateAdmin,
    csrfProtection,
    logNewsOperation('Планирование'),
    logUploadAttempts,
    upload,
    handleMulterErrors,
    postUploadValidation,
    createNewsValidator,
    validate,
    createNews,
);

router.get('/all', getAllNews);

router.get('/date', getNewsByDateValidator, validate, getNewsByDate);

router.get('/:id', getNewsByIdValidator, validate, getNewsById);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    logNewsOperation('Обновление'),
    logUploadAttempts,
    upload,
    handleMulterErrors,
    postUploadValidation,
    updateNewsValidator,
    validate,
    updateNews,
);

router.delete(
    '/delete/:id',
    authenticateAdmin,
    csrfProtection,
    logNewsOperation('Удаление'),
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

router.get(
    '/debug-scheduled',
    authenticateAdmin,
    debugScheduledNews,
);

module.exports = router;