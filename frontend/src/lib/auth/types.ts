import 'next-auth';
import 'next-auth/jwt';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      lastName: string;
      phone: string;
      email: string;
      role: UserRole;
    };
    accessToken: string;
  }

  interface User {
    id: string;
    name: string;
    lastName: string;
    phone: string;
    email: string;
    role: UserRole;
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    lastName: string;
    phone: string;
    email: string;
    role: UserRole;
    accessToken: string;
  }
}
