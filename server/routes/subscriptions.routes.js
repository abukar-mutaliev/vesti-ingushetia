const express = require('express');
const router = express.Router();
const SubscriptionsController = require('../controllers/subscription.controller');
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post('/add', authenticateToken, SubscriptionsController.createSubscription);

router.get('/user/:userId', authenticateToken, SubscriptionsController.getUserSubscriptions);

router.delete('/delete/:subscriptionId', authenticateToken, SubscriptionsController.deleteSubscription);

module.exports = router;
