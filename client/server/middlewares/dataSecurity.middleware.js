// middlewares/dataSecurity.middleware.js

/**
 * Безопасные атрибуты пользователя для публичного доступа
 */
const SAFE_USER_ATTRIBUTES = ['id', 'username', 'avatarUrl', 'createdAt'];

/**
 * Безопасные атрибуты пользователя для администраторов
 */
const ADMIN_USER_ATTRIBUTES = ['id', 'username', 'email', 'avatarUrl', 'isAdmin', 'createdAt', 'updatedAt'];

/**
 * Поля пользователя, которые НИКОГДА не должны быть возвращены
 */
const FORBIDDEN_USER_FIELDS = ['password', 'passwordHash', 'resetToken', 'refreshToken'];

/**
 * Middleware для обеспечения безопасности пользовательских данных
 */
const secureUserData = (req, res, next) => {
    // Сохраняем оригинальный метод json
    const originalJson = res.json;

    res.json = function(data) {
        try {
            // Рекурсивно очищаем данные от чувствительной информации
            const cleanedData = sanitizeUserData(data, req.user);
            return originalJson.call(this, cleanedData);
        } catch (error) {
            console.error('Ошибка при очистке данных:', error);
            return originalJson.call(this, data);
        }
    };

    next();
};

/**
 * Рекурсивно очищает объект от чувствительных пользовательских данных
 */
const sanitizeUserData = (data, currentUser) => {
    if (!data) return data;

    // Определяем права пользователя
    const isAdmin = currentUser && currentUser.isAdmin;
    const allowedAttributes = isAdmin ? ADMIN_USER_ATTRIBUTES : SAFE_USER_ATTRIBUTES;

    if (Array.isArray(data)) {
        return data.map(item => sanitizeUserData(item, currentUser));
    }

    if (typeof data === 'object' && data !== null) {
        const cleanedData = {};

        for (const [key, value] of Object.entries(data)) {
            // Если это пользовательские данные (объект с полями пользователя)
            if (isUserObject(value)) {
                cleanedData[key] = filterUserAttributes(value, allowedAttributes);
            }
            // Рекурсивно обрабатываем вложенные объекты и массивы
            else if (typeof value === 'object') {
                cleanedData[key] = sanitizeUserData(value, currentUser);
            }
            // Обычные поля копируем как есть
            else {
                cleanedData[key] = value;
            }
        }

        return cleanedData;
    }

    return data;
};

/**
 * Проверяет, является ли объект пользовательскими данными
 */
const isUserObject = (obj) => {
    if (!obj || typeof obj !== 'object') return false;

    // Проверяем наличие характерных полей пользователя
    const userFields = ['username', 'email', 'password', 'passwordHash'];
    return userFields.some(field => obj.hasOwnProperty(field));
};

/**
 * Фильтрует атрибуты пользователя, оставляя только разрешенные
 */
const filterUserAttributes = (userObj, allowedAttributes) => {
    if (!userObj || typeof userObj !== 'object') return userObj;

    const filtered = {};

    // Включаем только разрешенные атрибуты
    for (const attr of allowedAttributes) {
        if (userObj.hasOwnProperty(attr)) {
            filtered[attr] = userObj[attr];
        }
    }

    // Проверяем, что запрещенные поля не попали в ответ
    for (const forbiddenField of FORBIDDEN_USER_FIELDS) {
        if (filtered.hasOwnProperty(forbiddenField)) {
            delete filtered[forbiddenField];
            console.warn(`Удалено запрещенное поле: ${forbiddenField}`);
        }
    }

    return filtered;
};

/**
 * Middleware для логирования потенциально опасных запросов
 */
const logSensitiveDataAccess = (req, res, next) => {
    const originalJson = res.json;

    res.json = function(data) {
        // Проверяем, содержит ли ответ пользовательские данные
        if (containsUserData(data)) {
            console.log(`[SECURITY] Доступ к пользовательским данным: ${req.method} ${req.originalUrl}`, {
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                userId: req.user?.id || 'anonymous',
                timestamp: new Date().toISOString()
            });
        }

        return originalJson.call(this, data);
    };

    next();
};

/**
 * Проверяет, содержит ли данные пользовательскую информацию
 */
const containsUserData = (data) => {
    if (!data) return false;

    if (Array.isArray(data)) {
        return data.some(item => containsUserData(item));
    }

    if (typeof data === 'object') {
        return Object.values(data).some(value => {
            if (isUserObject(value)) return true;
            return containsUserData(value);
        });
    }

    return false;
};

/**
 * Получает безопасные атрибуты пользователя в зависимости от прав
 */
const getSafeUserAttributes = (isAdmin = false) => {
    return isAdmin ? ADMIN_USER_ATTRIBUTES : SAFE_USER_ATTRIBUTES;
};

module.exports = {
    secureUserData,
    logSensitiveDataAccess,
    getSafeUserAttributes,
    SAFE_USER_ATTRIBUTES,
    ADMIN_USER_ATTRIBUTES,
    FORBIDDEN_USER_FIELDS
};