export type UserRole = 'owner' | 'member';

export interface User {
  id: string;
  email: string;
  full_name: string;
  profile_photo: string | null;
  role: UserRole;
  family_member_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  owner_id: string;
  auth_user_id?: string | null;
  name: string;
  relationship: string | null;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  profile_photo: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  document_count?: number;
}

export type DocumentCategory =
  | 'Identity'
  | 'Cards'
  | 'Certificates'
  | 'Vehicle'
  | 'Photos'
  | 'Other';

export type DocumentStatus = 'active' | 'expiring_soon' | 'expired' | 'no_expiry';

export interface Document {
  id: string;
  owner_id: string;
  family_member_id: string;
  category: string;
  document_type: string;
  title: string;
  description: string | null;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  current_version: number;
  created_at: string;
  updated_at: string;
  family_member_name?: string;
  status?: DocumentStatus;
  file_size?: number;
  mime_type?: string;
  original_file_name?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  original_file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_at: string;
  is_current: boolean;
}

export interface Notification {
  id: string;
  owner_id: string;
  document_id: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DashboardStats {
  totalFamilyMembers: number;
  totalDocuments: number;
  active: number;
  expiringSoon: number;
  expired: number;
}