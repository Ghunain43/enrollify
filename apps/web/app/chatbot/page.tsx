"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import * as THREE from "three";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const HISTORY_TURNS = 6; // how many past messages we send back for follow-up questions

type Role = "user" | "bot";
type Message = { role: Role; text: string; sources?: string[] };

const WELCOME: Message = {
  role: "bot",
  text: "Hey! I'm MAJU Bot. Ask me about fees, admissions, deadlines, or eligibility and I'll pull it straight from the university's own pages.",
};

/* ---------------- theme toggle (same mechanism as the landing page, same storage key) ---------------- */

function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("enrollify-theme");
    const light = saved === "light";
    document.documentElement.classList.toggle("light", light);
    const frame = requestAnimationFrame(() => {
      setIsLight(light);
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("enrollify-theme", next ? "light" : "dark");
  }

  if (!mounted) return <div className="h-10 w-10" />;

  return (
    <button
      onClick={toggle}
      className="card-3d flex h-10 w-10 items-center justify-center rounded-full text-lg transition hover:scale-105 active:scale-95"
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
    >
      {isLight ? "🌙" : "☀️"}
    </button>
  );
}

/* ---------------- ambient particle field, recolored to the site's lime/teal accents ---------------- */

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(0xd9f99d); // lime-200

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const syncColor = () => {
      const light = document.documentElement.classList.contains("light");
      colorRef.current = light ? 0x65a30d : 0xd9f99d; // lime-600 on light bg, lime-200 on dark
    };
    syncColor();
    const observer = new MutationObserver(syncColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 55;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const COUNT = 160;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 130;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 90;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: colorRef.current,
      size: 1.4,
      transparent: true,
      opacity: 0.5,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // sparse connecting lines, same constellation feel as the chat page always had
    const linePositions: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 13) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: colorRef.current, transparent: true, opacity: 0.05 });
    const lines = new THREE.LineSegments(lineGeom, lineMaterial);
    scene.add(lines);

    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      material.color.setHex(colorRef.current);
      lineMaterial.color.setHex(colorRef.current);
      if (!prefersReducedMotion) {
        points.rotation.y += 0.0004;
        lines.rotation.y = points.rotation.y;
        camera.position.x += (mouseX * 4 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 3 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      lineGeom.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10" />;
}

/* ---------------- icons (currentColor, so they inherit text-strong / text-muted / text-faint) ---------------- */

const Icon = {
  Feather: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 3c-6 0-14 4-16 12 3-1 6-2 8-4M4 20l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Paperclip: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.5 8.49a2 2 0 0 1-2.83-2.83l7.78-7.77" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18200d" strokeWidth="2.2">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Reload: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLabel, setTimeLabel] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeLabel(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;

    // last few turns, for follow-ups like "what about BSSE?" — sent as {role, content}
    const history = messages
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.text }));

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chatbot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer, sources: data.sources }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Couldn't reach the server just now — check the API is running and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function regenerateLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) ask(lastUser.text);
  }

  return (
    <main className="text-strong relative flex h-screen flex-col overflow-hidden">
      <div className="grain" />
      <ParticleField />

      {/* top bar — mirrors the landing page's header exactly */}
      <div className="relative z-10 flex justify-center border-b border-white/10 px-5 py-6 backdrop-blur-md sm:px-10">
        <div className="flex w-full max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-200 font-display font-bold text-[#18200d] shadow-[0_8px_24px_-10px_#ddff5c]">
              E
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Enrollify<span className="text-lime-200">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="edge-label hidden sm:block">MAJU Bot</span>
            <span className="edge-label text-lime-200">Live</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* thread */}
      <div ref={scrollRef} className="relative z-10 flex flex-1 justify-center overflow-y-auto">
        <div className="w-full max-w-3xl px-5 py-10 sm:px-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-faint whitespace-nowrap font-mono text-[11px]">
              Today{timeLabel ? ` · ${timeLabel}` : ""}
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-8">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="card-3d max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] leading-relaxed">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="group">
                  <div className="mb-2 flex items-center gap-2 text-lime-200">
                    <Icon.Feather />
                    <span className="font-display text-sm font-semibold tracking-tight text-strong">MAJU Bot</span>
                  </div>
                  <p className="text-muted text-[15px] leading-[1.68]">{m.text}</p>

                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {m.sources.map((s) => (
                        <a
                          key={s}
                          href={s}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[12px] text-teal-200 hover:underline"
                        >
                          {s.replace("https://", "")}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="text-faint mt-3 flex items-center gap-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => navigator.clipboard.writeText(m.text)} title="Copy" className="hover:text-strong">
                      <Icon.Copy />
                    </button>
                    {i === messages.length - 1 && (
                      <button onClick={regenerateLast} title="Regenerate" className="hover:text-strong">
                        <Icon.Reload />
                      </button>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex items-center gap-2 text-lime-200">
                <Icon.Feather />
                <span className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* composer */}
      <div className="relative z-10 flex justify-center px-5 pb-6 pt-3 backdrop-blur-md sm:px-10">
        <div className="w-full max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="card-3d rounded-[1.25rem] px-4 pb-2 pt-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Ask MAJU Bot anything…"
              rows={1}
              className="text-strong max-h-40 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-faint"
            />
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
              <div className="flex items-center gap-4">
                <button type="button" className="text-faint cursor-not-allowed opacity-50" title="Attachments coming soon">
                  <Icon.Paperclip />
                </button>
                <span className="edge-label flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-200" />
                  Sourced live from jinnah.edu
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-faint hidden font-mono text-xs sm:inline">⏎ to send</span>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-200 transition hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  <Icon.Send />
                </button>
              </div>
            </div>
          </form>
          <p className="text-faintest mt-3 text-center text-[11px]">
            MAJU Bot can make mistakes. Double-check anything important with the university directly.
          </p>
        </div>
      </div>
    </main>
  );
}