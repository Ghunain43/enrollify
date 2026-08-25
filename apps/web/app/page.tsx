"use client";

import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

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

const COURSE_COLORS = [
  { bg: "bg-amber-400/20", border: "border-amber-400/50", text: "text-amber-200" },
  { bg: "bg-indigo-400/20", border: "border-indigo-400/50", text: "text-indigo-200" },
  { bg: "bg-emerald-400/20", border: "border-emerald-400/50", text: "text-emerald-200" },
  { bg: "bg-rose-400/20", border: "border-rose-400/50", text: "text-rose-200" },
  { bg: "bg-sky-400/20", border: "border-sky-400/50", text: "text-sky-200" },
  { bg: "bg-fuchsia-400/20", border: "border-fuchsia-400/50", text: "text-fuchsia-200" },
];

function courseColor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function to12Hour(time: string) {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm}`;
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

function build24(hour12: number, ampm: "AM" | "PM", minute: number): string {
  let h = hour12 % 12;
  if (ampm === "PM") h += 12;
  return `${h.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ---------- Analog clock time picker ----------
function ClockPicker({ value, onChange, onDone }: { value: string; onChange: (v: string) => void; onDone: () => void }) {
  const [h24, m] = value.split(":").map(Number);
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  const ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const minute = m;

  const hourAngle = (hour12 % 12) * 30 + minute * 0.5;
  const minuteAngle = minute * 6;

  const hourHandEnd = pointOnCircle(100, 100, 42, hourAngle);
  const minuteHandEnd = pointOnCircle(100, 100, 68, minuteAngle);

  return (
    <div className="card-3d mx-auto w-full max-w-[240px] rounded-2xl p-4">
      <svg viewBox="0 0 200 200" className="mx-auto h-40 w-40 sm:h-44 sm:w-44">
        <circle cx="100" cy="100" r="94" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
          const angle = n * 30;
          const pos = pointOnCircle(100, 100, 76, angle);
          const isSelected = hour12 === n;
          return (
            <text
              key={n}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              onClick={() => onChange(build24(n, ampm, minute))}
              className={`cursor-pointer select-none text-[15px] font-semibold transition ${
                isSelected ? "fill-amber-300" : "fill-indigo-200/60 hover:fill-white"
              }`}
            >
              {n}
            </text>
          );
        })}
        <line
          x1="100" y1="100" x2={hourHandEnd.x} y2={hourHandEnd.y}
          stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" className="clock-needle"
        />
        <line
          x1="100" y1="100" x2={minuteHandEnd.x} y2={minuteHandEnd.y}
          stroke="rgba(199,210,254,0.9)" strokeWidth="2.5" strokeLinecap="round" className="clock-needle"
        />
        <circle cx="100" cy="100" r="4.5" fill="#fcd34d" />
      </svg>

      <div className="mt-3 flex justify-center gap-1.5">
        {[0, 15, 30, 45].map((mm) => (
          <button
            key={mm}
            onClick={() => onChange(build24(hour12, ampm, mm))}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
              minute === mm ? "bg-amber-400 text-indigo-950" : "glass text-indigo-200/60 hover:text-white"
            }`}
          >
            :{mm.toString().padStart(2, "0")}
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-1.5">
        {(["AM", "PM"] as const).map((p) => (
          <button
            key={p}
            onClick={() => onChange(build24(hour12, p, minute))}
            className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
              ampm === p ? "bg-indigo-400 text-indigo-950" : "glass text-indigo-200/60 hover:text-white"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={onDone}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 py-2 text-sm font-semibold text-indigo-950 transition hover:brightness-105"
      >
        Done ✓
      </button>
    </div>
  );
}

// ---------- Tactile stepper for counts ----------
function Stepper({ value, onChange, min = 1, max = 10, label, hint }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; hint?: string;
}) {
  return (
    <div>
      <label className="mb-3 block text-sm text-indigo-200/60">
        {label} {hint && <span className="text-indigo-200/30">{hint}</span>}
      </label>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="card-3d flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-indigo-200/80 transition hover:text-white active:scale-90"
        >
          −
        </button>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/20 to-amber-500/10 ring-1 ring-amber-400/30">
          <span className="gradient-text font-display text-3xl font-bold">{value}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="card-3d flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-indigo-200/80 transition hover:text-white active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}

function WeekGrid({ sections }: { sections: Section[] }) {
  const allSessions = sections.flatMap((sec) =>
    sec.sessions.map((s) => ({ ...s, course_code: sec.course_code, section: sec.section }))
  );
  if (allSessions.length === 0) return null;

  const minStart = Math.min(...allSessions.map((s) => toMinutes(s.start)));
  const maxEnd = Math.max(...allSessions.map((s) => toMinutes(s.end)));
  const gridStart = Math.floor(minStart / 60) * 60;
  const gridEnd = Math.ceil(maxEnd / 60) * 60;
  const totalHours = (gridEnd - gridStart) / 60;
  const hourHeight = 52;

  const daysUsed = DAY_ORDER.filter((d) => allSessions.some((s) => s.day === d));
  const hourMarks = Array.from({ length: totalHours + 1 }, (_, i) => gridStart + i * 60);

  return (
    <div className="overflow-x-auto rounded-xl bg-black/25 p-2 sm:p-3">
      <div className="grid text-[10px] sm:text-xs" style={{ gridTemplateColumns: `44px repeat(${daysUsed.length}, minmax(78px, 1fr))` }}>
        <div />
        {daysUsed.map((d) => (
          <div key={d} className="pb-2 text-center font-display font-medium text-indigo-200/70">{d}</div>
        ))}
        <div className="relative" style={{ height: totalHours * hourHeight }}>
          {hourMarks.slice(0, -1).map((m) => (
            <div key={m} className="absolute -translate-y-2 pr-1 text-right text-[9px] text-indigo-200/40"
              style={{ top: ((m - gridStart) / 60) * hourHeight, width: 40 }}>
              {to12Hour(`${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`)}
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
              return (
                <div key={i} className={`absolute left-0.5 right-0.5 rounded-md border px-1 py-0.5 sm:px-1.5 sm:py-1 ${color.bg} ${color.border} ${color.text}`}
                  style={{ top, height: Math.max(height, 30) }}>
                  <div className="truncate font-semibold">{s.course_code} <span className="hidden opacity-60 sm:inline">· {s.section}</span></div>
                  <div className="truncate text-[9px] opacity-80 sm:text-[10px]">{to12Hour(s.start)}–{to12Hour(s.end)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

type Step = "setup" | "names" | "timing" | "preferences" | "results";
type MeetingEntry = { day: string; start: string };

const STEP_META: Record<Step, { icon: string; title: string; subtitle: string }> = {
  setup: { icon: "🎯", title: "Let's get you sorted", subtitle: "Just two quick numbers to start" },
  names: { icon: "🏷️", title: "Name things", subtitle: "So we know what we're scheduling" },
  timing: { icon: "🗓️", title: "When does everything meet?", subtitle: "Tap the clock to set each start time" },
  preferences: { icon: "⚙️", title: "Your ideal week", subtitle: "Tell us what a good schedule looks like" },
  results: { icon: "✨", title: "Your best options", subtitle: "Ranked from best fit to just fine" },
};

export default function Home() {
  const [step, setStep] = useState<Step>("setup");
  const [numSections, setNumSections] = useState(2);
  const [numCourses, setNumCourses] = useState(3);
  const [sectionNames, setSectionNames] = useState<string[]>([]);
  const [courses, setCourses] = useState<{ code: string; title: string }[]>([]);
  const [grid, setGrid] = useState<Record<string, MeetingEntry[]>>({});
  const [openClockKey, setOpenClockKey] = useState<string | null>(null);
  const [daysOff, setDaysOff] = useState<Set<string>>(new Set());
  const [maxClassesPerDay, setMaxClassesPerDay] = useState(3);
  const [maxGapHours, setMaxGapHours] = useState(3);
  const [preferredSection, setPreferredSection] = useState<string>("mixed");
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

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

  function addMeeting(key: string) {
    setGrid((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), { day: "Mon", start: "08:30" }] }));
  }
  function removeMeeting(key: string, index: number) {
    setGrid((prev) => ({ ...prev, [key]: (prev[key] ?? []).filter((_, i) => i !== index) }));
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
        result.push({
          course_code: c.code, course_title: c.title || null, section: s,
          instructor: null, credit_hours: null,
          sessions: entries.map((e) => ({ day: e.day, start: e.start, end: addMinutes(e.start, CLASS_DURATION_MINUTES) })),
        });
      }
    }
    return result;
  }

  async function handleGeneratePlans() {
    setGenerating(true); setGenError(""); setPlans([]);
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
      setPlans(data); setStep("results");
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
    <main className="relative min-h-screen overflow-hidden px-4 py-10 text-white sm:px-6 sm:py-14">
      <div className="grain" />
      <div className="orb-1 pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl sm:h-96 sm:w-96" />
      <div className="orb-2 pointer-events-none absolute -right-24 top-1/3 h-60 w-60 rounded-full bg-amber-400/10 blur-3xl sm:h-80 sm:w-80" />
      <div className="orb-1 pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl sm:h-72 sm:w-72" />

      <div className="relative mx-auto max-w-4xl">
        <div className="mb-8 flex items-center gap-3 sm:mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 font-display text-lg font-bold text-indigo-950 shadow-lg shadow-amber-500/20">E</div>
          <div>
            <h1 className="gradient-text font-display text-xl font-bold tracking-tight sm:text-2xl">Enrollify</h1>
            <p className="text-xs text-indigo-200/60 sm:text-sm">Enrollment, sorted before the deadline hits.</p>
          </div>
        </div>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500 ease-out" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="mb-6 flex items-center justify-between text-xs text-indigo-200/40 sm:mb-8">
          <span>Step {stepIndex + 1} of {steps.length}</span>
          <span className="hidden sm:inline">{steps.map((s) => STEP_META[s].icon).join(" · ")}</span>
        </div>

        <div key={step} className="step-enter mb-5 flex items-center gap-3 sm:mb-6">
          <span className="text-2xl sm:text-3xl">{meta.icon}</span>
          <div>
            <h2 className="font-display text-lg font-semibold sm:text-xl">{meta.title}</h2>
            <p className="text-xs text-indigo-200/50 sm:text-sm">{meta.subtitle}</p>
          </div>
        </div>

        {step === "setup" && (
          <div key="setup-body" className="step-enter card-3d-strong rounded-2xl p-6 sm:p-8">
            <div className="space-y-8">
              <Stepper label="How many sections are offered?" hint="(e.g. AM, PM, BM)" value={numSections} onChange={setNumSections} min={1} max={8} />
              <Stepper label="How many courses do you need this semester?" value={numCourses} onChange={setNumCourses} min={1} max={10} />
            </div>
            <button onClick={proceedToNames} className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.98] sm:w-auto">
              Let&apos;s go →
            </button>
          </div>
        )}

        {step === "names" && (
          <div key="names-body" className="step-enter space-y-5 sm:space-y-6">
            <div className="card-3d rounded-2xl p-5 sm:p-6">
              <h3 className="font-display mb-4 text-base font-semibold text-indigo-100/90">📛 Section names</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {sectionNames.map((name, i) => (
                  <input key={i} value={name} onChange={(e) => { const c = [...sectionNames]; c[i] = e.target.value; setSectionNames(c); }}
                    placeholder={`Section ${i + 1}`} className="rounded-lg glass px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-400/50" />
                ))}
              </div>
            </div>

            <div className="card-3d rounded-2xl p-5 sm:p-6">
              <h3 className="font-display mb-4 text-base font-semibold text-indigo-100/90">📚 Course list</h3>
              <div className="space-y-3">
                {courses.map((c, i) => (
                  <div key={i} className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <input value={c.code} onChange={(e) => { const cc = [...courses]; cc[i] = { ...cc[i], code: e.target.value.toUpperCase() }; setCourses(cc); }}
                      placeholder="CS301" className="rounded-lg glass px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-400/50 sm:w-32" />
                    <input value={c.title} onChange={(e) => { const cc = [...courses]; cc[i] = { ...cc[i], title: e.target.value }; setCourses(cc); }}
                      placeholder="Title (optional)" className="flex-1 rounded-lg glass px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-400/50" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setStep("setup")} className="text-xs text-indigo-200/50 underline hover:text-indigo-200">← Back</button>
              <button onClick={proceedToTiming} disabled={courses.some((c) => !c.code) || sectionNames.some((s) => !s)}
                className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] hover:brightness-105 disabled:opacity-40 disabled:hover:scale-100">
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === "timing" && (
          <div key="timing-body" className="step-enter space-y-5 sm:space-y-6">
            <p className="rounded-xl bg-black/20 px-4 py-3 text-xs text-indigo-200/60 sm:text-sm">
              💡 Tap the time to open the clock, set it, then hit Done. Every class is {CLASS_DURATION_MINUTES} minutes — just set the start. A section can meet the same day twice (a lecture and a lab) — just add two entries.
            </p>

            {courses.map((c) => (
              <div key={c.code} className="card-3d rounded-2xl p-5 sm:p-6">
                <h3 className="font-display mb-4 flex items-center gap-2 text-base font-semibold">
                  <span className={`h-2.5 w-2.5 rounded-full ${courseColor(c.code).bg.replace("/20", "")}`} />
                  {c.code}{c.title && <span className="font-normal text-indigo-200/50"> — {c.title}</span>}
                </h3>
                <div className="space-y-4">
                  {sectionNames.map((s) => {
                    const key = `${c.code}|${s}`;
                    const entries = grid[key] ?? [];
                    return (
                      <div key={s} className="rounded-lg bg-black/20 p-3 sm:p-4">
                        <p className="mb-3 text-sm font-medium text-indigo-200/70">{s}</p>
                        <div className="space-y-2">
                          {entries.map((entry, i) => {
                            const clockKey = `${key}::${i}`;
                            const isOpen = openClockKey === clockKey;
                            return (
                              <div key={i}>
                                <div className="flex flex-wrap items-center gap-2">
                                  <select value={entry.day} onChange={(e) => updateMeeting(key, i, "day", e.target.value)}
                                    className="rounded-lg glass px-2 py-1.5 text-xs text-white outline-none">
                                    {DAY_ORDER.map((d) => <option key={d} value={d} className="bg-indigo-950">{d}</option>)}
                                  </select>
                                  <button
                                    onClick={() => setOpenClockKey(isOpen ? null : clockKey)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${isOpen ? "bg-amber-400 text-indigo-950" : "glass text-white hover:bg-white/10"}`}
                                  >
                                    🕐 {to12Hour(entry.start)}
                                  </button>
                                  <span className="text-xs text-indigo-200/40">→ ends {to12Hour(addMinutes(entry.start, CLASS_DURATION_MINUTES))}</span>
                                  <button onClick={() => { removeMeeting(key, i); if (isOpen) setOpenClockKey(null); }}
                                    className="ml-auto rounded-full px-2 py-0.5 text-xs text-red-300/70 hover:bg-red-500/10 hover:text-red-300">✕</button>
                                </div>
                                {isOpen && (
                                  <div className="step-enter mt-3">
                                    <ClockPicker
                                      value={entry.start}
                                      onChange={(v) => updateMeeting(key, i, "start", v)}
                                      onDone={() => setOpenClockKey(null)}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={() => addMeeting(key)} className="mt-3 rounded-lg glass px-3 py-1 text-xs font-medium text-indigo-200/70 transition hover:text-white">
                          + Add meeting time
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <button onClick={() => setStep("names")} className="text-xs text-indigo-200/50 underline hover:text-indigo-200">← Back</button>
              <button onClick={() => setStep("preferences")} className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.02] hover:brightness-105">
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === "preferences" && (
          <div key="prefs-body" className="step-enter space-y-5 sm:space-y-6">
            <div className="card-3d rounded-2xl p-5 sm:p-6">
              <p className="mb-3 text-sm text-indigo-200/60">🏷️ Section preference</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPreferredSection("mixed")}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${preferredSection === "mixed" ? "bg-indigo-400 text-indigo-950" : "glass text-indigo-200/70 hover:text-white"}`}>
                  Mixed (any combination)
                </button>
                {sectionNames.map((name) => (
                  <button key={name} onClick={() => setPreferredSection(name)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${preferredSection === name ? "bg-indigo-400 text-indigo-950" : "glass text-indigo-200/70 hover:text-white"}`}>
                    All {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-3d rounded-2xl p-5 sm:p-6">
              <p className="mb-3 text-sm text-indigo-200/60">🌴 Days you want off</p>
              <div className="flex flex-wrap gap-2">
                {DAY_ORDER.map((day) => (
                  <button key={day} onClick={() => setDaysOff((prev) => { const n = new Set(prev); n.has(day) ? n.delete(day) : n.add(day); return n; })}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${daysOff.has(day) ? "bg-amber-400 text-indigo-950" : "glass text-indigo-200/70 hover:text-white"}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-3d rounded-2xl p-5 sm:p-6">
              <p className="mb-2 text-sm text-indigo-200/60">📆 Max classes per day: <span className="font-medium text-white">{maxClassesPerDay}</span></p>
              <input type="range" min={1} max={6} value={maxClassesPerDay} onChange={(e) => setMaxClassesPerDay(parseInt(e.target.value))} className="w-full accent-amber-400" />
              <p className="mb-2 mt-6 text-sm text-indigo-200/60">⏳ Max break between classes: <span className="font-medium text-white">{maxGapHours}h</span></p>
              <input type="range" min={1} max={6} step={0.5} value={maxGapHours} onChange={(e) => setMaxGapHours(parseFloat(e.target.value))} className="w-full accent-amber-400" />
              <button onClick={handleGeneratePlans} disabled={generating}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:scale-[1.01] hover:brightness-105 disabled:opacity-50">
                {generating ? "Building your best options… ✨" : "Generate my plans ✨"}
              </button>
              {genError && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">{genError}</p>}
            </div>

            <button onClick={() => setStep("timing")} className="text-xs text-indigo-200/50 underline hover:text-indigo-200">← Back</button>
          </div>
        )}

        {step === "results" && (
          <div key="results-body" className="step-enter space-y-5 sm:space-y-6">
            <button onClick={() => setStep("preferences")} className="text-xs text-indigo-200/50 underline hover:text-indigo-200">← Back to preferences</button>
            {plans.length === 0 && (
              <div className="card-3d rounded-2xl p-6 text-center text-sm text-indigo-200/60">
                😕 No valid conflict-free combinations found. Try loosening the max gap, max classes per day, or switching to &quot;Mixed&quot; sections.
              </div>
            )}
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-5 sm:p-6 ${i === 0 ? "card-3d-strong ring-1 ring-amber-400/40" : "card-3d"}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {i === 0 && <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-950">✨ BEST MATCH</span>}
                    <span className="font-display text-sm font-medium text-indigo-200/70">Score {Math.round(plan.score)}</span>
                  </div>
                  <button onClick={() => handleSavePlan(plan, i)} className="rounded-lg glass px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10">
                    {savedIndex === i ? "Saved ✓" : "Save this plan"}
                  </button>
                </div>
                <p className="mb-4 text-sm text-indigo-200/60">{plan.explanation}</p>
                <WeekGrid sections={plan.sections} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}