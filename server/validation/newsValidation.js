const { body, param, query } = require("express-validator");

exports.createNewsValidator = [
  body("title")
    .notEmpty()
    .withMessage("Заголовок обязателен")
    .isLength({ min: 5 })
    .withMessage("Заголовок должен содержать не менее 5 символов"),
  body("content")
    .notEmpty()
    .withMessage("Содержание обязательно")
    .isLength({ min: 20 })
    .withMessage("Содержание должно содержать не менее 20 символов"),
  body("categoryId")
    .notEmpty()
    .withMessage("ID категории обязателен")
    .isInt()
    .withMessage("ID категории должен быть числом"),
];

exports.updateNewsValidator = [
  param("id").isInt().withMessage("ID новости должен быть числом"),
  body("title")
    .optional()
    .isLength({ min: 5 })
    .withMessage("Заголовок должен содержать не менее 5 символов"),
  body("content")
    .optional()
    .isLength({ min: 20 })
    .withMessage("Содержание должно содержать не менее 20 символов"),
  body("categoryId")
    .optional()
    .isInt()
    .withMessage("ID категории должен быть числом"),
];

exports.getNewsByDateValidator = [
  query("date")
    .notEmpty()
    .withMessage("Дата обязательна")
    .isISO8601()
    .withMessage("Дата должна быть в формате ISO8601"),
];

exports.getNewsByIdValidator = [
  param("id").isInt().withMessage("ID новости должен быть числом"),
];

exports.deleteNewsValidator = [
  param("id").isInt().withMessage("ID новости должен быть числом"),
];
