const express = require('express');
const router = express.Router();
const videoAdController = require('../controllers/videoAd.controller');
const {
    uploadVideo,
    handleMulterErrors,
} = require('../middlewares/uploadVideo.middleware');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

const {
    createVideoAdValidator,
    updateVideoAdValidator,
    getVideoAdByIdValidator,
    deleteVideoAdValidator,
    toggleVideoAdStatusValidator,
} = require('../validation/videoAdValidation');

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    uploadVideo,
    createVideoAdValidator,
    validate,
    handleMulterErrors,
    videoAdController.createVideoAd,
);

router.get('/all-active', videoAdController.getAllActiveVideoAds);

router.get('/all', videoAdController.getVideoAds);

router.get(
    '/:id',
    getVideoAdByIdValidator,
    validate,
    videoAdController.getVideoAdById,
);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    uploadVideo,
    updateVideoAdValidator,
    validate,
    handleMulterErrors,
    videoAdController.updateVideoAd,
);

router.delete(
    '/delete/:id',
    authenticateAdmin,
    csrfProtection,
    deleteVideoAdValidator,
    validate,
    videoAdController.deleteVideoAd,
);

router.patch(
    '/pause/:id',
    authenticateAdmin,
    csrfProtection,
    toggleVideoAdStatusValidator,
    validate,
    videoAdController.pauseVideoAd,
);

router.patch(
    '/activate/:id',
    authenticateAdmin,
    csrfProtection,
    toggleVideoAdStatusValidator,
    validate,
    videoAdController.activeVideoAd,
);

module.exports = router;
