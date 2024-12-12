const express = require('express');
const router = express.Router();
const RatingsController = require('../controllers/rating.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

router.post(
    '/add',
    authenticateToken,
    csrfProtection,
    RatingsController.createRating,
);

router.get('/news/:newsId', RatingsController.getNewsRatings);

router.delete(
    '/delete/:ratingId',
    authenticateToken,
    csrfProtection,
    RatingsController.deleteRating,
);

module.exports = router;
