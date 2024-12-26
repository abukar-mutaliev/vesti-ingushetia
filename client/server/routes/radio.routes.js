const express = require('express');
const router = express.Router();
const radioController = require('../controllers/radio.controller');
const {
    uploadAudio,
    handleMulterErrors,
} = require('../middlewares/uploadAudio.middleware');
const { authenticateAdmin } = require('../middlewares/auth.middleware');

const {
    createRadioValidation,
    updateRadioValidation,
    getRadioByIdValidation,
    deleteRadioValidation,
} = require('../validation/radioValidation');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    uploadAudio,
    handleMulterErrors,
    createRadioValidation,
    validate,
    radioController.createRadio,
);

router.get('/all', radioController.getAllRadios);

router.get(
    '/:id',
    getRadioByIdValidation,
    validate,
    radioController.getRadioById,
);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    uploadAudio,
    handleMulterErrors,
    updateRadioValidation,
    validate,
    radioController.updateRadio,
);

router.delete(
    '/delete/:id',
    authenticateAdmin,
    csrfProtection,
    deleteRadioValidation,
    validate,
    radioController.deleteRadio,
);

module.exports = router;
