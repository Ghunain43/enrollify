"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Review = { id: number; rating: number | null; comment: string | null; created_at: string };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadReviews() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        headers: { "X-Admin-Password": password },
      });
      if (!res.ok) throw new Error(res.status === 401 ? "Wrong password" : `Error ${res.status}`);
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="text-strong min-h-screen px-5 py-8 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-200 font-display font-bold text-[#18200d]">E</div><span className="font-display text-xl font-bold">Enrollify<span className="text-lime-200">.</span></span></div>
          <span className="edge-label">Admin / reviews</span>
        </div>
        <p className="edge-label mb-3">Feedback console</p>
        <h1 className="font-display mb-10 text-4xl font-semibold tracking-tight">What students are saying.</h1>

        {reviews === null ? (
          <div className="card-3d rounded-2xl p-6 sm:p-8">
            <label className="text-muted mb-2 block text-sm">Admin password</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadReviews()}
                className="text-strong flex-1 rounded-lg glass px-3 py-3 outline-none focus:ring-2 focus:ring-lime-200/50"
              />
              <button
                onClick={loadReviews}
                disabled={loading || !password}
                className="accent-button rounded-lg px-4 py-3 text-sm font-bold transition disabled:opacity-40"
              >
                {loading ? "Checking…" : "View reviews"}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-faint text-sm">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            {reviews.map((r) => (
              <div key={r.id} className="card-3d rounded-xl p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-amber-500">{r.rating ? "⭐".repeat(r.rating) : "No rating"}</span>
                  <span className="text-faint text-xs">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                {r.comment && <p className="text-mid text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}