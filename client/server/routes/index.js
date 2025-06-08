const { Router } = require('express');

const router = Router();

router.use('/categories', require('./categories.routes'));

router.use('/news', require('./news.routes'));

router.use('/scheduled-news', require('./scheduledNews.routes'));

router.use('/users', require('./users.routes'));

router.use('/comments', require('./comments.routes'));

router.use('/ratings', require('./ratings.routes'));

router.use('/profile', require('./profiles.routes'));

router.use('/radio', require('./radio.routes'));

router.use('/program', require('./tvPrograms.routes'));

router.use('/video-ads', require('./videoAds.routes'));

router.use('/projects', require('./projects.routes'));

router.use('/media', require('./media.routes'));



module.exports = router;
