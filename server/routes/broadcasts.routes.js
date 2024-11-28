const express = require("express");
const router = express.Router();
const broadcastController = require("../controllers/broadcast.controller");
const {
  uploadAudio,
  handleMulterErrors,
} = require("../middlewares/uploadAudio");
const { authenticateAdmin } = require("../middlewares/auth.middleware");

const {
  createBroadcastValidation,
  updateBroadcastValidation,
  getBroadcastByIdValidation,
  deleteBroadcastValidation,
} = require("../validation/broadcastValidation");
const { validate } = require("../middlewares/validation.middleware");

router.post(
  "/add",
  authenticateAdmin,
  uploadAudio,
  handleMulterErrors,
  createBroadcastValidation,
  validate,
  broadcastController.createBroadcast
);

router.get("/all", broadcastController.getAllBroadcasts);

router.get(
  "/:id",
  getBroadcastByIdValidation,
  validate,
  broadcastController.getBroadcastById
);

router.put(
  "/update/:id",
  authenticateAdmin,
  uploadAudio,
  handleMulterErrors,
  updateBroadcastValidation,
  validate,
  broadcastController.updateBroadcast
);

router.delete(
  "/delete/:id",
  authenticateAdmin,
  deleteBroadcastValidation,
  validate,
  broadcastController.deleteBroadcast
);

module.exports = router;
