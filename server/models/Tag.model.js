const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tag = sequelize.define('Tag', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        tableName: 'tags',
        timestamps: true,
    });

    Tag.associate = (models) => {
        Tag.belongsToMany(models.News, {
            through: 'NewsTags',
            as: 'news',
            foreignKey: 'tagId',
            otherKey: 'newsId'
        });
    };

    return Tag;
};
