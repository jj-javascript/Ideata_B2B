"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Navbar } from "../../../components/Navbar";
import { FloatingVideoPanel } from "../../../components/FloatingVideoPanel";
import { BoardCanvas } from "../../../components/BoardCanvas";
import { AiIdeaInput } from "../../../components/AiIdeaInput";

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.id as Id<"meetings">;
  const { user, isLoaded } = useUser();
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const joinMeeting = useMutation(api.meetings.join);
  const getOrCreateByClerkId = useMutation(api.users.getOrCreateByClerkId);
  const inviteToMeeting = useMutation(api.meetingInvites.invite);
  const removeInvite = useMutation(api.meetingInvites.removeInvite);
  const meeting = useQuery(api.meetings.get, { meetingId });
  const invites = useQuery(
    api.meetingInvites.listByMeeting,
    meetingId ? { meetingId } : "skip"
  );
  const addImageRef = useRef<{ fn: ((url: string) => Promise<void>) | null }>({
    fn: null,
  });

  const isHost = meeting && convexUserId && meeting.hostId === convexUserId;

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

  const handleJoin = useCallback(async () => {
    if (!convexUserId) return;
    setJoinError(null);
    try {
      const room = await joinMeeting({
        meetingId,
        userId: convexUserId,
      });
      setRoomName(room);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join");
    }
  }, [meetingId, joinMeeting, convexUserId]);

  const handleAddImageRef = useCallback(
    (addImage: (url: string) => Promise<void>) => {
      addImageRef.current.fn = addImage;
    },
    []
  );

  const handleAddImage = useCallback(async (url: string) => {
    await addImageRef.current?.fn?.(url);
  }, []);

  const handleAddInvite = useCallback(async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      setInviteError("Please enter a valid email address");
      return;
    }
    setInviteError(null);
    try {
      await inviteToMeeting({
        meetingId,
        email,
        baseUrl: typeof window !== "undefined" ? window.location.origin : "",
      });
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite");
    }
  }, [meetingId, inviteEmail, inviteToMeeting]);

  const handleRemoveInvite = useCallback(
    async (inviteId: Id<"meetingInvites">) => {
      await removeInvite({ inviteId });
    },
    [removeInvite]
  );

  if (!isLoaded || meeting === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-brown-600">Loading meeting…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-brown-600">Please sign in to join the meeting.</p>
      </div>
    );
  }

  if (meeting === null) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-brown-600">Meeting not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-brown-200 bg-brown-50 px-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brown-600 hover:text-brown-900"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-lg font-semibold text-brown-900">
          {meeting.title}
        </h1>
        <div className="flex items-center gap-4">
          {isHost && (
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="text-sm font-medium text-brown-600 hover:text-brown-900 transition-colors"
            >
              Invite
            </button>
          )}
          <AiIdeaInput onAddImage={handleAddImage} />
        </div>
      </header>

      <main className="flex-1 min-h-0 flex">
        {meeting.platform === "zoom" || meeting.platform === "google_meet" ? (
          <>
            <div className="w-1/3 min-w-0 flex flex-col gap-4 border-r border-brown-200 bg-brown-50 p-6">
              <h2 className="text-lg font-semibold text-brown-900">
                {meeting.platform === "zoom" ? "Zoom" : "Google Meet"}
              </h2>
              <p className="text-sm text-brown-600">
                Open the video call in a new tab. Use the board alongside to
                brainstorm.
              </p>
              {meeting.externalLink && (
                <a
                  href={meeting.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg bg-brown-800 px-6 py-3 text-sm font-medium text-brown-50 hover:bg-brown-900 transition-colors"
                >
                  Join on {meeting.platform === "zoom" ? "Zoom" : "Google Meet"}
                </a>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {meeting.boardId ? (
                <BoardCanvas
                  boardId={meeting.boardId}
                  currentUser={
                    user
                      ? {
                          clerkId: user.id,
                          name: user.fullName ?? user.firstName ?? "User",
                          avatarUrl: user.imageUrl,
                        }
                      : null
                  }
                  onAddImageRef={handleAddImageRef}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-brown-100 text-brown-600">
                  No board linked to this meeting
                </div>
              )}
            </div>
          </>
        ) : !roomName ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="rounded-xl border border-brown-200 bg-brown-50 p-8 text-center">
              <h2 className="text-xl font-semibold text-brown-900 mb-4">
                Join the brainstorming meeting
              </h2>
              {joinError && (
                <p className="mb-4 text-sm text-red-600">{joinError}</p>
              )}
              <button
                onClick={handleJoin}
                disabled={!convexUserId}
                className="rounded-lg bg-brown-800 px-6 py-2.5 text-sm font-medium text-brown-50 hover:bg-brown-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join with video
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              {meeting.boardId ? (
                <BoardCanvas
                  boardId={meeting.boardId}
                  currentUser={
                    user
                      ? {
                          clerkId: user.id,
                          name: user.fullName ?? user.firstName ?? "User",
                          avatarUrl: user.imageUrl,
                        }
                      : null
                  }
                  onAddImageRef={handleAddImageRef}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-brown-100 text-brown-600">
                  No board linked to this meeting
                </div>
              )}
            </div>
            <FloatingVideoPanel
              roomName={roomName}
              participantName={user.fullName ?? user.firstName ?? "User"}
              participantIdentity={user.id}
              onLeave={() => setRoomName(null)}
            />
          </>
        )}
      </main>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-brown-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-brown-900">
              Invite participants
            </h2>
            <p className="mb-4 text-xs text-brown-500">
              Invitees will receive an email when invited and when the meeting
              starts.
            </p>
            <div className="mb-4 flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddInvite())
                }
                placeholder="email@example.com"
                className="flex-1 rounded-lg border border-brown-300 bg-brown-50 px-3 py-2 text-sm text-brown-900 placeholder:text-brown-400 outline-none focus:border-brown-500"
              />
              <button
                type="button"
                onClick={handleAddInvite}
                disabled={!inviteEmail.trim()}
                className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-medium text-brown-50 hover:bg-brown-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {inviteError && (
              <p className="mb-4 text-sm text-red-600">{inviteError}</p>
            )}
            {invites && invites.length > 0 && (
              <ul className="mb-4 space-y-1">
                {invites.map((inv) => (
                  <li
                    key={inv._id}
                    className="flex items-center justify-between gap-2 rounded bg-brown-50 px-3 py-2 text-sm text-brown-900"
                  >
                    <span className="min-w-0 flex-1 truncate">{inv.email}</span>
                    <span className="shrink-0 text-xs text-brown-500 capitalize">
                      {inv.status}
                    </span>
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInvite(inv._id)}
                        className="shrink-0 text-red-600 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteError(null);
                setInviteEmail("");
              }}
              className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}