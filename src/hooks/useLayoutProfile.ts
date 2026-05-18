import { useState, useEffect } from 'react';

export type LayoutProfile = 'MOBILE' | 'TABLET' | 'SMALL_DESKTOP' | 'DESKTOP';

const getProfile = (): LayoutProfile => {
    if (typeof window === 'undefined') return 'DESKTOP';
    const width = window.innerWidth;
    // Современные телефоны в ландшафтном режиме часто имеют ширину 800-900px.
    // Увеличиваем брейкпоинт до 950px, чтобы они гарантированно получали мобильный лейаут.
    if (width < 950) return 'MOBILE';
    if (width < 1150) return 'TABLET';
    if (width < 1400) return 'SMALL_DESKTOP';
    return 'DESKTOP';
};

export const useLayoutProfile = (): LayoutProfile => {
    const [profile, setProfile] = useState<LayoutProfile>(getProfile);

    useEffect(() => {
        const updateProfile = () => {
            setProfile(getProfile());
        };

        window.addEventListener('resize', updateProfile);
        return () => window.removeEventListener('resize', updateProfile);
    }, []);

    return profile;
};
