"use client";

import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const SAVE_DEBOUNCE_MS = 300;
const PRESENCE_THROTTLE_MS = 100;
const COLLABORATOR_COLORS = [
  { background: "#6965db", stroke: "#6965db" },
  { background: "#e03131", stroke: "#e03131" },
  { background: "#2f9e44", stroke: "#2f9e44" },
  { background: "#1971c2", stroke: "#1971c2" },
  { background: "#c2255c", stroke: "#c2255c" },
  { background: "#e67700", stroke: "#e67700" },
];

function getColorForClerkId(clerkId: string): { background: string; stroke: string } {
  let hash = 0;
  for (let i = 0; i < clerkId.length; i++) {
    hash = (hash << 5) - hash + clerkId.charCodeAt(i);
    hash |= 0;
  }
  return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length];
}

export interface CurrentUser {
  clerkId: string;
  name: string;
  avatarUrl?: string;
}

interface BoardCanvasProps {
  boardId: Id<"boards">;
  currentUser?: CurrentUser | null;
  onAddImageRef?: (addImage: (url: string) => Promise<void>) => void;
}

export function BoardCanvas({ boardId, currentUser, onAddImageRef }: BoardCanvasProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BoardCanvas.tsx:49',message:'BoardCanvas render entry',data:{boardId,hasCurrentUser:!!currentUser},timestamp:Date.now(),hypothesisId:'H1-H3'})}).catch(()=>{});
  // #endregion
  const board = useQuery(api.boards.get, { boardId });
  const presence = useQuery(api.boards.getPresence, { boardId });
  const saveMutation = useMutation(api.boards.save);
  const updatePresenceMutation = useMutation(api.boards.updatePresence);
  const removePresenceMutation = useMutation(api.boards.removePresence);

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPresenceRef = useRef<number>(0);
  const initialLoadDone = useRef(false);
  const isRemoteUpdateRef = useRef(false);

  const addImageElement = useCallback(
    async (url: string) => {
      if (!excalidrawAPI) return;
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const fileId = `ai-${Date.now()}`;
        excalidrawAPI.addFiles([
          {
            id: fileId,
            dataURL: dataUrl,
            mimeType: blob.type || "image/png",
          },
        ] as any);
        const elements = excalidrawAPI.getSceneElements();
        const maxX = elements.length
          ? Math.max(...elements.map((e) => e.x + (e.width || 0)))
          : 0;
        const imageElement = {
          type: "image" as const,
          id: `img-${fileId}`,
          x: maxX + 50,
          y: 50,
          width: 400,
          height: 400,
          angle: 0,
          strokeColor: "#1e1e1e",
          backgroundColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 2,
          strokeStyle: "solid",
          roughness: 1,
          opacity: 100,
          groupIds: [],
          roundness: { type: 3, value: 32 },
          seed: Math.floor(Math.random() * 2 ** 31),
          version: 1,
          versionNonce: Math.floor(Math.random() * 2 ** 31),
          isDeleted: false,
          boundElements: null,
          updated: Date.now(),
          link: null,
          locked: false,
          fileId,
        } as unknown as ExcalidrawElement;
        excalidrawAPI.updateScene({
          elements: [...elements, imageElement],
        });
      } catch (err) {
        console.error("Failed to add image:", err);
      }
    },
    [excalidrawAPI]
  );

  useEffect(() => {
    if (onAddImageRef && addImageElement) {
      onAddImageRef(addImageElement);
    }
  }, [onAddImageRef, addImageElement]);

  const handleChange = useCallback(
    (
      elements: readonly ExcalidrawElement[],
      _appState: unknown,
      files: BinaryFiles
    ) => {
      if (isRemoteUpdateRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const filesObj: Record<string, { dataURL: string; mimeType?: string }> =
          {};
        for (const [id, file] of Object.entries(files)) {
          if (file.dataURL) {
            filesObj[id] = {
              dataURL: file.dataURL,
              mimeType: file.mimeType,
            };
          }
        }
        saveMutation({
          boardId,
          elements: JSON.stringify({
            elements: elements.map((e) => ({
              ...e,
              id: e.id,
              type: e.type,
              x: e.x,
              y: e.y,
              width: e.width,
              height: e.height,
              fileId: "fileId" in e ? e.fileId : undefined,
            })),
            files: filesObj,
          }),
        });
        saveTimeoutRef.current = null;
      }, SAVE_DEBOUNCE_MS);
    },
    [boardId, saveMutation]
  );

  const handlePointerUpdate = useCallback(
    (payload: { pointer: { x: number; y: number; tool: "pointer" | "laser" } }) => {
      if (!currentUser) return;
      const now = Date.now();
      if (now - lastPresenceRef.current < PRESENCE_THROTTLE_MS) return;
      lastPresenceRef.current = now;

      const color = getColorForClerkId(currentUser.clerkId);
      updatePresenceMutation({
        boardId,
        clerkId: currentUser.clerkId,
        userName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        color: color.background,
        cursorX: payload.pointer.x,
        cursorY: payload.pointer.y,
      });
    },
    [boardId, currentUser, updatePresenceMutation]
  );

  const lastClerkIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      if (lastClerkIdRef.current) {
        removePresenceMutation({ boardId, clerkId: lastClerkIdRef.current });
        lastClerkIdRef.current = null;
      }
      return;
    }

    lastClerkIdRef.current = currentUser.clerkId;
    const color = getColorForClerkId(currentUser.clerkId);
    updatePresenceMutation({
      boardId,
      clerkId: currentUser.clerkId,
      userName: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      color: color.background,
    });

    const cleanup = () => {
      if (lastClerkIdRef.current) {
        removePresenceMutation({ boardId, clerkId: lastClerkIdRef.current });
        lastClerkIdRef.current = null;
      }
    };

    window.addEventListener("beforeunload", cleanup);
    return () => {
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, [boardId, currentUser?.clerkId, currentUser?.name, currentUser?.avatarUrl, removePresenceMutation, updatePresenceMutation]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (presenceTimeoutRef.current) {
        clearTimeout(presenceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!excalidrawAPI || !presence) return;

    const map = new Map<string, { username?: string; avatarUrl?: string; pointer?: { x: number; y: number; tool: "pointer" | "laser" }; color?: { background: string; stroke: string } }>();

    for (const p of presence) {
      if (currentUser && p.clerkId === currentUser.clerkId) continue;

      const color = getColorForClerkId(p.clerkId);
      map.set(p.clerkId, {
        username: p.userName,
        avatarUrl: p.avatarUrl ?? undefined,
        pointer:
          p.cursorX != null && p.cursorY != null
            ? { x: p.cursorX, y: p.cursorY, tool: "pointer" as const }
            : undefined,
        color: { background: color.background, stroke: color.stroke },
      });
    }

    excalidrawAPI.updateScene({
      collaborators: map as any,
      captureUpdate: 0 as any,
    });
  }, [excalidrawAPI, presence, currentUser?.clerkId]);

  useEffect(() => {
    if (!excalidrawAPI || !board?.elements) return;

    const parsed = JSON.parse(board.elements);
    const remoteElements = Array.isArray(parsed?.elements)
      ? parsed.elements
      : Array.isArray(parsed)
        ? parsed
        : [];

    if (remoteElements.length === 0) return;

    const localElements = excalidrawAPI.getSceneElements();
    const localById = new Map(localElements.map((e) => [e.id, e]));

    const merged: ExcalidrawElement[] = [];
    for (const remote of remoteElements) {
      const local = localById.get(remote.id);
      if (!local) {
        merged.push(remote as ExcalidrawElement);
      } else {
        const remoteVersion = remote.version ?? 0;
        const localVersion = local.version ?? 0;
        if (remoteVersion >= localVersion) {
          merged.push(remote as ExcalidrawElement);
        } else {
          merged.push(local);
        }
      }
    }

    for (const local of localElements) {
      if (!remoteElements.some((r: { id: string }) => r.id === local.id)) {
        merged.push(local);
      }
    }

    isRemoteUpdateRef.current = true;
    excalidrawAPI.updateScene({
      elements: merged,
      captureUpdate: 0 as any,
    });
    isRemoteUpdateRef.current = false;
  }, [board?.elements, excalidrawAPI]);

  let initialData: {
    elements?: ExcalidrawElement[];
    files?: Record<string, { dataURL: string; mimeType?: string }>;
  } = {};
  if (!initialLoadDone.current && board?.elements) {
    try {
      const parsed = JSON.parse(board.elements);
      if (parsed && typeof parsed === "object") {
        initialData = {
          elements: Array.isArray(parsed.elements)
            ? parsed.elements
            : Array.isArray(parsed)
              ? parsed
              : [],
          files: parsed.files || {},
        };
      } else {
        initialData = { elements: [] };
      }
      initialLoadDone.current = true;
    } catch {
      initialData = { elements: [] };
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BoardCanvas.tsx:early-return-check',message:'Board state before early returns',data:{boardIsUndefined:board===undefined,boardIsNull:board===null,boardHasElements:!!board?.elements,initialLoadDone:initialLoadDone.current},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  if (board === undefined) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BoardCanvas.tsx:early-return-loading',message:'Returning loading state',data:{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return (
      <div className="flex h-full w-full items-center justify-center bg-brown-100">
        <span className="text-brown-600">Loading board…</span>
      </div>
    );
  }

  if (board === null) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BoardCanvas.tsx:early-return-null',message:'Board not found',data:{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    return (
      <div className="flex h-full w-full items-center justify-center bg-brown-100">
        <span className="text-brown-600">Board not found</span>
      </div>
    );
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BoardCanvas.tsx:render-excalidraw',message:'Rendering Excalidraw component',data:{hasInitialElements:!!(initialData?.elements?.length),hasExcalidrawAPI:!!excalidrawAPI,isCollaborating:!!presence?.length},timestamp:Date.now(),hypothesisId:'H2-H4'})}).catch(()=>{});
  // #endregion

  return (
    <div className="h-full w-full">
      <Excalidraw
        excalidrawAPI={(api) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'BoardCanvas.tsx:excalidrawAPI-callback',message:'excalidrawAPI callback fired',data:{apiReceived:!!api},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          setExcalidrawAPI(api);
        }}
        initialData={initialData as any}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        isCollaborating={!!presence?.length}
        theme="light"
      />
    </div>
  );
}
