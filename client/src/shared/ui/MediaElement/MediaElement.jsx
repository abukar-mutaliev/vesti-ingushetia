import { useEffect, useMemo, useState } from 'react';
import { FaPlayCircle } from 'react-icons/fa';
import defaultImage from '@assets/default.jpg';
import { getVideoThumbnailUrl } from '@shared/lib/getVideoThumbnailUrl/getVideoThumbnailUrl.js';
import PropTypes from 'prop-types';
import styles from './MediaElement.module.scss';

export const MediaElement = ({
                                 imageUrl = null,
                                 videoUrl = null,
                                 alt,
                                 className = '',
                                 playIconSize = 30,
                                 showPlayIcon = true,
                                 onError = () => {},
                             }) => {
    const hasVideo = useMemo(() => Boolean(videoUrl), [videoUrl]);
    const [useHighQuality, setUseHighQuality] = useState(true);
    const [imageLoadError, setImageLoadError] = useState(false);

    const videoPosterUrl = useMemo(() => {
        return hasVideo ? getVideoThumbnailUrl(videoUrl) : null;
    }, [hasVideo, videoUrl]);

    // ИСПРАВЛЕНО: правильная обработка URL изображений
    const processedImageUrl = useMemo(() => {
        if (!imageUrl) return null;

        console.log('🖼️ [MediaElement] Обработка imageUrl:', imageUrl);

        // Если это уже полный URL
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            console.log('   ✅ Полный URL:', imageUrl);
            return imageUrl;
        }

        // Если это относительный путь
        if (imageUrl.startsWith('uploads/')) {
            // Убираем начальный слеш если есть
            const cleanPath = imageUrl.replace(/^\/+/, '');
            const fullUrl = `${window.location.origin}/${cleanPath}`;
            console.log('   🔧 Преобразован в полный URL:', fullUrl);
            return fullUrl;
        }

        // Если путь не начинается с uploads/, добавляем его
        if (!imageUrl.startsWith('/uploads/')) {
            const fullUrl = `${window.location.origin}/uploads/images/${imageUrl}`;
            console.log('   🔧 Добавлен базовый путь:', fullUrl);
            return fullUrl;
        }

        // Fallback - просто добавляем домен
        const fallbackUrl = `${window.location.origin}${imageUrl}`;
        console.log('   🔧 Fallback URL:', fallbackUrl);
        return fallbackUrl;
    }, [imageUrl]);

    useEffect(() => {
        if (hasVideo && videoPosterUrl) {
            const img = new Image();
            img.src = videoPosterUrl.highQuality;
        }
    }, [hasVideo, videoPosterUrl]);

    const src = useMemo(() => {
        if (hasVideo && videoPosterUrl) {
            const videoSrc = useHighQuality ? videoPosterUrl.highQuality : videoPosterUrl.fallback;
            console.log('🎥 [MediaElement] Используем видео постер:', videoSrc);
            return videoSrc;
        }

        const imageSrc = processedImageUrl || defaultImage;
        console.log('🖼️ [MediaElement] Финальный src:', imageSrc);
        return imageSrc;
    }, [hasVideo, videoPosterUrl, processedImageUrl, useHighQuality]);

    const handleImageError = (e) => {
        console.error('❌ [MediaElement] Ошибка загрузки изображения:', {
            src: e.target.src,
            originalImageUrl: imageUrl,
            hasVideo,
            useHighQuality
        });

        if (hasVideo && useHighQuality) {
            console.log('🔄 [MediaElement] Переключаемся на низкое качество видео постера');
            setUseHighQuality(false);
            return;
        }

        if (!imageLoadError) {
            setImageLoadError(true);

            // Пробуем альтернативные пути
            if (imageUrl && !imageUrl.startsWith('http')) {
                const alternativeUrls = [
                    `${window.location.origin}/${imageUrl}`,
                    `${window.location.origin}/uploads/${imageUrl}`,
                    `${window.location.origin}/uploads/images/${imageUrl.replace('uploads/images/', '')}`,
                ];

                console.log('🔄 [MediaElement] Пробуем альтернативные URL:', alternativeUrls);

                // Пробуем первый альтернативный URL
                if (alternativeUrls[0] !== e.target.src) {
                    e.target.src = alternativeUrls[0];
                    return;
                }
            }
        }

        console.log('🔄 [MediaElement] Используем изображение по умолчанию');
        e.target.src = defaultImage;
        onError(e);
    };

    const handleImageLoad = () => {
        console.log('✅ [MediaElement] Изображение успешно загружено:', src);
    };

    return (
        <div className={`${styles.mediaContainer} ${className}`}>
            <img
                src={src}
                alt={alt}
                className={styles.mediaImage}
                loading="lazy"
                onError={handleImageError}
                onLoad={handleImageLoad}
            />
            {hasVideo && videoPosterUrl && showPlayIcon && (
                <div className={styles.playIcon}>
                    <FaPlayCircle size={playIconSize} />
                </div>
            )}
        </div>
    );
};

MediaElement.propTypes = {
    imageUrl: PropTypes.string,
    videoUrl: PropTypes.string,
    alt: PropTypes.string.isRequired,
    className: PropTypes.string,
    playIconSize: PropTypes.number,
    showPlayIcon: PropTypes.bool,
    onError: PropTypes.func,
};