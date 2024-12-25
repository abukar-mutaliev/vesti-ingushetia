'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('news', 'categoryId');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('news', 'categoryId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id',
            },
        });
    },
};
