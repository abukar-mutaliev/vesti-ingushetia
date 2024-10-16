import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Slider from 'react-slick';
import { selectNewsList } from '@entities/news/model/newsSelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import { FaPlayCircle } from 'react-icons/fa';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './VideoSlider.module.scss';

const sliderSettings = {
    className: 'center',
    infinite: true,
    centerPadding: '60px',
    slidesToShow: 4,
    swipeToSlide: true,
    responsive: [
        {
            breakpoint: 1024,
            settings: {
                slidesToShow: 3,
            },
        },
        {
            breakpoint: 768,
            settings: {
                slidesToShow: 2,
            },
        },
        {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
            },
        },
    ],
};

export const VideoSlider = React.memo(() => {
    const dispatch = useDispatch();
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loading = useSelector((state) => state.news.newsLoading);

    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    useEffect(() => {
        if (!newsList.length) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, newsList.length]);

    const handleMouseDown = (e) => {
        setStartX(e.clientX);
        setDragging(false);
    };

    const handleMouseMove = (e) => {
        if (Math.abs(e.clientX - startX) > 5) {
            setDragging(true);
        }
    };

    const handleMouseUp = (e) => {
        if (dragging) {
            e.preventDefault();
        }
        setDragging(false);
    };

    const videoNews = useMemo(() => {
        return newsList.filter((news) =>
            news.mediaFiles?.some((media) => media.type === 'video'),
        );
    }, [newsList]);

    const videoNewsElements = useMemo(() => {
        return videoNews.map((news) => {
            const video = news.mediaFiles.find(
                (media) => media.type === 'video',
            );
            const image = news.mediaFiles.find(
                (media) => media.type === 'image',
            );

            const mediaElement = image ? (
                <img
                    src={`http://localhost:5000/${image.url}`}
                    alt={news.title}
                    className={styles.mediaImage}
                />
            ) : (
                <video
                    src={`http://localhost:5000/${video.url}`}
                    className={styles.mediaVideo}
                    preload="metadata"
                    controls
                />
            );

            return (
                <div
                    key={news.id}
                    className={styles.videoCard}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <a href="#" onClick={(e) => dragging && e.preventDefault()}>
                        <div className={styles.imageWrapper}>
                            {mediaElement}
                            <div className={styles.playButton}>
                                <FaPlayCircle size={50} />
                            </div>
                        </div>
                        <div className={styles.videoInfo}>
                            <h3>{news.title}</h3>
                        </div>
                    </a>
                </div>
            );
        });
    }, [videoNews, dragging]);

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (!videoNews.length) {
        return <div>Видео новости отсутствуют</div>;
    }

    return (
        <div className={styles.videoSlider}>
            <h2 className={styles.sliderTitle}>ТВ</h2>
            <Slider {...sliderSettings}>{videoNewsElements}</Slider>
        </div>
    );
});
