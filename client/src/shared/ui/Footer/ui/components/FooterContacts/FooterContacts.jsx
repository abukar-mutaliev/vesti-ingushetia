import styles from './FooterContacts.module.scss';

export const FooterContacts = () => {
    return (
        <div className={styles.footerContacts}>
            <address>
                <p>
                    Телефон:{' '}
                    <a href="tel:+7(873)222-42-52">+7 (873) 222-42-52</a>
                </p>
                <p>
                    Обратная связь:{' '}
                    <a href="mailto:tvi2002@mail.ru">tvi2002@mail.ru</a>
                </p>
                <p>
                    Рекламная служба:{' '}
                    <a href="tel:+7(928)793-47-86">+7 (928) 793-47-86</a>
                </p>
                <p>Адрес: г. Назрань,</p>
                <p>Переулок Набережный, 8</p>
            </address>
        </div>
    );
};
