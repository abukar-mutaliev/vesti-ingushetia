const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Radio = sequelize.define(
        'Radio',
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
            tableName: 'radios',
            timestamps: true,
        },
    );

    return Radio;
};
