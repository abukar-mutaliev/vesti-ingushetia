import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MdSearch, MdClose } from 'react-icons/md';
import styles from './Header.module.scss';
import { Logo } from '@shared/ui/Logo/index.jsx';
import { RxAvatar } from 'react-icons/rx';
import { useSelector } from 'react-redux';
import {
    selectLoading,
    selectUserAuth,
} from '@entities/user/auth/model/authSelectors.js';
import { FaBars, FaTimes } from 'react-icons/fa';

export const Header = () => {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const searchInputRef = useRef(null);
    const loading = useSelector(selectLoading);
    const isAuthenticated = useSelector(selectUserAuth);

    const handleSearchIconClick = () => {
        setShowSearch(true);
        setIsMobileMenuOpen(false);
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        setSearchQuery('');
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim() !== '') {
            navigate(
                `/search/results/?keywords=${encodeURIComponent(searchQuery)}`,
            );
            setSearchQuery('');
            setShowSearch(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCloseSearch();
            }
        };

        if (showSearch) {
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showSearch]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        setShowSearch(false);
    };

    const handleNavLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    const handleOverlayClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <header className={styles.header}>
            <div
                className={`${styles.navContainer} ${showSearch ? styles.hide : ''}`}
            >
                <div className={styles.logoContainer}>
                    <Logo />
                </div>
                <div className={styles.mobileIcons}>
                    <div
                        className={
                        `${styles.searchIconMobile}
                         ${location.pathname.includes('/search/results') ? styles.active : ''}`
                    }
                        onClick={handleSearchIconClick}
                    >
                        <MdSearch size={30} />
                    </div>
                    {!loading && (
                        <NavLink
                            to={isAuthenticated ? '/profile' : '/login'}
                            className={({ isActive }) =>
                                `${styles.loginMobile} ${isActive ? styles.active : ''}`
                            }
                        >
                            <RxAvatar size={30} />
                        </NavLink>
                    )}
                    <div
                        className={styles.hamburgerMenu}
                        onClick={toggleMobileMenu}
                    >
                        {isMobileMenuOpen ? (
                            <FaTimes size={30} />
                        ) : (
                            <FaBars size={30} />
                        )}
                    </div>
                </div>
                <nav
                    className={`${styles.nav} ${isMobileMenuOpen ? styles.open : ''}`}
                >
                    <ul className={styles.navList}>
                        <li>
                            <NavLink
                                to="/"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                Главная
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/news"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                Новости
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/tv"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                ТВ
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/program"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                Телепередачи
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/projects"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                Проекты
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/radio"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                Радио
                            </NavLink>
                        </li>
                        <li className={styles.live}>
                            <NavLink
                                to="/live"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                Прямой эфир
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/about"
                                className={({ isActive }) =>
                                    isActive ? styles.active : ''
                                }
                                onClick={handleNavLinkClick}
                            >
                                О нас
                            </NavLink>
                        </li>
                    </ul>
                </nav>
                <NavLink
                    to={isAuthenticated ? '/profile' : '/login'}
                    className={({ isActive }) =>
                        `${styles.login} ${isActive ? styles.active : ''}`
                    }
                >
                    <RxAvatar size={30} />
                </NavLink>
                <div
                    className={`${styles.searchIcon} ${location.pathname.includes('/search/results') ? styles.active : ''}`}
                    onClick={handleSearchIconClick}
                >
                    <MdSearch size={30} />
                </div>
            </div>

            {isMobileMenuOpen && (
                <div
                    className={styles.overlay}
                    onClick={handleOverlayClick}
                ></div>
            )}

            <div
                className={`${styles.searchOverlay} ${showSearch ? styles.show : styles.hide}`}
            >
                <form
                    onSubmit={handleSearchSubmit}
                    className={styles.searchForm}
                    ref={searchInputRef}
                >
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Поиск..."
                        className={styles.searchInput}
                        autoFocus
                    />
                    <div className={styles.searchButtons}>
                        <button type="submit" className={styles.searchButton}>
                            <MdSearch size={24} />
                        </button>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={handleCloseSearch}
                        >
                            <MdClose size={24} />
                        </button>
                    </div>
                </form>
            </div>
        </header>
    );
};
