'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduledNews', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Заголовок новости для удобства'
      },
      scheduledDate: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Дата и время планируемой публикации'
      },
      newsData: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'JSON с данными новости'
      },
      authorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'published', 'error', 'cancelled'),
        defaultValue: 'scheduled',
        allowNull: false,
        comment: 'Статус отложенной новости'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Сообщение об ошибке при публикации'
      },
      lastAttempt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Время последней попытки публикации'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Создаем индексы для оптимизации
    await queryInterface.addIndex('ScheduledNews', ['scheduledDate', 'status'], {
      name: 'idx_scheduled_news_date_status'
    });

    await queryInterface.addIndex('ScheduledNews', ['authorId'], {
      name: 'idx_scheduled_news_author'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ScheduledNews');
  }
}; 