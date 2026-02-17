"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type MeetingPlatform = "livekit" | "zoom" | "google_meet";

interface MeetingSchedulerProps {
  hostId: Id<"users">;
  boardId?: Id<"boards"> | null;
  onScheduled?: (meetingId: Id<"meetings">) => void;
}

export function MeetingScheduler({
  hostId,
  boardId,
  onScheduled,
}: MeetingSchedulerProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [platform, setPlatform] = useState<MeetingPlatform>("livekit");
  const [externalLink, setExternalLink] = useState("");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scheduleMeeting = useMutation(api.meetings.schedule);
  const inviteToMeeting = useMutation(api.meetingInvites.invite);

  const handleAddInvite = () => {
    const email = inviteInput.trim().toLowerCase();
    if (!email) return;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValid) {
      setError("Please enter a valid email address");
      return;
    }
    if (inviteEmails.includes(email)) {
      setError("This email is already in the list");
      return;
    }
    setInviteEmails((prev) => [...prev, email]);
    setInviteInput("");
    setError(null);
  };

  const handleRemoveInvite = (email: string) => {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!date || !time) {
      setError("Date and time are required");
      return;
    }
    if (
      (platform === "zoom" || platform === "google_meet") &&
      !externalLink.trim()
    ) {
      setError("Meeting link is required for Zoom and Google Meet");
      return;
    }
    try {
      const scheduledAt = new Date(`${date}T${time}`).getTime();
      const meetingId = await scheduleMeeting({
        title: title.trim(),
        hostId,
        boardId: boardId ?? undefined,
        scheduledAt,
        durationMinutes,
        platform,
        externalLink:
          platform === "zoom" || platform === "google_meet"
            ? externalLink.trim()
            : undefined,
      });
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      for (const email of inviteEmails) {
        try {
          await inviteToMeeting({
            meetingId,
            email,
            baseUrl,
          });
        } catch (inviteErr) {
          console.error("Failed to invite", email, inviteErr);
        }
      }
      onScheduled?.(meetingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule meeting");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-brown-200 bg-brown-50 p-6"
    >
      <h3 className="text-lg font-semibold text-brown-900">
        Schedule ideation meeting
      </h3>
      <div>
        <label
          htmlFor="meeting-title"
          className="mb-1 block text-sm font-medium text-brown-700"
        >
          Title
        </label>
        <input
          id="meeting-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q1 Product Ideas"
          className="w-full rounded-lg border border-brown-300 bg-white px-3 py-2 text-brown-900 placeholder:text-brown-400 focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="meeting-date"
            className="mb-1 block text-sm font-medium text-brown-700"
          >
            Date
          </label>
          <input
            id="meeting-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-brown-300 bg-white px-3 py-2 text-brown-900 focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
          />
        </div>
        <div>
          <label
            htmlFor="meeting-time"
            className="mb-1 block text-sm font-medium text-brown-700"
          >
            Time
          </label>
          <input
            id="meeting-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-brown-300 bg-white px-3 py-2 text-brown-900 focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="meeting-duration"
          className="mb-1 block text-sm font-medium text-brown-700"
        >
          Duration (minutes)
        </label>
        <select
          id="meeting-duration"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className="w-full rounded-lg border border-brown-300 bg-white px-3 py-2 text-brown-900 focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
        >
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={45}>45 min</option>
          <option value={60}>60 min</option>
          <option value={90}>90 min</option>
        </select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-brown-700">
          Video platform
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPlatform("livekit")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              platform === "livekit"
                ? "border-brown-600 bg-brown-800 text-brown-50"
                : "border-brown-300 bg-white text-brown-700 hover:bg-brown-100"
            }`}
          >
            Ideata Video
          </button>
          <button
            type="button"
            onClick={() => setPlatform("zoom")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              platform === "zoom"
                ? "border-brown-600 bg-brown-800 text-brown-50"
                : "border-brown-300 bg-white text-brown-700 hover:bg-brown-100"
            }`}
          >
            Zoom
          </button>
          <button
            type="button"
            onClick={() => setPlatform("google_meet")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              platform === "google_meet"
                ? "border-brown-600 bg-brown-800 text-brown-50"
                : "border-brown-300 bg-white text-brown-700 hover:bg-brown-100"
            }`}
          >
            Google Meet
          </button>
        </div>
      </div>
      {(platform === "zoom" || platform === "google_meet") && (
        <div>
          <label
            htmlFor="meeting-link"
            className="mb-1 block text-sm font-medium text-brown-700"
          >
            Meeting link
          </label>
          <input
            id="meeting-link"
            type="url"
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder={
              platform === "zoom"
                ? "https://zoom.us/j/..."
                : "https://meet.google.com/..."
            }
            className="w-full rounded-lg border border-brown-300 bg-white px-3 py-2 text-brown-900 placeholder:text-brown-400 focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
          />
          <p className="mt-1 text-xs text-brown-500">
            Paste the {platform === "zoom" ? "Zoom" : "Google Meet"} link you
            created for this meeting.
          </p>
        </div>
      )}
      <div>
        <label
          htmlFor="invite-email"
          className="mb-1 block text-sm font-medium text-brown-700"
        >
          Invite participants
        </label>
        <p className="mb-2 text-xs text-brown-500">
          Invitees will receive an email when invited and when the meeting
          starts.
        </p>
        <div className="flex gap-2">
          <input
            id="invite-email"
            type="email"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInvite())}
            placeholder="email@example.com"
            className="flex-1 rounded-lg border border-brown-300 bg-white px-3 py-2 text-brown-900 placeholder:text-brown-400 focus:border-brown-500 focus:outline-none focus:ring-1 focus:ring-brown-500"
          />
          <button
            type="button"
            onClick={handleAddInvite}
            className="rounded-lg border border-brown-300 bg-brown-50 px-4 py-2 text-sm font-medium text-brown-800 hover:bg-brown-100 transition-colors"
          >
            Add
          </button>
        </div>
        {inviteEmails.length > 0 && (
          <ul className="mt-2 space-y-1">
            {inviteEmails.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between rounded bg-brown-100 px-3 py-1.5 text-sm text-brown-900"
              >
                {email}
                <button
                  type="button"
                  onClick={() => handleRemoveInvite(email)}
                  className="text-brown-500 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        className="rounded-lg bg-brown-800 px-4 py-2.5 text-sm font-medium text-brown-50 hover:bg-brown-900 transition-colors"
      >
        Schedule meeting
      </button>
    </form>
  );
}
