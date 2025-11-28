/**
 * Утилита для проверки IP-адресов роботов Яндекса
 * Новые IP-адреса роботов Яндекса для вайтлиста
 */

// Конкретные IP-адреса роботов Яндекса
const yandexBotIPs = [
    '217.20.158.66',
    '217.20.158.67',
    '217.20.158.84',
    '217.20.158.85',
    '217.20.158.252',
    '217.20.158.253',
    '217.20.158.254',
    '217.20.158.255',
    '5.101.41.4',
    '5.101.41.5',
    '5.101.41.6',
    '5.101.41.7'
];

/**
 * Преобразует IP-адрес в число для сравнения
 * @param {string} ip - IP-адрес в формате "x.x.x.x"
 * @returns {number|null} - Числовое представление IP или null при ошибке
 */
function ipToNumber(ip) {
    if (!ip || typeof ip !== 'string') {
        return null;
    }
    
    const parts = ip.split('.');
    if (parts.length !== 4) {
        return null;
    }
    
    try {
        const num = (parseInt(parts[0], 10) << 24) + 
                   (parseInt(parts[1], 10) << 16) + 
                   (parseInt(parts[2], 10) << 8) + 
                   parseInt(parts[3], 10);
        
        // Проверяем, что все части валидны
        if (isNaN(num) || parts.some(p => isNaN(parseInt(p, 10)) || parseInt(p, 10) < 0 || parseInt(p, 10) > 255)) {
            return null;
        }
        
        return num;
    } catch (error) {
        return null;
    }
}

/**
 * Проверяет, находится ли IP-адрес в подсети
 * @param {string} ip - IP-адрес для проверки
 * @param {string} subnet - Подсеть в формате CIDR (например, "217.20.158.64/26")
 * @returns {boolean}
 */
function isIPInSubnet(ip, subnet) {
    if (!ip || !subnet) {
        return false;
    }
    
    try {
        const [subnetIP, prefixLengthStr] = subnet.split('/');
        const prefixLength = parseInt(prefixLengthStr, 10);
        
        if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
            return false;
        }
        
        const subnetNum = ipToNumber(subnetIP);
        const ipNum = ipToNumber(ip);
        
        if (subnetNum === null || ipNum === null) {
            return false;
        }
        
        const mask = (0xFFFFFFFF << (32 - prefixLength)) >>> 0;
        return (subnetNum & mask) === (ipNum & mask);
    } catch (error) {
        return false;
    }
}

// Подсети роботов Яндекса
const yandexBotSubnets = [
    '217.20.158.64/26',  // 217.20.158.64 - 217.20.158.127
    '217.20.158.252/30', // 217.20.158.252 - 217.20.158.255
    '5.101.41.0/29'      // 5.101.41.0 - 5.101.41.7
];

/**
 * Проверяет, является ли IP-адрес IP-адресом робота Яндекса
 * @param {string} ip - IP-адрес для проверки
 * @returns {boolean}
 */
function isYandexBotIP(ip) {
    if (!ip) {
        return false;
    }

    // Проверяем конкретные IP-адреса
    if (yandexBotIPs.includes(ip)) {
        return true;
    }

    // Проверяем подсети
    for (const subnet of yandexBotSubnets) {
        try {
            if (isIPInSubnet(ip, subnet)) {
                return true;
            }
        } catch (error) {
            // Игнорируем ошибки парсинга
        }
    }

    return false;
}

/**
 * Получает реальный IP-адрес клиента из запроса
 * Учитывает прокси и заголовки X-Forwarded-For
 * @param {object} req - Express request object
 * @returns {string}
 */
function getClientIP(req) {
    // Проверяем заголовки прокси
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        // X-Forwarded-For может содержать несколько IP через запятую
        const ips = forwarded.split(',').map(ip => ip.trim());
        // Берем первый IP (оригинальный клиент)
        return ips[0];
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
        return realIP;
    }

    // Fallback на стандартный IP
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
}

module.exports = {
    isYandexBotIP,
    getClientIP,
    yandexBotIPs,
    yandexBotSubnets
};

