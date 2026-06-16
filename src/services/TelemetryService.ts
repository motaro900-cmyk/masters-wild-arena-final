import * as Sentry from '@sentry/react';
import { AppConfig } from '../configs/AppConfig';

declare const __BUILD_TIME__: number;

export interface DeviceProfile {
    platform: string;
    device: string;
    os: string;
    browser: string;
    gpuVendor: string;
    gpuRenderer: string;
    cpuCores: number;
    memory: string; // e.g. "8 GB" or "Unknown"
    screen: string;
    refreshRate: number;
    renderer: string; // Will be updated by PixiApp
    webglVersion: string;
    maxTextureSize: number;
    antialias: boolean;
    webgpuSupported: boolean;
    shaderPrecision: string;
    gameVersion: string;
    buildHash: string;
    vkWebView: boolean;
    touchDevice: boolean;
    orientation: 'portrait' | 'landscape';
}

let deviceProfile: DeviceProfile | null = null;

/**
 * Измеряет частоту обновления экрана (Гц) через requestAnimationFrame.
 */
export function measureRefreshRate(): Promise<number> {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.requestAnimationFrame) {
            resolve(60);
            return;
        }

        let start = performance.now();
        let count = 0;
        const ticks = 15;

        const step = () => {
            count++;
            if (count >= ticks) {
                const duration = performance.now() - start;
                const fps = Math.round((ticks * 1000) / duration);
                if (fps > 100) resolve(120);
                else if (fps > 80) resolve(90);
                else if (fps > 50) resolve(60);
                else if (fps > 25) resolve(30);
                else resolve(fps);
            } else {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    });
}

/**
 * Собирает полный Device Profile устройства
 */
export async function getDeviceProfile(): Promise<DeviceProfile> {
    if (deviceProfile) return deviceProfile;

    let platform = 'Unknown';
    let device = 'Unknown Device';
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    let gpuVendor = 'unknown';
    let gpuRenderer = 'unknown';
    let webglVersion = 'none';
    let maxTextureSize = 0;
    let shaderPrecision = 'unknown';
    let isVK = false;
    let refreshRate = 60;

    if (typeof window !== 'undefined') {
        const ua = navigator.userAgent;
        
        // 1. OS & Device parsing
        if (/Android/i.test(ua)) {
            platform = 'Android';
            const match = ua.match(/Android\s+([0-9.]+)/i);
            os = match ? `Android ${match[1]}` : 'Android';
            
            const modelMatch = ua.match(/Android.*;\s+([^;)]+)\s+Build/i) || ua.match(/Linux;\s+Android.*;\s+([^;)]+)\)/i);
            device = modelMatch ? modelMatch[1].trim() : 'Android Device';
        } else if (/iPhone|iPad|iPod/i.test(ua)) {
            platform = /iPad/i.test(ua) ? 'iPadOS' : 'iOS';
            const match = ua.match(/OS\s+([0-9_]+)/i);
            os = match ? `${platform} ${match[1].replace(/_/g, '.')}` : platform;
            device = /iPad/i.test(ua) ? 'iPad' : 'iPhone';
        } else if (/Macintosh/i.test(ua)) {
            if (navigator.maxTouchPoints > 0) {
                platform = 'iPadOS';
                os = 'iPadOS';
                device = 'iPad';
            } else {
                platform = 'macOS';
                const match = ua.match(/Mac OS X\s+([0-9_]+)/i);
                os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
                device = 'Mac';
            }
        } else if (/Windows/i.test(ua)) {
            platform = 'Windows';
            const match = ua.match(/Windows NT\s+([0-9.]+)/i);
            os = match ? `Windows NT ${match[1]}` : 'Windows';
            device = 'PC / Windows';
        } else if (/Linux/i.test(ua)) {
            platform = 'Linux';
            os = 'Linux';
            device = 'PC / Linux';
        }

        // 2. Browser & WebView detection
        if (/Chrome/i.test(ua) && /Safari/i.test(ua)) {
            if (/Edg/i.test(ua)) browser = 'Edge';
            else if (/OPR/i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
            else browser = 'Chrome';
        } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
            browser = 'Safari';
        } else if (/Firefox/i.test(ua)) {
            browser = 'Firefox';
        }

        isVK = ua.toLowerCase().includes('vkapp') || 
               ua.toLowerCase().includes('messenger') || 
               ua.toLowerCase().includes('vkwebview') || 
               (window as any).VK_BRIDGE_VERSION !== undefined;

        if (isVK) {
            const vkMatch = ua.match(/VKWebView\/([0-9.]+)/i) || ua.match(/vkapp\/([0-9.]+)/i);
            browser = vkMatch ? `VK WebView ${vkMatch[1]}` : 'VK WebView';
        }

        // 3. WebGL details
        try {
            const canvas = document.createElement('canvas');
            let gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
            if (gl) {
                webglVersion = 'WebGL2';
            } else {
                gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
                if (gl) {
                    webglVersion = 'WebGL1';
                }
            }

            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
                    gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
                }
                maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
                
                const precisionFormat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
                if (precisionFormat && precisionFormat.precision > 0) {
                    shaderPrecision = 'highp';
                } else {
                    const medFormat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
                    if (medFormat && medFormat.precision > 0) {
                        shaderPrecision = 'mediump';
                    } else {
                        shaderPrecision = 'lowp';
                    }
                }
                // Clean up context immediately
                gl.getExtension('WEBGL_lose_context')?.loseContext();
            }
        } catch (e) {
            // Ignore
        }

        // 4. Refresh rate
        refreshRate = await measureRefreshRate();
    }

    const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    const memoryEstimate = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined;
    const memory = memoryEstimate ? `${memoryEstimate} GB` : 'Unknown';
    const screen = typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown';
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const webgpuSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;
    const touchDevice = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
    const orientation = typeof window !== 'undefined' && window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
    const buildHash = typeof __BUILD_TIME__ !== 'undefined' ? `build_${__BUILD_TIME__}` : 'dev';

    deviceProfile = {
        platform,
        device,
        os,
        browser,
        gpuVendor,
        gpuRenderer,
        cpuCores,
        memory,
        screen: `${screen} (DPR: ${dpr})`,
        refreshRate,
        renderer: 'unknown', // Set dynamically when PixiApp loads
        webglVersion,
        maxTextureSize,
        antialias: true,
        webgpuSupported,
        shaderPrecision,
        gameVersion: AppConfig.VERSION,
        buildHash,
        vkWebView: isVK,
        touchDevice,
        orientation
    };

    return deviceProfile;
}

