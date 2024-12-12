import styles from './NotFoundPage.module.scss';
import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>404</h1>
            <p className={styles.message}>Страница не найдена</p>
            <Link to="/" className={styles.homeLink}>
                Вернуться на главную
            </Link>
        </div>
    );
}
export default NotFoundPage;
