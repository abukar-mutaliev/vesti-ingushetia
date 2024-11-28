const express = require("express");
const router = express.Router();
const videoAdController = require("../controllers/videoAd.controller");
const {
  uploadVideo,
  handleMulterErrors,
} = require("../middlewares/uploadVideo.middleware");
const { authenticateAdmin } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validation.middleware");

const {
  createVideoAdValidator,
  updateVideoAdValidator,
  getVideoAdByIdValidator,
  deleteVideoAdValidator,
  toggleVideoAdStatusValidator,
} = require("../validation/videoAdValidation");

router.post(
  "/add",
  uploadVideo,
  authenticateAdmin,
  createVideoAdValidator,
  validate,
  handleMulterErrors,
  videoAdController.createVideoAd
);

router.get("/all", videoAdController.getAllVideoAds);

router.get(
  "/:id",
  getVideoAdByIdValidator,
  validate,
  videoAdController.getVideoAdById
);

router.put(
  "/update/:id",
  authenticateAdmin,
  uploadVideo,
  updateVideoAdValidator,
  validate,
  handleMulterErrors,
  videoAdController.updateVideoAd
);

router.delete(
  "/delete/:id",
  authenticateAdmin,
  deleteVideoAdValidator,
  validate,
  videoAdController.deleteVideoAd
);

router.patch(
  "/pause/:id",
  authenticateAdmin,
  toggleVideoAdStatusValidator,
  validate,
  videoAdController.pauseVideoAd
);

router.patch(
  "/active/:id",
  authenticateAdmin,
  toggleVideoAdStatusValidator,
  validate,
  videoAdController.activeVideoAd
);

module.exports = router;
