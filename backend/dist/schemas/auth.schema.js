import { z } from "zod";
export const signInSchema = z.object({
    identifier: z.string().min(1, "Username or email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
export const signUpSchema = z.object({
    name: z.string().min(2).max(100),
    username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6).max(100),
    role: z.string().refine((val) => {
        const lower = val.trim().toLowerCase();
        return (lower !== "admin" &&
            ["student", "industry", "academician", "institution", "faculty", "institute"].includes(lower));
    }, { message: "Admin accounts cannot be publicly registered. Allowed roles: student, industry, academician, institution." }),
});
