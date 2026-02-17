"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

interface AiIdeaInputProps {
  onAddImage?: (url: string) => Promise<void>;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function AiIdeaInput({ onAddImage }: AiIdeaInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const generateVisual = useAction(api.ai.generateVisual);
  const onAddImageRef = useRef(onAddImage);

  useEffect(() => {
    onAddImageRef.current = onAddImage;
  }, [onAddImage]);

  transcriptRef.current = transcript;

  const handleResult = useCallback(
    async (finalTranscript: string) => {
      const text = finalTranscript.trim();
      if (!text || !onAddImageRef.current) return;

      setStatus("processing");
      setError(null);
      try {
        const { url } = await generateVisual({ transcribedText: text });
        await onAddImageRef.current(url);
        setTranscript("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate visual");
      } finally {
        setStatus("idle");
      }
    },
    [generateVisual]
  );

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    transcriptRef.current = "";
    setTranscript("");

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        }
      }
      if (final) {
        transcriptRef.current += final;
        setTranscript(transcriptRef.current);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const text = transcriptRef.current.trim();
      if (text) {
        handleResult(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error !== "aborted") {
        setError(event.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setStatus("listening");
    setError(null);
  }, [handleResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    const text = transcriptRef.current.trim();
    if (text) {
      handleResult(text);
    } else {
      setStatus("idle");
    }
  }, [handleResult]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        disabled={status === "processing"}
        className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
          isListening
            ? "bg-red-500 text-white"
            : "bg-brown-800 text-brown-50 hover:bg-brown-900"
        } ${status === "processing" ? "opacity-50" : ""}`}
        title={isListening ? "Stop and generate visual" : "Speak your idea"}
      >
        {status === "processing" ? (
          <span className="text-sm">…</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>
      {transcript && (
        <p className="max-w-xs text-center text-sm text-brown-600">
          {transcript}
        </p>
      )}
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
