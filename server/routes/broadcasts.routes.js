const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcast.controller');
const {
    uploadAudio,
    handleMulterErrors,
} = require('../middlewares/uploadAudio.middleware');
const { authenticateAdmin } = require('../middlewares/auth.middleware');

const {
    createBroadcastValidation,
    updateBroadcastValidation,
    getBroadcastByIdValidation,
    deleteBroadcastValidation,
} = require('../validation/broadcastValidation');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    uploadAudio,
    handleMulterErrors,
    createBroadcastValidation,
    validate,
    broadcastController.createBroadcast,
);

router.get('/all', broadcastController.getAllBroadcasts);

router.get(
    '/:id',
    getBroadcastByIdValidation,
    validate,
    broadcastController.getBroadcastById,
);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    uploadAudio,
    handleMulterErrors,
    updateBroadcastValidation,
    validate,
    broadcastController.updateBroadcast,
);

router.delete(
    '/delete/:id',
    authenticateAdmin,
    csrfProtection,
    deleteBroadcastValidation,
    validate,
    broadcastController.deleteBroadcast,
);

module.exports = router;
