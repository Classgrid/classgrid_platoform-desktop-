import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';

interface WaveformPlayerProps {
  url: string;
}

export function WaveformPlayer({ url }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');

  const speeds = [1, 1.5, 2];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#78716c', // stone-500
      progressColor: '#3b82f6', // blue-500
      height: 28,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 0,
      url: url,
    });

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(formatTime(ws.getDuration()));
    });

    ws.on('audioprocess', () => {
      setCurrentTime(formatTime(ws.getCurrentTime()));
    });

    ws.on('seek', () => {
      setCurrentTime(formatTime(ws.getCurrentTime()));
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      ws.seekTo(0);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [url]);

  const togglePlay = () => {
    if (wavesurferRef.current && isReady) {
      if (isPlaying) {
        wavesurferRef.current.pause();
      } else {
        wavesurferRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleSpeed = () => {
    if (wavesurferRef.current && isReady) {
      const nextIndex = (speeds.indexOf(speed) + 1) % speeds.length;
      const nextSpeed = speeds[nextIndex];
      wavesurferRef.current.setPlaybackRate(nextSpeed);
      setSpeed(nextSpeed);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-3xl bg-background/90 backdrop-blur-sm border border-border w-full max-w-[300px] min-w-[260px] shadow-sm">
      <Button 
        onClick={togglePlay} 
        disabled={!isReady}
        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </Button>
      
      <div className="flex-1 flex flex-col justify-center min-w-[120px]">
        <div ref={containerRef} className="w-full opacity-90" />
        <div className="flex justify-between items-center mt-1 text-[10px] text-muted-foreground font-semibold px-0.5 tracking-wider">
          <span>{isPlaying ? currentTime : duration}</span>
        </div>
      </div>

      <Button 
        onClick={toggleSpeed} 
        disabled={!isReady}
        className="w-9 h-9 flex items-center justify-center text-[10px] font-bold rounded-full bg-accent text-accent-foreground border border-border shrink-0 hover:bg-accent/80 transition-colors disabled:opacity-50"
      >
        {speed}x
      </Button>
    </div>
  );
}
