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
    createPdfValidation,
    uploadPdfValidation,
    updatePdfTitleValidation,
    deletePdfValidation,
    updateBannerValidation,
    uploadBannerValidation,
} = require('../validation/electionsValidation');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

router.get('/pdf', electionsController.getElectionPdfs);

router.get('/news', newsController.getElectionsNews);

router.post(
    '/pdf',
    authenticateAdmin,
    csrfProtection,
    uploadPdf,
    handlePdfMulterErrors,
    createPdfValidation,
    validate,
    electionsController.createElectionPdf,
);

router.put(
    '/pdf/:id',
    authenticateAdmin,
    csrfProtection,
    uploadPdf,
    handlePdfMulterErrors,
    uploadPdfValidation,
    validate,
    electionsController.uploadOrReplacePdf,
);

router.patch(
    '/pdf/:id',
    authenticateAdmin,
    csrfProtection,
    updatePdfTitleValidation,
    validate,
    electionsController.updateElectionPdfTitle,
);

router.delete(
    '/pdf/:id',
    authenticateAdmin,
    csrfProtection,
    deletePdfValidation,
    validate,
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
