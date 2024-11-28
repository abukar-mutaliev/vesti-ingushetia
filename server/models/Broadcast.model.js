const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Broadcast = sequelize.define(
    "Broadcast",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "broadcasts",
      timestamps: true,
    }
  );

  return Broadcast;
};
