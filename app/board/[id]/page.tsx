"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BoardCanvas } from "../../../components/BoardCanvas";
import { AiIdeaInput } from "../../../components/AiIdeaInput";
import type { Id } from "../../../convex/_generated/dataModel";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as Id<"boards">;
  const { user } = useUser();
  const board = useQuery(api.boards.get, { boardId });
  const presence = useQuery(api.boards.getPresence, { boardId });
  const updateTitle = useMutation(api.boards.updateTitle);
  const [addImageFn, setAddImageFn] = useState<
    ((url: string) => Promise<void>) | null
  >(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (board?.title != null) setLocalTitle(board.title);
  }, [board?.title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      if (board?.title === "Untitled board") {
        titleInputRef.current.select();
      } else {
        titleInputRef.current.setSelectionRange(
          titleInputRef.current.value.length,
          titleInputRef.current.value.length
        );
      }
    }
  }, [isEditingTitle, board?.title]);

  const handleSaveTitle = useCallback(() => {
    setIsEditingTitle(false);
    const trimmed = localTitle.trim();
    if (trimmed && trimmed !== board?.title) {
      updateTitle({ boardId, title: trimmed });
    } else if (board?.title != null) {
      setLocalTitle(board.title);
    }
  }, [boardId, board?.title, localTitle, updateTitle]);

  const handleAddImageRef = useCallback(
    (addImage: (url: string) => Promise<void>) => {
      setAddImageFn(() => addImage);
    },
    []
  );

  const handleAddImage = useCallback(async (url: string) => {
    await addImageFn?.(url);
  }, [addImageFn]);

  const currentUser = user
    ? {
        clerkId: user.id,
        name: user.fullName ?? user.firstName ?? "User",
        avatarUrl: user.imageUrl,
      }
    : null;

  const collaborators = presence ?? [];

  // #region agent log
  if (typeof window !== 'undefined') { fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'board/[id]/page.tsx:render',message:'BoardPage rendering',data:{boardId,hasUser:!!user,collaboratorsCount:collaborators.length},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{}); }
  // #endregion

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-brown-200 bg-brown-50 px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-brown-600 hover:text-brown-900"
          >
            ← Back to dashboard
          </Link>
          {board && (
            <>
              <span className="text-brown-300">|</span>
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                  }}
                  className="min-w-[120px] rounded border border-brown-300 bg-white px-2 py-1 text-sm font-semibold text-brown-900 outline-none focus:border-brown-500"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="text-left text-sm font-semibold text-brown-900 hover:text-brown-700"
                >
                  {board.title || "Untitled board"}
                </button>
              )}
            </>
          )}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-2 border-l border-brown-200 pl-4">
              <span className="text-xs text-brown-500">Collaborators:</span>
              <div className="flex -space-x-2">
                {collaborators.map((c) => (
                  <div
                    key={c.clerkId}
                    className="relative h-7 w-7 rounded-full border-2 border-brown-50 bg-brown-200 flex items-center justify-center text-xs font-medium text-brown-800 overflow-hidden"
                    title={c.userName}
                  >
                    {c.avatarUrl ? (
                      <img
                        src={c.avatarUrl}
                        alt={c.userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {c.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <AiIdeaInput onAddImage={handleAddImage} />
        </div>
      </header>
      <main className="flex-1 min-h-0">
        <BoardCanvas
          boardId={boardId}
          currentUser={currentUser}
          onAddImageRef={handleAddImageRef}
        />
      </main>
    </div>
  );
}
