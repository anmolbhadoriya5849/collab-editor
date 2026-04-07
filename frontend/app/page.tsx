"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8);
    router.push(`/room/${id}`);
  };

  const joinRoom = () => {
    const trimmed = roomId.trim();
    if (!trimmed) {
      setError("Please enter a room ID.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    router.push(`/room/${trimmed}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0c0c0d;
          color: #e8e8e8;
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .card {
          width: 100%;
          max-width: 400px;
          background: #141416;
          border: 1px solid #232327;
          border-radius: 16px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .logo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7cfc8e;
          box-shadow: 0 0 8px #7cfc8e80;
        }

        .logo-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          color: #7cfc8e;
          letter-spacing: 0.08em;
          font-weight: 500;
        }

        .title {
          font-size: 26px;
          font-weight: 700;
          color: #f0f0f0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 14px;
          color: #5a5a64;
          font-weight: 400;
          line-height: 1.5;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #2e2e34;
          font-size: 11px;
          letter-spacing: 0.1em;
          font-family: 'IBM Plex Mono', monospace;
        }

        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #1e1e22;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-label {
          font-size: 11px;
          font-weight: 600;
          color: #4a4a54;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'IBM Plex Mono', monospace;
        }

        .btn-primary {
          width: 100%;
          padding: 13px 20px;
          background: #f0f0f0;
          color: #0c0c0d;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.15s, transform 0.1s;
        }

        .btn-primary:hover {
          background: #ffffff;
          transform: translateY(-1px);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .input-row {
          display: flex;
          gap: 8px;
        }

        .input {
          flex: 1;
          padding: 13px 14px;
          background: #0c0c0d;
          border: 1px solid #232327;
          border-radius: 10px;
          color: #e8e8e8;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }

        .input::placeholder {
          color: #3a3a42;
        }

        .input:focus {
          border-color: #3a3a48;
        }

        .input.error {
          border-color: #ff5e5e60;
        }

        .btn-secondary {
          padding: 13px 18px;
          background: transparent;
          color: #e8e8e8;
          border: 1px solid #2a2a30;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, transform 0.1s;
          white-space: nowrap;
        }

        .btn-secondary:hover {
          border-color: #3a3a44;
          background: #1a1a1e;
          transform: translateY(-1px);
        }

        .btn-secondary:active {
          transform: translateY(0);
        }

        .error-msg {
          font-size: 12px;
          color: #ff7070;
          font-family: 'IBM Plex Mono', monospace;
        }

        .footer {
          text-align: center;
          font-size: 12px;
          color: #2e2e36;
          font-family: 'IBM Plex Mono', monospace;
          margin-top: 32px;
        }
      `}</style>

      <div className="page">
        <div className="card">
          <div className="header">
            <div className="logo">
              <span className="logo-dot" />
              <span className="logo-text">collab.code</span>
            </div>
            <h1 className="title">Real-time code collaboration</h1>
            <p className="subtitle">Create a room or join an existing one to start coding together.</p>
          </div>

          <div className="section">
            <span className="section-label">New session</span>
            <button className="btn-primary" onClick={createRoom}>
              Create Room
            </button>
          </div>

          <div className="divider">or</div>

          <div className="section">
            <span className="section-label">Join existing</span>
            <div className="input-row">
              <input
                ref={inputRef}
                className={`input${error ? " error" : ""}`}
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                spellCheck={false}
              />
              <button className="btn-secondary" onClick={joinRoom}>
                Join
              </button>
            </div>
            {error && <span className="error-msg">{error}</span>}
          </div>
        </div>

        <p className="footer">Share the room ID with collaborators to invite them.</p>
      </div>
    </>
  );
}