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
    <main className="text-strong min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display mb-6 text-2xl font-bold">Reviews — Admin</h1>

        {reviews === null ? (
          <div className="card-3d rounded-2xl p-6">
            <label className="text-muted mb-2 block text-sm">Admin password</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadReviews()}
                className="text-strong flex-1 rounded-lg glass px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              <button
                onClick={loadReviews}
                disabled={loading || !password}
                className="rounded-lg bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-2 text-sm font-medium text-indigo-950 transition hover:brightness-105 disabled:opacity-40"
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