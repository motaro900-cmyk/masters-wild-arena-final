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

        const ticks = 30; // Increased sample count for high accuracy
        let frameTimes: number[] = [];
        let resolved = false;

        // Safety fallback if animation frames do not trigger (e.g. backgrounded tab)
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve(60); // Default to 60Hz fallback
            }
        }, 1000);

        const step = (timestamp: number) => {
            if (resolved) return;
            frameTimes.push(timestamp);
            if (frameTimes.length > ticks) {
                const deltas: number[] = [];
                for (let i = 1; i < frameTimes.length; i++) {
                    const delta = frameTimes[i] - frameTimes[i - 1];
                    // Skip delays caused by tab suspension/throttling (>150ms)
                    if (delta < 150) {
                        deltas.push(delta);
                    }
                }

                if (deltas.length >= 10) {
                    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
                    const fps = Math.round(1000 / avgDelta);

                    resolved = true;
                    clearTimeout(timeoutId);

                    // Map calculated values to standardized screen refresh rates
                    if (fps > 200) resolve(240);
                    else if (fps > 155) resolve(180);
                    else if (fps > 130) resolve(144);
                    else if (fps > 100) resolve(120);
                    else if (fps > 80) resolve(90);
                    else if (fps > 50) resolve(60);
                    else if (fps > 25) resolve(30);
                    else resolve(fps);
                    return;
                }
                // If we hit an abnormal delay and had to discard frames, reset samples
                frameTimes = [];
            }
            window.requestAnimationFrame(step);
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

            const modelMatch =
                ua.match(/Android.*;\s+([^;)]+)\s+Build/i) || ua.match(/Linux;\s+Android.*;\s+([^;)]+)\)/i);
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
            const ntMap: Record<string, string> = {
                '10.0': 'Windows 10',
                '6.3': 'Windows 8.1',
                '6.2': 'Windows 8',
                '6.1': 'Windows 7',
                '6.0': 'Windows Vista',
                '5.1': 'Windows XP',
            };
            if (match) {
                const ntVersion = match[1];
                os = ntMap[ntVersion] || `Windows NT ${ntVersion}`;
            } else {
                os = 'Windows';
            }
            device = 'PC / Windows';

            // Check for Windows 11 using User-Agent Client Hints if available
            if (os === 'Windows 10' && typeof navigator !== 'undefined' && (navigator as any).userAgentData) {
                const uaData = (navigator as any).userAgentData;
                if (uaData.platform === 'Windows') {
                    try {
                        const values = await uaData.getHighEntropyValues(['platformVersion']);
                        if (values.platformVersion) {
                            const versionParts = values.platformVersion.split('.').map((p: string) => parseInt(p, 10));
                            const major = versionParts[0] || 0;
                            const build = versionParts[2] || 0;
                            if (major >= 13 || (major === 10 && build >= 22000)) {
                                os = 'Windows 11';
                            }
                        }
                    } catch (e) {
                        // ignore and keep Windows 10
                    }
                }
            }
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

        isVK =
            ua.toLowerCase().includes('vkapp') ||
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
            let gl: WebGL2RenderingContext | WebGLRenderingContext | null = canvas.getContext(
                'webgl2',
            ) as WebGL2RenderingContext | null;
            if (gl) {
                webglVersion = 'WebGL2';
            } else {
                gl = (canvas.getContext('webgl') ||
                    canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
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
    const orientation =
        typeof window !== 'undefined' && window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
    const buildHash = typeof __BUILD_TIME__ !== 'undefined' ? `build_${__BUILD_TIME__}` : 'dev';

    const profile: DeviceProfile = {
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
        orientation,
    };

    // Cache the profile globally only if the document is visible,
    // ensuring we run a fresh, accurate refresh rate measurement next time
    // once the tab gains active focus.
    if (typeof document !== 'undefined' && !document.hidden) {
        deviceProfile = profile;
    }

    return profile;
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
            perf_avg_fps: stats.avgFPS.toString(),
            perf_min_fps: stats.minFPS.toString(),
            perf_frame_drops: stats.frameDrops.toString(),
            perf_memory_pressure: stats.memoryPressure.toString(),
            device_model: deviceProfile?.device || 'unknown',
            renderer_active: deviceProfile?.renderer || 'unknown',
        });

        scope.setExtra('stats', stats);
        scope.setExtra('profile', deviceProfile);

        Sentry.captureMessage(
            `Device Performance Report: ${deviceProfile?.device} (${deviceProfile?.renderer}) - Avg FPS: ${stats.avgFPS}`,
            'info',
        );
    });
}

export function getCachedRefreshRate(): number {
    return deviceProfile ? deviceProfile.refreshRate : 60;
}

export function getCachedDeviceProfile(): DeviceProfile | null {
    return deviceProfile;
}
