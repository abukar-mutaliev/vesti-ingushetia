const express = require("express");
const router = express.Router();
const tvProgramController = require("../controllers/tvProgram.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validation.middleware");

const {
  createTvProgramValidator,
  updateTvProgramValidator,
  getTvProgramByIdValidator,
  deleteTvProgramValidator,
} = require("../validation/tvProgramValidation");

router.post(
  "/add",
  authenticateAdmin,
  createTvProgramValidator,
  validate,
  tvProgramController.createTvProgram
);

router.get("/all", tvProgramController.getAllTvPrograms);

router.get(
  "/:id",
  getTvProgramByIdValidator,
  validate,
  tvProgramController.getTvProgramById
);

router.put(
  "/update/:id",
  authenticateAdmin,
  updateTvProgramValidator,
  validate,
  tvProgramController.updateTvProgram
);

router.delete(
  "/delete/:id",
  authenticateAdmin,
  deleteTvProgramValidator,
  validate,
  tvProgramController.deleteTvProgram
);

module.exports = router;
