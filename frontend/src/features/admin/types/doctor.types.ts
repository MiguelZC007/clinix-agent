import type { UserRole } from "@/lib/auth/types";

export type { UserRole };

export type Doctor = {
  id: string;
  userId: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  specialtyId: string;
  specialtyName: string;
  licenseNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Transitional: present only when backend supports role management */
  role?: UserRole;
};

export type CreateDoctorRequest = {
  email: string;
  name: string;
  lastName: string;
  phone: string;
  specialtyId: string;
  licenseNumber: string;
  password?: string;
};

export type UpdateDoctorRequest = Partial<Omit<CreateDoctorRequest, 'email' | 'phone' | 'password'>> & {
  /** Transitional: include only when backend supports role management */
  role?: UserRole;
};

export type DoctorsListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  specialtyId?: string;
};
