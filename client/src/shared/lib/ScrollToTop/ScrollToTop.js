import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map();

export const ScrollToTop = () => {
    const { pathname } = useLocation();
    const navigationType = useNavigationType();
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (navigationType === 'POP') {
            const savedPosition = scrollPositions.get(pathname);
            if (savedPosition !== undefined) {
                window.scrollTo(0, savedPosition);
            }
            return;
        }

        if (!isFirstRender.current) {
            window.scrollTo(0, 0);
        }
    }, [pathname, navigationType]);

    useEffect(() => {
        isFirstRender.current = false;

        return () => {
            scrollPositions.set(pathname, window.scrollY);
        };
    }, [pathname]);

    return null;
};
