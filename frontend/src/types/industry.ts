export type VerificationStatus = "pending" | "approved" | "rejected";

export interface IndustryProfile {
  id: number;
  userId: number;
  companyName: string;
  companyType: string | null;
  industrySector: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  contactEmail: string | null;
  phone: string | null;
  logo: string | null;
  verificationStatus: VerificationStatus;
  verification_status?: VerificationStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIndustryItem extends IndustryProfile {
  userName: string | null;
  userEmail: string | null;
}
