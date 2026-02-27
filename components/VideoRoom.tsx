"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

interface VideoRoomProps {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  onDisconnected?: () => void;
  onConnectionError?: (message: string) => void;
}

export function VideoRoom({
  roomName,
  participantName,
  participantIdentity,
  onDisconnected,
  onConnectionError,
}: VideoRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasConnectedRef = useRef(false);
  const getToken = useAction(api.livekit.getToken);

  const connect = useCallback(async () => {
    try {
      setError(null);
      const t = await getToken({
        roomName,
        participantName,
        participantIdentity,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoRoom.tsx:connect:success',message:'Got LiveKit token',data:{hasToken:!!t,tokenLen:t?.length},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setToken(t);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoRoom.tsx:connect:error',message:'Token fetch failed',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
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
  if (!livekitUrl || livekitUrl.includes("your-project")) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-brown-200 bg-brown-50 p-6">
        <p className="text-brown-600">
          NEXT_PUBLIC_LIVEKIT_URL is not configured. Set it in .env.local with
          your LiveKit project URL from{" "}
          <a
            href="https://cloud.livekit.io"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            cloud.livekit.io
          </a>
          , then restart the dev server.
        </p>
      </div>
    );
  }

  // #region agent log
  const handleDisconnected = () => {
    fetch('http://127.0.0.1:7242/ingest/f4184da3-d841-4337-b105-2729fa0b958d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoRoom.tsx:onDisconnected',message:'LiveKit onDisconnected fired',data:{roomName,livekitUrl,hadConnected:hasConnectedRef.current},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    if (!hasConnectedRef.current) {
      onConnectionError?.(
        "Could not connect to the video server. Check that NEXT_PUBLIC_LIVEKIT_URL is correct in .env.local and restart the dev server."
      );
    }
    onDisconnected?.();
  };
  // #endregion

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      video={true}
      audio={true}
      onConnected={() => { hasConnectedRef.current = true; }}
      onDisconnected={handleDisconnected}
      data-lk-theme="default"
      style={{ height: "100%" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
