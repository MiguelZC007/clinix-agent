export type User = {
  id: string;
  name: string;
  lastName: string;
  phone: string;
  email: string;
};

export type LoginRequest = {
  phone: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
};

export type ForgotPasswordRequest = {
  phone: string;
};

export type ResetPasswordRequest = {
  phone: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};
