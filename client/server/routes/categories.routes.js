const express = require('express');
const router = express.Router();
const {
    addCategory,
    getCategories,
    deleteCategory,
    updateCategory,
    getNewsByCategory,
} = require('../controllers/category.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const csrfProtection = require('../middlewares/csrfProtection.middleware');

const { validate } = require('../middlewares/validation.middleware');

const {
    addCategoryValidation,
    updateCategoryValidation,
    getNewsByCategoryValidation,
    deleteCategoryValidation,
} = require('../validation/categoryValidation');

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    addCategoryValidation,
    validate,
    addCategory,
);

router.get('/', getCategories);

router.get(
    '/news/:categoryId',
    getNewsByCategoryValidation,
    validate,
    getNewsByCategory,
);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    updateCategoryValidation,
    validate,
    updateCategory,
);

router.delete(
    '/delete/:id',
    authenticateAdmin,
    csrfProtection,
    deleteCategoryValidation,
    validate,
    deleteCategory,
);

module.exports = router;
