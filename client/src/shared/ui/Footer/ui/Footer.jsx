import styles from './Footer.module.scss';
import { FooterTop } from './components/FooterTop/FooterTop';
import { FooterBottom } from './components/FooterBottom/FooterBottom';

export const Footer = () => {
    return (
        <footer className={styles.footer}>
            <FooterTop />
            <FooterBottom />
        </footer>
    );
};
