"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Editor, { OnMount } from "@monaco-editor/react";
import { editor as MonacoEditor } from "monaco-editor";
import { Button } from "@/components/ui/button";
import axios from "axios";
import * as Y from "yjs";
import type { MonacoBinding } from "y-monaco";
import { Plus, FileCode, Folder, ChevronDown } from "lucide-react";
import { bootOS, fileSystem, startDevServer, webcontainerInstance } from "@/components/webContainers/webContainer";
import { log } from "console";

// ── LAYMAN'S EXPLANATION: TypeScript definition for our nested items ───────
interface FileSystemNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: FileSystemNode[];
}

// ── LAYMAN'S EXPLANATION: Converts ["/main.ts", "/src/utils/math.ts"] into a nested tree structure ──
const buildTree = (paths: string[]): FileSystemNode[] => {
  const root: any = {};

  paths.forEach((path) => {
    const parts = path.split("/").filter(Boolean);
    let current = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath += "/" + part;
      const isFolder = index < parts.length - 1;

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          isFolder: isFolder,
          children: isFolder ? {} : null,
        };
      }
      if (isFolder) {
        current = current[part].children;
      }
    });
  });

  const formatNode = (obj: any): FileSystemNode[] => {
    return Object.values(obj).map((node: any) => ({
      name: node.name,
      path: node.path,
      isFolder: node.isFolder,
      children: node.isFolder ? formatNode(node.children) : [],
    }));
  };

  return formatNode(root);
};

