import { TvProgramList } from '@features/tvProgramList/ui/TvProgramList';
import styles from '@pages/TvProgramsPage/ui/TvProgramsPage.module.scss';
import { SlArrowRight } from 'react-icons/sl';
import { FaTimes } from 'react-icons/fa';
import { SideMenu } from '@widgets/SideMenu/index.js';
import { useState } from 'react';

const TvProgramsPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <div className={styles.TvProgramsPage}>
            {isMenuOpen && (
                <div className={styles.backdrop} onClick={closeMenu}></div>
            )}
            <div className={styles.mobileMenuIcon}>
                <SlArrowRight size={20} onClick={toggleMenu} />
            </div>
            <div
                className={`${styles.sideMenu} ${isMenuOpen ? styles.open : ''}`}
            >
                <button className={styles.closeButton} onClick={closeMenu}>
                    <FaTimes size={20} />
                </button>
                <SideMenu onCategoryClick={closeMenu} />
            </div>
            <TvProgramList />
        </div>
    );
};
export default TvProgramsPage;
