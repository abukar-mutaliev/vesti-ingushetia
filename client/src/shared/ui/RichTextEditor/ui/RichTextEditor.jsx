import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styles from './RichTextEditor.module.scss';

export const RichTextEditor = ({ value, onChange }) => {
    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ align: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'video'],
            ['clean'],
        ],
    };

    const formats = [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'align',
        'list',
        'bullet',
        'link',
        'image',
        'video',
    ];

    return (
        <div className={styles.editorContainer}>
            <ReactQuill
                className={styles.editor}
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder="Введите содержание новости..."
            />
        </div>
    );
};
