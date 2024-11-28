const express = require("express");
const router = express.Router();
const {
  createNews,
  getAllNews,
  getNewsById,
  getNewsByDate,
  updateNews,
  deleteNews,
  getAllVideos,
} = require("../controllers/news.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");
const { handleMulterErrors, upload } = require("../middlewares/upload");
const { validate } = require("../middlewares/validation.middleware");

const {
  createNewsValidator,
  updateNewsValidator,
  getNewsByDateValidator,
  getNewsByIdValidator,
  deleteNewsValidator,
} = require("../validation/newsValidation");

router.post(
  "/add",
  authenticateAdmin,
  upload,
  createNewsValidator,
  validate,
  handleMulterErrors,
  createNews
);

router.get("/all", getAllNews);

router.get("/videos", getAllVideos);

router.get("/date", validate, getNewsByDateValidator, getNewsByDate);

router.get("/:id", validate, getNewsByIdValidator, getNewsById);

router.put(
  "/update/:id",
  authenticateAdmin,
  upload,
  updateNewsValidator,
  validate,
  handleMulterErrors,
  updateNews
);

router.delete(
  "/delete/:id",
  deleteNewsValidator,
  authenticateAdmin,
  validate,
  deleteNews
);

module.exports = router;
