"use client";

import { useCallback, useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

interface VideoRoomProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  onDisconnected?: () => void;
}

export function VideoRoom({
  roomName,
  participantName,
  participantIdentity,
  onDisconnected,
}: VideoRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const getToken = useAction(api.livekit.getToken);

  const connect = useCallback(async () => {
    try {
      setError(null);
      const t = await getToken({
        roomName,
        participantName,
        participantIdentity,
      });
      setToken(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get token");
    }
  }, [getToken, roomName, participantName, participantIdentity]);

  useEffect(() => {
    connect();
  }, [connect]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-brown-200 bg-brown-50 p-6">
        <p className="text-brown-600">{error}</p>
        <button
          onClick={connect}
          className="rounded-lg bg-brown-800 px-4 py-2 text-sm font-medium text-brown-50 hover:bg-brown-900"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-brown-200 bg-brown-50 p-6">
        <p className="text-brown-600">Connecting to video room…</p>
      </div>
    );
  }

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!livekitUrl) {
    return (
      <div className="rounded-lg border border-brown-200 bg-brown-50 p-4 text-brown-600">
        NEXT_PUBLIC_LIVEKIT_URL is not configured.
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={onDisconnected}
      data-lk-theme="default"
      style={{ height: "100%" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
