"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Navbar } from "../../components/Navbar";
import { MeetingScheduler } from "../../components/MeetingScheduler";
import { SwipeBoardCard } from "../../components/SwipeBoardCard";

type BoardAction = "rename" | "priority" | "share" | "delete";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [boardAction, setBoardAction] = useState<{
    boardId: Id<"boards">;
    action: BoardAction;
    title: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"viewer" | "editor">("editor");
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const newBoardInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const getOrCreateByClerkId = useMutation(api.users.getOrCreateByClerkId);
  const createBoard = useMutation(api.boards.create);
  const updateTitle = useMutation(api.boards.updateTitle);
  const updatePriority = useMutation(api.boards.updatePriority);
  const removeBoard = useMutation(api.boards.remove);
  const removeAllBoards = useMutation(api.boards.removeAllByOwner);
  const generateShareLink = useMutation(api.boards.generateShareLink);
  const revokeShareLink = useMutation(api.boards.revokeShareLink);
  const addShare = useMutation(api.boards.addShare);
  const removeShare = useMutation(api.boards.removeShare);
  const boards = useQuery(
    api.boards.listWithShareCounts,
    convexUserId ? { ownerId: convexUserId } : "skip"
  );
  const sharedBoards = useQuery(
    api.boards.listSharedWithMe,
    convexUserId ? { userId: convexUserId } : "skip"
  );
  const boardShares = useQuery(
    api.boards.getShares,
    boardAction?.action === "share" && boardAction?.boardId
      ? { boardId: boardAction.boardId }
      : "skip"
  );
  const boardForShareLink = useQuery(
    api.boards.get,
    boardAction?.action === "share" && boardAction?.boardId
      ? { boardId: boardAction.boardId }
      : "skip"
  );
  const meetings = useQuery(
    api.meetings.list,
    convexUserId ? { hostId: convexUserId } : "skip"
  );

  useEffect(() => {
    if (!isLoaded || !user) return;
    const sync = async () => {
      const id = await getOrCreateByClerkId({
        clerkId: user.id,
        name: user.fullName ?? user.firstName ?? "User",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        avatarUrl: user.imageUrl,
      });
      setConvexUserId(id);
    };
    sync();
  }, [isLoaded, user, getOrCreateByClerkId]);

  const openNewBoardDialog = useCallback(() => {
    setNewBoardTitle("");
    setShowNewBoard(true);
    setTimeout(() => newBoardInputRef.current?.focus(), 0);
  }, []);

  const handleCreateBoard = useCallback(async () => {
    if (!convexUserId) return;
    const title = newBoardTitle.trim() || "Untitled board";
    setShowNewBoard(false);
    const boardId = await createBoard({
      title,
      ownerId: convexUserId,
    });
    window.location.href = `/board/${boardId}`;
  }, [convexUserId, createBoard, newBoardTitle]);

  const handleScheduled = useCallback((meetingId: Id<"meetings">) => {
    setShowScheduler(false);
    window.location.href = `/meeting/${meetingId}`;
  }, []);

  useEffect(() => {
    if (boardAction?.action === "rename") {
      setRenameValue(boardAction.title);
      setTimeout(() => renameInputRef.current?.focus(), 0);
    }
  }, [boardAction?.action, boardAction?.title]);

  const openBoardAction = useCallback(
    (boardId: Id<"boards">, action: BoardAction, title: string) => {
      setBoardAction({ boardId, action, title });
    },
    []
  );

  const closeBoardAction = useCallback(() => {
    setBoardAction(null);
    setShareEmail("");
  }, []);

  const handleRenameSave = useCallback(async () => {
    if (!boardAction || boardAction.action !== "rename") return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      await updateTitle({ boardId: boardAction.boardId, title: trimmed });
    }
    closeBoardAction();
  }, [boardAction, renameValue, updateTitle, closeBoardAction]);

  const handlePrioritySave = useCallback(
    async (priority: "low" | "medium" | "high" | null) => {
      if (!boardAction || boardAction.action !== "priority") return;
      await updatePriority({
        boardId: boardAction.boardId,
        priority: priority ?? undefined,
      });
      closeBoardAction();
    },
    [boardAction, updatePriority, closeBoardAction]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!boardAction || boardAction.action !== "delete") return;
    await removeBoard({ boardId: boardAction.boardId });
    closeBoardAction();
  }, [boardAction, removeBoard, closeBoardAction]);

  const handleDeleteAllConfirm = useCallback(async () => {
    if (!convexUserId) return;
    await removeAllBoards({ ownerId: convexUserId });
    setShowDeleteAllConfirm(false);
  }, [convexUserId, removeAllBoards]);

  const handleAddShare = useCallback(async () => {
    if (!boardAction || boardAction.action !== "share" || !shareEmail.trim())
      return;
    try {
      await addShare({
        boardId: boardAction.boardId,
        email: shareEmail.trim().toLowerCase(),
        role: shareRole,
      });
      setShareEmail("");
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Failed to add share. User may not exist."
      );
    }
  }, [boardAction, shareEmail, shareRole, addShare]);

  const handleRemoveShare = useCallback(
    async (userId: Id<"users">) => {
      if (!boardAction || boardAction.action !== "share") return;
      await removeShare({ boardId: boardAction.boardId, userId });
    },
    [boardAction, removeShare]
  );

  const handleGenerateShareLink = useCallback(async () => {
    if (!boardAction || boardAction.action !== "share") return;
    await generateShareLink({ boardId: boardAction.boardId });
  }, [boardAction, generateShareLink]);

  const handleRevokeShareLink = useCallback(async () => {
    if (!boardAction || boardAction.action !== "share") return;
    await revokeShareLink({ boardId: boardAction.boardId });
    closeBoardAction();
  }, [boardAction, revokeShareLink]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-brown-600">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-brown-600">Please sign in to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-brown-900">
            Dashboard
          </h1>
          <div className="flex gap-3">
            <button
              onClick={openNewBoardDialog}
              disabled={!convexUserId}
              className="rounded-lg bg-brown-800 px-4 py-2.5 text-sm font-medium text-brown-50 transition-colors duration-150 hover:bg-brown-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              New board
            </button>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              disabled={!convexUserId}
              className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2.5 text-sm font-medium text-brown-800 transition-colors duration-150 hover:bg-brown-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule meeting
            </button>
          </div>
        </div>

        {showScheduler && convexUserId && (
          <div className="mb-10 max-w-md">
            <MeetingScheduler
              hostId={convexUserId}
              boardId={boards?.[0]?._id}
              onScheduled={handleScheduled}
            />
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-brown-900">
                Your boards
              </h2>
              {boards && boards.length > 0 && (
                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="text-sm text-brown-500 hover:text-red-600 transition-colors duration-150"
                >
                  Delete all
                </button>
              )}
            </div>
            {!convexUserId ? (
              <p className="text-brown-600">Loading…</p>
            ) : boards === undefined ? (
              <p className="text-brown-600">Loading…</p>
            ) : boards.length === 0 ? (
              <p className="text-brown-600">No boards yet. Create one to get started.</p>
            ) : (
              <ul className="space-y-2">
                {boards.map((board) => (
                  <SwipeBoardCard
                    key={board._id}
                    board={board}
                    shareCount={board.shareCount}
                    onRename={() =>
                      openBoardAction(board._id, "rename", board.title)
                    }
                    onPriority={() =>
                      openBoardAction(board._id, "priority", board.title)
                    }
                    onShare={() =>
                      openBoardAction(board._id, "share", board.title)
                    }
                    onDelete={() =>
                      openBoardAction(board._id, "delete", board.title)
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          {sharedBoards && sharedBoards.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-brown-900 mb-4">
                Shared with you
              </h2>
              <ul className="space-y-2">
                {sharedBoards.map((board) => (
                  <li key={board._id}>
                    <Link
                      href={`/board/${board._id}`}
                      className="block rounded-lg border border-brown-200 bg-brown-50 p-4 transition-colors duration-150 hover:bg-brown-100"
                    >
                      <span className="font-medium text-brown-900">
                        {board.title}
                      </span>
                      <span className="ml-2 text-xs text-brown-500">
                        ({board.role})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-brown-900 mb-4">
              Upcoming meetings
            </h2>
            {!convexUserId ? (
              <p className="text-brown-600">Loading…</p>
            ) : meetings === undefined ? (
              <p className="text-brown-600">Loading…</p>
            ) : meetings.length === 0 ? (
              <p className="text-brown-600">No meetings scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {meetings
                  .filter((m) => m.status !== "ended")
                  .map((meeting) => (
                    <li key={meeting._id}>
                      <Link
                        href={`/meeting/${meeting._id}`}
                        className="flex items-center gap-2 rounded-lg border border-brown-200 bg-brown-50 p-4 transition-colors duration-150 hover:bg-brown-100"
                      >
                        <span className="font-medium text-brown-900">
                          {meeting.title}
                        </span>
                        <span
                          className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-brown-200 text-brown-700"
                          title={
                            meeting.platform === "zoom"
                              ? "Zoom"
                              : meeting.platform === "google_meet"
                                ? "Google Meet"
                                : "Ideata Video"
                          }
                        >
                          {meeting.platform === "zoom"
                            ? "Zoom"
                            : meeting.platform === "google_meet"
                              ? "Meet"
                              : "Video"}
                        </span>
                        <span className="text-sm text-brown-600"> — </span>
                        <span className="text-sm text-brown-600">
                          {new Date(meeting.scheduledAt).toLocaleString()}
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      {showNewBoard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-brown-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brown-900">
              Name your board
            </h2>
            <input
              ref={newBoardInputRef}
              type="text"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateBoard();
              }}
              placeholder="e.g. Sprint Planning Ideas"
              className="mb-4 w-full rounded-lg border border-brown-300 bg-brown-50 px-3 py-2 text-sm text-brown-900 placeholder:text-brown-400 outline-none focus:border-brown-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewBoard(false)}
                className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                disabled={!convexUserId}
                className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-medium text-brown-50 hover:bg-brown-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {boardAction?.action === "rename" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-brown-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brown-900">
              Rename board
            </h2>
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSave();
              }}
              className="mb-4 w-full rounded-lg border border-brown-300 bg-brown-50 px-3 py-2 text-sm text-brown-900 outline-none focus:border-brown-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeBoardAction}
                className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSave}
                className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-medium text-brown-50 hover:bg-brown-900"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {boardAction?.action === "priority" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-brown-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brown-900">
              Set priority
            </h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePrioritySave(p)}
                  className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 capitalize hover:bg-brown-100"
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePrioritySave(null)}
                className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-600 hover:bg-brown-100"
              >
                Clear
              </button>
            </div>
            <button
              onClick={closeBoardAction}
              className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {boardAction?.action === "share" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-brown-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brown-900">
              Share board
            </h2>
            <div className="mb-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-brown-700">
                  Invite by email
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 rounded-lg border border-brown-300 bg-brown-50 px-3 py-2 text-sm text-brown-900 placeholder:text-brown-400 outline-none focus:border-brown-500"
                  />
                  <select
                    value={shareRole}
                    onChange={(e) =>
                      setShareRole(e.target.value as "viewer" | "editor")
                    }
                    className="rounded-lg border border-brown-300 bg-brown-50 px-3 py-2 text-sm text-brown-900"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleAddShare}
                    disabled={!shareEmail.trim()}
                    className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-medium text-brown-50 hover:bg-brown-900 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
              {boardShares && boardShares.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-brown-700">
                    People with access
                  </p>
                  <ul className="space-y-1">
                    {boardShares.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-center justify-between rounded bg-brown-50 px-3 py-2 text-sm"
                      >
                        <span className="text-brown-900">
                          {s.userName} ({s.userEmail})
                        </span>
                        <span className="text-brown-500 text-xs">{s.role}</span>
                        <button
                          onClick={() => handleRemoveShare(s.userId)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="mb-2 text-sm font-medium text-brown-700">
                  Share link
                </p>
                {boardForShareLink?.shareToken ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/board/shared/${boardForShareLink.shareToken}`
                            : ""
                        }
                        className="flex-1 rounded-lg border border-brown-300 bg-brown-50 px-3 py-2 text-sm text-brown-900"
                      />
                      <button
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/board/shared/${boardForShareLink.shareToken}`
                            );
                          }
                        }}
                        className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
                      >
                        Copy
                      </button>
                    </div>
                    <button
                      onClick={handleRevokeShareLink}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Revoke link
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateShareLink}
                    className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-medium text-brown-50 hover:bg-brown-900"
                  >
                    Generate link
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={closeBoardAction}
              className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {boardAction?.action === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-brown-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brown-900">
              Delete board
            </h2>
            <p className="mb-4 text-sm text-brown-600">
              Are you sure you want to delete &quot;{boardAction.title}&quot;?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeBoardAction}
                className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-brown-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brown-900">
              Delete all boards
            </h2>
            <p className="mb-4 text-sm text-brown-600">
              Are you sure you want to delete all {boards?.length ?? 0} boards?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
