const express = require('express');
const router = express.Router();
const authorController = require('../controllers/author.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');


router.post(
    '/add',

    authorController.createAuthor,
);

router.get('/all', authorController.getAllAuthors);

router.get(
    '/:id',
    authorController.getAuthorById,
);

router.get(
    '/news/:authorId',
    authorController.getNewsByAuthor,
);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    validate,
    authorController.updateAuthor,
);

router.delete(
    '/delete/:id',
    validate,
    authorController.deleteAuthor,
);

module.exports = router;
