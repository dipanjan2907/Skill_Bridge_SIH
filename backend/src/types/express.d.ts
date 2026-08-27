export interface AuthUser {
  id: number;
  username?: string;
  email: string;
  role: "student" | "industry" | "academician" | "institution" | "admin" | "Student" | "Industry" | "Academician" | "Institution" | "Admin" | "Faculty" | "Institute" | string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

