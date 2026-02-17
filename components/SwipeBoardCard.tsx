"use client";

import Link from "next/link";
import type { Id } from "../convex/_generated/dataModel";

type Priority = "low" | "medium" | "high";

interface Board {
  _id: Id<"boards">;
  title: string;
  priority?: Priority;
  shareToken?: string;
}

interface SwipeBoardCardProps {
  board: Board;
  shareCount?: number;
  onRename: () => void;
  onPriority: () => void;
  onShare: () => void;
  onDelete: () => void;
  isShared?: boolean;
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

const priorityLabels: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function SwipeBoardCard({
  board,
  shareCount = 0,
  onRename,
  onPriority,
  onShare,
  onDelete,
  isShared = false,
}: SwipeBoardCardProps) {
  return (
    <li className="group relative overflow-hidden rounded-lg border border-brown-200 transition-shadow duration-150 hover:shadow-sm">
      <Link
        href={`/board/${board._id}`}
        className="relative z-10 flex w-full items-center gap-2 bg-brown-50 p-4 transition-colors duration-150 hover:bg-brown-100"
      >
        <span className="min-w-0 flex-1 font-medium text-brown-900 truncate">
          {board.title}
        </span>
        {board.priority && (
          <span className="shrink-0 rounded px-2 py-0.5 text-xs font-medium bg-brown-200 text-brown-800">
            {priorityLabels[board.priority]}
          </span>
        )}
        {(shareCount > 0 || board.shareToken) && (
          <span className="shrink-0 text-xs text-brown-500">
            {shareCount > 0 ? `${shareCount} shared` : "Link"}
          </span>
        )}
        {isShared && (
          <span className="shrink-0 rounded px-2 py-0.5 text-xs bg-brown-100 text-brown-600">
            Shared
          </span>
        )}
      </Link>
      <div
        className="absolute right-0 top-0 z-20 flex h-full w-[200px] shrink-0 items-center justify-end gap-1 bg-gradient-to-l from-brown-100 to-brown-200 pl-8 pr-2 transition-transform duration-700 ease-out translate-x-full group-hover:translate-x-0"
        aria-hidden
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRename();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brown-400 text-white transition-all duration-150 hover:bg-brown-500 active:scale-95"
          title="Rename"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPriority();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brown-500 text-white transition-all duration-150 hover:bg-brown-600 active:scale-95"
          title="Priority"
        >
          <FlagIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShare();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-brown-600 text-white transition-all duration-150 hover:bg-brown-700 active:scale-95"
          title="Share"
        >
          <LinkIcon />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white transition-all duration-150 hover:bg-red-700 active:scale-95"
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}
