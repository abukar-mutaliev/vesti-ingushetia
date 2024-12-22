const NEWS_LOCAL_STORAGE_KEY = 'newsList';

export const saveNewsToLocalStorage = (newsList) => {
    try {
        const serializedNews = JSON.stringify(newsList);
        localStorage.setItem(NEWS_LOCAL_STORAGE_KEY, serializedNews);
    } catch (error) {
        console.error('Ошибка при сохранении новостей в localStorage:', error);
    }
};

export const loadNewsFromLocalStorage = () => {
    const storedNews = localStorage.getItem(NEWS_LOCAL_STORAGE_KEY);
    if (storedNews) {
        try {
            return JSON.parse(storedNews);
        } catch (error) {
            console.error('Ошибка при разборе новостей из localStorage:', error);
            return [];
        }
    }
    return [];
};