/**
 * Обновляет тип выбранного рендерера в профиле.
 */
export function updateActiveRenderer(rendererName: string) {
    if (deviceProfile) {
        deviceProfile.renderer = rendererName;
        Sentry.setTag('selected_renderer', rendererName);
    }
}

/**
 * Инициализация Sentry телеметрии для клиентского мониторинга ошибок.
 */
export async function initTelemetry() {
    const profile = await getDeviceProfile();
    console.log('[Telemetry] Device Profile gathered:', profile);

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
        Sentry.setTag('gpu_vendor', profile.gpuVendor);
        Sentry.setTag('gpu_renderer', profile.gpuRenderer);
        Sentry.setTag('supports_webgpu', profile.webgpuSupported.toString());
        Sentry.setTag('is_webview', profile.vkWebView.toString());
        Sentry.setTag('device_model', profile.device);
        Sentry.setTag('os_version', profile.os);
        Sentry.setTag('game_version', profile.gameVersion);
        Sentry.setTag('build_hash', profile.buildHash);
        Sentry.setTag('screen_resolution', profile.screen);
        Sentry.setTag('webgl_version', profile.webglVersion);

        console.log('[Sentry] Telemetry initialized with Sentry tags.');
    } else {
        console.warn('[Sentry] DSN is not provided. Remote error monitoring is disabled.');
    }
}

/**
 * Отправляет в Sentry отчет о производительности устройства ("здоровье").
 */
export function sendPerformanceReport(stats: {
    avgFPS: number;
    minFPS: number;
    frameDrops: number;
    memoryPressure: boolean;
    memoryUsedMb: number;
}) {
    if (!deviceProfile) return;

    console.log('[Telemetry] Sending Device Health / Performance report:', stats);

    Sentry.withScope((scope) => {
        scope.setTags({
            'perf_avg_fps': stats.avgFPS.toString(),
            'perf_min_fps': stats.minFPS.toString(),
            'perf_frame_drops': stats.frameDrops.toString(),
            'perf_memory_pressure': stats.memoryPressure.toString(),
            'device_model': deviceProfile?.device || 'unknown',
            'renderer_active': deviceProfile?.renderer || 'unknown',
        });
        
        scope.setExtra('stats', stats);
        scope.setExtra('profile', deviceProfile);

        Sentry.captureMessage(
            `Device Performance Report: ${deviceProfile?.device} (${deviceProfile?.renderer}) - Avg FPS: ${stats.avgFPS}`,
            'info'
        );
    });
}
