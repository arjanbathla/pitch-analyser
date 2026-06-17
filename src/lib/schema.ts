import { z } from "zod";

export const analysisSchema = z.object({
  companyName: z.string(),
  sector: z.string(),
  stage: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()),
  risks: z.array(z.string()),
  investabilityScore: z.number().min(0).max(100),
  reasoning: z.string(),
});

export type Analysis = z.infer<typeof analysisSchema>;
