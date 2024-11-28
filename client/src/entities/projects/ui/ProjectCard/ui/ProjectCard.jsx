import React from 'react';
import styles from './ProjectCard.module.scss';
import { Link } from 'react-router-dom';

export const ProjectCard = ({ project }) => {
    const imageUrl = project.mediaFiles[0]?.url;

    return (
        <Link to={`/projects/${project.id}`} className={styles.projectCard}>
            <img
                src={imageUrl}
                alt={project.title}
                className={styles.projectCardImage}
            />
            <div className={styles.projectCardContent}>
                <h3 className={styles.projectCardTitle}>{project.title}</h3>
            </div>
        </Link>
    );
};
