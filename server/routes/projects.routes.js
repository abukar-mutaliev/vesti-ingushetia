const express = require("express");
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/project.controller");
const { authenticateAdmin } = require("../middlewares/auth.middleware");
const { handleMulterErrors, upload } = require("../middlewares/upload");
const {
  createProjectValidator,
  updateProjectValidator,
  getProjectByIdValidator,
  deleteProjectValidator,
} = require("../validation/projectValidation");
const { validate } = require("../middlewares/validation.middleware");

router.post(
  "/add",
  authenticateAdmin,
  upload,
  createProjectValidator,
  validate,
  handleMulterErrors,
  createProject
);

router.get("/all", getAllProjects);

router.get("/:id", getProjectByIdValidator, validate, getProjectById);

router.put(
  "/update/:id",
  authenticateAdmin,
  upload,
  updateProjectValidator,
  validate,
  handleMulterErrors,
  updateProject
);

router.delete(
  "/delete/:id",
  authenticateAdmin,
  deleteProjectValidator,
  validate,
  deleteProject
);

module.exports = router;
