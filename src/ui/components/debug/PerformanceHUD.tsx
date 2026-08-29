/**
 * @owner: @Motaro900 / QA & Performance Team
 * @purpose: Real-time Performance HUD for measuring Mobile & WebView FPS, Frame time, Memory Heap, Pixi stats, and API latency.
 */

import React, { useEffect, useState, useRef } from 'react';
import { PixiApp } from '../../../engine/core/PixiApp';

interface PerfMetrics {
    fps: number;
    fpsLow1Pct: number;
    frameTimeMs: number;
    jsHeapMb: number | null;
    pixiChildrenCount: number;
    apiLatencyMs: number | null;
}

export const PerformanceHUD: React.FC = () => {
    const [isVisible] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return window.location.search.includes('perf=true') || localStorage.getItem('DEV_PERF_HUD') === 'true';
        }
        return false;
    });

    const [metrics, setMetrics] = useState<PerfMetrics>({
        fps: 60,
        fpsLow1Pct: 60,
        frameTimeMs: 16.6,
        jsHeapMb: null,
        pixiChildrenCount: 0,
        apiLatencyMs: null,
    });

    const frameTimesRef = useRef<number[]>([]);
    const lastFrameTimeRef = useRef<number>(performance.now());
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isVisible) return;

        // 1. Measure API Latency periodically
        const measureLatency = async () => {
            const start = performance.now();
            try {
                const res = await fetch('/api/time');
                if (res.ok) {
                    const elapsed = Math.round(performance.now() - start);
                    setMetrics((m) => ({ ...m, apiLatencyMs: elapsed }));
                }
            } catch {
                setMetrics((m) => ({ ...m, apiLatencyMs: null }));
            }
        };

        measureLatency();
        const latencyInterval = setInterval(measureLatency, 5000);

        // 2. Measure FPS, Frame Time, and 1% low via RAF
        const updatePerf = (now: number) => {
            const delta = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;

            if (delta > 0 && delta < 200) {
                frameTimesRef.current.push(delta);
                if (frameTimesRef.current.length > 60) {
                    frameTimesRef.current.shift();
                }
            }

            rafIdRef.current = requestAnimationFrame(updatePerf);
        };

        rafIdRef.current = requestAnimationFrame(updatePerf);

        // 3. Aggregate metrics every 500ms
        const aggInterval = setInterval(() => {
            const frames = frameTimesRef.current;
            if (frames.length === 0) return;

            const avgDelta = frames.reduce((a, b) => a + b, 0) / frames.length;
            const currentFps = Math.round(1000 / avgDelta);

            // Calculate 1% low (99th percentile of frame times)
            const sortedTimes = [...frames].sort((a, b) => b - a);
            const p99Index = Math.floor(sortedTimes.length * 0.1); // Worst 10% for short window
            const worstTime = sortedTimes[p99Index] || avgDelta;
            const low1Pct = Math.round(1000 / worstTime);

            // Memory Heap (Chrome / Chromium)
            let heapMb: number | null = null;
            if ((performance as any).memory?.usedJSHeapSize) {
                heapMb = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
            }

            // Pixi Stage count
            let childCount = 0;
            try {
                const pixi = PixiApp.getInstance();
                const app = (pixi as any).pixiApp;
                if (app && app.stage) {
                    childCount = app.stage.children?.length || 0;
                }
            } catch {}

            setMetrics((prev) => ({
                ...prev,
                fps: Math.min(144, currentFps),
                fpsLow1Pct: Math.min(144, low1Pct),
                frameTimeMs: parseFloat(avgDelta.toFixed(1)),
                jsHeapMb: heapMb,
                pixiChildrenCount: childCount,
            }));
        }, 500);

        return () => {
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
            clearInterval(aggInterval);
            clearInterval(latencyInterval);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    const fpsColor = metrics.fps >= 55 ? '#4ade80' : metrics.fps >= 30 ? '#facc15' : '#f87171';

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 8,
                left: 8,
                zIndex: 99999,
                backgroundColor: 'rgba(0, 0, 0, 0.88)',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontFamily: 'monospace',
                fontSize: '11px',
                lineHeight: '1.4',
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                userSelect: 'none',
            }}
        >
            <div style={{ fontWeight: 'bold', color: fpsColor, display: 'flex', justifyContent: 'space-between' }}>
                <span>FPS: {metrics.fps}</span>
                <span style={{ color: '#aaa', marginLeft: '8px' }}>1% low: {metrics.fpsLow1Pct}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Frame: {metrics.frameTimeMs}ms</span>
                {metrics.jsHeapMb !== null && <span style={{ marginLeft: '8px' }}>RAM: {metrics.jsHeapMb}MB</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Pixi Nodes: {metrics.pixiChildrenCount}</span>
                {metrics.apiLatencyMs !== null && <span style={{ marginLeft: '8px' }}>VPS: {metrics.apiLatencyMs}ms</span>}
            </div>
        </div>
    );
};
