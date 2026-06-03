import * as Sentry from '@sentry/react';

/**
 * Инициализация Sentry телеметрии для клиентского мониторинга ошибок.
 * Вызывается один раз при старте приложения.
 */
export function initTelemetry() {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            tracesSampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
        });
        console.log('[Sentry] Telemetry initialized successfully.');
    } else {
        console.warn('[Sentry] DSN is not provided. Remote error monitoring is disabled.');
    }
}
