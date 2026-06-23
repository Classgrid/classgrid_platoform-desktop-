"use client";

import { useEffect, useRef } from "react";
import createGlobe, { type Globe as CobeGlobe } from "cobe";
import { cn } from "@/lib/utils";

type GlobeProps = {
  className?: string;
  showLabel?: boolean;
};

const GLOBE_SCALE = 1.06;
const GLOBE_RADIUS = 1200 * ((0.8 * GLOBE_SCALE) / 2);
const GLOBE_COLOR = "#171717";

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.replace("#", "");

  return [
    parseInt(value.slice(0, 2), 16) / 255,
    parseInt(value.slice(2, 4), 16) / 255,
    parseInt(value.slice(4, 6), 16) / 255,
  ];
};

const globeBaseTint = hexToRgb(GLOBE_COLOR).map((channel) => channel * 9.85) as [
  number,
  number,
  number,
];

const projectLocation = (lat: number, lon: number, phi: number, theta: number) => {
  const latRad = lat * (Math.PI / 180);
  const lonRad = lon * (Math.PI / 180) - Math.PI;

  const sx = -Math.cos(latRad) * Math.cos(lonRad);
  const sy = Math.sin(latRad);
  const sz = Math.cos(latRad) * Math.sin(lonRad);

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const fx = sx * cosPhi + sz * sinPhi;
  const fy = sx * (sinPhi * sinTheta) + sy * cosTheta + sz * (-cosPhi * sinTheta);
  const fz = sx * (-sinPhi * cosTheta) + sy * sinTheta + sz * (cosPhi * cosTheta);

  return {
    x: 600 + fx * GLOBE_RADIUS,
    y: 600 - fy * GLOBE_RADIUS,
    z: fz,
  };
};

export default function Globe({ className, showLabel = false }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!container || !canvas || !overlay) return;

    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    let globe: CobeGlobe | null = null;
    let animationFrame = 0;
    let currentPhi = 0;
    const theta = 0;

    overlay.width = 1200;
    overlay.height = 1200;

    globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0.15,
      dark: 1,
      diffuse: 1.18,
      scale: GLOBE_SCALE,
      mapSamples: 16000,
      mapBrightness: 3.45,
      mapBaseBrightness: 0,
      baseColor: globeBaseTint,
      markerColor: [1, 1, 1],
      glowColor: [0.82, 0.82, 0.82],
      markers: [],
    });

    const cobeWrapper = canvas.parentElement;
    if (cobeWrapper && cobeWrapper !== container) {
      cobeWrapper.style.position = "absolute";
      cobeWrapper.style.inset = "0";
      cobeWrapper.style.width = "100%";
      cobeWrapper.style.height = "100%";
      cobeWrapper.style.pointerEvents = "none";
    }

    const renderOverlay = () => {
      ctx.clearRect(0, 0, 1200, 1200);

      if (!showLabel) return;

      // Pointing the label at the Central India marker
      const marker = projectLocation(21.1458, 79.0882, currentPhi, theta);
      if (marker.z <= 0.05) return;

      const text = "INDIA";
      ctx.font = "bold 22px 'Inter', sans-serif";
      const metrics = ctx.measureText(text);
      const padX = 10;
      const padY = 6;
      const boxW = metrics.width + padX * 2;
      const boxH = 22 + padY * 2;
      const boxX = marker.x - boxW / 2;
      const boxY = marker.y - boxH - 16;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(marker.x, marker.y - 4);
      ctx.lineTo(marker.x, boxY + boxH);
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 4);
      ctx.fill();

      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, marker.x, boxY + boxH / 2);
    };

    const animate = () => {
      currentPhi += 0.005;
      globe?.update({ phi: currentPhi, theta });
      renderOverlay();
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      globe?.destroy();
      if (cobeWrapper && cobeWrapper !== container && cobeWrapper.contains(canvas)) {
        container.appendChild(canvas);
        cobeWrapper.remove();
      }
    };
  }, [showLabel]);

  return (
    <div
      ref={containerRef}
      className={cn("relative flex items-center justify-center", className)}
      style={{
        width: "min(650px, 100%)",
        aspectRatio: "1 / 1",
        maxWidth: "100%",
        isolation: "isolate",
      }}
    >
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          aspectRatio: 1,
          pointerEvents: "none",
          zIndex: 30,
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          aspectRatio: 1,
          pointerEvents: "none",
        }}
        className="z-10 opacity-100 pointer-events-none"
      />
    </div>
  );
}
