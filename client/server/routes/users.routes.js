const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { upload, postUploadValidation, handleMulterErrors, logUploadAttempts} = require('../middlewares/uploads.middleware');
const {
    authenticateAdmin,
    authenticateToken,
} = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');
const rateLimit = require('express-rate-limit');

const {
    bruteForceProtection,
    suspiciousIPSlowdown,
    adminActionLimiter,
    registrationLimiter,
    detectSuspiciousPatterns,
    geoLocationCheck,
    logFailedRequests,
    getSecurityStats
} = require('../middlewares/securityProtection.middleware');

const {
    registerUserValidator,
    loginUserValidator,
    updateUserValidator,
    updateUserRoleValidator,
    updateAvatarValidator,
    refreshTokenValidator,
    registerAdminValidator,
    changePasswordValidator,
} = require('../validation/userValidation');

router.use(detectSuspiciousPatterns);
router.use(geoLocationCheck);
router.use(logFailedRequests);
router.use(suspiciousIPSlowdown);

const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Слишком много запросов к пользовательским данным. Попробуйте позже.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:${req.get('User-Agent') || 'unknown'}`;
    }
});

const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Слишком много попыток входа. Попробуйте позже.'
    },
    skipSuccessfulRequests: true,
});

const logSuspiciousActivity = (req, res, next) => {
    const sensitiveEndpoints = ['/all', '/register', '/login', '/:id/role', '/security-stats'];
    const isSensitive = sensitiveEndpoints.some(endpoint =>
        req.route?.path === endpoint || req.path.includes('/role') || req.path.includes('/security')
    );

    if (isSensitive) {
        console.log(`[SECURITY] Запрос к чувствительному эндпоинту: ${req.method} ${req.path}`, {
            userId: req.user?.id || 'anonymous',
            isAdmin: req.user?.isAdmin || false,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            referer: req.get('Referer') || 'direct'
        });
    }
    next();
};

router.use(logSuspiciousActivity);

router.post(
    '/register',
    registrationLimiter,
    csrfProtection,
    registerUserValidator,
    validate,
    userController.registerUser,
);

router.post(
    '/login',
    authRateLimit,
    bruteForceProtection,
    loginUserValidator,
    validate,
    userController.loginUser
);

router.post(
    '/refresh',
    authRateLimit,
    csrfProtection,
    refreshTokenValidator,
    validate,
    userController.refreshToken,
);

router.post('/logout', userController.logOutUser);

router.get('/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

router.get(
    '/profile',
    authenticateToken,
    userController.getUserProfile
);

router.get(
    '/replies',
    authenticateToken,
    userController.getUserReplies
);

router.put(
    '/update/:id',
    authenticateToken,
    csrfProtection,
    logUploadAttempts,
    upload,
    handleMulterErrors,
    postUploadValidation,
    updateUserValidator,
    validate,
    userController.updateUser,
);

router.put(
    '/update-avatar',
    authenticateToken,
    csrfProtection,
    logUploadAttempts,
    upload,
    handleMulterErrors,
    postUploadValidation,
    updateAvatarValidator,
    validate,
    userController.updateAvatar,
);

router.put(
    '/change-password',
    authenticateToken,
    csrfProtection,
    changePasswordValidator,
    validate,
    userController.changePassword,
);

router.get(
    '/all',
    strictRateLimit,
    authenticateAdmin,
    adminActionLimiter,
    csrfProtection,
    userController.getAllUsers
);

router.post(
    '/register-admin',
    strictRateLimit,
    authenticateAdmin,
    adminActionLimiter,
    csrfProtection,
    registerAdminValidator,
    validate,
    userController.registerAdmin,
);

router.put(
    '/:id/role',
    strictRateLimit,
    authenticateAdmin,
    adminActionLimiter,
    csrfProtection,
    updateUserRoleValidator,
    validate,
    userController.updateUserRole,
);

router.get(
    '/security-stats',
    strictRateLimit,
    authenticateAdmin,
    adminActionLimiter,
    csrfProtection,
    getSecurityStats
);

router.use((req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
        if (data && typeof data === 'object') {
            const dataStr = JSON.stringify(data);
            const dangerousFields = ['password', 'passwordHash', 'resetToken', 'refreshToken'];

            for (const field of dangerousFields) {
                if (dataStr.includes(`"${field}"`)) {
                    console.error(`[CRITICAL SECURITY ALERT] Обнаружена попытка отправки ${field} в ответе!`, {
                        endpoint: req.path,
                        method: req.method,
                        userId: req.user?.id,
                        ip: req.ip,
                        timestamp: new Date().toISOString(),
                        stackTrace: new Error().stack
                    });

                    return originalJson.call(this, {
                        error: 'Внутренняя ошибка сервера'
                    });
                }
            }
        }

        return originalJson.call(this, data);
    };

    next();
});


router.use((err, req, res, next) => {
    console.error(`[SECURITY] Ошибка в пользовательском роуте: ${err.message}`, {
        endpoint: req.path,
        method: req.method,
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        timestamp: new Date().toISOString(),
        stack: err.stack
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.status(500).json({
        error: isProduction ? 'Внутренняя ошибка сервера' : err.message
    });
});

module.exports = router;