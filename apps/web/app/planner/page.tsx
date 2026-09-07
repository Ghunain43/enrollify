"use client";

import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type SessionT = { day: string; start: string; end: string; room?: string };
type Section = {
  course_code: string;
  course_title?: string | null;
  section: string;
  instructor?: string | null;
  credit_hours?: number | null;
  sessions: SessionT[];
};
type SchedulePlan = { sections: Section[]; score: number; explanation: string };

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CLASS_DURATION_MINUTES = 90;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const LOADING_MESSAGES = [
  "Waking up the server…",
  "Loading your courses…",
  "Checking every combination…",
  "Filtering out the bad ones…",
  "Ranking your best options…",
  "Almost there…",
];

const COURSE_COLORS = [
  { bg: "bg-amber-400/20", border: "border-amber-400/50", text: "text-amber-600", swatch: "bg-amber-400" },
  { bg: "bg-indigo-400/20", border: "border-indigo-400/50", text: "text-indigo-600", swatch: "bg-indigo-400" },
  { bg: "bg-emerald-400/20", border: "border-emerald-400/50", text: "text-emerald-600", swatch: "bg-emerald-400" },
  { bg: "bg-rose-400/20", border: "border-rose-400/50", text: "text-rose-600", swatch: "bg-rose-400" },
  { bg: "bg-sky-400/20", border: "border-sky-400/50", text: "text-sky-600", swatch: "bg-sky-400" },
  { bg: "bg-fuchsia-400/20", border: "border-fuchsia-400/50", text: "text-fuchsia-600", swatch: "bg-fuchsia-400" },
];

