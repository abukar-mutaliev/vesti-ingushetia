const express = require('express');
const router = express.Router();
const csrfProtection = require('../middlewares/csrfProtection.middleware');

const {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
} = require('../controllers/project.controller');
const { authenticateAdmin } = require('../middlewares/auth.middleware');
const {
    handleMulterErrors,
    upload,
} = require('../middlewares/uploads.middleware');
const {
    createProjectValidator,
    updateProjectValidator,
    getProjectByIdValidator,
    deleteProjectValidator,
} = require('../validation/projectValidation');
const { validate } = require('../middlewares/validation.middleware');

router.post(
    '/add',
    authenticateAdmin,
    csrfProtection,
    upload,
    createProjectValidator,
    validate,
    handleMulterErrors,
    createProject,
);

router.get('/all', getAllProjects);

router.get('/:id', getProjectByIdValidator, validate, getProjectById);

router.put(
    '/update/:id',
    authenticateAdmin,
    csrfProtection,
    upload,
    updateProjectValidator,
    validate,
    handleMulterErrors,
    updateProject,
);

router.delete(
    '/delete/:id',
    authenticateAdmin,
    csrfProtection,
    deleteProjectValidator,
    validate,
    deleteProject,
);

module.exports = router;
