import { useEffect, useState } from 'react';

export default function usePhone() {
    const [isPhone, setIsPhone] = useState<boolean>(false);

    const change = () => {
        const isPhone = window.innerWidth < 996;
        setIsPhone(isPhone);
    };

    useEffect(() => {
        change();
        window.addEventListener('resize', change, false);
        return () => window.removeEventListener('resize', change, false);
    }, []);
    return { isPhone };
}
