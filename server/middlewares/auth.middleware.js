const jwt = require("jsonwebtoken");
const { User } = require("../models");

const JWT_SECRET = process.env.SECRET_KEY || "your_secret_key";

const authenticate = (requireAdmin = false) => {
  return async (req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }

    const authHeader = req.headers["authorization"];
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({ error: "Пользователь не найден" });
      }

      req.user = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      };

      if (requireAdmin && !user.isAdmin) {
        return res
          .status(403)
          .json({ error: "Доступ разрешен только администраторам" });
      }

      next();
    } catch (err) {
      return res.status(403).json({ error: "Недействительный токен" });
    }
  };
};

module.exports = {
  authenticateToken: authenticate(),
  authenticateAdmin: authenticate(true),
};
