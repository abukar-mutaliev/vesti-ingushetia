const express = require("express");
const router = express.Router();
const { getMediaFile } = require("../controllers/media.controller");

router.get("/:type/:filename", getMediaFile);

module.exports = router;
