const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    {
        dialect: 'postgres',
        logging: false,
    },
);


const User = require('./User.model')(sequelize);
const Comment = require('./Comment.model')(sequelize);
const CommentLike = require('./CommentLike.model')(sequelize);
const News = require('./News.model')(sequelize);
const Category = require('./Category.model')(sequelize);
const Media = require('./Media.model')(sequelize);
const Profile = require('./Profile.model')(sequelize);
const NewsMedia = require('./NewsMedia.model')(sequelize);
const Radio = require('./Radio.model')(sequelize);
const TvProgram = require('./TvProgram.model')(sequelize);
const VideoAd = require('./VideoAd.model')(sequelize);
const Project = require('./Projects.model')(sequelize);
const NewsCategory = require('./NewsCategory.model')(sequelize);
const ScheduledNews = require('./ScheduledNews.model')(sequelize);

const models = {
    User,
    Comment,
    CommentLike,
    News,
    Category,
    NewsCategory,
    Media,
    Profile,
    NewsMedia,
    Radio,
    TvProgram,
    VideoAd,
    Project,
    ScheduledNews,
};

Object.values(models).forEach((model) => {
    if (model.associate) {
        model.associate(models);
    }
});

module.exports = {
    sequelize,
    ...models,
};