function courseColor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutesToAdd: number): string {
  const total = toMinutes(time) + minutesToAdd;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(wrapped / 60).toString().padStart(2, "0");
  const mm = (wrapped % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

type ParsedEntry = { section: string; day: string; start: string };
type ParsedCourse = { code: string; title: string; entries: ParsedEntry[] };

function parsePastedSections(rawText: string): ParsedCourse[] {
  const text = rawText.replace(/[\u2013\u2014]/g, "-").replace(/\s+/g, " ").trim();
  const chunks = text.split(/(?=[A-Z]{2,6}\d{3,4}\s*-)/).filter((c) => c.trim());
  const courses: ParsedCourse[] = [];

  for (const chunk of chunks) {
    const headerMatch = chunk.match(/^([A-Z]{2,6}\d{3,4})\s*-\s*/);
    if (!headerMatch) continue;
    const code = headerMatch[1];
    const remainder = chunk.slice(headerMatch[0].length);

    const sectionRegex = /([A-Z]{1,4})\s+((?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*:\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\s*)+)/g;
    const sectionMatches = [...remainder.matchAll(sectionRegex)];
    if (sectionMatches.length === 0) continue;

    const title = remainder.slice(0, sectionMatches[0].index).trim();
    const entries: ParsedEntry[] = [];

    for (const sm of sectionMatches) {
      const sectionLabel = sm[1];
      const dayTimeBlock = sm[2];
      const dtRegex = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*:\s*(\d{1,2}):(\d{2})\s*-\s*\d{1,2}:\d{2}/g;
      let dm: RegExpExecArray | null;
      while ((dm = dtRegex.exec(dayTimeBlock)) !== null) {
        entries.push({ section: sectionLabel, day: dm[1], start: `${pad2(parseInt(dm[2]))}:${dm[3]}` });
      }
    }
    courses.push({ code, title, entries });
  }
  return courses;
}

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

function Stepper({ value, onChange, min = 1, max = 10, label, hint }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; hint?: string;
}) {
  return (
    <div>
      <label className="text-muted mb-3 block text-sm">
        {label} {hint && <span className="text-faint">{hint}</span>}
      </label>
      <div className="flex items-center gap-4">
        <button onClick={() => onChange(Math.max(min, value - 1))}
          className="card-3d text-mid flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold transition hover:opacity-80 active:scale-90">
          −
        </button>
        <div key={value} className="pop-in flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/20 to-amber-500/10 ring-1 ring-amber-400/30">
          <span className="gradient-text font-display text-3xl font-bold">{value}</span>
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          className="card-3d text-mid flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold transition hover:opacity-80 active:scale-90">
          +
        </button>
      </div>
    </div>
  );
}

function WeekGrid({ sections }: { sections: Section[] }) {
  const allSessions = sections.flatMap((sec) =>
    sec.sessions.map((s) => ({ ...s, course_code: sec.course_code, course_title: sec.course_title, section: sec.section }))
  );
  if (allSessions.length === 0) return null;

  const minStart = Math.min(...allSessions.map((s) => toMinutes(s.start)));
  const maxEnd = Math.max(...allSessions.map((s) => toMinutes(s.end)));
  const gridStart = Math.floor(minStart / 60) * 60;
  const gridEnd = Math.ceil(maxEnd / 60) * 60;
  const totalHours = (gridEnd - gridStart) / 60;
  const hourHeight = 60;

  const daysUsed = DAY_ORDER.filter((d) => allSessions.some((s) => s.day === d));
  const hourMarks = Array.from({ length: totalHours + 1 }, (_, i) => gridStart + i * 60);

  const legendCourses = Array.from(new Map(sections.map((s) => [s.course_code, s.course_title])).entries());

  return (
    <div>
      <div className="surface-inset-strong overflow-x-auto rounded-xl p-2 sm:p-3">
        <div className="grid text-[10px] sm:text-xs" style={{ gridTemplateColumns: `48px repeat(${daysUsed.length}, minmax(84px, 1fr))` }}>
          <div />
          {daysUsed.map((d) => (
            <div key={d} className="text-mid font-display pb-2 text-center font-medium">{d}</div>
          ))}
          <div className="surface-inset-strong sticky left-0 z-10 rounded-l-lg" style={{ height: totalHours * hourHeight }}>
            {hourMarks.slice(0, -1).map((m) => (
              <div key={m} className="text-faint absolute -translate-y-2 pr-1 text-right text-[9px]"
                style={{ top: ((m - gridStart) / 60) * hourHeight, width: 44 }}>
                {`${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`}
              </div>
            ))}
          </div>
          {daysUsed.map((day) => (
            <div key={day} className="relative border-l border-white/5" style={{ height: totalHours * hourHeight }}>
              {hourMarks.slice(0, -1).map((m) => (
                <div key={m} className="absolute w-full border-t border-white/5" style={{ top: ((m - gridStart) / 60) * hourHeight }} />
              ))}
              {allSessions.filter((s) => s.day === day).map((s, i) => {
                const top = ((toMinutes(s.start) - gridStart) / 60) * hourHeight;
                const height = ((toMinutes(s.end) - toMinutes(s.start)) / 60) * hourHeight;
                const color = courseColor(s.course_code);
                const showTitle = s.course_title && height > 55;
                return (
                  <div key={i} className={`absolute left-0.5 right-0.5 rounded-lg border px-1.5 py-1 shadow-sm transition hover:z-10 hover:scale-[1.03] ${color.bg} ${color.border} ${color.text}`}
                    style={{ top, height: Math.max(height, 34) }}>
                    <div className="truncate font-semibold">{s.course_code} <span className="opacity-60">· {s.section}</span></div>
                    {showTitle && <div className="truncate text-[9px] opacity-70">{s.course_title}</div>}
                    <div className="truncate text-[9px] opacity-80 sm:text-[10px]">{s.start}–{s.end}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {legendCourses.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 px-1">
          {legendCourses.map(([code, title]) => {
            const color = courseColor(code);
            return (
              <div key={code} className="flex items-center gap-1.5 text-xs">
                <span className={`h-2.5 w-2.5 rounded-full ${color.swatch}`} />
                <span className="text-mid font-medium">{code}</span>
                {title && <span className="text-faint">— {title}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GeneratingProgress() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    let current = 0;
    const progressTimer = setInterval(() => {
      current = Math.min(92, current + Math.random() * 7 + 2);
      setProgress(current);
    }, 450);
    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2600);
    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <div className="card-3d rounded-2xl p-6 text-center">
      <p className="text-mid mb-4 text-sm font-medium">{LOADING_MESSAGES[messageIndex]}</p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-faint mt-3 text-xs">First load can take up to a minute if the server's been idle — hang tight.</p>
    </div>
  );
}

function SkeletonPlanCard({ delay }: { delay: number }) {
  return (
    <div className="step-enter card-3d rounded-2xl p-5 sm:p-6" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-7 w-20 rounded-lg" />
      </div>
      <div className="skeleton mb-4 h-4 w-2/3 rounded" />
      <div className="skeleton h-40 w-full rounded-xl" />
    </div>
  );
}

function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: rating || null, comment: comment || null }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="card-3d pop-in rounded-2xl p-6 text-center">
        <span className="text-2xl">🙌</span>
        <p className="text-mid mt-2 text-sm font-medium">Thanks for the feedback!</p>
      </div>
    );
  }

  return (
    <div className="card-3d rounded-2xl p-6">
      <p className="text-mid mb-3 text-sm font-medium">How was your experience?</p>
      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-2xl transition ${n <= rating ? "opacity-100" : "opacity-30"} hover:scale-110`}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Anything you'd change or loved? (optional)"
        className="text-strong mb-3 w-full rounded-lg glass px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400/50"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting || (rating === 0 && !comment.trim())}
        className="rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-2 text-sm font-medium text-indigo-950 transition hover:brightness-105 disabled:opacity-40"
      >
        {submitting ? "Sending…" : "Send feedback"}
      </button>
    </div>
  );
}

type Step = "setup" | "names" | "timing" | "preferences" | "results";
type MeetingEntry = { day: string; start: string };

const STEP_META: Record<Step, { icon: string; title: string; subtitle: string }> = {
  setup: { icon: "🎯", title: "Let's get you sorted", subtitle: "Paste your sections, or enter them by hand" },
  names: { icon: "🏷️", title: "Name things", subtitle: "So we know what we're scheduling" },
  timing: { icon: "🗓️", title: "When does everything meet?", subtitle: "Type each start time in 24-hour format" },
  preferences: { icon: "⚙️", title: "Your ideal week", subtitle: "Tell us what a good schedule looks like" },
  results: { icon: "✨", title: "Your best options", subtitle: "Ranked from best fit to just fine" },
};

export default function PlannerPage() {
  const [step, setStep] = useState<Step>("setup");
  const [numSections, setNumSections] = useState(2);
  const [numCourses, setNumCourses] = useState(3);
  const [sectionNames, setSectionNames] = useState<string[]>([]);
  const [courses, setCourses] = useState<{ code: string; title: string }[]>([]);
  const [grid, setGrid] = useState<Record<string, MeetingEntry[]>>({});
  const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set());
  const [daysOff, setDaysOff] = useState<Set<string>>(new Set());
  const [maxClassesPerDay, setMaxClassesPerDay] = useState(3);
  const [maxGapHours, setMaxGapHours] = useState(3);
  const [preferredSection, setPreferredSection] = useState<string>("mixed");
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [pasteSuccess, setPasteSuccess] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/health`).catch(() => {});
  }, []);

  function proceedToNames() {
    setSectionNames(Array.from({ length: numSections }, (_, i) => `Section ${i + 1}`));
    setCourses(Array.from({ length: numCourses }, () => ({ code: "", title: "" })));
    setStep("names");
  }

  function proceedToTiming() {
    const initialGrid: Record<string, MeetingEntry[]> = {};
    for (const c of courses) for (const s of sectionNames) initialGrid[`${c.code}|${s}`] = [];
    setGrid(initialGrid);
    setStep("timing");
  }

  function handleParsePaste() {
    setPasteError("");
    setPasteSuccess("");
    const parsedCourses = parsePastedSections(pasteText);
    if (parsedCourses.length === 0) {
      setPasteError("Couldn't find any courses in that text. Check the format matches: CODE – Title, then SECTION Day: HH:MM – HH:MM …");
      return;
    }
    const allSectionLabels = Array.from(new Set(parsedCourses.flatMap((c) => c.entries.map((e) => e.section))));
    const newCourses = parsedCourses.map((c) => ({ code: c.code, title: c.title }));
    const newGrid: Record<string, MeetingEntry[]> = {};
    for (const c of newCourses) for (const s of allSectionLabels) newGrid[`${c.code}|${s}`] = [];
    for (const pc of parsedCourses) {
      for (const entry of pc.entries) {
        const key = `${pc.code}|${entry.section}`;
        if (!newGrid[key]) newGrid[key] = [];
        newGrid[key].push({ day: entry.day, start: entry.start });
      }
    }
    setSectionNames(allSectionLabels);
    setCourses(newCourses);
    setGrid(newGrid);
    setNumSections(allSectionLabels.length);
    setNumCourses(newCourses.length);
    const totalEntries = parsedCourses.reduce((sum, c) => sum + c.entries.length, 0);
    setPasteSuccess(`Parsed ${newCourses.length} courses, ${allSectionLabels.length} sections, ${totalEntries} meeting times. Review below before continuing.`);
    setTimeout(() => setStep("timing"), 900);
  }

  function addMeeting(key: string) {
    setGrid((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { day: "Mon", start: "08:30" }] }));
  }

  function removeMeeting(key: string, index: number) {
    const removeKey = `${key}::${index}`;
    setRemovingKeys((prev) => new Set(prev).add(removeKey));
    setTimeout(() => {
      setGrid((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((_, i) => i !== index) }));
      setRemovingKeys((prev) => { const next = new Set(prev); next.delete(removeKey); return next; });
    }, 220);
  }

  function updateMeeting(key: string, index: number, field: "day" | "start", value: string) {
    setGrid((prev) => ({ ...prev, [key]: (prev[key] ?? []).map((e, i) => (i === index ? { ...e, [field]: value } : e)) }));
  }

  function buildSections(): Section[] {
    const result: Section[] = [];
    for (const c of courses) {
      for (const s of sectionNames) {
        const entries = grid[`${c.code}|${s}`];
        if (!entries || entries.length === 0) continue;
        const validEntries = entries.filter((e) => TIME_RE.test(e.start));
        if (validEntries.length === 0) continue;
        result.push({
          course_code: c.code, course_title: c.title || null, section: s,
          instructor: null, credit_hours: null,
          sessions: validEntries.map((e) => ({ day: e.day, start: e.start, end: addMinutes(e.start, CLASS_DURATION_MINUTES) })),
        });
      }
    }
    return result;
  }

  const hasInvalidTimes = Object.values(grid).some((entries) => entries.some((e) => e.start.length > 0 && !TIME_RE.test(e.start)));

  async function handleGeneratePlans() {
    setGenerating(true); setGenError(""); setPlans([]); setStep("results");
    const allSections = buildSections();
    const requiredCodes = Array.from(new Set(courses.map((c) => c.code).filter(Boolean)));
    try {
      const res = await fetch(`${API_URL}/enrollment/generate-plans`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          required_course_codes: requiredCodes, all_sections: allSections,
          preferences: {
            preferred_section: preferredSection === "mixed" ? null : preferredSection,
            preferred_days_off: Array.from(daysOff), minimize_gaps: true,
            max_gap_hours: maxGapHours, max_classes_per_day: maxClassesPerDay, avoid_instructors: [],
          },
        }),
      });
      if (!res.ok) { const body = await res.json().catch(() => null); throw new Error(body?.detail || `Generation failed (${res.status})`); }
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setGenerating(false); }
  }

  async function handleSavePlan(plan: SchedulePlan, index: number) {
    try {
      const res = await fetch(`${API_URL}/plans/save?user_id=1&semester=Fall%202026&score=${Math.round(plan.score)}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(plan.sections),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setSavedIndex(index); setTimeout(() => setSavedIndex(null), 2000);
    } catch (err) { alert(err instanceof Error ? err.message : "Save failed"); }
  }

  const steps: Step[] = ["setup", "names", "timing", "preferences", "results"];
  const stepIndex = steps.indexOf(step);
  const meta = STEP_META[step];

  return (
    <main className="text-strong relative min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <ParallaxBackground />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 font-display text-lg font-bold text-indigo-950 shadow-lg shadow-amber-500/20">E</div>
            <div>
              <h1 className="gradient-text font-display text-xl font-bold tracking-tight sm:text-2xl">Enrollify</h1>
              <p className="text-muted text-xs sm:text-sm">Enrollment, sorted before the deadline hits.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500 ease-out" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="text-faint mb-6 flex items-center justify-between text-xs sm:mb-8">
          <span>Step {stepIndex + 1} of {steps.length}</span>
          <span className="hidden sm:inline">{steps.map((s) => STEP_META[s].icon).join(" · ")}</span>
        </div>

        <div key={step} className="step-enter mb-5 flex items-center gap-3 sm:mb-6">
          <span className="text-2xl sm:text-3xl">{meta.icon}</span>
          <div>
            <h2 className="font-display text-lg font-semibold sm:text-xl">{meta.title}</h2>
            <p className="text-muted text-xs sm:text-sm">{meta.subtitle}</p>
          </div>
        </div>

        {step === "setup" && (
          <div key="setup-body" className="step-enter space-y-5 sm:space-y-6">
            <div className="card-3d-strong rounded-2xl p-6 sm:p-8">
              {!showPasteBox ? (
                <button onClick={() => setShowPasteBox(true)}
                  className="w-full rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-5 py-4 text-left transition hover:bg-amber-400/10">
                  <span className="font-display block text-base font-semibold text-amber-500">📋 Paste your sections instead</span>
                  <span className="text-muted mt-1 block text-xs">Got the whole offered-sections list as text? Paste it and we&apos;ll fill everything in automatically.</span>
                </button>
              ) : (
                <div>
                  <label className="text-muted mb-2 block text-sm">
                    Paste your sections text below — format: <span className="font-mono text-amber-500">CODE – Title, then SECTION Day: HH:MM – HH:MM …</span>
                  </label>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={6}
                    placeholder="CS4163 – Computer Networks AM Fri: 08:30 – 10:00 Mon: 13:00 – 14:30 BM Thu: 08:30 – 10:00 ..."
                    className="text-strong w-full rounded-lg glass px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                  {pasteError && <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">{pasteError}</p>}
                  {pasteSuccess && <p className="pop-in mt-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">{pasteSuccess}</p>}
                  <div className="mt-3 flex gap-2">
                    <button onClick={handleParsePaste} disabled={!pasteText.trim()}
                      className="rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-2 text-sm font-medium text-indigo-950 transition hover:brightness-105 disabled:opacity-40">
                      Parse & fill in
                    </button>
                    <button onClick={() => { setShowPasteBox(false); setPasteText(""); setPasteError(""); setPasteSuccess(""); }}
                      className="text-muted rounded-lg glass px-4 py-2 text-sm transition hover:opacity-80">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-faintest flex items-center gap-3 text-xs">
              <div className="h-px flex-1 bg-white/10" /> or enter manually <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="card-3d-strong rounded-2xl p-6 sm:p-8">
              <div className="space-y-8">
                <Stepper label="How many sections are offered?" hint="(e.g. AM, PM, BM)" value={numSections} onChange={setNumSections} min={1} max={8} />
                <Stepper label="How many courses do you need this semester?" value={numCourses} onChange={setNumCourses} min={1} max={10} />
              </div>
              <button onClick={proceedToNames} className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.98] sm:w-auto">
                Let&apos;s go →
              </button>
            </div>
          </div>
        )}

        {step === "names" && (
          <div key="names-body" className="step-enter space-y-5 sm:space-y-6">
            <div className="card-3d rounded-2xl p-5 transition hover:-translate-y-0.5 sm:p-6">
              <h3 className="text-mid font-display mb-4 text-base font-semibold">📛 Section names</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {sectionNames.map((name, i) => (
                  <input key={i} value={name} onChange={(e) => { const c = [...sectionNames]; c[i] = e.target.value; setSectionNames(c); }}
                    placeholder={`Section ${i + 1}`} className="text-strong rounded-lg glass px-3 py-2 outline-none transition focus:ring-2 focus:ring-amber-400/50" />
                ))}
              </div>
            </div>

            <div className="card-3d rounded-2xl p-5 transition hover:-translate-y-0.5 sm:p-6">
              <h3 className="text-mid font-display mb-4 text-base font-semibold">📚 Course list</h3>
              <div className="space-y-3">
                {courses.map((c, i) => (
                  <div key={i} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <input value={c.code} onChange={(e) => { const cc = [...courses]; cc[i] = { ...cc[i], code: e.target.value.toUpperCase() }; setCourses(cc); }}
                      placeholder="CS301" className="text-strong rounded-lg glass px-3 py-2 outline-none transition focus:ring-2 focus:ring-amber-400/50 sm:w-32" />
                    <input value={c.title} onChange={(e) => { const cc = [...courses]; cc[i] = { ...cc[i], title: e.target.value }; setCourses(cc); }}
                      placeholder="Title (optional)" className="text-strong flex-1 rounded-lg glass px-3 py-2 outline-none transition focus:ring-2 focus:ring-amber-400/50" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep("setup")} className="text-faint text-xs underline hover:text-strong">← Back</button>
              <button onClick={proceedToTiming} disabled={courses.some((c) => !c.code) || sectionNames.some((s) => !s)}
                className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] hover:brightness-105 disabled:opacity-40 disabled:hover:scale-100">
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === "timing" && (
          <div key="timing-body" className="step-enter space-y-5 sm:space-y-6">
            <p className="surface-inset text-muted rounded-xl px-4 py-3 text-xs sm:text-sm">
              💡 Type each start time in 24-hour format, like <span className="font-mono text-amber-500">21:10</span> or <span className="font-mono text-amber-500">08:30</span>. Every class is {CLASS_DURATION_MINUTES} minutes — the end time is calculated for you.
            </p>

            {courses.map((c, ci) => (
              <div key={c.code} className="step-enter card-3d rounded-2xl p-5 transition hover:-translate-y-0.5 sm:p-6" style={{ animationDelay: `${ci * 60}ms` }}>
                <h3 className="font-display mb-4 flex items-center gap-2 text-base font-semibold">
                  <span className={`h-2.5 w-2.5 rounded-full ${courseColor(c.code).swatch}`} />
                  {c.code}{c.title && <span className="text-muted font-normal"> — {c.title}</span>}
                </h3>
                <div className="space-y-4">
                  {sectionNames.map((s) => {
                    const key = `${c.code}|${s}`;
                    const entries = grid[key] ?? [];
                    return (
                      <div key={s} className="surface-inset rounded-lg p-3 sm:p-4">
                        <p className="text-mid mb-3 text-sm font-medium">{s}</p>
                        {entries.length === 0 && <p className="text-faintest mb-3 text-xs italic">No meeting times yet — add one below</p>}
                        <div className="space-y-2">
                          {entries.map((entry, i) => {
                            const removeKey = `${key}::${i}`;
                            const isRemoving = removingKeys.has(removeKey);
                            const isValid = TIME_RE.test(entry.start);
                            return (
                              <div key={i} className={isRemoving ? "fade-out-collapse" : ""}>
                                <div className="flex flex-wrap items-center gap-2">
                                  <select value={entry.day} onChange={(e) => updateMeeting(key, i, "day", e.target.value)}
                                    className="text-strong rounded-lg glass px-2 py-1.5 text-xs outline-none">
                                    {DAY_ORDER.map((d) => <option key={d} value={d} className="bg-indigo-950 text-white">{d}</option>)}
                                  </select>
                                  <input
                                    type="text" inputMode="numeric" value={entry.start}
                                    onChange={(e) => updateMeeting(key, i, "start", e.target.value)}
                                    placeholder="HH:MM" maxLength={5}
                                    className={`w-20 rounded-lg px-2 py-1.5 text-center font-mono text-xs outline-none transition ${
                                      isValid ? "text-strong glass focus:ring-2 focus:ring-amber-400/50" : "bg-red-500/10 text-red-500 ring-1 ring-red-400/50"
                                    }`}
                                  />
                                  {isValid ? (
                                    <span className="text-faint text-xs">→ ends {addMinutes(entry.start, CLASS_DURATION_MINUTES)}</span>
                                  ) : (
                                    <span className="text-xs text-red-500/80">use 24h format, e.g. 21:10</span>
                                  )}
                                  <button onClick={() => removeMeeting(key, i)}
                                    className="ml-auto rounded-full px-2 py-0.5 text-xs text-red-500/70 transition hover:bg-red-500/10">✕</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={() => addMeeting(key)} className="text-muted mt-3 rounded-lg glass px-3 py-1 text-xs font-medium transition hover:opacity-80 active:scale-95">
                          + Add meeting time
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <button onClick={() => setStep("names")} className="text-faint text-xs underline hover:text-strong">← Back</button>
              <div className="text-right">
                {hasInvalidTimes && <p className="mb-2 text-xs text-red-500">Some times aren&apos;t valid 24-hour format yet</p>}
                <button onClick={() => setStep("preferences")} className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] hover:brightness-105">
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div key="prefs-body" className="step-enter space-y-5 sm:space-y-6">
            <div className="card-3d rounded-2xl p-5 transition hover:-translate-y-0.5 sm:p-6">
              <p className="text-muted mb-3 text-sm">🏷️ Section preference</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPreferredSection("mixed")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 ${preferredSection === "mixed" ? "bg-indigo-400 text-indigo-950" : "text-muted glass hover:opacity-80"}`}>
                  Mixed (any combination)
                </button>
                {sectionNames.map((name) => (
                  <button key={name} onClick={() => setPreferredSection(name)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 ${preferredSection === name ? "bg-indigo-400 text-indigo-950" : "text-muted glass hover:opacity-80"}`}>
                    All {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-3d rounded-2xl p-5 transition hover:-translate-y-0.5 sm:p-6">
              <p className="text-muted mb-3 text-sm">🌴 Days you want off</p>
              <div className="flex flex-wrap gap-2">
                {DAY_ORDER.map((day) => (
                  <button key={day} onClick={() => setDaysOff((prev) => { const n = new Set(prev); n.has(day) ? n.delete(day) : n.add(day); return n; })}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition active:scale-95 ${daysOff.has(day) ? "bg-amber-400 text-indigo-950" : "text-muted glass hover:opacity-80"}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-3d rounded-2xl p-5 transition hover:-translate-y-0.5 sm:p-6">
              <p className="text-muted mb-2 text-sm">📆 Max classes per day: <span className="text-strong font-medium">{maxClassesPerDay}</span></p>
              <input type="range" min={1} max={6} value={maxClassesPerDay} onChange={(e) => setMaxClassesPerDay(parseInt(e.target.value))} className="w-full accent-amber-400" />
              <p className="text-muted mb-2 mt-6 text-sm">⏳ Max break between classes: <span className="text-strong font-medium">{maxGapHours}h</span></p>
              <input type="range" min={1} max={6} step={0.5} value={maxGapHours} onChange={(e) => setMaxGapHours(parseFloat(e.target.value))} className="w-full accent-amber-400" />
              <button onClick={handleGeneratePlans} disabled={generating}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.98] disabled:opacity-50">
                {generating ? "Building your best options… ✨" : "Generate my plans ✨"}
              </button>
              {genError && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{genError}</p>}
            </div>

            <button onClick={() => setStep("timing")} className="text-faint text-xs underline hover:text-strong">← Back</button>
          </div>
        )}

        {step === "results" && (
          <div key="results-body" className="step-enter space-y-5 sm:space-y-6">
            <button onClick={() => setStep("preferences")} className="text-faint text-xs underline hover:text-strong">← Back to preferences</button>

            {generating && (
              <>
                <GeneratingProgress />
                <SkeletonPlanCard delay={0} />
                <SkeletonPlanCard delay={80} />
              </>
            )}

            {!generating && genError && (
              <div className="card-3d rounded-2xl p-6 text-center text-sm text-red-500">{genError}</div>
            )}

            {!generating && !genError && plans.length === 0 && (
              <div className="card-3d text-muted rounded-2xl p-6 text-center text-sm">
                <span className="inline-block animate-bounce text-2xl">😕</span>
                <p className="mt-2">No valid conflict-free combinations found. Try loosening the max gap, max classes per day, days off, or switching to &quot;Mixed&quot; sections.</p>
              </div>
            )}

            {!generating && plans.map((plan, i) => (
              <div key={i} style={{ animationDelay: `${i * 90}ms` }}
                className={`step-enter rounded-2xl p-5 transition hover:-translate-y-0.5 sm:p-6 ${i === 0 ? "card-3d-strong pulse-ring ring-1 ring-amber-400/40" : "card-3d"}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-950">✨ BEST MATCH</span>}
                    <span className="text-muted font-display text-sm font-medium">Score {Math.round(plan.score)}</span>
                  </div>
                  <button onClick={() => handleSavePlan(plan, i)} className="text-strong rounded-lg glass px-3 py-1.5 text-xs font-medium transition hover:opacity-80 active:scale-95">
                    {savedIndex === i ? <span className="pop-in inline-block">Saved ✓</span> : "Save this plan"}
                  </button>
                </div>
                <p className="text-muted mb-4 text-sm">{plan.explanation}</p>
                <WeekGrid sections={plan.sections} />
              </div>
            ))}

            {!generating && plans.length > 0 && (
              <div className="step-enter" style={{ animationDelay: `${plans.length * 90 + 100}ms` }}>
                <ReviewForm />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}