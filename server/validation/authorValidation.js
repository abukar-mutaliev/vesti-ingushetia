const { body, param } = require("express-validator");

exports.createAuthorValidation = [
  body("name")
    .notEmpty()
    .withMessage("Имя автора обязательно")
    .isLength({ max: 100 }),
  body("email")
    .notEmpty()
    .withMessage("Email обязателен")
    .isEmail()
    .normalizeEmail(),
  body("bio").optional().isLength({ max: 500 }),
];
