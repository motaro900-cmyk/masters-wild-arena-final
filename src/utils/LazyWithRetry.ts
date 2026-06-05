import React from 'react';

/**
 * Обертка для React.lazy, которая автоматически перезагружает страницу
 * при сбое загрузки чанка (например, после деплоя новой версии на Vercel).
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
    componentImport: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
        try {
            const result = await componentImport();
            sessionStorage.removeItem('chunk-failed-reloaded');
            return result;
        } catch (error) {
            console.error('Dynamic import failed, attempting page reload...', error);
            const hasReloaded = sessionStorage.getItem('chunk-failed-reloaded');
            if (!hasReloaded) {
                sessionStorage.setItem('chunk-failed-reloaded', 'true');
                window.location.reload();
                return new Promise(() => {}); // Ждем перезагрузки страницы
            }
            throw error;
        }
    });
}
