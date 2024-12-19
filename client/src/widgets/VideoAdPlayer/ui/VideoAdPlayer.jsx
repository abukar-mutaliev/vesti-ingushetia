import { useEffect, useState, useRef, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    selectAllActiveVideoAds,
    selectVideoAdLoading,
    selectVideoAdError,
} from '@entities/videoAd/model/videoAdSelectors';
import {
    fetchAllActiveVideoAds,
} from '@entities/videoAd/model/videoAdSlice';
import { Loader } from '@shared/ui/Loader/index.js';
import defaultImg from '@assets/default.jpg';
import styles from './VideoAdPlayer.module.scss';
import { FaVolumeMute } from 'react-icons/fa';
import { FaVolumeHigh } from 'react-icons/fa6';

export const VideoAdPlayer = memo(() => {
    const dispatch = useDispatch();
    const videoAds = useSelector(selectAllActiveVideoAds);
    const loading = useSelector(selectVideoAdLoading);
    const error = useSelector(selectVideoAdError);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showMuteButton, setShowMuteButton] = useState(false);
    const [isVideoVisible, setIsVideoVisible] = useState(false);
    const videoRef = useRef(null);
    const observerRef = useRef(null);


    useEffect(() => {
        dispatch(fetchAllActiveVideoAds());
    }, [dispatch]);

    useEffect(() => {
        if (videoAds.length > 0 && videoRef.current && isVideoVisible) {
            videoRef.current.play().catch((err) => {
                console.error('Ошибка воспроизведения видео:', err);
            });
            videoRef.current.muted = isMuted;
        }
    }, [videoAds, currentAdIndex, isVideoVisible, isMuted]);

    useEffect(() => {
        const currentVideo = videoRef.current;

        if (!currentVideo) return;

        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                setIsVideoVisible(entry.isIntersecting);
            },
            {
                threshold: 0.5,
            }
        );

        observerRef.current.observe(currentVideo);

        return () => {
            if (observerRef.current && currentVideo) {
                observerRef.current.unobserve(currentVideo);
                observerRef.current.disconnect();
            }
        };
    }, []);

    const handleVideoEnded = () => {
        console.log('Видео закончилось');
        if (videoAds.length === 1) {
            // Если одно видео, повторяем его
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch((err) => {
                    console.error('Ошибка воспроизведения видео:', err);
                });
            }
        } else {
            setCurrentAdIndex((prevIndex) => (prevIndex + 1) % videoAds.length);
        }
    };

    const toggleMute = () => {
        setIsMuted((prevMuted) => !prevMuted);
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
        }
    };

    if (loading) return <Loader />;

    if (error) {
        return (
            <div className={styles.videoAdPlayer}>
                <p>Ошибка: {error.message || 'Неизвестная ошибка'}</p>
            </div>
        );
    }

    if (videoAds.length === 0) {
        return (
            <div className={styles.videoAdPlayer}>
                <img
                    src={defaultImg}
                    alt="Нет доступной рекламы"
                    className={styles.defaultImage}
                />
            </div>
        );
    }

    const currentAd = videoAds[currentAdIndex];

    return (
        <div
            className={styles.videoAdPlayer}
            onMouseEnter={() => setShowMuteButton(true)}
            onMouseLeave={() => setShowMuteButton(false)}
        >
            <video
                key={currentAdIndex}
                ref={videoRef}
                controls={false}
                onEnded={handleVideoEnded}
                autoPlay
                muted={isMuted}
                loop={videoAds.length === 1}
                className={styles.video}
            >
                <source src={currentAd.url} type="video/mp4" />
                Ваш браузер не поддерживает воспроизведение видео.
            </video>
            {showMuteButton && (
                <button className={styles.muteButton} onClick={toggleMute}>
                    {isMuted ? <FaVolumeMute /> : <FaVolumeHigh />}
                </button>
            )}
        </div>
    );
});
