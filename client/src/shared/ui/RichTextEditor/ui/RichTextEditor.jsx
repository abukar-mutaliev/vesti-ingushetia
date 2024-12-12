import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export const RichTextEditor = ({ value, onChange }) => {
    const handleEditorChange = (event, editor) => {
        const data = editor.getData();
        onChange(data);
    };

    return (
        <CKEditor
            editor={ClassicEditor}
            data={value}
            onChange={handleEditorChange}
            config={{
                toolbar: [
                    'heading',
                    '|',
                    'bold',
                    'italic',
                    'link',
                    'bulletedList',
                    'numberedList',

                    '|',
                    'insertTable',
                    'blockQuote',
                    'undo',
                    'redo',
                ],
            }}
        />
    );
};
