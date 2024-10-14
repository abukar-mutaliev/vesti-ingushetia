const express = require('express');
const router = express.Router();
const TagsController = require('../controllers/tag.controller');
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post('/add', authenticateToken, authenticateToken, TagsController.createTag);

router.get('/', TagsController.getAllTags);

router.delete('/delete/:tagId', authenticateToken, TagsController.deleteTag);

module.exports = router;
