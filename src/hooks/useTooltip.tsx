"use client";

import React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Position {
  x: number;
  y: number;
}

interface TooltipProps {
  content: React.ReactNode;
  position: Position;
  className?: string;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, position, className = "" }, ref) => {
    return createPortal(
      <div
        ref={ref}
        className={`fixed z-[1000] px-2 py-1 text-sm bg-gray-900 border border-gray-700 text-white rounded shadow-lg pointer-events-none
          transition-opacity duration-150 ${className}`}
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -100%)",
          marginTop: -8,
        }}
      >
        {content}
        <div
          className="absolute left-1/2 -bottom-1 w-2 h-2 bg-gray-900 rotate-45"
          style={{ transform: "translateX(-50%) rotate(45deg)" }}
        />
      </div>,
      document.body
    );
  }
);

Tooltip.displayName = "Tooltip";

interface UseTooltipProps {
  targetRef: React.RefObject<HTMLElement>;
  content: React.ReactNode;
  delay?: number;
  offset?: number;
}

export const useTooltip = ({
  targetRef,
  content,
  delay = 200,
  offset = 8,
}: UseTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!targetRef.current) return { x: 0, y: 0 };

    const rect = targetRef.current.getBoundingClientRect();
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Basic initial position
    const x = rect.left + rect.width / 2 + scrollLeft;
    const y = rect.top + scrollTop - offset;

    return { x, y };
  }, [targetRef, offset]);

  const showTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      const newPosition = calculatePosition();
      setPosition(newPosition);
      setIsVisible(true);
    }, delay);
  }, [calculatePosition, delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    target.addEventListener("mouseenter", showTooltip);
    target.addEventListener("mouseleave", hideTooltip);
    target.addEventListener("focus", showTooltip);
    target.addEventListener("blur", hideTooltip);

    const handleScroll = () => {
      if (isVisible) {
        const newPosition = calculatePosition();
        setPosition(newPosition);
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      target.removeEventListener("mouseenter", showTooltip);
      target.removeEventListener("mouseleave", hideTooltip);
      target.removeEventListener("focus", showTooltip);
      target.removeEventListener("blur", hideTooltip);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [targetRef, showTooltip, hideTooltip, calculatePosition, isVisible]);

  // Add this new effect to adjust position after mount
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const targetRect = targetRef.current?.getBoundingClientRect();

      console.log(tooltipRect, targetRect);

      if (targetRect) {
        setPosition(prev => ({
          x: prev.x,
          y: targetRect.top - tooltipRect.height - offset,
        }));
      }
    }
  }, [isVisible, offset, targetRef]);

  const tooltip = isVisible ? (
    <Tooltip ref={tooltipRef} content={content} position={position} />
  ) : null;

  return tooltip;
};
