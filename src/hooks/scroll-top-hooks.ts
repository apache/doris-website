import { useCallback, useEffect, useState } from 'react';

export default function useScrollTop(top: number) {
    const [isTop, setIsTop] = useState<boolean>(true);
    const scrollCallback = () => {
        const scrollTop = document.documentElement.scrollTop;
        if (scrollTop > top) {
            setIsTop(false);
        } else {
            setIsTop(true);
        }
    };
    const eventListener = useCallback(e => scrollCallback(), []);
    useEffect(() => {
        scrollCallback();
        document.addEventListener('scroll', eventListener);
        return () => {
            document.removeEventListener('scroll', eventListener);
        };
    }, []);
    return { isTop, top };
}
