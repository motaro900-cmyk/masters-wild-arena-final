import { TextStyle } from 'pixi.js';

/**
 * TextStyles — Централизованные стили текста для PixiJS сцен.
 */
export const TextStyles = {
    panelTitle: new TextStyle({
        fontFamily: 'Cinzel, serif',
        fontSize: 22,
        fontWeight: '700',
        fill: '#f0c040',
        dropShadow: {
            color: '#000000',
            distance: 2,
            blur: 6,
            alpha: 0.9,
        },
        letterSpacing: 2,
    }),

    bodyText: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 15,
        fill: '#e8dfc8',
        dropShadow: {
            color: '#000000',
            distance: 1,
            blur: 4,
            alpha: 0.8,
        },
    }),

    parchmentText: new TextStyle({
        fontFamily: 'Nunito, sans-serif',
        fontSize: 14,
        fill: '#3d2a10',
        fontWeight: '600',
    }),

    resourceValue: new TextStyle({
        fontFamily: 'Cinzel, serif',
        fontSize: 18,
        fontWeight: '700',
        fill: '#f0c040',
        dropShadow: {
            color: '#000000',
            distance: 2,
            blur: 8,
            alpha: 0.9,
        },
    }),

    buttonLabel: new TextStyle({
        fontFamily: 'Cinzel, serif',
        fontSize: 16,
        fontWeight: '700',
        fill: '#fff8e8',
        letterSpacing: 1.5,
        dropShadow: {
            color: '#000000',
            distance: 1,
            blur: 4,
        },
    }),
};
