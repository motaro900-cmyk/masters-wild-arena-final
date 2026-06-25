export const isMobileDevice = () =>
    (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) ||
    (typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent));
