"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("enrollify-theme");
    const light = saved === "light";
    setIsLight(light);
    document.documentElement.classList.toggle("light", light);
    setMounted(true);
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
      <div
        className="orb-1 absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl transition-transform duration-300 ease-out sm:h-[28rem] sm:w-[28rem]"
        style={{ transform: `translate3d(${pos.x * 35}px, ${pos.y * 25}px, 0)` }}
      />
      <div
        className="orb-2 absolute -right-24 top-1/4 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl transition-transform duration-300 ease-out sm:h-96 sm:w-96"
        style={{ transform: `translate3d(${pos.x * -50}px, ${pos.y * -35}px, 0)` }}
      />
      <div
        className="orb-1 absolute bottom-0 left-1/4 h-60 w-60 rounded-full bg-fuchsia-500/15 blur-3xl transition-transform duration-300 ease-out sm:h-80 sm:w-80"
        style={{ transform: `translate3d(${pos.x * 20}px, ${pos.y * 15}px, 0)` }}
      />
      <div
        className="absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${pos.x * -25}px, ${pos.y * 40}px, 0)` }}
      />
    </div>
  );
}

function FeatureCard({ icon, title, description, status, href }: {
  icon: string; title: string; description: string; status: "live" | "soon"; href?: string;
}) {
  const content = (
    <div className={`card-3d h-full rounded-2xl p-6 transition ${status === "live" ? "hover:-translate-y-1 hover:shadow-2xl" : "opacity-70"}`}>
      <div className="mb-4 flex items-start justify-between">
        <span className="text-3xl">{icon}</span>
        {status === "live" ? (
          <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">LIVE</span>
        ) : (
          <span className="surface-inset text-faint rounded-full px-2.5 py-0.5 text-[11px] font-semibold">COMING SOON</span>
        )}
      </div>
      <h3 className="font-display text-mid mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted text-sm">{description}</p>
      {status === "live" && (
        <p className="mt-4 text-sm font-medium text-amber-500">Try it now →</p>
      )}
    </div>
  );

  return status === "live" && href ? <Link href={href}>{content}</Link> : content;
}

export default function LandingPage() {
  return (
    <main className="text-strong relative min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <ParallaxBackground />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between sm:mb-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 font-display text-lg font-bold text-indigo-950 shadow-lg shadow-amber-500/20">E</div>
            <span className="gradient-text font-display text-xl font-bold tracking-tight sm:text-2xl">Enrollify</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="step-enter mb-10 text-center sm:mb-12">
          <h1 className="font-display mb-4 text-2xl font-bold leading-tight sm:text-4xl">
            Enrollment, sorted before the deadline hits.
          </h1>
          <p className="text-muted mx-auto mb-6 max-w-xl text-sm sm:text-base">
            Tell Enrollify what you need — it hands you the best conflict-free schedule options, ranked.
          </p>
          <Link
            href="/planner"
            className="inline-block rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-8 py-3.5 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] hover:brightness-105 active:scale-[0.98]"
          >
            Start planning your schedule →
          </Link>
        </div>

        <div className="step-enter mb-12 sm:mb-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureCard
              icon="🗓️"
              title="Enrollment Planner"
              description="Enter your available sections, set your preferences, and get ranked conflict-free schedules in seconds."
              status="live"
              href="/planner"
            />
            <FeatureCard
              icon="🧮"
              title="CGPA Calculator"
              description="A quick, no-fuss way to track your GPA across semesters without digging out a spreadsheet."
              status="soon"
            />
            <FeatureCard
              icon="🤖"
              title="MAJU Bot"
              description="A campus assistant for the everyday questions — deadlines, timings, where things are."
              status="soon"
            />
          </div>
        </div>

        <div className="card-3d step-enter mb-10 rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-mid mb-3 text-lg font-semibold">Why I built this</h2>
          <p className="text-muted text-sm leading-relaxed sm:text-base">
            This started as a two-person idea to fix a problem every MAJU student knows —
            watching the enrollment deadline creep closer while trying to piece together a
            schedule that doesn&apos;t fall apart. My original teammate had to step back partway
            through, so I&apos;ve been building the rest of this solo since then: the scheduling
            engine, the database, the whole interface. It&apos;s a work in progress, and it&apos;s
            genuinely built to be used, not just to look nice in a portfolio.
          </p>
        </div>

        <p className="text-faintest step-enter mt-10 text-center text-xs">
          Built for MAJU students, one feature at a time.
        </p>
      </div>
    </main>
  );
}