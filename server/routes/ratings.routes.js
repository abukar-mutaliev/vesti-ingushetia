const express = require('express');
const router = express.Router();
const RatingsController = require('../controllers/rating.controller');
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post('/add', authenticateToken, RatingsController.createRating);

router.get('/news/:newsId', RatingsController.getNewsRatings);

router.delete('/delete/:ratingId', authenticateToken, RatingsController.deleteRating);

module.exports = router;
