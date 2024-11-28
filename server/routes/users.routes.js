const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { upload } = require("../middlewares/upload");
const {
  authenticateAdmin,
  authenticateToken,
} = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validation.middleware");

const {
  registerUserValidator,
  loginUserValidator,
  updateUserValidator,
  updateUserRoleValidator,
  updateAvatarValidator,
  refreshTokenValidator,
} = require("../validation/userValidation");

router.post(
  "/register",
  upload,
  registerUserValidator,
  validate,
  userController.registerUser
);

router.post("/login", loginUserValidator, validate, userController.loginUser);

router.put(
  "/:id/role",
  authenticateAdmin,
  updateUserRoleValidator,
  validate,
  userController.updateUserRole
);

router.put(
  "/update/:id",
  authenticateToken,
  upload,
  updateUserValidator,
  validate,
  userController.updateUser
);

router.post("/logout", userController.logOutUser);

router.get("/all", userController.getAllUsers);

router.get("/replies", authenticateToken, userController.getUserReplies);

router.get("/profile", authenticateToken, userController.getUserProfile);

router.put(
  "/update-avatar",
  authenticateToken,
  upload,
  updateAvatarValidator,
  validate,
  userController.updateAvatar
);

router.post(
  "/refresh",
  refreshTokenValidator,
  validate,
  userController.refreshToken
);

module.exports = router;
