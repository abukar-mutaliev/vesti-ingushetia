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
  getAllComments,
} = require("../controllers/comment.controller");
const { validate } = require("../middlewares/validation.middleware");

const {
  createCommentValidation,
  replyToCommentValidation,
  getCommentsForNewsValidation,
  deleteCommentValidation,
  likeCommentValidation,
} = require("../validation/commentValidation");

router.post("/add", createCommentValidation, validate, createComment);

router.get("/all", getAllComments);

router.post(
  "/like/:commentId",
  authenticateToken,
  likeCommentValidation,
  validate,
  likeComment
);

router.post(
  "/reply/:parentCommentId",
  authenticateToken,
  replyToCommentValidation,
  validate,
  replyToComment
);

router.get(
  "/:newsId",
  getCommentsForNewsValidation,
  validate,
  getCommentsForNews
);

router.delete(
  "/delete/:commentId",
  authenticateAdmin,
  deleteCommentValidation,
  validate,
  deleteComment
);

module.exports = router;
