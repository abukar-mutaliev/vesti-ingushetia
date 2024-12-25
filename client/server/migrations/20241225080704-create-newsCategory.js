module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('NewsCategory', 'createdAt');
    await queryInterface.removeColumn('NewsCategory', 'updatedAt');
  }
};