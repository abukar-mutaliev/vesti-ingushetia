const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Project = sequelize.define(
    "Project",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "projects",
      timestamps: true,
    }
  );

  Project.associate = (models) => {
    Project.belongsToMany(models.Media, {
      through: "ProjectMedia",
      foreignKey: "projectId",
      otherKey: "mediaId",
      as: "mediaFiles",
    });
  };

  return Project;
};
