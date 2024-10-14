const { Router } = require("express");

const router = Router();

router.use("/categories", require("./category.routes"));

router.use("/news", require("./news.routes"));

router.use("/users", require("./user.routes"));

router.use("/authors", require("./author.routes"));

router.use("/comments", require("./comment.routes"));

router.use("/tags", require("./tags.routes"));

router.use("/subscriptions", require("./subscriptions.routes"));

router.use("/ratings", require("./ratings.routes"));

router.use("/profile", require("./profiles.routes"));

module.exports = router;
