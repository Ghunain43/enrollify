"use client";

import { useState, useRef, useEffect } from "react";
import * as THREE from "three";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Message = { role: "user" | "bot"; text: string; sources?: string[] };

const WELCOME: Message = {
  role: "bot",
  text: "Hey! I'm MAJU Bot. Ask me about fees, admissions, deadlines, or eligibility and I'll pull it straight from the university's own pages.",
};

/* ---------------- theme tokens ---------------- */

const THEME = {
  light: {
    bg: "#FAF6F0",
    ink: "#1A1A1A",
    muted: "#8A7E6C",
    hairline: "#E7DCCC",
    paper: "#F4ECE1",
    userBg: "#F0E3D5",
    userBorder: "#EAD6C4",
    accent: "#C4552F",
    accentHover: "#A8421F",
    particle: 0xc4552f,
  },
  dark: {
    bg: "#1B1712",
    ink: "#F3ECE1",
    muted: "#9C8F7A",
    hairline: "#332B22",
    paper: "#241F19",
    userBg: "#3A2A1E",
    userBorder: "#4A3626",
    accent: "#E38356",
    accentHover: "#F0996E",
    particle: 0xe38356,
  },
};

/* ---------------- Three.js ambient background ---------------- */

function ParticleField({ dark }: { dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(dark ? THEME.dark.particle : THEME.light.particle);
  colorRef.current = dark ? THEME.dark.particle : THEME.light.particle;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 55;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const COUNT = 180;
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
      size: 1.5,
      transparent: true,
      opacity: 0.55,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // sparse connecting lines for a soft constellation feel
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
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      lineGeom.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />;
}

/* ---------------- icons ---------------- */

const Icon = {
  Feather: ({ c }: { c: string }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M20 3c-6 0-14 4-16 12 3-1 6-2 8-4M4 20l7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Sun: ({ c }: { c: string }) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  ),
  Moon: ({ c }: { c: string }) => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Paperclip: ({ c }: { c: string }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7">
      <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.5 8.49a2 2 0 0 1-2.83-2.83l7.78-7.77" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FAF6F0" strokeWidth="2">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Copy: ({ c }: { c: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7">
      <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Reload: ({ c }: { c: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7">
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function ChatbotPage() {
  const [dark, setDark] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLabel, setTimeLabel] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = dark ? THEME.dark : THEME.light;

  useEffect(() => {
    setTimeLabel(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chatbot/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer, sources: data.sources }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Couldn't reach the server just now — check the API is running and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function regenerateLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) ask(lastUser.text);
  }

  return (
    <div
      className="h-screen flex flex-col transition-colors duration-300"
      style={{ color: t.ink, fontFamily: "'Patrick Hand', cursive" }}
    >
      {/* body background lives here, BEHIND the canvas — never on the flex wrapper above,
          which would (and did) paint over the fixed canvas regardless of its z-index */}
      <div className="fixed inset-0 -z-20 transition-colors duration-300" style={{ background: t.bg }} />
      <ParticleField dark={dark} />

      {/* top bar */}
      <div
        className="sticky top-0 z-10 backdrop-blur-md px-4 md:px-0 py-4 flex justify-center transition-colors"
        style={{ background: `${t.bg}B3`, borderBottom: `1px solid ${t.hairline}` }}
      >
        <div className="w-full max-w-[760px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon.Feather c={t.accent} />
            <span style={{ fontFamily: "'Caveat', cursive", fontSize: 26, fontWeight: 700 }}>MAJU Bot</span>
          </div>
          <button
            onClick={() => setDark((d) => !d)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ border: `1px solid ${t.hairline}` }}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Icon.Sun c={t.ink} /> : <Icon.Moon c={t.ink} />}
          </button>
        </div>
      </div>

      {/* thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto flex justify-center">
        <div className="w-full max-w-[760px] px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px" style={{ background: t.hairline }} />
            <span className="text-[11px] tracking-wide uppercase whitespace-nowrap" style={{ color: t.muted }}>
              Today{timeLabel ? ` · ${timeLabel}` : ""}
            </span>
            <div className="flex-1 h-px" style={{ background: t.hairline }} />
          </div>

          <div className="space-y-6">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] leading-relaxed"
                    style={{ background: t.userBg, border: `1px solid ${t.userBorder}` }}
                  >
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon.Feather c={t.accent} />
                    <span className="text-[19px]" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>MAJU Bot</span>
                  </div>
                  <p className="text-[15px] leading-[1.68]">{m.text}</p>

                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {m.sources.map((s) => (
                        <a
                          key={s}
                          href={s}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[12px] hover:underline"
                          style={{ color: t.accentHover, fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {s.replace("https://", "")}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => navigator.clipboard.writeText(m.text)} title="Copy">
                      <Icon.Copy c={t.muted} />
                    </button>
                    {i === messages.length - 1 && (
                      <button onClick={regenerateLast} title="Regenerate">
                        <Icon.Reload c={t.muted} />
                      </button>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="flex items-center gap-2">
                <Icon.Feather c={t.accent} />
                <span className="typing-dots">
                  <span style={{ background: t.accent }} />
                  <span style={{ background: t.accent }} />
                  <span style={{ background: t.accent }} />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* composer */}
      <div className="px-4 md:px-0 pb-4 pt-2 flex justify-center backdrop-blur-md" style={{ background: `${t.bg}B3` }}>
        <div className="w-full max-w-[760px]">
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="rounded-2xl px-4 pt-3 pb-2 transition-colors"
            style={{ border: `1px solid ${t.hairline}`, background: `${t.bg}CC`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
              placeholder="Reply to MAJU Bot…"
              rows={1}
              className="w-full resize-none bg-transparent text-[15px] outline-none max-h-40"
              style={{ color: t.ink }}
            />
            <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${t.hairline}99` }}>
              <div className="flex items-center gap-3">
                <button type="button" className="opacity-50 cursor-not-allowed" title="Attachments coming soon">
                  <Icon.Paperclip c={t.muted} />
                </button>
                <span
                  className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                  style={{ color: t.muted, border: `1px solid ${t.hairline}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: t.accent }} />
                  MAJU Bot · Live
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs hidden sm:inline" style={{ color: t.muted }}>⏎ to send</span>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 transition-colors"
                  style={{ background: t.accent }}
                >
                  <Icon.Send />
                </button>
              </div>
            </div>
          </form>
          <p className="text-center text-[11px] mt-2" style={{ color: t.muted }}>
            MAJU Bot can make mistakes. Double-check important info.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .typing-dots { display: inline-flex; gap: 4px; }
        .typing-dots span { width: 6px; height: 6px; border-radius: 50%; display: inline-block; animation: bounce 1.1s infinite ease-in-out; }
        .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,80%,100% { opacity:0.3; transform: translateY(0);} 40% { opacity:1; transform: translateY(-3px);} }
        @media (prefers-reduced-motion: reduce) { .typing-dots span { animation: none; opacity: 0.6; } }
      `}</style>
    </div>
  );
}