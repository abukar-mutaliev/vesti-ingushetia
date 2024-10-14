const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const News = sequelize.define(
    "News",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      newsAuthorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "authors",
          key: "id",
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
      },
    },
    {
      tableName: "news",
      timestamps: true,
    }
  );

  News.associate = (models) => {
    News.belongsTo(models.User, {
      foreignKey: "authorId",
      as: "authorDetails",
    });
    News.belongsTo(models.Author, { foreignKey: "newsAuthorId", as: "author" });
    News.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });
    News.hasMany(models.Comment, { foreignKey: "newsId", as: "comments" });
    News.belongsToMany(models.Media, {
      through: "NewsMedia",
      foreignKey: "newsId",
      otherKey: "mediaId",
      as: "mediaFiles",
    });
    News.belongsToMany(models.Tag, {
      through: "NewsTags",
      foreignKey: "newsId",
      otherKey: "tagId",
      as: "tags",
    });
  };

  return News;
};
