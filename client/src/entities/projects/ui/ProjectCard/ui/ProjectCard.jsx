import React from 'react';
import styles from './ProjectCard.module.scss';

export const ProjectCard = React.memo(({ project }) => {
    const imageUrl = project.mediaFiles?.[0]?.url || null;

    return (
        <div className={styles.projectCard}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={project.title}
                    className={styles.projectCardImage}
                />
            ) : (
                <div className={styles.placeholderImage}>Без изображения</div>
            )}
            <div className={styles.projectCardContent}>
                <h3 className={styles.projectCardTitle}>{project.title}</h3>
            </div>
        </div>
    );
});
