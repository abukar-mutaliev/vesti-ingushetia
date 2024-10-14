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

router.post("/add", authenticateAdmin, addCategory);

router.get("/", getCategories);

router.get("/news/:categoryId", getNewsByCategory);

router.put("/update/:id", authenticateAdmin, updateCategory);

router.delete("/delete/:id", authenticateAdmin, deleteCategory);

module.exports = router;
