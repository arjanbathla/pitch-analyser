import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { analysisSchema } from "@/lib/schema";
import { getSupabase } from "@/lib/supabase";

// remove ```json ... ``` fences if the model wraps the output
function stripFences(s: string) {
  return s.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

// parse the raw model text and validate it against the zod schema
function parseAndValidate(raw: string) {
  const cleaned = stripFences(raw);

  let json;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return { ok: false as const, error: "output was not valid JSON" };
  }

  const result = analysisSchema.safeParse(json);
  if (result.success) {
    return { ok: true as const, data: result.data };
  }

  const errors = result.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  return { ok: false as const, error: errors };
}

async function callModel(model: GenerativeModel, content: string) {
  const result = await model.generateContent(content);
  return result.response.text();
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "missing GEMINI_API_KEY" }, { status: 500 });
  }

  const body = await req.json();
  const text = body.text;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "no text provided" }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    // first attempt
    let raw = await callModel(model, text);
    let parsed = parseAndValidate(raw);

    // if it didn't match the schema, re-prompt once with the validation error
    if (!parsed.ok) {
      console.log("first attempt failed validation:", parsed.error);

      const fixPrompt = `The company text was:\n${text}\n\nYou returned:\n${raw}\n\nThis did not match the required schema. Problems: ${parsed.error}\n\nReturn a corrected JSON object that fixes these problems. Only the JSON object.`;

      raw = await callModel(model, fixPrompt);
      parsed = parseAndValidate(raw);

      if (!parsed.ok) {
        console.log("second attempt also failed:", parsed.error);
        return NextResponse.json({ error: "could not get valid structured data" }, { status: 422 });
      }
    }

    // save to supabase if it's configured. a save failure shouldn't lose the
    // user's result, so we log and still return the analysis.
    const supabase = getSupabase();
    if (supabase) {
      const { error: dbError } = await supabase.from("analyses").insert({
        company_name: parsed.data.companyName,
        sector: parsed.data.sector,
        stage: parsed.data.stage,
        summary: parsed.data.summary,
        strengths: parsed.data.strengths,
        risks: parsed.data.risks,
        investability_score: parsed.data.investabilityScore,
        reasoning: parsed.data.reasoning,
        source_text: text,
      });
      if (dbError) console.log("supabase insert error:", dbError.message);
    }

    return NextResponse.json({ data: parsed.data });
  } catch (error) {
    console.log("gemini error:", error);
    return NextResponse.json({ error: "something went wrong calling the model" }, { status: 500 });
  }
}
