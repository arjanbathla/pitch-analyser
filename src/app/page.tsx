"use client";

import { useState } from "react";
import { Analysis } from "@/lib/schema";
import Result from "@/components/Result";
import History from "@/components/History";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleSubmit() {
    if (text.trim().length === 0) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "request failed");
      } else {
        setResult(data.data);
        setRefreshKey((k) => k + 1); // reload the history list
      }
    } catch (e) {
      setError("could not reach the server");
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Pitch Analyser</h1>
      <p className="mt-2 text-sm text-slate-500">
        Paste unstructured text about a company and get a structured analysis back.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the company pitch here..."
        rows={10}
        disabled={loading}
        className="mt-6 w-full resize-y rounded-lg border border-slate-300 bg-white p-4 text-sm shadow-sm outline-none focus:border-slate-500 disabled:opacity-60"
      />

      <button
        onClick={handleSubmit}
        disabled={loading || text.trim().length === 0}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {loading ? "Analysing..." : "Analyse pitch"}
      </button>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {result && <Result data={result} />}

      <History refreshKey={refreshKey} />
    </main>
  );
}
