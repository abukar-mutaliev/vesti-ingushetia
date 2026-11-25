import { useCallback, useState } from 'react';
import styles from './SideMenu.module.scss';
import { CategoryList } from '@entities/categories/index.js';
import { Link, useLocation } from 'react-router-dom';
import { ArticlesNewsList } from '@features/ArticlesNews/ui/articlesNews.jsx';
import { FaTimes } from 'react-icons/fa';
import { SlArrowRight } from 'react-icons/sl';

export const SideMenu = () => {
    const location = useLocation();
    const isActiveTv = location.pathname === '/tv';
    const [isOpen, setIsOpen] = useState(false);

    const openMenu = useCallback(() => setIsOpen(true), []);
    const closeMenu = useCallback(() => setIsOpen(false), []);

    return (
        <>
            {isOpen && (
                <div className={styles.backdrop} onClick={closeMenu} />
            )}
            <button
                type="button"
                className={styles.mobileMenuIcon}
                onClick={openMenu}
                aria-label="Открыть меню категорий"
            >
                <SlArrowRight size={20} />
            </button>
            <aside
                className={`${styles.shell} ${isOpen ? styles.open : ''}`}
            >
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={closeMenu}
                    aria-label="Закрыть меню"
                >
                    <FaTimes size={20} />
                </button>
                <div className={styles.sideMenu}>
                    <h3>Категории</h3>
                    <div>
                        <CategoryList />
                        <ul className={styles.navList}>
                            <li className={isActiveTv ? styles.active : ''}>
                                <Link to="/tv" onClick={closeMenu}>
                                    ТВ
                                </Link>
                            </li>
                        </ul>
                        <div className={styles.articlesNews}>
                            <h4>Лента новостей</h4>
                            <ArticlesNewsList />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
