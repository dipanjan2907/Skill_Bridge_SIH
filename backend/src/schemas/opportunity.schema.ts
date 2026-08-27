import { z } from "zod";

export const requiredSkillSchema = z.object({
  skillId: z.number().int().positive("Invalid skill ID").optional(),
  skillName: z.string().trim().min(1, "Skill name required").optional(),
  requiredProficiency: z
    .number()
    .min(0, "Proficiency must be at least 0")
    .max(100, "Proficiency cannot exceed 100"),
});

export const createOpportunitySchema = z.object({
  type: z.enum(["internship", "job"], {
    message: "Type must be either internship or job",
  }),
  title: z.string().trim().min(2, "Title is required").max(255),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  location: z.string().trim().nullable().optional(),
  workMode: z.string().trim().default("On-site"),
  stipendMin: z.number().nullable().optional(),
  stipendMax: z.number().nullable().optional(),
  duration: z.string().trim().nullable().optional(),
  eligibility: z.string().trim().nullable().optional(),
  applicationDeadline: z.string().trim().nullable().optional(),
  status: z.enum(["draft", "published", "closed"]).default("draft"),
  requiredSkills: z.array(requiredSkillSchema).optional().default([]),
});

export const updateOpportunitySchema = createOpportunitySchema.partial();
