import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomVideoPlayerProps {
  url: string;
  title?: string;
  poster?: string;
}

const formatTime = (s: number) => {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
};

export function CustomVideoPlayer({ url, title, poster }: CustomVideoPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Progress & Time
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  // Volume slider
  const [volumeSlider, setVolumeSlider] = useState(false);
  const [volume, setVolume] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = muted;
    vid.volume = volume;
    if (playing) {
      vid.play().catch(() => setPlaying(false));
    } else {
      vid.pause();
    }
  }, [playing, muted, volume]);

  useEffect(() => {
    const cb = () =>
      setFullscreen(
        !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
      );
    document.addEventListener("fullscreenchange", cb);
    document.addEventListener("webkitfullscreenchange", cb);
    return () => {
      document.removeEventListener("fullscreenchange", cb);
      document.removeEventListener("webkitfullscreenchange", cb);
    };
  }, []);

  const onTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    if (seeking) return;
    setCurrentTime(vid.currentTime);
    if (vid.duration) setProgress((vid.currentTime / vid.duration) * 100);

    if (vid.buffered.length > 0) {
      const end = vid.buffered.end(vid.buffered.length - 1);
      setBuffered((end / vid.duration) * 100);
    }
  };

  const onLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (e.currentTarget) setDuration(e.currentTarget.duration);
  };

  const onEnded = () => {
    setPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const bar = e.currentTarget;
    const vid = videoRef.current;
    if (!bar || !vid || !vid.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vid.currentTime = pct * vid.duration;
    setProgress(pct * 100);
    setCurrentTime(pct * vid.duration);
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const doc = document as any;
    if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlaying((p) => !p);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((m) => !m);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none flex flex-col justify-center"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        muted={muted}
        playsInline
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className="h-full w-full object-contain"
        aria-label={title || "Video"}
      />

      {/* Dark gradient at bottom for control readability */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Big centered play button when paused */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-black/70 text-white shadow-2xl backdrop-blur-sm border border-white/10">
              <Play className="ml-1.5 h-8 w-8" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls bar */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          className="relative mx-3 mb-1 py-3 cursor-pointer group/bar"
          onClick={handleSeek}
          onMouseDown={() => setSeeking(true)}
          onMouseUp={() => setSeeking(false)}
          onMouseLeave={() => setSeeking(false)}
        >
          <div className="relative h-[3px] rounded-full bg-white/25 transition-all group-hover/bar:h-[5px]">
            {/* Buffered */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/30"
              style={{ width: `${buffered}%` }}
            />
            {/* Progress */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-emerald-500 opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-md"
              style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1 text-white">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={togglePlay}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center gap-1 group/vol"
              onMouseEnter={() => setVolumeSlider(true)}
              onMouseLeave={() => setVolumeSlider(false)}
            >
              <button
                onClick={toggleMute}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  volumeSlider ? "w-16 md:w-20 opacity-100" : "w-0 opacity-0"
                )}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (v > 0 && muted) setMuted(false);
                    if (v === 0) setMuted(true);
                  }}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
                />
              </div>
            </div>

            <span className="text-[11px] md:text-xs font-medium tabular-nums tracking-wide text-white/90 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
