const logger = require('../logger');

let legacyCategoryIdColumn = false;

async function dropNotNull(sequelize, tableName, columnName) {
    await sequelize.query(
        `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" DROP NOT NULL`,
    );
}

async function ensureNewsCategorySchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const newsTable = await queryInterface.describeTable('news');
    legacyCategoryIdColumn = Boolean(newsTable.categoryId);

    if (newsTable.categoryId && newsTable.categoryId.allowNull === false) {
        await dropNotNull(sequelize, 'news', 'categoryId');
        logger.info('Колонка news.categoryId больше не обязательна');
    }

    let joinTable;
    try {
        joinTable = await queryInterface.describeTable('newsCategory');
    } catch (error) {
        logger.warn(`Таблица newsCategory недоступна: ${error.message}`);
        return;
    }

    for (const columnName of ['createdAt', 'updatedAt']) {
        if (joinTable[columnName] && joinTable[columnName].allowNull === false) {
            await dropNotNull(sequelize, 'newsCategory', columnName);
        }
    }

    if (legacyCategoryIdColumn) {
        await sequelize.query(`
            INSERT INTO "newsCategory" ("newsId", "categoryId")
            SELECT n.id, n."categoryId"
            FROM "news" n
            WHERE n."categoryId" IS NOT NULL
              AND NOT EXISTS (
                SELECT 1
                FROM "newsCategory" nc
                WHERE nc."newsId" = n.id
                  AND nc."categoryId" = n."categoryId"
              )
        `);
    }

    const [legacyTables] = await sequelize.query(`
        SELECT c.table_name AS name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name IN ('NewsCategory', 'newscategory')
          AND c.column_name IN ('newsId', 'categoryId')
        GROUP BY c.table_name
        HAVING COUNT(DISTINCT c.column_name) = 2
    `);

    for (const table of legacyTables) {
        if (table.name === 'newsCategory') continue;
        const quotedName = `"${String(table.name).replace(/"/g, '""')}"`;
        await sequelize.query(`
            INSERT INTO "newsCategory" ("newsId", "categoryId")
            SELECT src."newsId", src."categoryId"
            FROM ${quotedName} src
            WHERE NOT EXISTS (
                SELECT 1
                FROM "newsCategory" nc
                WHERE nc."newsId" = src."newsId"
                  AND nc."categoryId" = src."categoryId"
            )
        `);
    }
}

function hasLegacyCategoryIdColumn() {
    return legacyCategoryIdColumn;
}

async function assignLegacyCategoryId(sequelize, newsId, categoryId, transaction) {
    if (!legacyCategoryIdColumn || !categoryId) return;

    await sequelize.query(
        'UPDATE "news" SET "categoryId" = :categoryId WHERE id = :id',
        {
            replacements: { categoryId, id: newsId },
            transaction,
        },
    );
}

module.exports = {
    ensureNewsCategorySchema,
    hasLegacyCategoryIdColumn,
    assignLegacyCategoryId,
};
