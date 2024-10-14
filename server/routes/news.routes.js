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

router.post("/add", upload, authenticateAdmin, handleMulterErrors, createNews);

router.get("/all", getAllNews);

router.get("/videos", getAllVideos);

router.get("/date", getNewsByDate);

router.get("/:id", getNewsById);

router.put(
  "/update/:id",
  authenticateAdmin,
  upload,
  handleMulterErrors,
  updateNews
);

router.delete("/delete/:id", authenticateAdmin, deleteNews);

module.exports = router;
