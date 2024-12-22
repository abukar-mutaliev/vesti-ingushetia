module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('news', 'publishDate', {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.NOW,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('news', 'publishDate');
    },
};
