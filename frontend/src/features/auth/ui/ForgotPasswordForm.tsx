"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
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
  CardDescription,
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
import { LoadingSpinner } from "@/ui/atoms/LoadingSpinner";
import { forgotPassword } from "../api/auth.api";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../schemas/login.schema";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword({ phone: data.phone.trim() });
      toast.success(t("auth.forgotPasswordSuccess"));
      router.push("/reset-password");
    } catch {
      toast.error(t("auth.forgotPasswordError"));
    }
  };

  return (
    <Card data-testid="forgot-password-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {t("auth.forgotPassword")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("auth.forgotPasswordDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="forgot-password-form">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.phone")}</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+584241234567" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
              data-testid="btn-submit"
            >
              {form.formState.isSubmitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {t("auth.sendOtpByWhatsApp")}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          data-testid="link-back-login"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.backToLogin")}
        </Link>
      </CardFooter>
    </Card>
  );
}
