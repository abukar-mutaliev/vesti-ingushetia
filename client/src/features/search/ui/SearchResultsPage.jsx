import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdSearch } from 'react-icons/md';
import { NewsCard } from '@widgets/NewsCard';
import { Sidebar } from '@widgets/Sidebar';
import styles from './SearchResultsPage.module.scss';

import { selectNewsList } from '@entities/news/model/newsSelectors';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { selectCategories } from '@entities/categories/model/categorySelectors.js';

import { highlightKeywordsInHtml } from '@shared/lib/highlightKeywordsInHtml/highlightKeywordsInHtml.jsx';

const SearchResultsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialKeywords = queryParams.get('keywords') || '';
    const newsList = useSelector(selectNewsList);
    const categories = useSelector(selectCategories);
    const [searchQuery, setSearchQuery] = useState(initialKeywords);
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (newsList.length === 0) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, newsList.length]);

    useEffect(() => {
        if (searchQuery && newsList.length > 0) {
            const lowerCaseKeywords = searchQuery.toLowerCase();
            const results = newsList.filter((news) => {
                const titleMatch =
                    news.title &&
                    news.title.toLowerCase().includes(lowerCaseKeywords);
                const descriptionMatch =
                    news.content &&
                    news.content.toLowerCase().includes(lowerCaseKeywords);
                return titleMatch || descriptionMatch;
            });
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, newsList]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        navigate(
            `/search/results/?keywords=${encodeURIComponent(searchQuery)}`,
        );
    };

    const handleNewsClick = (id) => {
        sessionStorage.setItem('scrollPosition', window.scrollY);
        navigate(`/news/${id}`, { state: { id } });
    };

    useEffect(() => {
        const savedScrollPosition = sessionStorage.getItem('scrollPosition');
        if (savedScrollPosition) {
            window.scrollTo(0, savedScrollPosition);
            sessionStorage.removeItem('scrollPosition');
        }
    }, []);

    return (
        <div className={styles.searchResultsPage}>
            <div className={styles.searchBar}>
                <form
                    onSubmit={handleSearchSubmit}
                    className={styles.searchForm}
                >
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Поиск..."
                        className={styles.searchInput}
                        autoFocus
                    />
                    <button type="submit" className={styles.searchButton}>
                        <MdSearch size={24} />
                    </button>
                </form>
            </div>
            <div className={styles.contentContainer}>
                <div className={styles.mainContent}>
                    <h1 className={styles.resultsTitle}>
                        Результаты поиска по запросу: {initialKeywords}
                    </h1>
                    <p className={styles.resultsCount}>
                        Найдено результатов: {searchResults.length}
                    </p>

                    {searchResults.length > 0 ? (
                        <div className={styles.resultsList}>
                            {searchResults.map((news) => (
                                <NewsCard
                                    key={news.id}
                                    showContent={true}
                                    onClick={() => handleNewsClick(news.id)}
                                    news={{
                                        ...news,
                                        title: highlightKeywordsInHtml(
                                            news.title || '',
                                            initialKeywords,
                                        ),
                                        content: highlightKeywordsInHtml(
                                            news.content || '',
                                            initialKeywords,
                                        ),
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noResults}>
                            Ничего не найдено
                        </div>
                    )}
                </div>
                <div className={styles.sidebar}>
                    <Sidebar categories={categories} newsList={newsList} />
                </div>
            </div>
        </div>
    );
};

export default SearchResultsPage;
