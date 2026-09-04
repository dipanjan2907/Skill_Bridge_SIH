import { z } from "zod";

export const createQuestionSchema = z.object({
  skill_id: z.number(),
  question: z.string().min(5, "Question text must be at least 5 characters"),
  option_a: z.string().min(1, "Option A is required"),
  option_b: z.string().min(1, "Option B is required"),
  option_c: z.string().min(1, "Option C is required"),
  option_d: z.string().min(1, "Option D is required"),
  correct_option: z.enum(["A", "B", "C", "D"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  explanation: z.string().min(5, "Explanation must be at least 5 characters"),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const rejectQuestionSchema = z.object({
  rejection_reason: z.string().min(3, "Rejection reason must be at least 3 characters"),
});

export const createSkillRequestSchema = z.object({
  skill_name: z.string().min(2, "Skill name must be at least 2 characters"),
  category: z.string().optional().default("Technical"),
  reason: z.string().optional(),
});
