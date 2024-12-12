import { useEffect, useState } from 'react';
import styles from './EditTvProgramSection.module.scss';
import { RichTextEditor } from '@shared/ui/RichTextEditor';
import {
    fetchAllTvPrograms,
    updateTvProgram,
} from '@entities/tvProgram/model/tvProgramSlice.js';
import { useDispatch } from 'react-redux';

export const EditTvProgramSection = ({ tvProgram, onCancel }) => {
    const dispatch = useDispatch();
    const [programText, setProgramText] = useState('');

    useEffect(() => {
        if (tvProgram) {
            setProgramText(tvProgram.program || '');
        }
    }, [tvProgram]);

    const handleFieldChange = (field, value) => {
        if (field === 'program') {
            setProgramText(value);
        }
    };

    const handleSave = () => {
        dispatch(updateTvProgram({ id: tvProgram.id, program: programText }))
            .unwrap()
            .then(() => {
                dispatch(fetchAllTvPrograms());
                onCancel();
            })
            .catch((error) => {
                console.error('Ошибка при обновлении ТВ программы:', error);
            });
    };

    return (
        <div className={styles.editTvProgramSection}>
            <h2>Редактировать ТВ программу</h2>
            <RichTextEditor
                value={programText}
                onChange={(value) => handleFieldChange('program', value)}
            />
            <div className={styles.buttons}>
                <button onClick={handleSave} className={styles.saveButton}>
                    Сохранить
                </button>
                <button onClick={onCancel} className={styles.cancelButton}>
                    Отмена
                </button>
            </div>
        </div>
    );
};
