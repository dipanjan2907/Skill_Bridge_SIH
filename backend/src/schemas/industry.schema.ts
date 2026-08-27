import { z } from "zod";

export const industryProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required").optional(),
  company_name: z.string().min(1, "Company name is required").optional(),
  companyType: z.string().nullable().optional(),
  company_type: z.string().nullable().optional(),
  industrySector: z.string().nullable().optional(),
  industry_sector: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional().or(z.literal("")),
  contact_email: z.string().email().nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
});

export const rejectIndustrySchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required").optional(),
  rejection_reason: z.string().min(1, "Rejection reason is required").optional(),
});
