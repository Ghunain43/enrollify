"use client";

import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type Session = {
  day: string;
  start: string;
  end: string;
  room?: string;
};

type Section = {
  course_code: string;
  course_title: string;
  section: string;
  instructor?: string;
  credit_hours: number;
  sessions: Session[];
};

type SchedulePlan = {
  sections: Section[];
  score: number;
  explanation: string;
};

const TEST_SECTIONS: Section[] = [
  {
    course_code: "CS301",
    course_title: "Database Systems",
    section: "AM-1",
    instructor: "Dr. Ateeq",
    credit_hours: 3,
    sessions: [{ day: "Mon", start: "08:00", end: "09:30", room: "R-101" }],
  },
  {
    course_code: "CS301",
    course_title: "Database Systems",
    section: "PM-1",
    instructor: "Dr. Ateeq",
    credit_hours: 3,
    sessions: [{ day: "Mon", start: "14:00", end: "15:30", room: "R-101" }],
  },
  {
    course_code: "MATH201",
    course_title: "Calculus II",
    section: "AM-1",
    instructor: "Dr. Khan",
    credit_hours: 3,
    sessions: [{ day: "Tue", start: "08:00", end: "09:30", room: "R-202" }],
  },
  {
    course_code: "MATH201",
    course_title: "Calculus II",
    section: "PM-1",
    instructor: "Dr. Khan",
    credit_hours: 3,
    sessions: [{ day: "Tue", start: "15:30", end: "17:00", room: "R-202" }],
  },
];

const PREFERENCE_OPTIONS = [
  { value: "all_am", label: "All morning" },
  { value: "all_pm", label: "All afternoon" },
  { value: "mixed_two_sections", label: "Mixed (max 2 sections)" },
  { value: "no_preference", label: "No preference" },
];

function scoreColor(score: number) {
  if (score >= 40) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (score >= 20) return "bg-amber-50 text-amber-700 ring-amber-600/20";
  return "bg-slate-100 text-slate-600 ring-slate-500/20";
}

export default function Home() {
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("all_am");
  const [savedId, setSavedId] = useState<number | null>(null);

  async function handleGeneratePlans() {
    setLoading(true);
    setError("");
    setPlans([]);
    try {
      const res = await fetch(`${API_URL}/enrollment/generate-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          required_course_codes: ["CS301", "MATH201"],
          all_sections: TEST_SECTIONS,
          preferences: {
            time_of_day: timeOfDay,
            preferred_days_off: [],
            minimize_gaps: true,
            avoid_instructors: [],
          },
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the backend. Is uvicorn running on port 8000?"
      );
    } finally {
      setLoading(false);
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
      setSavedId(index);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              E
            </div>
            <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Internal test console
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Enrollify</h1>
          <p className="mt-1 text-slate-500">
            Backend test harness — running against hardcoded CS301 + MATH201 sections.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Time-of-day preference
          </label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeOfDay(opt.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  timeOfDay === opt.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleGeneratePlans}
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating plans…" : "Generate plans"}
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        {plans.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              {plans.length} ranked option{plans.length > 1 ? "s" : ""}
            </h2>

            {plans.map((plan, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${scoreColor(
                      plan.score
                    )}`}
                  >
                    Score {plan.score}
                  </span>
                  <button
                    onClick={() => handleSavePlan(plan, i)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {savedId === i ? "Saved ✓" : "Save this plan"}
                  </button>
                </div>

                <p className="mb-3 text-sm text-slate-500">{plan.explanation}</p>

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {plan.sections.map((sec, j) => (
                    <div key={j} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium text-slate-800">{sec.course_code}</span>
                        <span className="ml-2 text-slate-400">Section {sec.section}</span>
                      </div>
                      <div className="text-slate-500">
                        {sec.sessions.map((s) => `${s.day} ${s.start}–${s.end}`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && plans.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 py-12 text-center text-sm text-slate-400">
            No plans generated yet — pick a preference above and click Generate.
          </div>
        )}
      </div>
    </main>
  );
}