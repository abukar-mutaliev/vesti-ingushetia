const express = require("express");
const router = express.Router();
const broadcastController = require("../controllers/broadcast.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validation.middleware");

const {
  createBroadcastValidation,
  updateBroadcastValidation,
  getBroadcastByIdValidation,
  deleteBroadcastValidation,
} = require("../validation/broadcastValidation");

router.post(
  "/add",
  authenticateAdmin,
  createBroadcastValidation,
  validate,
  broadcastController.createBroadcast
);

router.get("/all", broadcastController.getAllBroadcasts);

router.get(
  "/:id",
  authenticateAdmin,
  getBroadcastByIdValidation,
  validate,
  broadcastController.getBroadcastById
);

router.put(
  "/update/:id",
  authenticateAdmin,
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
