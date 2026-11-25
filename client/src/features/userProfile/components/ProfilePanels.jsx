import { Link } from 'react-router-dom';
import styles from '../ui/UserProfile.module.scss';

const LINKS = [
    { to: '/news', title: 'Все новости', text: 'Лента и архив по датам' },
    { to: '/program', title: 'Текущая программа', text: 'Расписание эфира на неделю' },
    { to: '/tv', title: 'Телевидение', text: 'Сюжеты и видеоматериалы' },
    { to: '/radio', title: 'Радио', text: 'Эфир и записи Радио России' },
    { to: '/projects', title: 'Наши проекты', text: 'Телепроекты и рубрики' },
    { to: '/live', title: 'Прямой эфир', text: 'Смотреть трансляцию' },
];

export const AccountPanel = ({ user, isAdmin }) => {
    const formattedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : '—';

    return (
        <section className={styles.panel}>
            <h2>Аккаунт</h2>
            <dl className={styles.details}>
                <div>
                    <dt>Имя</dt>
                    <dd>{user.username}</dd>
                </div>
                <div>
                    <dt>Почта</dt>
                    <dd>{user.email}</dd>
                </div>
                <div>
                    <dt>Статус</dt>
                    <dd>{isAdmin ? 'Администратор' : 'Читатель'}</dd>
                </div>
                <div>
                    <dt>Регистрация</dt>
                    <dd>{formattedDate}</dd>
                </div>
            </dl>
            <p className={styles.panelNote}>
                Имя, почту и пароль можно изменить в настройках профиля.
                Аватар обновляется по кнопке на фото.
            </p>
        </section>
    );
};

export const SiteLinks = () => (
    <section className={styles.panel}>
        <h2>Разделы сайта</h2>
        <ul className={styles.linkList}>
            {LINKS.map((item) => (
                <li key={item.to}>
                    <Link to={item.to}>
                        <span>{item.title}</span>
                        <small>{item.text}</small>
                    </Link>
                </li>
            ))}
        </ul>
    </section>
);
