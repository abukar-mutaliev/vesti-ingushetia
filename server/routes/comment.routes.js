const express = require("express");
const router = express.Router();
const {
  authenticateAdmin,
  authenticateToken,
} = require("../middlewares/auth.middleware");
const {
  likeComment,
  createComment,
  replyToComment,
  getCommentsForNews,
  deleteComment,
} = require("../controllers/comment.controller");

router.post("/add", createComment);

router.post("/like/:commentId", authenticateToken, likeComment);

router.post("/reply/:parentCommentId", authenticateToken, replyToComment);

router.get("/:newsId", getCommentsForNews);

router.delete("/delete/:commentId", authenticateAdmin, deleteComment);

module.exports = router;
