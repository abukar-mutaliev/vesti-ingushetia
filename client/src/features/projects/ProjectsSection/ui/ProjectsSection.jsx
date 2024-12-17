import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import ReactPaginate from 'react-paginate';
import PropTypes from 'prop-types';

import styles from './ProjectsSection.module.scss';
import { ProjectCard } from '@entities/projects/ui/ProjectCard';
import { fetchAllProjects } from '@entities/projects/model/projectSlice';
import { selectProjectList } from '@entities/projects/model/projectSelectors';

export const ProjectsSection = ({ title = 'Наши проекты', itemsPerPage = 6 }) => {
    const dispatch = useDispatch();
    const projects = useSelector(selectProjectList, shallowEqual);

    const [currentPage, setCurrentPage] = useState(0);

    const pageCount = Math.ceil(projects.length / itemsPerPage);

    const currentProjects = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return projects.slice(start, start + itemsPerPage);
    }, [currentPage, projects, itemsPerPage]);

    const projectsContainerRef = useRef(null);

    const handlePageClick = useCallback(({ selected }) => {
        setCurrentPage(selected);
        if (projectsContainerRef.current) {
            const topOffset = projectsContainerRef.current.offsetTop - 150;
            window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        if (!projects.length) {
            dispatch(fetchAllProjects());
        }
    }, [dispatch, projects.length]);

    return (
        <div className={styles.projectsSection} ref={projectsContainerRef}>
            <h2>{title}</h2>
            <div className={styles.projectsGrid}>
                {currentProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
            {pageCount > 1 && (
                <ReactPaginate
                    previousLabel={'← Предыдущая'}
                    nextLabel={'Следующая →'}
                    breakLabel={'...'}
                    pageCount={pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageClick}
                    containerClassName={styles.pagination}
                    activeClassName={styles.activePage}
                    pageLinkClassName={styles.pageLink}
                    previousLinkClassName={styles.pageLink}
                    nextLinkClassName={styles.pageLink}
                    breakLinkClassName={styles.pageLink}
                />
            )}
        </div>
    );
};

ProjectsSection.propTypes = {
    title: PropTypes.string,
    itemsPerPage: PropTypes.number,
};
