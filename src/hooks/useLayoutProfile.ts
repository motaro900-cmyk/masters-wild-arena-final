import { useState, useEffect } from 'react';

export type LayoutProfile = 'MOBILE' | 'TABLET' | 'SMALL_DESKTOP' | 'DESKTOP';

export const useLayoutProfile = (): LayoutProfile => {
    const [profile, setProfile] = useState<LayoutProfile>('DESKTOP');

    useEffect(() => {
        const updateProfile = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setProfile('MOBILE');
            } else if (width < 1100) {
                setProfile('TABLET');
            } else if (width < 1400) {
                setProfile('SMALL_DESKTOP');
            } else {
                setProfile('DESKTOP');
            }
        };

        updateProfile();
        window.addEventListener('resize', updateProfile);
        return () => window.removeEventListener('resize', updateProfile);
    }, []);

    return profile;
};
