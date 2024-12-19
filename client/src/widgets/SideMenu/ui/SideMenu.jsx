import styles from './SideMenu.module.scss';
import { CategoryList } from '@entities/categories/index.js';
import { Link, NavLink } from 'react-router-dom';
import { ArticlesNewsList } from '@features/ArticlesNews/ui/articlesNews.jsx';

export const SideMenu = () => {
    return (
        <div className={styles.sideMenu}>
            <h3>Категории</h3>
            <div>
                <CategoryList/>
                <ul>
                    <Link
                        to="/tv"
                    >
                    <li>
                            ТВ
                    </li>
                    </Link>
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
