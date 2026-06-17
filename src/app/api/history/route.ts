import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// run on every request instead of being cached at build time, so newly
// saved analyses show up in the history list
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ history: [] });

  const { data, error } = await supabase
    .from("analyses")
    .select("id, created_at, company_name, sector, stage, investability_score")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.log("history error:", error.message);
    return NextResponse.json({ history: [] });
  }

  return NextResponse.json({ history: data });
}
