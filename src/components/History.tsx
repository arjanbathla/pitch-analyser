"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  created_at: string;
  company_name: string;
  sector: string;
  stage: string;
  investability_score: number;
};

export default function History({ refreshKey }: { refreshKey: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => {
        if (active) setRows(d.history || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (loading) {
    return <p className="mt-10 text-sm text-slate-400">loading history...</p>;
  }

  if (rows.length === 0) {
    return <p className="mt-10 text-sm text-slate-400">no analyses yet</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-sm font-medium text-slate-500">History</h2>
      <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{row.company_name}</p>
              <p className="text-xs text-slate-400">
                {row.sector} · {row.stage} · {new Date(row.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-700">{row.investability_score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
