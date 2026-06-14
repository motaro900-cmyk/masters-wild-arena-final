import React from 'react';

/**
 * lazyWithRetry - обертка над React.lazy, которая автоматически
 * перезагружает страницу один раз при возникновении ошибки загрузки чанка
 * (например, при обновлении билда на Vercel).
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
        const hasRetriedKey = `lazy-retry-${importFn.toString().replace(/[^a-zA-Z0-9]/g, '')}`;
        
        try {
            const result = await importFn();
            sessionStorage.removeItem(hasRetriedKey);
            return result;
        } catch (error) {
            const hasRetried = sessionStorage.getItem(hasRetriedKey);
            
            if (!hasRetried) {
                sessionStorage.setItem(hasRetriedKey, 'true');
                console.warn('⚠️ Chunk loading failed. Retrying page load...', error);
                window.location.reload();
                // Возвращаем бесконечный промис, чтобы предотвратить дальнейший рендер сломанного состояния во время перезагрузки
                return new Promise<{ default: T }>(() => {});
            }
            
            console.error('❌ Chunk loading failed after retry:', error);
            throw error;
        }
    });
}
