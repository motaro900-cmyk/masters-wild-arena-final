import { MusicGlyph } from './PortalGlyphs';
/**
 * PORTAL OST PLAYER (Святилище Звука: Саундтрек Диких Земель)
 * Плеер оригинальных композиций с динамической Canvas-визуализацией спектра,
 * 8 эпическими треками и Anti-Clash изоляцией звука.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { proceduralAudio } from '../../utils/ProceduralAudio';

export interface IOSTTrack {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  duration: string;
  zone: string;
}

export const OST_PLAYLIST: IOSTTrack[] = [
  {
    id: 'ironwood',
    title: 'The Ironwood Threshold',
    subtitle: 'Порог Железного Леса',
    file: '/assets/audio/music/The_Ironwood_Threshold.mp3',
    duration: '03:20',
    zone: 'Врата Цитадели',
  },
  {
    id: 'siege',
    title: 'Dawn of the Siege',
    subtitle: 'Рассвет Осады',
    file: '/assets/audio/music/Dawn_of_the_Siege.mp3',
    duration: '02:30',
    zone: 'Поле Брани',
  },
  {
    id: 'scrolls',
    title: 'Scrolls of the Mountain Pass',
    subtitle: 'Свитки Горного Перевала',
    file: '/assets/audio/music/Scrolls_of_the_Mountain_Pass.mp3',
    duration: '03:32',
    zone: 'Пики Куньлунь',
  },
  {
    id: 'silent_plains',
    title: 'Silent Plains of Honor',
    subtitle: 'Безмолвные Равнины Чести',
    file: '/assets/audio/music/Silent_Plains_of_Honor.mp3',
    duration: '03:42',
    zone: 'Земли Предков',
  },
  {
    id: 'snow_cedar',
    title: 'Snow on the Cedar Path',
    subtitle: 'Снег на Кедровой Тропе',
    file: '/assets/audio/music/Snow_on_the_Cedar_Path.mp3',
    duration: '03:52',
    zone: 'Северная Застава',
  },
  {
    id: 'canopy_weeps',
    title: 'Where the Canopy Weeps',
    subtitle: 'Где Плачут Кроны',
    file: '/assets/audio/music/Where_the_Canopy_Weeps.mp3',
    duration: '03:26',
    zone: 'Древняя Чаща',
  },
  {
    id: 'steel_rests',
    title: 'Where the Steel Rests',
    subtitle: 'Где Покоится Сталь',
    file: '/assets/audio/music/Where_the_Steel_Rests.mp3',
    duration: '03:06',
    zone: 'Кузница Забытых',
  },
  {
    id: 'road_alone',
    title: 'A Long Road Alone',
    subtitle: 'Долгий Одинокий Путь',
    file: '/assets/audio/music/A_Long_Road_Alone.mp3',
    duration: '03:43',
    zone: 'Великая Стена',
  },
];

interface PortalOSTPlayerProps {
  isGameActive?: boolean;
}

export const PortalOSTPlayer: React.FC<PortalOSTPlayerProps> = ({ isGameActive = false }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentTrack = OST_PLAYLIST[currentTrackIndex];

  // Anti-Clash gate: pause when game launches or tab goes inactive
  useEffect(() => {
    if (isGameActive && audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isGameActive, isPlaying]);

  // Handle audio initialization
  useEffect(() => {
    const audio = new Audio(currentTrack.file);
    audio.volume = volume;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      handleNextTrack();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentTrackIndex]);

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    proceduralAudio.playClick(1.0);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleNextTrack = useCallback(() => {
    proceduralAudio.playClick(1.1);
    setCurrentTrackIndex((prev) => (prev + 1) % OST_PLAYLIST.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 100);
  }, []);

  const handlePrevTrack = () => {
    proceduralAudio.playClick(0.9);
    setCurrentTrackIndex((prev) => (prev - 1 + OST_PLAYLIST.length) % OST_PLAYLIST.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 100);
  };

  const handleSelectTrack = (index: number) => {
    proceduralAudio.playClick(1.0);
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  // Canvas spectrum wave visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const barCount = 48;

    const render = () => {
      phase += isPlaying ? 0.08 : 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        // Procedural musical waveform
        const normalized = i / barCount;
        let wave = Math.sin(phase + normalized * Math.PI * 4) * 0.4 + 0.6;
        let harmonic = Math.cos(phase * 1.5 + normalized * Math.PI * 6) * 0.3;
        let energy = (wave + harmonic) * (isPlaying ? 0.85 : 0.2);

        const barHeight = Math.max(4, energy * height * 0.85);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
        grad.addColorStop(0.6, isPlaying ? 'rgba(212, 175, 55, 0.9)' : 'rgba(200, 168, 112, 0.4)');
        grad.addColorStop(1, isPlaying ? '#ffe89e' : '#aa8f65');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section
      id="music"
      style={{
        position: 'relative',
        padding: '90px 24px',
        backgroundColor: '#07050b',
        borderBottom: '1px solid rgba(200, 168, 112, 0.15)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '30px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#d4af37',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <MusicGlyph size={16} color="#d4af37" glow /> СВЯТИЛИЩЕ ЗВУКА & САУНДТРЕК
          </div>
          <h2
            style={{
              margin: '0 0 14px 0',
              fontFamily: "'Philosopher', 'Philosopher', serif",
              fontSize: 'clamp(28px, 4vw, 42px)',
              color: '#f9f5ea',
              textShadow: '0 4px 14px rgba(0,0,0,0.8)',
            }}
          >
            Оркестровое Эхо Диких Земель
          </h2>
          <p style={{ margin: '0 auto', maxWidth: '640px', fontSize: '15px', color: '#a39886', lineHeight: 1.6 }}>
            8 оригинальных инструментальных тем, записанных для погружения в атмосферу северных перевалов,
            храмовых святилищ и яростных штурмов.
          </p>
        </div>

        {/* Player Grid (Current Track Center + Interactive Spectrum + Playlist) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '30px',
            background: 'linear-gradient(135deg, rgba(20, 15, 25, 0.8) 0%, rgba(10, 8, 15, 0.95) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(212, 175, 55, 0.1)',
          }}
        >
          {/* Left: Active Track Display & Spectrum Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPlaying ? '#10b981' : '#6b7280' }} />
                <span style={{ fontSize: '12px', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Локация: {currentTrack.zone}
                </span>
              </div>
              <h3
                style={{
                  margin: '0 0 6px 0',
                  fontFamily: "'Philosopher', serif",
                  fontSize: '26px',
                  color: '#ffe599',
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                }}
              >
                {currentTrack.title}
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#bcaea0', fontStyle: 'italic' }}>
                {currentTrack.subtitle}
              </p>
            </div>

            {/* Real-time Spectrum Visualizer Canvas */}
            <div
              style={{
                margin: '24px 0',
                padding: '14px',
                background: 'rgba(5, 4, 8, 0.85)',
                borderRadius: '14px',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
              }}
            >
              <canvas
                ref={canvasRef}
                width={480}
                height={90}
                style={{ width: '100%', height: '90px', display: 'block' }}
              />
            </div>

            {/* Scrub Bar & Controls */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: '#9c8e7e', width: '40px' }}>
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    flex: 1,
                    accentColor: '#d4af37',
                    cursor: 'pointer',
                    height: '5px',
                  }}
                />
                <span style={{ fontSize: '12px', color: '#9c8e7e', width: '40px', textAlign: 'right' }}>
                  {formatTime(duration)}
                </span>
              </div>

              {/* Main Button Deck */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Prev */}
                  <button
                    onClick={handlePrevTrack}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: '#d4af37',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ⏮
                  </button>

                  {/* Play / Pause Primary */}
                  <button
                    onClick={togglePlay}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #d4af37 0%, #aa8022 100%)',
                      border: 'none',
                      color: '#120d05',
                      fontSize: '22px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(212, 175, 55, 0.45)',
                      transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>

                  {/* Next */}
                  <button
                    onClick={handleNextTrack}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      color: '#d4af37',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ⏭
                  </button>
                </div>

                {/* Volume slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#c4b5a2' }}></span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{
                      width: '80px',
                      accentColor: '#d4af37',
                      cursor: 'pointer',
                      height: '4px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Full 8-track Interactive Playlist */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '360px',
              overflowY: 'auto',
              paddingRight: '6px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#d4af37',
                marginBottom: '4px',
                fontWeight: 700,
              }}
            >
              Плейлист Саундтрека ({OST_PLAYLIST.length} треков)
            </div>

            {OST_PLAYLIST.map((track, idx) => {
              const isCurrent = currentTrackIndex === idx;
              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isCurrent
                      ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.22) 0%, rgba(20, 15, 25, 0.6) 100%)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isCurrent
                      ? '1px solid rgba(212, 175, 55, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        color: isCurrent ? '#d4af37' : '#73685c',
                        fontWeight: 700,
                        width: '20px',
                      }}
                    >
                      {isCurrent && isPlaying ? '▶' : (idx + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? '#ffe599' : '#e0d4c3',
                        }}
                      >
                        {track.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8c7e6f' }}>
                        {track.subtitle}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#8c7e6f' }}>
                    {track.duration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
