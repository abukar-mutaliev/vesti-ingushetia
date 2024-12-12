const express = require('express');
const router = express.Router();
const ProfilesController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

router.post(
    '/add',
    authenticateToken,
    csrfProtection,
    ProfilesController.createProfile,
);

router.get('/:id', authenticateToken, ProfilesController.getProfileById);

router.put(
    '/update/:id',
    authenticateToken,
    csrfProtection,
    ProfilesController.updateProfile,
);

router.delete(
    '/delete/:id',
    authenticateToken,
    csrfProtection,
    ProfilesController.deleteProfile,
);

module.exports = router;
