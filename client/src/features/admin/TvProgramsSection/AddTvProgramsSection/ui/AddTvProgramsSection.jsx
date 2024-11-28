import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    createTvProgram,
    fetchAllTvPrograms,
} from '@entities/tvProgram/model/tvProgramSlice';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import styles from './AddScheduleSection.module.scss';

export const AddTvProgramsSection = ({ onSave, onCancel }) => {
    const [program, setProgram] = useState('');
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();

    const validateFields = () => {
        const newErrors = {};

        if (!program || program.trim() === '') {
            newErrors.program = 'Поле расписания обязательно для заполнения.';
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateFields()) return;

        dispatch(createTvProgram({ program }))
            .unwrap()
            .then(() => {
                dispatch(fetchAllTvPrograms());
                onSave();
            })
            .catch((error) => {
                if (error.errors) {
                    const serverErrors = {};
                    error.errors.forEach((err) => {
                        if (err.path) {
                            serverErrors[err.path] = err.msg;
                        }
                    });
                    setErrors(serverErrors);
                } else {
                    setErrors({
                        general: 'Ошибка при добавлении телепрограммы',
                    });
                    console.error(
                        'Ошибка при добавлении телепрограммы:',
                        error,
                    );
                }
            });
    };

    const handleProgramChange = (content) => {
        setProgram(content);
        // Удаляем ошибку, если поле заполнено
        if (content && content.trim() !== '') {
            setErrors((prevErrors) => {
                const { program, ...rest } = prevErrors;
                return rest;
            });
        }
    };

    return (
        <div className={styles.addScheduleSection}>
            <h2>Добавить расписание</h2>
            <div className={styles.addForm}>
                <label>Расписание</label>
                <RichTextEditor
                    value={program}
                    onChange={handleProgramChange}
                />
                {errors.program && (
                    <p className={styles.error}>{errors.program}</p>
                )}

                <div className={styles.buttons}>
                    <button
                        className={styles.saveButton}
                        onClick={handleSubmit}
                    >
                        Сохранить
                    </button>
                    <button className={styles.cancelButton} onClick={onCancel}>
                        Отмена
                    </button>
                </div>
                {errors.general && (
                    <p className={styles.error}>{errors.general}</p>
                )}
            </div>
        </div>
    );
};
