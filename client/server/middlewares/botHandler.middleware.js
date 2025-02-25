const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('../logger');

/**
 * Middleware для специальной обработки поисковых ботов
 */
const botHandler = async (req, res, next) => {
    // Определяем, является ли запрос от бота
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const isBot = userAgent.includes('bot') ||
        userAgent.includes('spider') ||
        userAgent.includes('crawler') ||
        userAgent.includes('yandex') ||
        userAgent.includes('googlebot');

    // Если это не бот, просто пропускаем запрос дальше
    if (!isBot) {
        return next();
    }

    logger.info(`Запрос от бота: ${userAgent} - ${req.method} ${req.originalUrl}`);

    // Проверяем, является ли это запросом к странице новости
    const newsMatch = req.originalUrl.match(/\/news\/(\d+)/);
    if (!newsMatch) {
        // Если это не страница новости, просто пропускаем запрос дальше
        return next();
    }

    try {
        const newsId = newsMatch[1];
        logger.info(`Бот запрашивает страницу новости ${newsId}`);

        // Получаем данные новости из API
        const response = await axios.get(`http://localhost:${process.env.PORT}/api/news/${newsId}`);
        const news = response.data;

        if (!news) {
            logger.warn(`Новость ${newsId} не найдена для бота ${userAgent}`);
            return next();
        }

        // Определяем базовый URL сайта
        const baseUrl = process.env.BASE_URL || `https://${req.get('host')}`;

        // Определяем главное изображение
        const imageMedia = news.mediaFiles?.find(media => media.type === 'image');
        const imageUrl = imageMedia
            ? (imageMedia.url.startsWith('http') ? imageMedia.url : `${baseUrl}${imageMedia.url}`)
            : `${baseUrl}/default.jpg`;

        // Формируем категории
        const categories = news.categories?.map(cat => cat.name).join(', ') || 'Новости';

        // Формируем автора
        const author = news.authorDetails?.username || 'Редакция';

        // Формируем дату публикации
        const publishDate = news.publishDate || news.createdAt;
        const formattedDate = new Date(publishDate).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Очищаем контент от HTML-тегов для полнотекстового поиска
        const plainContent = news.content?.replace(/<[^>]*>?/gm, '') || '';

        // Читаем SEO HTML-шаблон вместо обычного
        const distDir = path.join(__dirname, '../../dist');
        const seoHtmlPath = path.join(distDir, 'seo.html');

        // Если SEO шаблон не найден, пробуем использовать обычный шаблон
        if (!fs.existsSync(seoHtmlPath)) {
            logger.warn(`Файл SEO шаблона не найден, использую обычный index.html`);
            const indexHtmlPath = path.join(distDir, 'index.html');

            if (!fs.existsSync(indexHtmlPath)) {
                logger.error(`Файл index.html не найден по пути ${indexHtmlPath}`);
                return next();
            }
        }

        // Читаем SEO шаблон или обычный, если SEO не найден
        const htmlTemplatePath = fs.existsSync(seoHtmlPath) ? seoHtmlPath : path.join(distDir, 'index.html');
        let htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf8');

        // Если используем SEO шаблон, заменяем все плейсхолдеры
        if (fs.existsSync(seoHtmlPath)) {
            htmlTemplate = htmlTemplate
                .replace(/%TITLE%/g, news.title)
                .replace(/%DESCRIPTION%/g, news.description || news.title.substring(0, 150))
                .replace(/%FULLTEXT%/g, plainContent)
                .replace(/%NEWS_ID%/g, newsId)
                .replace(/%IMAGE_URL%/g, imageUrl)
                .replace(/%PUBLISH_DATE%/g, publishDate)
                .replace(/%AUTHOR%/g, author)
                .replace(/%CONTENT%/g, news.content || '')
                .replace(/%PUBLISHER_MARKUP%/g, `
          <div itemprop="publisher" itemscope itemtype="http://schema.org/Organization">
            <meta itemprop="name" content="Вести Ингушетии" />
            <div itemprop="logo" itemscope itemtype="http://schema.org/ImageObject">
              <meta itemprop="url" content="${baseUrl}/logo.png" />
            </div>
          </div>
        `);

            // Если в шаблоне остались какие-то незамененные плейсхолдеры, заменяем их пустыми строками
            htmlTemplate = htmlTemplate
                .replace(/%[A-Z_]+%/g, '');
        }
        // Если используем обычный шаблон, то добавляем все SEO-метки и преренделинг
        else {
            // Добавляем мета-теги и схему Schema.org для поисковых ботов
            const metaTags = `
        <meta name="description" content="${news.description || news.title.substring(0, 150)}">
        <meta name="keywords" content="новости, Ингушетия, ГТРК, ${categories}">
        <meta name="yandex:full-text" content="${plainContent}">
        <meta property="og:title" content="${news.title}">
        <meta property="og:description" content="${news.description || news.title.substring(0, 150)}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:url" content="${baseUrl}/news/${newsId}">
        <meta property="og:type" content="article">
        <meta property="og:locale" content="ru_RU">
        <meta property="article:published_time" content="${publishDate}">
        <meta property="article:author" content="${author}">
      `;

            const schemaOrgScript = `
        <script type="application/ld+json">
        {
          "@context": "http://schema.org",
          "@type": "NewsArticle",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${baseUrl}/news/${newsId}"
          },
          "headline": "${news.title.replace(/"/g, '\\"')}",
          "description": "${(news.description || news.title.substring(0, 150)).replace(/"/g, '\\"')}",
          "image": ["${imageUrl}"],
          "author": {
            "@type": "Person",
            "name": "${author}"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Вести Ингушетии",
            "logo": {
              "@type": "ImageObject",
              "url": "${baseUrl}/logo.png",
              "width": 600,
              "height": 60
            }
          },
          "datePublished": "${publishDate}",
          "dateModified": "${news.updatedAt || publishDate}",
          "articleBody": "${plainContent.substring(0, 1000).replace(/"/g, '\\"')}..."
        }
        </script>
      `;

            // Вставляем мета-теги и Schema.org в HTML
            htmlTemplate = htmlTemplate.replace('</head>', `${metaTags}${schemaOrgScript}</head>`);

            // Добавляем предварительный HTML-контент для ботов
            const prerenderedContent = `
        <div id="prerendered-content">
          <article itemscope itemtype="http://schema.org/NewsArticle">
            <header>
              <h1 itemprop="headline">${news.title}</h1>
              <div>
                <span>Автор: <span itemprop="author">${author}</span></span>
                <span>Дата: <time itemprop="datePublished" datetime="${publishDate}">${formattedDate}</time></span>
                <span>Просмотры: ${news.views || 0}</span>
              </div>
            </header>
            
            ${imageMedia ?
                `<div itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
                <img src="${imageUrl}" alt="${news.title}" />
                <meta itemprop="url" content="${imageUrl}">
              </div>` : ''
            }
            
            <div itemprop="articleBody">
              ${news.content || ''}
            </div>
            
            <footer>
              <div>Категории: ${categories}</div>
            </footer>
          </article>
        </div>
      `;

            // Вставляем предварительный контент в HTML для ботов
            htmlTemplate = htmlTemplate.replace('<div id="root"></div>', `<div id="root">${prerenderedContent}</div>`);
            htmlTemplate = htmlTemplate.replace('<div id="root">', `<div id="root">`);
        }

        // Логируем успешную обработку
        logger.info(`Отправка HTML для бота (${userAgent}) - новость ${newsId} - использован ${fs.existsSync(seoHtmlPath) ? 'SEO' : 'обычный'} шаблон`);

        // Отправляем HTML боту
        res.send(htmlTemplate);
    } catch (error) {
        logger.error(`Ошибка при обработке бота: ${error.message}`);
        // В случае ошибки просто продолжаем обычный процесс
        next();
    }
};

module.exports = botHandler;