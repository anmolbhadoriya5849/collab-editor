"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();

  const [code, setCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState(0);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:5001");

    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.emit("join-room", roomId);

    socketRef.current.on("code", (newCode: string) => {
      setCode(newCode);
    });

    socketRef.current.on("peer-count", (count: number) => {
      setPeers(count);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      setCode(newCode);
      socketRef.current?.emit("code-change", { roomId, newCode });
    },
    [roomId]
  );

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId as string).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body { height: 100%; background: #0c0c0d; color: #e8e8e8; }

        .layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          font-family: 'Syne', sans-serif;
        }

        /* ── Top bar ── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 52px;
          border-bottom: 1px solid #1a1a1e;
          background: #0c0c0d;
          flex-shrink: 0;
          gap: 16px;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #3e3e48;
          letter-spacing: 0.08em;
          font-weight: 500;
          white-space: nowrap;
        }

        .sep {
          width: 1px;
          height: 18px;
          background: #1e1e24;
        }

        .room-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #141416;
          border: 1px solid #222226;
          border-radius: 8px;
          padding: 5px 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .room-badge:hover {
          border-color: #2e2e36;
          background: #1a1a1e;
        }

        .room-id {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: #c0c0cc;
          letter-spacing: 0.04em;
        }

        .copy-icon {
          color: #3e3e4a;
          font-size: 11px;
          transition: color 0.15s;
        }

        .room-badge:hover .copy-icon {
          color: #7cfc8e;
        }

        .copy-icon.done {
          color: #7cfc8e;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #4a4a54;
          letter-spacing: 0.06em;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2e2e36;
          transition: background 0.3s, box-shadow 0.3s;
        }

        .status-dot.online {
          background: #7cfc8e;
          box-shadow: 0 0 6px #7cfc8e60;
        }

        .peers {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #3a3a42;
        }

        /* ── Editor area ── */
        .editor-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .editor-header {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          gap: 8px;
          border-bottom: 1px solid #141416;
          background: #0f0f10;
          flex-shrink: 0;
        }

        .tab-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: #2a2a32;
        }

        .tab-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #3e3e48;
          letter-spacing: 0.06em;
        }

        .editor {
          flex: 1;
          width: 100%;
          padding: 24px 28px;
          background: #0c0c0d;
          color: #d4d4d8;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          line-height: 1.7;
          border: none;
          outline: none;
          resize: none;
          tab-size: 2;
          caret-color: #7cfc8e;
          letter-spacing: 0.01em;
        }

        .editor::placeholder {
          color: #252530;
        }

        .editor::selection {
          background: #7cfc8e20;
        }

        /* ── Status bar ── */
        .statusbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 28px;
          border-top: 1px solid #141416;
          background: #0a0a0b;
          flex-shrink: 0;
        }

        .statusbar-item {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #2e2e38;
          letter-spacing: 0.06em;
        }

        .statusbar-item.accent {
          color: #3e3e4a;
        }

        .disconnected-banner {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: #1a1010;
          border: 1px solid #3a1a1a;
          color: #ff7070;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          padding: 8px 16px;
          border-radius: 8px;
          letter-spacing: 0.04em;
          z-index: 10;
          white-space: nowrap;
        }
      `}</style>

      <div className="layout">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="logo-text">collab.code</span>
            <span className="sep" />
            <button className="room-badge" onClick={copyRoomId} title="Click to copy room ID">
              <span className="room-id">{roomId}</span>
              <span className={`copy-icon${copied ? " done" : ""}`}>
                {copied ? "✓" : "⎘"}
              </span>
            </button>
          </div>

          <div className="topbar-right">
            {peers > 0 && (
              <span className="peers">{peers} {peers === 1 ? "user" : "users"}</span>
            )}
            <div className="status">
              <span className={`status-dot${connected ? " online" : ""}`} />
              {connected ? "connected" : "connecting"}
            </div>
          </div>
        </header>

        {/* Editor */}
        <div className="editor-wrap">
          {!connected && (
            <div className="disconnected-banner">reconnecting…</div>
          )}

          <div className="editor-header">
            <span className="tab-dot" />
            <span className="tab-label">main.ts</span>
          </div>

          <textarea
            className="editor"
            value={code}
            onChange={handleChange}
            placeholder="// Start typing — changes sync in real time"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Status bar */}
        <footer className="statusbar">
          <span className="statusbar-item">TypeScript</span>
          <span className="statusbar-item accent">
            {code.split("\n").length} lines · {code.length} chars
          </span>
        </footer>
      </div>
    </>
  );
}