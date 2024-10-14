const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const NewsTags = sequelize.define('NewsTags', {
        newsId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'news',
                key: 'id'
            }
        },
        tagId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'tags',
                key: 'id'
            }
        }
    }, {
        tableName: 'NewsTags',
        timestamps: false,
    });

    return NewsTags;
};
