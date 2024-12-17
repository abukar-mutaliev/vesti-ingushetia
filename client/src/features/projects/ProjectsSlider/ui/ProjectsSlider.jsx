import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Slider from 'react-slick';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './ProjectsSlider.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import { ProjectCard } from '@entities/projects/ui/ProjectCard';
import { fetchAllProjects } from '@entities/projects/model/projectSlice';
import {
    selectProjectsWithImages,
    selectProjectsLoading,
    selectProjectsError,
} from '@entities/projects/model/projectSelectors';

const sliderSettings = {
    className: 'center',
    infinite: true,
    centerPadding: '60px',
    slidesToShow: 4,
    swipeToSlide: true,
    responsive: [
        {
            breakpoint: 1224,
            settings: {
                slidesToShow: 3,
            },
        },
        {
            breakpoint: 1024,
            settings: {
                slidesToShow: 2,
            },
        },
        {
            breakpoint: 768,
            settings: {
                slidesToShow: 1,
            },
        },
    ],
};

export const ProjectsSlider = ({ title = 'Наши проекты', itemsToShow = 4 }) => {
    const dispatch = useDispatch();
    const projects = useSelector(selectProjectsWithImages, shallowEqual);
    const loading = useSelector(selectProjectsLoading);
    const error = useSelector(selectProjectsError);

    const isDragging = useRef(false);
    const startX = useRef(0);

    useEffect(() => {
        if (!projects.length) {
            dispatch(fetchAllProjects());
        }
    }, [dispatch, projects.length]);

    const handleMouseDown = useCallback((e) => {
        startX.current = e.clientX;
        isDragging.current = false;
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (Math.abs(e.clientX - startX.current) > 5) {
            isDragging.current = true;
        }
    }, []);

    const projectsElements = useMemo(() => {
        return projects.map((project) => {
            const image = project.mediaFiles.find(
                (media) => media.type === 'image',
            );

            const imageUrl = image?.url || null;

            return (
                <div
                    key={project.id}
                    className={styles.projectCardWrapper}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                >
                    <Link
                        to={`/projects/${project.id}`}
                        onClick={(e) => {
                            if (isDragging.current) {
                                e.preventDefault();
                            }
                        }}
                        className={styles.link}
                    >
                        <ProjectCard project={project} imageUrl={imageUrl} />
                    </Link>
                </div>
            );
        });
    }, [projects, handleMouseDown, handleMouseMove]);

    if (loading) {
        return (
            <div className={styles.projectsSlider}>
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.projectsSlider}>
                Ошибка загрузки проектов: {error}
            </div>
        );
    }

    if (!projects.length) {
        return (
            <div className={styles.projectsSlider}>
                Проекты отсутствуют
            </div>
        );
    }

    return (
        <div className={styles.projectsSlider}>
            <h2>{title}</h2>
            <Slider {...{ ...sliderSettings, slidesToShow: itemsToShow }}>
                {projectsElements}
            </Slider>
        </div>
    );
};

ProjectsSlider.propTypes = {
    title: PropTypes.string,
    itemsToShow: PropTypes.number,
};
