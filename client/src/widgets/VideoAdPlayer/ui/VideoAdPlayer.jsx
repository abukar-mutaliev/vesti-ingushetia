import React, { useEffect, useState, useRef, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllVideoAds } from '@entities/videoAd/model/videoAdSlice';
import {
    selectAllVideoAds,
    selectVideoAdLoading,
} from '@entities/videoAd/model/videoAdSelectors';
import { Loader } from '@shared/ui/Loader/index.js';
import defaultImg from '@assets/default.jpg';
import styles from './VideoAdPlayer.module.scss';
import { FaVolumeMute } from 'react-icons/fa';
import { FaVolumeHigh } from 'react-icons/fa6';

export const VideoAdPlayer = memo(() => {
    const dispatch = useDispatch();
    const videoAds = useSelector(selectAllVideoAds);
    const loading = useSelector(selectVideoAdLoading);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [showMuteButton, setShowMuteButton] = useState(false);
    const [isVideoVisible, setIsVideoVisible] = useState(false);
    const videoRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
        if (!videoAds.length) {
            dispatch(fetchAllVideoAds());
        }
    }, [dispatch, videoAds.length]);

    useEffect(() => {
        if (videoAds.length > 0 && videoRef.current && isVideoVisible) {
            videoRef.current.load();
            videoRef.current.play();
            videoRef.current.muted = isMuted;
        }
    }, [videoAds, currentAdIndex, isVideoVisible, isMuted]);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(([entry]) => {
            setIsVideoVisible(entry.isIntersecting);
        });
        if (videoRef.current) {
            observerRef.current.observe(videoRef.current);
        }

        return () => {
            if (observerRef.current && videoRef.current) {
                observerRef.current.unobserve(videoRef.current);
            }
        };
    }, []);

    const handleVideoEnded = () => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % videoAds.length);
    };

    const toggleMute = () => {
        setIsMuted((prevMuted) => !prevMuted);
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
        }
    };

    if (loading) return <Loader />;

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
                ref={videoRef}
                controls={false}
                onEnded={handleVideoEnded}
                autoPlay
                muted={isMuted}
                loop
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
