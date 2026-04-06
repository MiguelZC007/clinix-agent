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

export type UpdateDoctorRequest = Partial<Omit<CreateDoctorRequest, 'email' | 'phone' | 'password'>>;

export type DoctorsListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  specialtyId?: string;
};
