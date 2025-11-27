import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import styles from './ImageCropModal.module.scss';

// Соотношение сторон для новостей: 770x517 ≈ 1.49:1 (близко к 3:2)
const NEWS_ASPECT_RATIO = 770 / 517;

export const ImageCropModal = ({ image, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = useCallback((crop) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom) => {
        setZoom(zoom);
    }, []);

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const getCroppedImg = useCallback(async (imageSrc, pixelCrop) => {
        const createImage = (url) =>
            new Promise((resolve, reject) => {
                const image = new Image();
                image.addEventListener('load', () => resolve(image));
                image.addEventListener('error', (error) => reject(error));
                image.setAttribute('crossOrigin', 'anonymous');
                image.src = url;
            });

        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = Math.max(image.naturalWidth, image.naturalHeight);
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

        canvas.width = safeArea;
        canvas.height = safeArea;

        ctx.translate(safeArea / 2, safeArea / 2);
        ctx.translate(-safeArea / 2, -safeArea / 2);

        ctx.drawImage(
            image,
            safeArea / 2 - image.naturalWidth / 2,
            safeArea / 2 - image.naturalHeight / 2
        );

        const data = ctx.getImageData(0, 0, safeArea, safeArea);

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.putImageData(
            data,
            Math.round(0 - safeArea / 2 + image.naturalWidth / 2 - pixelCrop.x),
            Math.round(0 - safeArea / 2 + image.naturalHeight / 2 - pixelCrop.y)
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const file = new File([blob], imageSrc.name || 'cropped-image.jpg', {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
                resolve(file);
            }, 'image/jpeg', 0.95);
        });
    }, []);

    const handleCropSave = useCallback(async () => {
        if (!croppedAreaPixels) return;

        try {
            const croppedImage = await getCroppedImg(image.src, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    }, [croppedAreaPixels, image.src, getCroppedImg, onCropComplete]);

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Обрезка изображения</h3>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onCancel}
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.aspectInfo}>
                    <span>Соотношение сторон: 770×517 (для новостей)</span>
                </div>

                <div className={styles.cropContainer}>
                    <Cropper
                        image={image.src}
                        crop={crop}
                        zoom={zoom}
                        aspect={NEWS_ASPECT_RATIO}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropCompleteCallback}
                        cropShape="rect"
                        showGrid={true}
                    />
                </div>

                <div className={styles.zoomControls}>
                    <label>Масштаб: {zoom.toFixed(1)}x</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className={styles.zoomSlider}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        className={styles.saveBtn}
                        onClick={handleCropSave}
                        disabled={!croppedAreaPixels}
                    >
                        Применить обрезку
                    </button>
                </div>
            </div>
        </div>
    );
};
