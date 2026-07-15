const express = require('express');
const router = express.Router();
const electionsController = require('../controllers/elections.controller');
const newsController = require('../controllers/news.controller');
const {
    uploadPdf,
    handleMulterErrors: handlePdfMulterErrors,
} = require('../middlewares/uploadPdf.middleware');
const {
    uploadBanner,
    handleMulterErrors: handleBannerMulterErrors,
} = require('../middlewares/uploadElectionBanner.middleware');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const {
    uploadPdfValidation,
    updateBannerValidation,
    uploadBannerValidation,
} = require('../validation/electionsValidation');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

router.get('/pdf', electionsController.getElectionPdfs);

router.get('/news', newsController.getElectionsNews);

router.put(
    '/pdf/:documentKey',
    authenticateAdmin,
    csrfProtection,
    uploadPdf,
    handlePdfMulterErrors,
    uploadPdfValidation,
    validate,
    electionsController.uploadOrReplacePdf,
);

router.delete(
    '/pdf/:documentKey',
    authenticateAdmin,
    csrfProtection,
    electionsController.deletePdf,
);

router.get('/banner', electionsController.getCurrentBanner);

router.patch(
    '/banner',
    authenticateAdmin,
    csrfProtection,
    updateBannerValidation,
    validate,
    electionsController.updateBannerSettings,
);

router.put(
    '/banner/image',
    authenticateAdmin,
    csrfProtection,
    uploadBanner,
    handleBannerMulterErrors,
    uploadBannerValidation,
    validate,
    electionsController.uploadOrReplaceBanner,
);

router.delete(
    '/banner/image',
    authenticateAdmin,
    csrfProtection,
    electionsController.deleteBannerImage,
);

module.exports = router;
