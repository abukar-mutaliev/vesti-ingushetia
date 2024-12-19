import styles from './SideMenu.module.scss';
import { CategoryList } from '@entities/categories/index.js';
import { Link, useLocation } from 'react-router-dom';
import { ArticlesNewsList } from '@features/ArticlesNews/ui/articlesNews.jsx';

export const SideMenu = () => {
    const location = useLocation();
    const isActiveTv = location.pathname === '/tv';

    return (
        <div className={styles.sideMenu}>
            <h3>Категории</h3>
            <div>
                <CategoryList/>
                <ul>
                    <li className={isActiveTv ? styles.active : ''}>
                        <Link to="/tv">ТВ</Link>
                    </li>
                </ul>
                <div className={styles.articlesNews}>
                    <h4>Лента новостей</h4>
                    <ArticlesNewsList/>
                </div>
            </div>
        </div>
    )
        ;
};
