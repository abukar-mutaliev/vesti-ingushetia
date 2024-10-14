import React from 'react';
import styles from './AboutUsPage.module.scss';

export const AboutUsPage = () => {
    return (
        <div className={styles.aboutUsPage}>
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Филиал ФГУП ВГТРК ГТРК «Ингушетия»
                </h1>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Адрес</h2>
                    <p className={styles.text}>
                        386101 - Республика Ингушетия, г. Назрань, пер.
                        Набережный, 8.
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Директор</h2>
                    <p className={styles.text}>Евлоев Берс Биланович</p>
                    <p className={styles.text}>
                        Тел.: <a href="tel:+78732224252">+7 (8732) 22-42-52</a>
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Служба информационных программ
                    </h2>
                    <p className={styles.text}>
                        Тел.: <a href="tel:+78732224133">+7 (8732) 22-41-33</a>
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Продюсер</h2>
                    <p className={styles.text}>
                        Тел.: <a href="tel:+78732224128">+7 (8732) 22-41-28</a>
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Планово-экономический отдел
                    </h2>
                    <p className={styles.text}>
                        Тел.: <a href="tel:+78732224145">+7 (8732) 22-41-45</a>
                    </p>
                </div>

                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Служба радиовещания</h2>
                    <p className={styles.text}>
                        Тел.: <a href="tel:+78732224134">+7 (8732) 22-41-34</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
