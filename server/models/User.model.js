const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  User.associate = (models) => {
    User.hasOne(models.Profile, { foreignKey: "userId", as: "profile" });
    User.hasMany(models.News, { foreignKey: "authorId", as: "news" });
    User.hasMany(models.Comment, { foreignKey: "userId", as: "comments" });
    User.belongsToMany(models.Comment, {
      through: models.CommentLike,
      foreignKey: "userId",
      otherKey: "commentId",
      as: "likedComments",
    });
  };

  return User;
};
