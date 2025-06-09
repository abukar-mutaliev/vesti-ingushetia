export const truncateHtmlToSentences = (html, sentenceLimit) => {

    const truncateToSentences = (htmlContent, limit) => {
        let sentenceCount = 0;
        let truncatedHtml = '';
        const div = document.createElement('div');
        div.innerHTML = htmlContent;

        const traverse = (node) => {
            if (sentenceCount >= limit) return;

            if (node.nodeType === Node.TEXT_NODE) {
                const sentences = node.textContent.match(/[^\.!\?]+[\.!\?]+/g);
                if (sentences) {
                    sentences.forEach((sentence) => {
                        if (sentenceCount < limit) {
                            truncatedHtml += sentence;
                            sentenceCount += 1;
                        }
                    });
                } else {
                    truncatedHtml += node.textContent;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                truncatedHtml += `<${node.nodeName.toLowerCase()}`;
                Array.from(node.attributes).forEach((attr) => {
                    truncatedHtml += ` ${attr.name}="${attr.value}"`;
                });
                truncatedHtml += '>';
                Array.from(node.childNodes).forEach((child) => traverse(child));
                truncatedHtml += `</${node.nodeName.toLowerCase()}>`;
            }
        };

        Array.from(div.childNodes).forEach((child) => traverse(child));

        if (sentenceCount < limit) {
            return htmlContent;
        }

        return `${truncatedHtml.trim()}`;
    };

    return truncateToSentences(html, sentenceLimit);
};

// Простая функция для обрезки HTML по символам с сохранением структуры
export const truncateHtmlByChars = (html, charLimit) => {
    if (!html) {
        return html;
    }

    // Создаем временный div для парсинга HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Получаем только текстовое содержимое
    const textContent = div.textContent || div.innerText || '';
    
    // Если текст короче или равен лимиту, возвращаем весь текст
    if (textContent.length <= charLimit) {
        return textContent;
    }
    
    // Обрезаем текст и добавляем многоточие
    const truncatedText = textContent.substring(0, charLimit).trim();
    return truncatedText + '...';
};
