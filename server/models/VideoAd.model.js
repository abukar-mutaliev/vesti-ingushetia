const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const VideoAd = sequelize.define(
    "VideoAd",
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
      status: {
        type: DataTypes.ENUM("active", "paused"),
        allowNull: false,
        defaultValue: "active",
      },
      expirationDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "video_ads",
      timestamps: true,
    }
  );

  return VideoAd;
};
