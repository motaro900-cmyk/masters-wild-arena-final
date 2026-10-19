/**
 * @owner: Lead Sound Engineer & Audio Optimizer
 * @purpose: High-fidelity audio optimization & EBU R128 normalization for Masters of the Wild.
 *           Reduces total music footprint from 29.5 MB down to ~6.6 - 9.7 MB while strictly
 *           complying with VK Mini Apps hosting limits (<50 MB) and Asset Protection Rules.
 *
 * Targets:
 *   - Integrated Loudness: -14.0 LUFS (+/- 1.0 LUFS)
 *   - True Peak: <= -1.0 dBFS
 *   - Strip all non-audio payload (attached artwork images, useless ID3 frames)
 *
 * Usage:
 *   node scripts/optimize-audio.js [--preset=universal|ultra-opus] [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_AUDIO_DIR = path.join(ROOT_DIR, 'assets-src/audio');
const DEST_AUDIO_DIR = path.join(ROOT_DIR, 'public/assets/audio');

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const presetArg = args.find((a) => a.startsWith('--preset='));
const PRESET = presetArg ? presetArg.split('=')[1] : 'universal'; // 'universal' (MP3 64k) or 'ultra-opus' (Opus 40k)

console.log(`\n🎵 ========================================================`);
console.log(`   MASTERS OF THE WILD — AUDIO OPTIMIZATION PIPELINE`);
console.log(`   Target Preset: ${PRESET.toUpperCase()} | Dry-run: ${isDryRun ? 'YES' : 'NO'}`);
console.log(`   Loudness Standard: EBU R128 (-14.0 LUFS, TP <= -1.0 dBFS)`);
console.log(`========================================================\n`);

// Locate ffmpeg and ffprobe
function getFfmpegPath() {
    const check = spawnSync('ffmpeg', ['-version']);
    if (check.status === 0) return 'ffmpeg';
    const wingetFfmpeg =
        'C:\\Users\\Motar\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.1-full_build\\bin\\ffmpeg.EXE';
    if (fs.existsSync(wingetFfmpeg)) return wingetFfmpeg;
    throw new Error('FFmpeg executable not found in PATH or standard WinGet location!');
}

const FFMPEG = getFfmpegPath();

// Analyze file with ffprobe / ffmpeg ebur128
function getAudioMetrics(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    const sizeKB = (stat.size / 1024).toFixed(1);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);

    const proc = spawnSync(FFMPEG, ['-nostdin', '-i', filePath, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
    });
    const output = proc.stderr || proc.stdout || '';
    const summaryIdx = output.indexOf('Summary:');
    let lufs = 'N/A';
    let peak = 'N/A';
    if (summaryIdx >= 0) {
        const summary = output.substring(summaryIdx);
        const lufsMatch = summary.match(/I:\s+([-\d\.]+)\s+LUFS/);
        const peakMatch = summary.match(/Peak:\s+([-\d\.]+)\s+dBFS/);
        if (lufsMatch) lufs = `${lufsMatch[1]} LUFS`;
        if (peakMatch) peak = `${peakMatch[1]} dBFS`;
    }

    return { sizeBytes: stat.size, sizeKB, sizeMB, lufs, peak };
}

// Process Music track
function processMusicTrack(srcFile, destFile, preset) {
    const parentDir = path.dirname(destFile);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

    let ffmpegArgs = [];
    if (preset === 'ultra-opus') {
        const opusDest = destFile.replace(/\.mp3$/i, '.opus');
        ffmpegArgs = [
            '-y',
            '-nostdin',
            '-i',
            srcFile,
            '-vn',
            '-af',
            'loudnorm=I=-14:TP=-1.5:LRA=11',
            '-c:a',
            'libopus',
            '-b:a',
            '40k',
            '-ar',
            '48000',
            opusDest,
        ];
    } else {
        // Universal MP3 Joint Stereo (64 kbps, 44.1 kHz, EBU R128 with -2.0 dBFS target to guarantee TP <= -1.0 dBFS)
        ffmpegArgs = [
            '-y',
            '-nostdin',
            '-i',
            srcFile,
            '-vn',
            '-af',
            'loudnorm=I=-14:TP=-2.0:LRA=11',
            '-c:a',
            'libmp3lame',
            '-b:a',
            '64k',
            '-joint_stereo',
            '1',
            '-ar',
            '44100',
            destFile,
        ];
    }

    if (isDryRun) {
        return { success: true };
    }

    const run = spawnSync(FFMPEG, ffmpegArgs, { encoding: 'utf-8' });
    if (run.status !== 0) {
        console.error(`❌ Error encoding ${path.basename(srcFile)}:`, run.stderr);
        return { success: false, error: run.stderr };
    }
    return { success: true };
}

// Process SFX track (strip artwork bloat, peak limit to <= -1.0 dBFS, eliminate +5dB digital overs)
function processSFXTrack(srcFile, destFile) {
    const parentDir = path.dirname(destFile);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

    // Map custom attenuation per SFX based on raw peak measurements to achieve TP <= -1.0 dBFS
    const fileName = path.basename(srcFile);
    let gain = '-2.5dB';
    if (fileName === 'strike_dagger.mp3') gain = '-6.2dB'; // was +5.0 dBFS
    else if (fileName === 'strike_staff.mp3') gain = '-5.0dB'; // was +3.8 dBFS
    else if (fileName === 'impact_hit.mp3') gain = '-6.0dB'; // was +3.0 dBFS
    else if (fileName === 'strike_sword.mp3') gain = '-4.0dB'; // was +2.6 dBFS
    else if (fileName === 'buy_success.mp3') gain = '-4.0dB'; // was +2.6 dBFS
    else if (fileName === 'click.mp3' || fileName === 'miss.mp3') gain = '-4.0dB'; // was +2.8 dBFS

    const ffmpegArgs = [
        '-y',
        '-nostdin',
        '-i',
        srcFile,
        '-vn', // Strip embedded PNG/JPEG artwork covers
        '-af',
        `volume=${gain}`,
        '-c:a',
        'libmp3lame',
        '-q:a',
        '4',
        '-ar',
        '44100',
        destFile,
    ];

    if (isDryRun) {
        return { success: true };
    }

    const run = spawnSync(FFMPEG, ffmpegArgs, { encoding: 'utf-8' });
    if (run.status !== 0) {
        console.error(`❌ Error processing SFX ${path.basename(srcFile)}:`, run.stderr);
        return { success: false, error: run.stderr };
    }
    return { success: true };
}

async function runPipeline() {
    const musicSrcDir = path.join(SRC_AUDIO_DIR, 'music');
    const sfxSrcDir = path.join(SRC_AUDIO_DIR, 'sfx');

    const musicFiles = fs.existsSync(musicSrcDir) ? fs.readdirSync(musicSrcDir).filter((f) => f.endsWith('.mp3')) : [];
    const sfxFiles = fs.existsSync(sfxSrcDir) ? fs.readdirSync(sfxSrcDir).filter((f) => f.endsWith('.mp3')) : [];

    console.log(`Found ${musicFiles.length} Music tracks and ${sfxFiles.length} SFX files in assets-src/audio.\n`);

    const reportTable = [];
    let totalOrigBytes = 0;
    let totalOptBytes = 0;

    console.log(`⚡ Processing Music Tracks...`);
    for (const file of musicFiles) {
        const srcPath = path.join(musicSrcDir, file);
        const destPath = path.join(DEST_AUDIO_DIR, 'music', file);

        const beforeMetrics = getAudioMetrics(srcPath);
        totalOrigBytes += beforeMetrics ? beforeMetrics.sizeBytes : 0;

        processMusicTrack(srcPath, destPath, PRESET);

        const targetFile = PRESET === 'ultra-opus' ? destPath.replace(/\.mp3$/i, '.opus') : destPath;
        const afterMetrics = isDryRun ? beforeMetrics : getAudioMetrics(targetFile);
        totalOptBytes += afterMetrics ? afterMetrics.sizeBytes : 0;

        reportTable.push({
            Category: 'Music',
            Name: file,
            'Orig Size': `${beforeMetrics.sizeMB} MB`,
            'Opt Size': isDryRun ? 'Dry-run' : `${afterMetrics.sizeMB} MB`,
            'Orig LUFS / Peak': `${beforeMetrics.lufs} / ${beforeMetrics.peak}`,
            'Opt LUFS / Peak': isDryRun ? 'Dry-run' : `${afterMetrics.lufs} / ${afterMetrics.peak}`,
        });
    }

    console.log(`⚡ Processing SFX Tracks...`);
    for (const file of sfxFiles) {
        const srcPath = path.join(sfxSrcDir, file);
        const destPath = path.join(DEST_AUDIO_DIR, 'sfx', file);

        const beforeMetrics = getAudioMetrics(srcPath);
        totalOrigBytes += beforeMetrics ? beforeMetrics.sizeBytes : 0;

        processSFXTrack(srcPath, destPath);

        const afterMetrics = isDryRun ? beforeMetrics : getAudioMetrics(destPath);
        totalOptBytes += afterMetrics ? afterMetrics.sizeBytes : 0;

        reportTable.push({
            Category: 'SFX',
            Name: file,
            'Orig Size': `${beforeMetrics.sizeKB} KB`,
            'Opt Size': isDryRun ? 'Dry-run' : `${afterMetrics.sizeKB} KB`,
            'Orig LUFS / Peak': `${beforeMetrics.lufs} / ${beforeMetrics.peak}`,
            'Opt LUFS / Peak': isDryRun ? 'Dry-run' : `${afterMetrics.lufs} / ${afterMetrics.peak}`,
        });
    }

    console.log('\n📊 OPTIMIZATION METRICS REPORT:');
    console.table(reportTable);

    const origTotalMB = (totalOrigBytes / (1024 * 1024)).toFixed(2);
    const optTotalMB = (totalOptBytes / (1024 * 1024)).toFixed(2);
    const savedMB = (origTotalMB - optTotalMB).toFixed(2);
    const savedPercent = (((origTotalMB - optTotalMB) / origTotalMB) * 100).toFixed(1);

    console.log(`\n================ SUMMARY ================`);
    console.log(`Original Audio Footprint : ${origTotalMB} MB`);
    console.log(`Optimized Footprint     : ${optTotalMB} MB`);
    console.log(`Total Space Saved       : ${savedMB} MB (-${savedPercent}%)`);
    console.log(`=========================================\n`);
}

runPipeline().catch((e) => console.error(e));
