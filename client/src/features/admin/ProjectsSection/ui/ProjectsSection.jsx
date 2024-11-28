import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectProjectList } from '@entities/projects/model/projectSelectors';
import {
    fetchAllProjects,
    deleteProject,
} from '@entities/projects/model/projectSlice';
import styles from './ProjectsSection.module.scss';
import { ConfirmDeleteModal } from '@shared/ui/ConfirmDeleteModal';

export const ProjectsSection = ({ onEditProject, onAddProject }) => {
    const dispatch = useDispatch();
    const projects = useSelector(selectProjectList);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectIdToDelete, setProjectIdToDelete] = useState(null);

    useEffect(() => {
        dispatch(fetchAllProjects());
    }, [dispatch]);

    const openDeleteModal = (id) => {
        setProjectIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setProjectIdToDelete(null);
    };

    const handleConfirmDelete = () => {
        if (projectIdToDelete) {
            dispatch(deleteProject(projectIdToDelete))
                .unwrap()
                .then(() => {
                    dispatch(fetchAllProjects());
                    closeDeleteModal();
                });
        }
    };

    return (
        <div className={styles.section}>
            <div className={styles.topbar}>
                <h1>Проекты</h1>
                <button className={styles.create} onClick={onAddProject}>
                    + Добавить проект
                </button>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.hideOnMobile}>Id</th>
                        <th>Название</th>
                        <th>Редактировать</th>
                        <th>Удалить</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr key={project.id}>
                            <td className={styles.hideOnMobile}>
                                {project.id}
                            </td>
                            <td>
                                <Link
                                    to={`/projects/${project.id}`}
                                    className={styles.projectLink}
                                >
                                    {project.title}
                                </Link>
                            </td>
                            <td>
                                <button
                                    className={styles.editButton}
                                    onClick={() => onEditProject(project)}
                                >
                                    Изменить
                                </button>
                            </td>
                            <td>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => openDeleteModal(project.id)}
                                >
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                description="Вы уверены, что хотите удалить этот проект?"
            />
        </div>
    );
};
