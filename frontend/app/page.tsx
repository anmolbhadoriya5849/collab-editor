"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, LogOut, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';   

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Better Auth session hook
  const { data: session, isPending } = authClient.useSession();

  const [joinedRooms, setJoinedRooms] = useState<string[]>([]);

  const handleGoogleLogin = async () => {
    try {
      await authClient.signIn.social({ provider: "google" });
    } catch (error) {
      toast.error("Failed to sign in with Google.");
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      toast.success("Logged out successfully.");
    } catch (error) {
      toast.error("Failed to log out.");
    }
  };

  const createRoom = async () => {
    if (!session) {
      toast.error("You must be signed in to create a room.");
      return;
    }
    const id = Math.random().toString(36).substring(2, 8);
    
    await axios.post(`api/rooms/create`, { roomId: id });
    router.push(`/room/${id}`);
  };

  const joinRoom = async () => {
    if (!session) {
      toast.error("You must be signed in to join a room.");
      return;
    }
    
    const trimmed = roomId.trim();
    if (!trimmed) {
      toast.error("Please enter a valid room ID.");
      inputRef.current?.focus();
      return;
    }
    await axios.post(`api/rooms/join`, { roomId: trimmed });
    router.push(`/room/${trimmed}`);
  };

  useEffect(() => {
    if (session) {
      const fetchRooms = async () => {
        try {
          console.log("Fetching rooms...", session.user.id);
          const rooms = await axios.get(`api/rooms/getAllRooms`);
          setJoinedRooms(rooms.data.rooms);
        } catch (error) {
          console.error("Error fetching rooms:", error);
        }
      };
      fetchRooms();
    }
  }, [session]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans relative selection:bg-emerald-500/30">
      
      {/* Top Navbar / Auth Section */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-end">
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
        ) : session ? (
          <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full shadow-sm">
            <span className="text-sm font-medium text-zinc-300">{session.user.name}</span>
            <button 
              onClick={handleLogout}
              className="text-zinc-400 hover:text-red-400 transition-colors p-1"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
          >
            {/* Standard Google SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>

      {/* Main Interactive Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col gap-8 relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-emerald-500/10 blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-mono text-xs font-semibold text-emerald-400 tracking-widest uppercase">
              collab.code
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Real-time code collaboration
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Create a room or join an existing one to start coding together with your team.
          </p>
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          {/* Create Room Section */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
              New Session
            </span>
            <button 
              onClick={createRoom}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              Initialize New Room
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 opacity-60">
            <div className="h-px bg-zinc-800 flex-1" />
            <span className="text-xs text-zinc-500 font-mono tracking-widest uppercase">or</span>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          {/* Join Room Section */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
              Join Existing
            </span>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                placeholder="Paste Room ID..."
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
              />
              <button 
                onClick={joinRoom}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-xl transition-all active:scale-[0.98] border border-zinc-700"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3>All Joined Rooms</h3>
          <ul>
{/* Recent Workspaces / Joined Rooms */}
        {joinedRooms.length > 0 && (
          <div className="flex flex-col gap-3 mt-2 pt-6 border-t border-zinc-800/50">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
              Recent Workspaces
            </span>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {joinedRooms.map((room: any) => (
                <a
                  key={room.id}
                  href={`/room/${room.id}`}
                  className="flex items-center justify-between bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/50 hover:border-zinc-700 rounded-xl px-4 py-3 transition-all group"
                >
                  <span className="text-sm font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors truncate pr-4">
                    {room.name || room.id}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
          </ul>
        </div>
      </motion.div>

      <p className="mt-8 text-xs text-zinc-500 font-mono text-center">
        Authentication required to access workspaces.
      </p>
    </div>
  );
}