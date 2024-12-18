import styles from './Logo.module.scss';
import { Link } from 'react-router-dom';

export const Logo = () => {
    return (
        <div className={styles.logo}>
            <Link to="/">
                ВЕСТИ
                <span>ИНГУШЕТИИ</span>
            </Link>
        </div>
    );
};
