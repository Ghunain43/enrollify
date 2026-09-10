"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("enrollify-theme");
    const light = saved === "light";
    document.documentElement.classList.toggle("light", light);
    const frame = requestAnimationFrame(() => { setIsLight(light); setMounted(true); });
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

function ParallaxBackground() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setPos({ x, y });
      });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ perspective: "1000px" }}>
      <div className="grain" />
      <div className="terminal-grid absolute inset-x-0 top-1/3 h-2/3" />
      <div className="absolute -right-20 top-8 h-72 w-72 rounded-full border border-lime-200/10 transition-transform duration-500" style={{ transform: `translate3d(${pos.x * -24}px, ${pos.y * -18}px, 0) rotateX(62deg) rotateZ(-18deg)` }} />
      <div className="absolute -left-32 bottom-10 h-80 w-80 rounded-full border border-teal-200/10 transition-transform duration-500" style={{ transform: `translate3d(${pos.x * 18}px, ${pos.y * 22}px, 0) rotateX(62deg) rotateZ(22deg)` }} />
    </div>
  );
}

function FeatureCard({ icon, title, description, status, href }: {
  icon: string; title: string; description: string; status: "live" | "soon"; href?: string;
}) {
  const content = (
    <div className={`card-3d h-full rounded-[1.25rem] p-5 transition duration-300 ${status === "live" ? "hover:-translate-y-2 hover:border-lime-200/35" : "opacity-65"}`}>
      <div className="mb-8 flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-200/10 font-mono text-sm font-bold text-lime-200">{icon}</span>
        {status === "live" ? (
          <span className="edge-label">Live now</span>
        ) : (
          <span className="edge-label text-faint">Queued</span>
        )}
      </div>
      <h3 className="font-display text-mid mb-2 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-muted text-sm leading-relaxed">{description}</p>
      {status === "live" && (
        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-lime-200">Open planner <span aria-hidden="true">↗</span></p>
      )}
    </div>
  );

  return status === "live" && href ? <Link href={href}>{content}</Link> : content;
}

export default function LandingPage() {
  return (
    <main className="text-strong relative min-h-screen overflow-hidden px-5 py-6 sm:px-10 sm:py-8">
      <ParallaxBackground />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 flex items-center justify-between sm:mb-24">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-200 font-display font-bold text-[#18200d] shadow-[0_8px_24px_-10px_#ddff5c]">E</div>
            <span className="font-display text-lg font-bold tracking-tight sm:text-xl">Enrollify<span className="text-lime-200">.</span></span>
          </div>
          <div className="flex items-center gap-4"><span className="edge-label hidden text-muted sm:block">MAJU / FALL 2026</span><ThemeToggle /></div>
        </div>

        <div className="orbit-stage step-enter relative mb-20 grid min-h-[28rem] items-center overflow-hidden rounded-[2rem] border border-white/10 bg-black/10 px-6 py-14 sm:px-16">
          <div className="relative z-10 max-w-3xl">
            <p className="edge-label mb-5">Enrollment intelligence / 01</p>
            <h1 className="font-display mb-6 max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-7xl">
              Your semester,<br /><span className="gradient-text">in formation.</span>
            </h1>
            <p className="text-muted mb-8 max-w-lg text-sm leading-relaxed sm:text-base">
              Enrollify turns a messy course list into a calm, conflict-free week. Compare the combinations, keep the best fit, and enroll with a clear head.
            </p>
            <Link href="/planner" className="accent-button inline-flex items-center gap-4 rounded-xl px-5 py-3 text-sm font-bold transition">
              Build my schedule <span className="text-lg">↗</span>
            </Link>
          </div>
          <div className="absolute bottom-10 right-10 hidden w-52 rotate-[-7deg] rounded-2xl border border-lime-200/20 bg-[#212a23]/80 p-4 shadow-2xl backdrop-blur-xl sm:block" style={{ transform: "translate3d(0, 0, 40px) rotate(-7deg)" }}>
            <div className="mb-5 flex items-center justify-between"><span className="edge-label text-lime-200">Top match</span><span className="text-xs text-teal-200">97%</span></div>
            <div className="mb-2 h-2 rounded-full bg-lime-200/15"><div className="h-full w-[97%] rounded-full bg-lime-200" /></div>
            <p className="mt-4 font-mono text-[10px] text-white/60">NO CONFLICTS DETECTED</p>
          </div>
        </div>

        <div className="step-enter mb-20">
          <div className="mb-6 flex items-end justify-between"><div><p className="edge-label mb-2">The toolkit</p><h2 className="font-display text-2xl font-semibold tracking-tight">Less guesswork. Better weeks.</h2></div><span className="text-faint hidden font-mono text-xs sm:block">03 / 03</span></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureCard
              icon="01"
              title="Enrollment Planner"
              description="Enter your available sections, set your preferences, and get ranked conflict-free schedules in seconds."
              status="live"
              href="/planner"
            />
            <FeatureCard
              icon="02"
              title="CGPA Calculator"
              description="A quick, no-fuss way to track your GPA across semesters without digging out a spreadsheet."
              status="soon"
            />
            <FeatureCard
              icon="03"
              title="MAJU Bot"
              description="A campus assistant for the everyday questions — deadlines, timings, where things are."
              status="soon"
            />
          </div>
        </div>

        <div className="step-enter mb-12 grid gap-5 border-t border-white/10 pt-10 sm:grid-cols-[0.65fr_1fr] sm:gap-16">
          <div><p className="edge-label mb-3">A note from the builder</p><h2 className="font-display text-2xl font-semibold tracking-tight">Made for the moment before enrollment.</h2></div>
          <p className="text-muted text-sm leading-relaxed sm:text-base">
            This started as a two-person idea to fix a problem every MAJU student knows —
            watching the enrollment deadline creep closer while trying to piece together a
            schedule that doesn&apos;t fall apart. My original teammate had to step back partway
            through, so I&apos;ve been building the rest of this solo since then: the scheduling
            engine, the database, the whole interface. It&apos;s a work in progress, and it&apos;s
            genuinely built to be used, not just to look nice in a portfolio.
          </p>
        </div>

        <p className="text-faintest step-enter border-t border-white/10 py-8 text-xs">
          Built for MAJU students / one feature at a time.
        </p>
      </div>
    </main>
  );
}