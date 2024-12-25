'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableExists = await queryInterface.sequelize.query(
          `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'NewsCategory'
        );`
      );

      if (tableExists[0][0].exists) {
        await queryInterface.removeColumn('NewsCategory', 'createdAt');
        await queryInterface.removeColumn('NewsCategory', 'updatedAt');
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('NewsCategory', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
      await queryInterface.addColumn('NewsCategory', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
