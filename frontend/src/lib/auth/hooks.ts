"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

export function useAuth() {
  const { data: session, status } = useNextAuthSession();
  const router = useRouter();
  const t = useTranslations();

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success(t("auth.logoutSuccess"));
      router.push("/login");
    } catch (_error) {
      toast.error(t("auth.logoutError"));
    }
  };

  return {
    session,
    user: session?.user,
    accessToken: session?.accessToken,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    logout,
  };
}
