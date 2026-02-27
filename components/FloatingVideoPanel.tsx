"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VideoRoom } from "./VideoRoom";

const MIN_WIDTH = 240;
const MIN_HEIGHT = 180;
const MAX_WIDTH_RATIO = 0.5;
const MAX_HEIGHT_RATIO = 0.5;
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 240;
const PADDING = 16;

interface FloatingVideoPanelProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  onLeave: () => void;
  onConnectionError?: (message: string) => void;
}

function VideoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function FloatingVideoPanel({
  roomName,
  participantName,
  participantIdentity,
  onLeave,
  onConnectionError,
}: FloatingVideoPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const clampPosition = useCallback((x: number, y: number, w: number, h: number) => {
    const maxX = typeof window !== "undefined" ? window.innerWidth - w - PADDING : 0;
    const maxY = typeof window !== "undefined" ? window.innerHeight - h - PADDING : 0;
    return {
      x: Math.max(PADDING, Math.min(maxX, x)),
      y: Math.max(PADDING, Math.min(maxY, y)),
    };
  }, []);

  const clampSize = useCallback((width: number, height: number) => {
    const maxW = typeof window !== "undefined" ? window.innerWidth * MAX_WIDTH_RATIO : 480;
    const maxH = typeof window !== "undefined" ? window.innerHeight * MAX_HEIGHT_RATIO : 360;
    return {
      width: Math.max(MIN_WIDTH, Math.min(maxW, width)),
      height: Math.max(MIN_HEIGHT, Math.min(maxH, height)),
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const maxX = window.innerWidth - DEFAULT_WIDTH - PADDING;
    const maxY = window.innerHeight - DEFAULT_HEIGHT - PADDING;
    setPosition({
      x: Math.max(PADDING, maxX),
      y: Math.max(PADDING, maxY),
    });
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [position]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
        left: position.x,
        top: position.y,
      };
    },
    [size, position]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newX = dragStartRef.current.posX + dx;
      const newY = dragStartRef.current.posY + dy;
      const clamped = clampPosition(newX, newY, size.width, size.height);
      setPosition(clamped);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, size, clampPosition]);

  useEffect(() => {
    if (!isResizing) return;
    const { left: startLeft, top: startTop, width: startW } = resizeStartRef.current;
    const onMove = (e: MouseEvent) => {
      const newLeft = e.clientX;
      const newWidth = startLeft + startW - newLeft;
      const newHeight = e.clientY - startTop;
      const clamped = clampSize(newWidth, newHeight);
      const clampedPos = clampPosition(newLeft, startTop, clamped.width, clamped.height);
      setPosition(clampedPos);
      setSize(clamped);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing, clampSize, clampPosition]);

  if (isMinimized) {
    return (
      <div
        className="fixed z-40 flex cursor-grab items-center gap-2 rounded-full border border-brown-200 bg-brown-100 px-4 py-2 shadow-lg active:cursor-grabbing"
        style={{
          left: position.x,
          top: position.y,
        }}
        onMouseDown={handleDragStart}
        role="button"
        tabIndex={0}
        onClick={() => setIsMinimized(false)}
        onKeyDown={(e) => e.key === "Enter" && setIsMinimized(false)}
      >
        <VideoIcon />
        <span className="text-sm font-medium text-brown-800">Video</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLeave();
          }}
          className="ml-2 rounded p-0.5 text-brown-600 hover:bg-brown-200 hover:text-brown-900"
          title="Leave video"
        >
          <CloseIcon />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-40 flex flex-col overflow-hidden rounded-lg border border-brown-200 bg-white shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div
        className="flex shrink-0 cursor-grab items-center justify-between border-b border-brown-200 bg-brown-50 px-3 py-2 active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <VideoIcon />
          <span className="text-sm font-medium text-brown-800">Video</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="rounded p-1.5 text-brown-600 hover:bg-brown-200 hover:text-brown-900"
            title="Minimize"
          >
            <MinimizeIcon />
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded p-1.5 text-brown-600 hover:bg-brown-200 hover:text-red-600"
            title="Leave video"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-0">
        <VideoRoom
          roomName={roomName}
          participantName={participantName}
          participantIdentity={participantIdentity}
          onDisconnected={onLeave}
          onConnectionError={onConnectionError}
        />
        <div
          className="absolute bottom-0 left-0 h-4 w-4 cursor-nwse-resize border-l-2 border-b-2 border-brown-300"
          onMouseDown={handleResizeStart}
          title="Resize"
        />
      </div>
    </div>
  );
}
