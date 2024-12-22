const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { upload } = require('../middlewares/uploads.middleware');
const {
    authenticateAdmin,
    authenticateToken,
} = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

const {
    registerUserValidator,
    loginUserValidator,
    updateUserValidator,
    updateUserRoleValidator,
    updateAvatarValidator,
    refreshTokenValidator,
} = require('../validation/userValidation');

router.post(
    '/register',
    csrfProtection,
    registerUserValidator,
    validate,
    userController.registerUser,
);

router.post('/login', loginUserValidator, validate, userController.loginUser);

router.put(
    '/:id/role',
    authenticateAdmin,
    csrfProtection,
    updateUserRoleValidator,
    validate,
    userController.updateUserRole,
);

router.put(
    '/update/:id',
    authenticateToken,
    csrfProtection,
    upload,
    updateUserValidator,
    validate,
    userController.updateUser,
);

router.post('/logout', userController.logOutUser);

router.get('/all', userController.getAllUsers);

router.get('/replies', authenticateToken, userController.getUserReplies);

router.get('/profile', authenticateToken, userController.getUserProfile);

router.put(
    '/update-avatar',
    authenticateToken,
    csrfProtection,
    upload,
    updateAvatarValidator,
    validate,
    userController.updateAvatar,
);

router.post(
    '/refresh',
    csrfProtection,
    refreshTokenValidator,
    validate,
    userController.refreshToken,
);

router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

module.exports = router;
