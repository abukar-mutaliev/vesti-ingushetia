const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Comment = sequelize.define(
        'Comment',
        {
            content: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            authorName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            newsId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'news',
                    key: 'id',
                },
            },
            userId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
            },
            parentCommentId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'comments',
                    key: 'id',
                },
            },
        },
        {
            tableName: 'comments',
            timestamps: true,
        },
    );

    Comment.associate = (models) => {
        Comment.belongsTo(models.News, { foreignKey: 'newsId', as: 'news' });
        Comment.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
        });
        Comment.belongsTo(models.Comment, {
            foreignKey: 'parentCommentId',
            as: 'parentComment',
        });
        Comment.hasMany(models.Comment, {
            foreignKey: 'parentCommentId',
            as: 'replies',
        });
        Comment.belongsToMany(models.User, {
            through: models.CommentLike,
            foreignKey: 'commentId',
            otherKey: 'userId',
            as: 'likedBy',
        });
    };

    return Comment;
};
