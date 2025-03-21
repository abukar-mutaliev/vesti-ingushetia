'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('NewsCategory', {
      newsId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'news',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true,
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('NewsCategory');
  }
};