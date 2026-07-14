const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ElectionBanner = sequelize.define(
        'ElectionBanner',
        {
            url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            originalFilename: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Выборы 2026',
            },
            isVisible: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            tableName: 'election_banners',
            timestamps: true,
        },
    );

    return ElectionBanner;
};
