const express = require("express");
const router = express.Router();
const authorsController = require("../controllers/author.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");

router.post("/add", authenticateAdmin, authorsController.createAuthor);

router.get("/all", authorsController.getAllAuthors);

router.get("/news/:authorId", authorsController.getNewsByAuthor);

router.get("/:id", authorsController.getAuthorById);

router.put("/update/:id", authenticateAdmin, authorsController.updateAuthor);

router.delete("/delete/:id", authenticateAdmin, authorsController.deleteAuthor);

module.exports = router;
