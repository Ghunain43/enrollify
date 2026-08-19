"use client";

import { useState, useRef } from "react";

const API_URL = "http://127.0.0.1:8000";

type Session = { day: string; start: string; end: string; room?: string };
type Section = {
  course_code: string;
  course_title?: string | null;
  section: string;
  instructor?: string | null;
  credit_hours?: number | null;
  sessions: Session[];
};
type SchedulePlan = { sections: Section[]; score: number; explanation: string };

const PREFERENCE_OPTIONS = [
  { value: "all_am", label: "All morning" },
  { value: "all_pm", label: "All afternoon" },
  { value: "mixed_two_sections", label: "Mixed sections" },
  { value: "no_preference", label: "No preference" },
];

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
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
  const hourHeight = 56;

  const daysUsed = DAY_ORDER.filter((d) => allSessions.some((s) => s.day === d));
  const hourMarks = Array.from({ length: totalHours + 1 }, (_, i) => gridStart + i * 60);

  return (
    <div className="overflow-x-auto rounded-xl bg-black/20 p-3">
      <div
        className="grid text-xs"
        style={{
          gridTemplateColumns: `56px repeat(${daysUsed.length}, minmax(90px, 1fr))`,
        }}
      >
        {/* header row */}
        <div />
        {daysUsed.map((d) => (
          <div key={d} className="pb-2 text-center font-display font-medium text-indigo-200/70">
            {d}
          </div>
        ))}

        {/* hour labels + grid body */}
        <div className="relative" style={{ height: totalHours * hourHeight }}>
          {hourMarks.slice(0, -1).map((m) => (
            <div
              key={m}
              className="absolute -translate-y-2 pr-2 text-right text-[10px] text-indigo-200/40"
              style={{ top: ((m - gridStart) / 60) * hourHeight, width: 50 }}
            >
              {to12Hour(`${Math.floor(m / 60)}:${(m % 60).toString().padStart(2, "0")}`)}
            </div>
          ))}
        </div>

        {daysUsed.map((day) => (
          <div
            key={day}
            className="relative border-l border-white/5"
            style={{ height: totalHours * hourHeight }}
          >
            {hourMarks.slice(0, -1).map((m) => (
              <div
                key={m}
                className="absolute w-full border-t border-white/5"
                style={{ top: ((m - gridStart) / 60) * hourHeight }}
              />
            ))}
            {allSessions
              .filter((s) => s.day === day)
              .map((s, i) => {
                const top = ((toMinutes(s.start) - gridStart) / 60) * hourHeight;
                const height = ((toMinutes(s.end) - toMinutes(s.start)) / 60) * hourHeight;
                const color = courseColor(s.course_code);
                return (
                  <div
                    key={i}
                    className={`absolute left-0.5 right-0.5 rounded-md border px-1.5 py-1 ${color.bg} ${color.border} ${color.text}`}
                    style={{ top, height: Math.max(height, 28) }}
                  >
                    <div className="truncate font-semibold">{s.course_code}</div>
                    <div className="truncate text-[10px] opacity-80">
                      {to12Hour(s.start)}–{to12Hour(s.end)}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

type Step = "upload" | "review" | "results";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [university, setUniversity] = useState("");

  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [timeOfDay, setTimeOfDay] = useState("all_am");
  const [maxGapHours, setMaxGapHours] = useState(3);

  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueCourseCodes = Array.from(new Set(sections.map((s) => s.course_code)));

  async function handleFileUpload(file: File) {
    setParsing(true);
    setParseError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/parsing/screenshot`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Parsing failed (${res.status})`);
      }
      const data = await res.json();
      setSections(data.sections);
      setUniversity(data.university);
      setSelectedCourses(new Set(data.sections.map((s: Section) => s.course_code)));
      setStep("review");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setParsing(false);
    }
  }

  function toggleCourse(code: string) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function handleGeneratePlans() {
    setGenerating(true);
    setGenError("");
    setPlans([]);
    try {
      const res = await fetch(`${API_URL}/enrollment/generate-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          required_course_codes: Array.from(selectedCourses),
          all_sections: sections,
          preferences: {
            time_of_day: timeOfDay,
            preferred_days_off: [],
            max_gap_hours: maxGapHours,
            minimize_gaps: true,
            avoid_instructors: [],
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Generation failed (${res.status})`);
      }
      const data = await res.json();
      setPlans(data);
      setStep("results");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSavePlan(plan: SchedulePlan, index: number) {
    try {
      const res = await fetch(
        `${API_URL}/plans/save?user_id=1&semester=Fall%202026&score=${Math.round(plan.score)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plan.sections),
        }
      );
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setSavedIndex(index);
      setTimeout(() => setSavedIndex(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <main className="min-h-screen px-6 py-14 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 font-display text-lg font-bold text-indigo-950 shadow-lg shadow-amber-500/20">
            E
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">Enrollify</h1>
            <p className="text-sm text-indigo-200/60">Enrollment, sorted before the deadline hits.</p>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-2 text-xs font-medium text-indigo-200/50">
          {(["upload", "review", "results"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  step === s ? "bg-amber-400 text-indigo-950 font-semibold" : "glass text-indigo-200/60"
                }`}
              >
                {i + 1}
              </span>
              <span className={step === s ? "text-white" : ""}>
                {s === "upload" ? "Upload" : s === "review" ? "Review" : "Results"}
              </span>
              {i < 2 && <span className="mx-1 text-indigo-200/20">—</span>}
            </div>
          ))}
        </div>

        {step === "upload" && (
          <div className="glass-strong rounded-2xl p-8 text-center shadow-2xl shadow-black/20">
            <h2 className="font-display mb-2 text-lg font-semibold">Upload your available sections</h2>
            <p className="mb-6 text-sm text-indigo-200/60">
              A screenshot of the timetable your university shows during enrollment.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:brightness-105 disabled:opacity-60"
            >
              {parsing ? "Reading your timetable…" : "Choose screenshot"}
            </button>
            {parseError && (
              <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                {parseError}
              </p>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  Found {sections.length} sections{university && ` at ${university}`}
                </h2>
                <button onClick={() => setStep("upload")} className="text-xs text-indigo-200/50 underline hover:text-indigo-200">
                  Re-upload
                </button>
              </div>
              <p className="mb-3 text-sm text-indigo-200/60">Select which courses you need this semester:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueCourseCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => toggleCourse(code)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      selectedCourses.has(code) ? "bg-amber-400 text-indigo-950" : "glass text-indigo-200/70 hover:text-white"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <p className="mb-3 text-sm text-indigo-200/60">Time-of-day preference:</p>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeOfDay(opt.value)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      timeOfDay === opt.value ? "bg-indigo-400 text-indigo-950" : "glass text-indigo-200/70 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-6">
  <p className="mb-3 text-sm text-indigo-200/60">
    Max break between classes: <span className="text-white font-medium">{maxGapHours}h</span>
  </p>
  <input
    type="range"
    min={1}
    max={6}
    step={0.5}
    value={maxGapHours}
    onChange={(e) => setMaxGapHours(parseFloat(e.target.value))}
    className="w-full accent-amber-400"
  />
</div>
              <button
                onClick={handleGeneratePlans}
                disabled={generating || selectedCourses.size === 0}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 py-3 font-medium text-indigo-950 shadow-lg shadow-amber-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? "Building your best options…" : "Generate my plans"}
              </button>
              {genError && (
                <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/20">
                  {genError}
                </p>
              )}
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-6">
            <button onClick={() => setStep("review")} className="text-xs text-indigo-200/50 underline hover:text-indigo-200">
              ← Back to preferences
            </button>

            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 shadow-2xl shadow-black/20 transition ${
                  i === 0 ? "glass-strong ring-1 ring-amber-400/40" : "glass"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-950">
                        BEST MATCH
                      </span>
                    )}
                    <span className="font-display text-sm font-medium text-indigo-200/70">
                      Score {Math.round(plan.score)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSavePlan(plan, i)}
                    className="rounded-lg glass px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
                  >
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