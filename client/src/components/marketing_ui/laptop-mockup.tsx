"use client";

import { useEffect, useRef, useState } from "react";

type LaptopMockupProps = {
  videoUrl?: string;
  posterUrl?: string;
  title?: string;
};

export function LaptopMockup({
  videoUrl,
  posterUrl = "/dashboards/admin-overview.png",
  title = "Classgrid product demo",
}: LaptopMockupProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const hasVideo = Boolean(videoUrl) && !hasVideoError;

  useEffect(() => {
    if (!hasVideo || !videoRef.current) {
      return;
    }

    let player: { destroy: () => void } | undefined;
    let cancelled = false;

    void import("plyr").then(({ default: Plyr }) => {
      if (cancelled || !videoRef.current) {
        return;
      }

      player = new Plyr(videoRef.current, {
        autoplay: true,
        muted: true,
        hideControls: false,
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "settings",
          "pip",
          "airplay",
          "fullscreen",
        ],
        settings: ["speed", "quality"],
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [hasVideo, videoUrl]);

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="relative w-full overflow-hidden rounded-2xl border-[12px] border-zinc-200 bg-zinc-200 pt-[53%] shadow-2xl ring-1 ring-zinc-300 transition-colors dark:border-zinc-950 dark:bg-zinc-950 dark:ring-zinc-800">
        <div className="absolute inset-0 overflow-hidden rounded-lg bg-zinc-100 transition-colors dark:bg-zinc-900">
          {hasVideo ? (
            <div className="h-full w-full bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                src={videoUrl}
                poster={posterUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                onError={() => setHasVideoError(true)}
              />
            </div>
          ) : (
            <div className="relative h-full w-full">
              <img
                src={posterUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute right-5 bottom-5 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                Upload video in Sanity to play here
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-0 left-1/2 flex h-5 w-48 -translate-x-1/2 items-center justify-center space-x-2 rounded-b-xl bg-zinc-200 transition-colors dark:bg-zinc-950">
          <div className="h-2 w-2 rounded-full border border-zinc-400 bg-zinc-800/80 dark:border-zinc-700/50 dark:bg-zinc-800/80" />
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/50" />
        </div>
      </div>

      <div className="relative mx-auto -mt-1 flex h-6 w-[110%] justify-center rounded-b-2xl border-t border-zinc-400 bg-gradient-to-b from-zinc-300 to-zinc-400 shadow-[0_20px_50px_rgba(0,0,0,0.1)] shadow-2xl transition-colors dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-950 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="mt-0 h-2 w-32 rounded-b-lg bg-zinc-400 transition-colors dark:bg-zinc-700" />
      </div>
    </div>
  );
}
