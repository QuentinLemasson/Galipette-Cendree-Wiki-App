"use client";

import { useCallback, useEffect, useState } from "react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocity: {
    x: number;
    y: number;
  };
}

export function SparklesCursor() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const createSparkle = useCallback((x: number, y: number) => {
    return {
      id: Math.random(),
      x,
      y,
      size: Math.random() * 16 + 8, // Bigger size between 8-28px
      opacity: 1,
      velocity: {
        x: (Math.random() - 0.5) * 3, // Random horizontal movement
        y: (Math.random() - 0.2) * 2, // Downward movement
      },
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastSparkleTime = 0;
    const SPARKLE_INTERVAL = 50; // Adjust this value to control sparkle frequency

    const updateSparkles = () => {
      setSparkles(prevSparkles =>
        prevSparkles
          .map(sparkle => ({
            ...sparkle,
            x: sparkle.x + sparkle.velocity.x,
            y: sparkle.y + sparkle.velocity.y,
            opacity: sparkle.opacity - 0.02,
          }))
          .filter(sparkle => sparkle.opacity > 0)
      );
      animationFrameId = requestAnimationFrame(updateSparkles);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      setCursor({ x: e.clientX, y: e.clientY });

      // Check if cursor is over a clickable element
      const target = e.target as HTMLElement;
      const isClickable =
        target.matches('a, button, [role="button"], input, select, textarea') ||
        window.getComputedStyle(target).cursor === "pointer";
      setIsHovering(isClickable);

      // Add new sparkles with rate limiting
      if (currentTime - lastSparkleTime > SPARKLE_INTERVAL) {
        setSparkles(prev => [
          ...prev,
          createSparkle(e.clientX, e.clientY),
          createSparkle(e.clientX, e.clientY), // Create multiple sparkles per interval
        ]);
        lastSparkleTime = currentTime;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    animationFrameId = requestAnimationFrame(updateSparkles);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [createSparkle]);

  return (
    <>
      <div
        className="custom-cursor fixed pointer-events-none z-100"
        style={{
          left: cursor.x,
          top: cursor.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            isHovering
              ? "w-6 h-6 bg-indigo-400 opacity-70 ring-2 ring-indigo-300"
              : "bg-white opacity-50"
          }`}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-50">
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="absolute"
            style={{
              left: sparkle.x,
              top: sparkle.y,
              width: sparkle.size,
              height: sparkle.size,
              opacity: sparkle.opacity,
              transform: "translate(-50%, -50%)",
            }}
          >
            <svg
              className="w-full h-full text-yellow-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}
