import { Request } from 'express';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type MemberStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'INACTIVE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'DISTRICT_ADMIN' | 'TALUK_ADMIN' | 'UNIT_ADMIN' | 'MEMBER';

export interface IUser {
  id: number;
  email: string;
  mobile: string;
  password_hash?: string;
  status: UserStatus;
  roles?: string[];
  last_login?: Date | string;
  created_at?: Date | string;
}

export interface IMember {
  id: number;
  user_id: number;
  member_id: string | null;
  full_name: string;
  father_name: string;
  date_of_birth: string;
  gender: Gender;
  email: string;
  mobile: string;
  profile_photo: string | null;
  address_line1: string;
  address_line2?: string | null;
  village: string;
  taluk_id: number;
  district_id: number;
  state: string;
  pincode: string;
  membership_type_id: number;
  unit_id: number;
  joining_date: string | null;
  status: MemberStatus;
  created_at?: string;
  updated_at?: string;
  // Joined relation fields
  district_name?: string;
  taluk_name?: string;
  unit_name?: string;
  membership_type_name?: string;
}

export interface IQrCode {
  id: number;
  member_id: number;
  verification_token: string;
  qr_image_path: string | null;
  issued_at: string;
  expires_at?: string | null;
}

export interface INews {
  id: number;
  category_id: number;
  author_id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image: string | null;
  is_featured: boolean | number;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  published_at: string;
  category_name?: string;
  author_name?: string;
}

export interface IEvent {
  id: number;
  organizer_id: number;
  title: string;
  slug: string;
  description: string;
  location: string;
  venue_address: string;
  event_date: string;
  start_time: string;
  end_time?: string | null;
  cover_image: string | null;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  capacity: number;
  registered_count?: number;
}

export interface ILeader {
  id: number;
  name: string;
  designation: string;
  photo_url: string | null;
  biography: string | null;
  display_order: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    mobile: string;
    roles: string[];
    permissions?: string[];
    member_id?: string | null;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
  error?: {
    code: string;
    details?: any;
  } | null;
}
