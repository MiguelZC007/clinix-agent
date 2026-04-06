"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  messageFormSchema,
  type MessageFormData,
} from "../schemas/message.schema";

type MessageInputProps = {
  onSendMessage: (content: string) => Promise<void> | void;
  disabled?: boolean;
};

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const t = useTranslations();

  const getLocalizedError = (message?: string) => {
    switch (message) {
      case "errors.required":
        return t("errors.required");
      case "errors.maxLength":
        return t("errors.maxLength", { max: 1000 });
      default:
        return message;
    }
  };

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    try {
      await onSendMessage(data.content);
      form.reset();
    } catch {
      // Keep the typed text so the user can retry
    }
  };

  return (
    <div className="shrink-0 border-t p-4 bg-background" data-testid="message-input">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center gap-2"
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field, fieldState }) => (
              <FormItem className="flex-1">
                <FormLabel className="sr-only">
                  {t("messages.typeMessage")}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("messages.typeMessage")}
                    aria-label={t("messages.typeMessage")}
                    disabled={disabled}
                    maxLength={1000}
                    className="rounded-full px-4"
                    data-testid="input-message"
                    onBlur={async () => {
                      field.onBlur();
                      await form.trigger("content");
                    }}
                  />
                </FormControl>
                <FormMessage>
                  {getLocalizedError(fieldState.error?.message)}
                </FormMessage>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10"
            aria-label={t("messages.send")}
            disabled={
              disabled ||
              form.formState.isSubmitting ||
              !form.watch("content").trim()
            }
            data-testid="btn-send"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
