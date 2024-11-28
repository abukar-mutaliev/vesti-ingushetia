const express = require("express");
const router = express.Router();
const {
  addCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  getNewsByCategory,
} = require("../controllers/category.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");

const { validate } = require("../middlewares/validation.middleware");

const {
  addCategoryValidation,
  updateCategoryValidation,
  getNewsByCategoryValidation,
  deleteCategoryValidation,
} = require("../validation/categoryValidation");

router.post(
  "/add",
  authenticateAdmin,
  addCategoryValidation,
  validate,
  addCategory
);

router.get("/", getCategories);

router.get(
  "/news/:categoryId",
  getNewsByCategoryValidation,
  validate,
  getNewsByCategory
);

router.put(
  "/update/:id",
  authenticateAdmin,
  updateCategoryValidation,
  validate,
  updateCategory
);

router.delete(
  "/delete/:id",
  authenticateAdmin,
  deleteCategoryValidation,
  validate,
  deleteCategory
);

module.exports = router;
