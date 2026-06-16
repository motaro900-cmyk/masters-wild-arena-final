import * as Sentry from '@sentry/react';

interface GPUMetadata {
    vendor: string;
    renderer: string;
    supportsWebGPU: boolean;
    isWebView: boolean;
    dpr: number;
    screenSize: string;
}

export function getGPUMetadata(): GPUMetadata {
    let vendor = 'unknown';
    let renderer = 'unknown';
    let supportsWebGPU = false;
    let isWebView = false;
    
    if (typeof window !== 'undefined') {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
                    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
                }
            }
        } catch (e) {
            // ignore
        }

        supportsWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
        
        const ua = navigator.userAgent.toLowerCase();
        isWebView = ua.includes('wv') || ua.includes('webview') || ua.includes('vkapp') || ua.includes('messenger');
    }

    return {
        vendor,
        renderer,
        supportsWebGPU,
        isWebView,
        dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        screenSize: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown',
    };
}

/**
 * Инициализация Sentry телеметрии для клиентского мониторинга ошибок.
 * Вызывается один раз при старте приложения.
 */
export function initTelemetry() {
    const gpuMeta = getGPUMetadata();
    console.log('[Telemetry] Graphics & device hardware info:', gpuMeta);

    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn) {
        Sentry.init({
            dsn: sentryDsn,
            integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
            tracesSampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
        });

        // Set global tags for Sentry events
        Sentry.setTag('gpu_vendor', gpuMeta.vendor);
        Sentry.setTag('gpu_renderer', gpuMeta.renderer);
        Sentry.setTag('supports_webgpu', gpuMeta.supportsWebGPU.toString());
        Sentry.setTag('is_webview', gpuMeta.isWebView.toString());
        Sentry.setTag('dpr', gpuMeta.dpr.toString());
        Sentry.setTag('screen_size', gpuMeta.screenSize);

        console.log('[Sentry] Telemetry initialized successfully with hardware tags.');
    } else {
        console.warn('[Sentry] DSN is not provided. Remote error monitoring is disabled.');
    }
}
