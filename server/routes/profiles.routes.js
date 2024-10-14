const express = require("express");
const router = express.Router();
const ProfilesController = require("../controllers/profile.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.post("/add", authenticateToken, ProfilesController.createProfile);

router.get("/:id", authenticateToken, ProfilesController.getProfileById);

router.put("/update/:id", authenticateToken, ProfilesController.updateProfile);

router.delete(
  "/delete/:id",
  authenticateToken,
  ProfilesController.deleteProfile
);

module.exports = router;