// ── LAYMAN'S EXPLANATION: A recursive component that renders files and folders ──
function FileNode({ 
  node, 
  activeFile, 
  setActiveFile 
}: { 
  node: FileSystemNode; 
  activeFile: string; 
  setActiveFile: (path: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (node.isFolder) {
    return (
      <div className="w-full select-none">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left flex items-center gap-1.5 px-2 py-1 cursor-pointer font-['IBM_Plex_Mono',monospace] text-[12.5px] text-[#888892] hover:bg-[#141416] hover:text-[#c0c0cc] transition-colors rounded"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? "" : "-rotate-90"}`} />
          <Folder className="w-3.5 h-3.5 text-[#bd93f9] opacity-90" />
          <span className="truncate font-medium text-[#c0c0cc]">{node.name}</span>
        </button>
        {isOpen && (
          <div className="pl-3 border-l border-[#1a1a1e] ml-3.5 mt-0.5 mb-0.5 flex flex-col gap-0.5">
            {node.children.map((child) => (
              <FileNode 
                key={child.path} 
                node={child} 
                activeFile={activeFile} 
                setActiveFile={setActiveFile} 
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeFile === node.path;
  return (
    <button
      onClick={() => setActiveFile(node.path)}
      className={`w-full text-left flex items-center gap-2 px-3 py-1 cursor-pointer font-['IBM_Plex_Mono',monospace] text-[12.5px] transition-colors rounded ${
        isActive 
          ? "bg-[#1a1a22] text-[#7cfc8e] font-semibold" 
          : "bg-transparent text-[#888892] hover:bg-[#141416] hover:text-[#c0c0cc]"
      }`}
    >
      <FileCode className={`w-3.5 h-3.5 opacity-80 ${isActive ? "text-[#7cfc8e]" : "text-[#888892]"}`} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeFile, setActiveFile] = useState("/main.ts");
  const [editorMounted, setEditorMounted] = useState(false);
  const [fileReady, setFileReady] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const fileContentsRef = useRef<Y.Map<Y.Text> | null>(null);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  
  const [fileList, setFileList] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [filePath, setFilePath] = useState("");

  const monacoRef = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const fileContents = ydoc.getMap<Y.Text>("fileContents");
    fileContentsRef.current = fileContents;
    async function initializeFileSystem() {
      await bootOS();
    }
    initializeFileSystem();
    console.log(fileContents.keys());

    fileContents.observe(() => {
      const paths = Array.from(fileContents.keys());
      setFileList(paths);

      async function updateFileSystem() {
        if(!webcontainerInstance){
          console.log("WebContainer instance is not initialized.");
          return;
        }
        await fileSystem(fileContents);
      }
      updateFileSystem();
    });

    return () => ydoc.destroy();
  }, []);

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL!);
    const ydoc = ydocRef.current;
    if (!ydoc) return;

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current?.emit("join-room", roomId);
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("document-state", (state: number[]) => {
      if (!ydocRef.current) return;
      Y.applyUpdate(ydocRef.current, new Uint8Array(state));
      setFileReady(true);
    });

    socketRef.current.on("yjs-update", (update: number[]) => {
      if (!ydocRef.current) return;
      Y.applyUpdate(ydocRef.current, new Uint8Array(update));
    });

    socketRef.current.on("peer-count", (count: number) => setPeers(count));

    const handleYjsUpdate = (update: Uint8Array) => {
      socketRef.current?.emit("yjs-update", {
        roomId,
        update: Array.from(update),
      });
    };

    ydoc.on("update", handleYjsUpdate);

    return () => {
      ydoc.off("update", handleYjsUpdate);
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (!editorMounted || !fileReady || !editorRef.current || !fileContentsRef.current) return;

    let ytext = fileContentsRef.current.get(activeFile);
    
    if (!ytext) {
      ytext = new Y.Text();
      fileContentsRef.current.set(activeFile, ytext);
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    let binding: MonacoBinding | null = null;
    let isCancelled = false; 

    import("y-monaco").then(({ MonacoBinding }) => {
      import("@monaco-editor/react").then(({ loader }) => {
        loader.init().then((monaco) => {
          if (isCancelled || !editorRef.current) return;

          const uri = monaco.Uri.parse(`file:///${roomId}${activeFile.startsWith('/') ? activeFile : `/${activeFile}`}`);
          const model =
            monaco.editor.getModel(uri) ??
            monaco.editor.createModel("", getLanguage(activeFile), uri);

          editorRef.current.setModel(model);

          binding = new MonacoBinding(
            ytext!,
            model,
            new Set([editorRef.current])
          );
          bindingRef.current = binding;
        });
      });
    });

    return () => {
      isCancelled = true; 
      if (binding) binding.destroy();
      if (bindingRef.current) bindingRef.current = null;
    };
  }, [activeFile, editorMounted, fileReady, roomId]);

  const handleEditorMount: OnMount = (mountedEditor, monaco) => {
    editorRef.current = mountedEditor;
    monacoRef.current = monaco;
    setEditorMounted(true);
  };

  const handleCreateNewFile = (rawPath: string) => {
    if (!fileContentsRef.current || !rawPath.trim()) return;
    
    const newFilePath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

    if (fileContentsRef.current.has(newFilePath)) {
      alert("File already exists!");
      return;
    }

    fileContentsRef.current.set(newFilePath, new Y.Text());
    setActiveFile(newFilePath);
    setFilePath("");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId as string).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const confirmLeaveRoom = async () => {
    await axios.post(`api/rooms/leave`, { roomId });
    router.push("/");
  };

  // Turn our flat files state into a visual tree hierarchy state
  const fileTree = buildTree(fileList);

  return (
    <div className="flex h-screen font-['Syne',sans-serif] bg-[#0c0c0d] text-[#e8e8e8] overflow-hidden">
      
      {/* ── SIDEBAR (Visual File Explorer Layout) ── */}
      <aside className="w-[260px] flex flex-col border-r border-[#1a1a1e] bg-[#0a0a0b] shrink-0 z-10">
        <div className="h-[52px] flex items-center px-4 border-b border-[#1a1a1e] shrink-0">
          <span className="font-['IBM_Plex_Mono',monospace] text-[12px] text-[#e8e8e8] tracking-[0.08em] font-semibold">
            EXPLORER
          </span>
        </div>

        <div className="p-3 flex items-center justify-between">
          <span className="text-[11px] font-['IBM_Plex_Mono',monospace] text-[#888892] font-semibold tracking-wider">WORKSPACE</span>
          <button 
            onClick={() => setShowInput(!showInput)}
            className="text-[#888892] hover:text-[#7cfc8e] transition-colors"
            title="Create New File/Folder Path"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showInput && (
          <div className="px-3 mb-2">
            <input
              autoFocus
              type="text"
              placeholder="e.g. /src/components/button.ts"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateNewFile(filePath);
                  setShowInput(false);
                } else if (e.key === "Escape") {
                  setShowInput(false);
                }
              }}
              className="w-full bg-[#141416] border border-[#2e2e36] rounded py-[6px] px-[8px] text-[#c0c0cc] text-[12px] font-['IBM_Plex_Mono',monospace] outline-none focus:border-[#7cfc8e]"
            />
          </div>
        )}

        {/* ── Rendering the Recursive Tree Component ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 flex flex-col gap-0.5">
          {fileTree.map((node) => (
            <FileNode 
              key={node.path} 
              node={node} 
              activeFile={activeFile} 
              setActiveFile={setActiveFile} 
            />
          ))}
        </div>
      </aside>

      {/* ── MAIN EDITOR AREA ── */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="flex items-center justify-between px-5 h-[52px] border-b border-[#1a1a1e] bg-[#0c0c0d] shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <button 
              className="group flex items-center gap-2 bg-[#141416] border border-[#222226] rounded-lg py-[5px] px-[10px] cursor-pointer transition-colors duration-150 hover:border-[#2e2e36] hover:bg-[#1a1a1e]" 
              onClick={copyRoomId} 
              title="Click to copy room ID"
            >
              <span className="font-['IBM_Plex_Mono',monospace] text-[13px] text-[#c0c0cc] tracking-[0.04em]">
                {roomId}
              </span>
              <span className={`text-[11px] transition-colors duration-150 ${copied ? "text-[#7cfc8e]" : "text-[#3e3e4a] group-hover:text-[#7cfc8e]"}`}>
                {copied ? "✓" : "⎘"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {peers > 0 && (
              <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#3a3a42]">
                {peers} {peers === 1 ? "user" : "users"}
              </span>
            )}
            <div className="flex items-center gap-[6px] font-['IBM_Plex_Mono',monospace] text-[11px] text-[#4a4a54] tracking-[0.06em]">
              <span className={`w-[6px] h-[6px] rounded-full transition-all duration-300 ${connected ? "bg-[#7cfc8e] shadow-[0_0_6px_#7cfc8e60]" : "bg-[#2e2e36]"}`} />
              {connected ? "connected" : "connecting"}
            </div>
            <span className="w-[1px] h-[18px] bg-[#1e1e24]" />
            <Button
            onClick={() => {
              if(!fileContentsRef.current) return;
              startDevServer(fileContentsRef.current);
            }}
            variant="default" size="sm" className="hover:text-green-600 text-green-300">
              Run
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/")} className="bg-transparent border-[#222226] text-[#c0c0cc] hover:text-white hover:bg-[#1a1a1e]">
              Home
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowLeaveModal(true)} className="bg-[#3a1010] text-[#ff7070] hover:bg-[#501010]">
              Leave
            </Button>
          </div>
        </header>

        <div className="flex-1 relative bg-[#0f0f10]">
          {!connected && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1a1010] border border-[#3a1a1a] text-[#ff7070] font-['IBM_Plex_Mono',monospace] text-[12px] px-4 py-2 rounded-lg tracking-[0.04em] z-10 shadow-lg">
              reconnecting…
            </div>
          )}

          <div className="flex items-center px-4 h-[35px] gap-2 border-b border-[#141416] bg-[#0c0c0d] shrink-0">
            <span className="font-['IBM_Plex_Mono',monospace] text-[12px] text-[#7cfc8e] tracking-[0.04em]">
              {activeFile}
            </span>
          </div>

          <Editor
            height="calc(100% - 35px)"
            language={getLanguage(activeFile)}
            onMount={handleEditorMount}
            options={{
              theme: "vs-dark",
              fontSize: 14,
              lineHeight: 22,
              automaticLayout: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 16, bottom: 16 },
              tabSize: 2,
              insertSpaces: true,
              formatOnPaste: true,
              formatOnType: true,
              cursorBlinking: "smooth",
              smoothScrolling: true,
              renderWhitespace: "selection",
            }}
          />
        </div>

        <footer className="flex items-center justify-between px-4 h-[24px] border-t border-[#141416] bg-[#007acc] shrink-0">
          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-white tracking-[0.06em]">
            collab.code // {peers} online
          </span>
          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-white tracking-[0.06em]">
            {getLanguage(activeFile).toUpperCase()}
          </span>
        </footer>
      </main>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[100]">
          <div className="bg-[#101012] border border-[#222226] rounded-xl p-6 w-[90%] max-w-[400px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center">
            <h3 className="text-[18px] font-semibold mb-3 text-[#e8e8e8]">Leave Room?</h3>
            <p className="text-[14px] text-[#888892] mb-6 leading-relaxed">
              Are you sure you want to go back to the main page? Your connection to this collaborative session will be closed.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                className="bg-[#1a1a1e] text-[#c0c0cc] border border-[#2e2e36] py-2.5 px-5 rounded-lg cursor-pointer font-['Syne',sans-serif] font-semibold transition-all duration-200 hover:bg-[#222226] hover:text-[#e8e8e8]"
                onClick={() => setShowLeaveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="bg-[#ff7070] text-[#101012] border-none py-2.5 px-5 rounded-lg cursor-pointer font-['Syne',sans-serif] font-semibold transition-all duration-200 hover:bg-[#ff5050]"
                onClick={confirmLeaveRoom}
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getLanguage(filename: string): string {
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".md")) return "markdown";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".html")) return "html";
  return "plaintext";
}