import { Analysis } from "@/lib/schema";

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function barColor(score: number) {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export default function Result({ data }: { data: Analysis }) {
  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{data.companyName}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {data.sector}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {data.stage}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${scoreColor(data.investabilityScore)}`}>
            {data.investabilityScore}
          </div>
          <div className="text-xs text-slate-400">investability / 100</div>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor(data.investabilityScore)}`}
          style={{ width: `${data.investabilityScore}%` }}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-500">Summary</h3>
        <p className="mt-1 text-sm text-slate-800">{data.summary}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-green-700">Strengths</h3>
          <ul className="mt-2 space-y-1.5">
            {data.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-green-500">+</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-medium text-red-700">Risks</h3>
          <ul className="mt-2 space-y-1.5">
            {data.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-red-500">−</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-500">Reasoning</h3>
        <p className="mt-1 text-sm text-slate-600">{data.reasoning}</p>
      </div>
    </div>
  );
}
