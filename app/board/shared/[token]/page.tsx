"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function SharedBoardPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const board = useQuery(
    api.boards.getByShareToken,
    token ? { shareToken: token } : "skip"
  );

  useEffect(() => {
    if (board) {
      router.replace(`/board/${board._id}`);
    }
  }, [board, router]);

  if (board === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-brown-600">Loading…</p>
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-brown-600">This link is invalid or has been revoked.</p>
        <a
          href="/dashboard"
          className="text-sm font-medium text-brown-800 hover:text-brown-900"
        >
          Go to dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-brown-600">Redirecting to board…</p>
    </div>
  );
}
