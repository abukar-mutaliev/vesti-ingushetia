const express = require('express');
const router = express.Router();
const {
    getMediaFile,
    getRutubeThumbnail,
    getVkThumbnail,
} = require('../controllers/media.controller');

router.get('/video-thumbnail/rutube/:videoId', getRutubeThumbnail);
router.get('/video-thumbnail/vk/:oid/:id', getVkThumbnail);
router.get('/:type/:filename', getMediaFile);

module.exports = router;
