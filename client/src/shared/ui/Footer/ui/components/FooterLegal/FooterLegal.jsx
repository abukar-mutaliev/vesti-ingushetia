import styles from './FooterLegal.module.scss';
import { Link } from 'react-router-dom';

export const FooterLegal = () => {
    return (
        <div className={styles.footerLegal}>
            <div className={styles.container}>
                <p>© 2024 ГТРК Ингушетия. Все права защищены.</p>
                <div className={styles.links}>
                    <Link to="/privacy">Политика конфиденциальности</Link>
                    <Link to="/terms">Пользовательское соглашение</Link>
                    <Link to="/about">Контакты</Link>
                </div>
            </div>
        </div>
    );
};
