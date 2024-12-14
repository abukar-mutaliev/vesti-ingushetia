const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Author = sequelize.define(
        'Author',
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            tableName: 'authors',
            timestamps: true,
        },
    );

    Author.associate = (models) => {
        Author.hasMany(models.News, {
            foreignKey: 'authorId',
            as: 'news',
        });
    };

    return Author;
};
