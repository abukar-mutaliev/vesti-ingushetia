const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { upload } = require("../middlewares/upload");
const {
  authenticateAdmin,
  authenticateToken,
} = require("../middlewares/auth.middleware");

router.post("/register", upload, userController.registerUser);

router.post("/login", userController.loginUser);

router.put("/:id/role", authenticateAdmin, userController.updateUserRole);

router.put("/update/:id", upload, userController.updateUser);

router.post("/logout", userController.logOutUser);

router.get("/all", userController.getAllUsers);

router.get("/replies", authenticateToken, userController.getUserReplies);

router.get("/profile", authenticateToken, userController.getUserProfile);

router.post("/refresh", userController.refreshToken);

router.put(
  "/update-avatar",
  authenticateToken,
  upload,
  userController.updateAvatar
);

module.exports = router;
