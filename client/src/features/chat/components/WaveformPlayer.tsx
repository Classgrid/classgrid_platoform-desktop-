import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';

interface WaveformPlayerProps {
  url: string;
  fallbackDurationSeconds?: number;
  fileName?: string;
}

function getValidDuration(seconds?: number | null) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return seconds;
}

function getDurationFromFileName(fileName?: string) {
  const match = fileName?.match(/_(\d+)s\.[^.]+$/i);
  if (!match) return null;
  return getValidDuration(Number(match[1]));
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function WaveformPlayer({ url, fallbackDurationSeconds, fileName }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackDuration = getValidDuration(fallbackDurationSeconds) ?? getDurationFromFileName(fileName);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [waveformFailed, setWaveformFailed] = useState(false);
  const [duration, setDuration] = useState(() => fallbackDuration ? formatTime(fallbackDuration) : '0:00');
  const [currentTime, setCurrentTime] = useState('0:00');

  const speeds = [1, 1.5, 2];
  const canControl = isReady || waveformFailed || Boolean(fallbackDuration);

  useEffect(() => {
    if (fallbackDuration) {
      setDuration(formatTime(fallbackDuration));
    }
  }, [fallbackDuration]);

  useEffect(() => {
    const audio = new Audio();
    fallbackAudioRef.current = audio;

    const updateDuration = () => {
      const validDuration = getValidDuration(audio.duration);
      if (validDuration) {
        setDuration(formatTime(validDuration));
      }
    };
    const updateCurrentTime = () => {
      setCurrentTime(formatTime(audio.currentTime || 0));
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime('0:00');
      audio.currentTime = 0;
    };

    audio.preload = 'metadata';
    audio.playbackRate = speed;
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('timeupdate', updateCurrentTime);
    audio.addEventListener('ended', handleEnded);
    audio.src = url;

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('timeupdate', updateCurrentTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeAttribute('src');
      audio.load();
      if (fallbackAudioRef.current === audio) {
        fallbackAudioRef.current = null;
      }
    };
  }, [url]);

  useEffect(() => {
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsReady(false);
    setIsPlaying(false);
    setWaveformFailed(false);
    setCurrentTime('0:00');

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#78716c',
      progressColor: '#3b82f6',
      height: 28,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 0,
      url,
    });

    ws.on('ready', () => {
      setIsReady(true);
      setWaveformFailed(false);
      const validDuration = getValidDuration(ws.getDuration());
      if (validDuration) {
        setDuration(formatTime(validDuration));
      } else if (fallbackDuration) {
        setDuration(formatTime(fallbackDuration));
      }
    });

    ws.on('error', () => {
      setWaveformFailed(true);
      setIsReady(false);
      if (fallbackDuration) {
        setDuration(formatTime(fallbackDuration));
      }
    });

    ws.on('audioprocess', () => {
      const validTime = getValidDuration(ws.getCurrentTime());
      setCurrentTime(formatTime(validTime ?? 0));
    });

    ws.on('seeking', () => {
      const validTime = getValidDuration(ws.getCurrentTime());
      setCurrentTime(formatTime(validTime ?? 0));
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime('0:00');
      ws.seekTo(0);
    });

    wavesurferRef.current = ws;

    return () => {
      wavesurferRef.current = null;
      ws.destroy();
    };
  }, [url, fallbackDuration]);

  const togglePlay = () => {
    if (wavesurferRef.current && isReady && !waveformFailed) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
      setIsPlaying(!isPlaying);
      return;
    }

    const audio = fallbackAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const toggleSpeed = () => {
    const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex] ?? 1;

    if (wavesurferRef.current && isReady && !waveformFailed) {
      wavesurferRef.current.setPlaybackRate(nextSpeed);
    }
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.playbackRate = nextSpeed;
    }
    setSpeed(nextSpeed);
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-3xl bg-background/90 backdrop-blur-sm border border-border w-full max-w-[300px] min-w-[260px] shadow-sm">
      <button
        onClick={togglePlay}
        disabled={!canControl}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-[120px]">
        <div ref={containerRef} className={waveformFailed ? 'hidden' : 'w-full opacity-90'} />
        {waveformFailed && (
          <div className="h-7 flex items-center gap-1 opacity-70">
            {Array.from({ length: 28 }).map((_, index) => (
              <span
                key={index}
                className="w-0.5 rounded-full bg-muted-foreground/70"
                style={{ height: `${8 + ((index * 7) % 18)}px` }}
              />
            ))}
          </div>
        )}
        <div className="flex justify-between items-center mt-1 text-[10px] text-muted-foreground font-semibold px-0.5 tracking-wider">
          <span>{isPlaying ? currentTime : duration}</span>
        </div>
      </div>

      <button
        onClick={toggleSpeed}
        disabled={!canControl}
        className="w-9 h-9 flex items-center justify-center text-[10px] font-bold rounded-full bg-accent text-accent-foreground border border-border shrink-0 hover:bg-accent/80 transition-colors disabled:opacity-50"
      >
        {speed}x
      </button>
    </div>
  );
}