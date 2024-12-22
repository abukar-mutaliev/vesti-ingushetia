import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import Slider from 'react-slick';
import {
    selectNewsList,
    selectNewsWithVideos,
} from '@entities/news/model/newsSelectors.js';
import { fetchAllNews } from '@entities/news/model/newsSlice.js';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './VideoSlider.module.scss';
import { Loader } from '@shared/ui/Loader/index.js';
import { Link } from 'react-router-dom';
import { MediaElement } from '@shared/ui/MediaElement/MediaElement.jsx';

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

export const VideoSlider = () => {
    const dispatch = useDispatch();
    const newsList = useSelector(selectNewsList, shallowEqual);
    const loading = useSelector((state) => state.news.newsLoading);
    const videoNews = useSelector(selectNewsWithVideos, shallowEqual);

    const isDragging = useRef(false);
    const startX = useRef(0);

    useEffect(() => {
        if (!newsList.length) {
            dispatch(fetchAllNews());
        }
    }, [dispatch, newsList.length, newsList]);

    const handleMouseDown = useCallback((e) => {
        startX.current = e.clientX;
        isDragging.current = false;
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (Math.abs(e.clientX - startX.current) > 5) {
            isDragging.current = true;
        }
    }, []);


    const videoNewsElements = useMemo(() => {
        return videoNews.map((news) => {
            const video = news.mediaFiles.find(
                (media) => media.type === 'video',
            );
            const image = news.mediaFiles.find(
                (media) => media.type === 'image',
            );

            const videoUrl = video?.url || null;

            return (
                <div
                    key={news.id}
                    className={styles.videoCard}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                >
                    <Link
                        to={`/news/${news.id}`}
                        onClick={(e) => {
                            if (isDragging.current) {
                                e.preventDefault();
                            }
                        }}
                        className={styles.link}
                    >
                        <div className={styles.imageWrapper}>
                            <MediaElement
                                imageUrl={image?.url || null}
                                videoUrl={videoUrl}
                                alt={news.title}
                                className={styles.mediaElement}
                                playIconSize={50}
                                onError={() => {}}
                            />

                        </div>
                        <div className={styles.videoInfo}>
                            <h3>{news.title}</h3>
                        </div>
                    </Link>
                </div>
            );
        });
    }, [videoNews, handleMouseDown, handleMouseMove]);

    if (loading || !newsList.length) {
        return (
            <div>
                <Loader />
            </div>
        );
    }

    if (!videoNews.length) {
        return (
            <div className={styles.videoSliderNotFound}>
                Видео новости отсутствуют
            </div>
        );
    }

    return (
        <div className={styles.videoSlider}>
            <h2>ТВ</h2>
            <Slider {...sliderSettings}>{videoNewsElements}</Slider>
        </div>
    );
};
