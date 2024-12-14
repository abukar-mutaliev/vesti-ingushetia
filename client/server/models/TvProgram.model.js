const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TvProgram = sequelize.define('TvProgram', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        program: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    });
    return TvProgram;
};
