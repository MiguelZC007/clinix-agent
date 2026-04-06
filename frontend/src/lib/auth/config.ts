import '@/lib/auth/types';
import type { UserRole } from '@/lib/auth/types';
import { type NextAuthOptions } from 'next-auth';
import type { JWT as _JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { login } from '@/features/auth/api/auth.api';

const VALID_ROLES: UserRole[] = ['PATIENT', 'DOCTOR', 'ADMIN'];

function decodeRoleFromToken(accessToken: string): UserRole {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const role = payload.role;
    if (typeof role === 'string' && VALID_ROLES.includes(role as UserRole)) {
      return role as UserRole;
    }
    return 'PATIENT';
  } catch {
    return 'PATIENT';
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        try {
          const response = await login({
            phone: credentials.phone,
            password: credentials.password,
          });

          const role = decodeRoleFromToken(response.accessToken);

          return {
            id: response.user.id,
            name: response.user.name,
            lastName: response.user.lastName,
            phone: response.user.phone,
            email: response.user.email,
            role,
            accessToken: response.accessToken,
          };
        } catch (_error) {
          // El error ya se mostrará en el interceptor de axios
          // Solo retornamos null para que NextAuth muestre el error genérico
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.lastName = user.lastName;
        token.phone = user.phone;
        token.email = user.email;
        token.role = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.lastName = token.lastName;
        session.user.phone = token.phone;
        session.user.email = token.email;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días (mismo que el token del backend)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
