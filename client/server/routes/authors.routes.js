const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcast.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

const {
    createBroadcastValidation,
    updateBroadcastValidation,
    getBroadcastByIdValidation,
    deleteBroadcastValidation,
} = require('../validation/broadcastValidation');

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    createBroadcastValidation,
    validate,
    broadcastController.createBroadcast,
);

router.get('/all', broadcastController.getAllBroadcasts);

router.get(
    '/:id',
    authenticateAdmin,
    getBroadcastByIdValidation,
    validate,
    broadcastController.getBroadcastById,
);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
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
