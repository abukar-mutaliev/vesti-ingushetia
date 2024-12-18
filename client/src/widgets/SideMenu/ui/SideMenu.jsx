import styles from './SideMenu.module.scss';
import { CategoryList } from '@entities/categories/index.js';
import { Link, NavLink } from 'react-router-dom';

export const SideMenu = () => {
    return (
        <div className={styles.sideMenu}>
            <h3>Категории</h3>
            <div>
                <CategoryList/>
                <ul>
                    <li>
                        <Link
                            to="/tv"
                        >
                            ТВ
                        </Link>
                    </li>
                </ul>
        </div>
</div>
)
    ;
};
