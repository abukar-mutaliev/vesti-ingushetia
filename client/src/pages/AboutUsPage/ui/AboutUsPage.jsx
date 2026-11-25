import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '@entities/categories/model/categorySlice';
import { selectCategories } from '@entities/categories/model/categorySelectors';
import { SideMenu } from '@widgets/SideMenu/index.js';
import styles from './AboutUsPage.module.scss';

const CONTACTS = [
    {
        title: 'Директор',
        name: 'Евлоев Берс Биланович',
        phone: '+7 (8732) 22-42-52',
        tel: '+78732224252',
    },
    {
        title: 'Служба информационных программ',
        phone: '+7 (8732) 22-41-33',
        tel: '+78732224133',
    },
    {
        title: 'Продюсер',
        phone: '+7 (8732) 22-41-28',
        tel: '+78732224128',
    },
    {
        title: 'Планово-экономический отдел',
        phone: '+7 (8732) 22-41-45',
        tel: '+78732224145',
    },
    {
        title: 'Служба радиовещания',
        phone: '+7 (8732) 22-41-34',
        tel: '+78732224134',
    },
];

const AboutUsPage = () => {
    const dispatch = useDispatch();
    const categories = useSelector(selectCategories);

    useEffect(() => {
        if (!categories.length) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    return (
        <div className={styles.aboutPage}>
            <SideMenu />
            <article className={styles.card}>
                <header className={styles.header}>
                    <span className={styles.eyebrow}>ГТРК «Ингушетия»</span>
                    <h1 className={styles.title}>О нас</h1>
                    <p className={styles.subtitle}>
                        Филиал ФГУП ВГТРК ГТРК «Ингушетия»
                    </p>
                </header>

                <section className={styles.address}>
                    <span className={styles.addressLabel}>Адрес редакции</span>
                    <p>
                        386101, Республика Ингушетия, г. Назрань, пер.
                        Набережный, 8
                    </p>
                </section>

                <div className={styles.grid}>
                    {CONTACTS.map((contact) => (
                        <section key={contact.title} className={styles.contact}>
                            <h2>{contact.title}</h2>
                            {contact.name && <p className={styles.name}>{contact.name}</p>}
                            <a href={`tel:${contact.tel}`}>{contact.phone}</a>
                        </section>
                    ))}
                </div>
            </article>
        </div>
    );
};

export default AboutUsPage;
