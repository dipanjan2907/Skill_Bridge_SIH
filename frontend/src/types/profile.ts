export interface Institution {
  id: number;
  name: string;
  code?: string;
  location?: string;
  website?: string;
}

export interface MasterSkill {
  id: number;
  name: string;
  category: string;
}

export interface StudentProfileData {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  dob?: string;
  gender?: string;
  bio?: string;
  institution_id?: number;
  institution?: string;
  degree?: string;
  department?: string;
  roll_number?: string;
  student_id?: string;
  current_sem?: string;
  cgpa?: number | string;
  expected_grad?: string;
  counselor?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  work_mode_preference?: string;
  expected_stipend_min?: number;
  expected_stipend_max?: number;
  preferred_locations?: string[];
  target_roles?: string[];
}

export interface SkillItem {
  id: number;
  student_id?: number;
  skill_id?: number;
  name: string;
  category?: string;
  proficiency_score: number;
  verification_source?: string;
  is_badge_earned?: boolean;
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  tech_stack: string[];
  status: string;
  project_url?: string;
  repo_url?: string;
}

export interface CertItem {
  id: number;
  title: string;
  issuer: string;
  issue_year: string;
  credential_url?: string;
}

export interface ProfileApiResponse {
  profile: StudentProfileData;
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertItem[];
}
