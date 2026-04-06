"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { showError } from "@/lib/utils/error-handler";
import { LoadingSpinner } from "@/ui/atoms/LoadingSpinner";
import { PhoneInputWithCountry } from "@/ui/molecules/PhoneInputWithCountry";
import { loginSchema, type LoginFormData } from "../schemas/login.schema";

export function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        phone: data.phone,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // El error puede ser genérico de NextAuth o específico del backend
        // Si es un error de red/conexión, ya se mostró en el interceptor
        // Mostramos un mensaje genérico aquí
        const errorMessage =
          result.error === "CredentialsSignin"
            ? t("auth.invalidCredentials")
            : t("auth.loginError");

        toast.error(errorMessage);
        form.reset();
      } else if (result?.ok) {
        toast.success(t("auth.loginSuccess"));
        // Usar router.push para respetar el locale (es por defecto)
        // Redirigir a pacientes que es una ruta que existe
        router.push("/patients");
      }
    } catch (error) {
      // El error ya se mostrará en el interceptor de axios
      // Pero mostramos un mensaje genérico aquí si es necesario
      showError(error, { logError: true, t });
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card data-testid="login-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {t("auth.login")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.phone")}</FormLabel>
                  <FormControl>
                    <PhoneInputWithCountry
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="4241234567"
                      defaultCountry="BO"
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || form.formState.isSubmitting}
              data-testid="btn-login"
            >
              {isLoading || form.formState.isSubmitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {t("auth.login")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-primary"
          data-testid="link-forgot-password"
        >
          {t("auth.forgotPassword")}
        </Link>
      </CardFooter>
    </Card>
  );
}
