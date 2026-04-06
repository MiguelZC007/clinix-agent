"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, toDateLocale } from "@/lib/utils";
import type { Conversation } from "../types/message.types";

const previewMarkdownClasses =
  "text-xs text-muted-foreground [&>*]:m-0 [&>*:last-child]:mb-0";
const previewComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <span className={previewMarkdownClasses}>{children}</span>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-muted px-1 font-mono">{children}</code>
  ),
  a: ({ children }: { children?: React.ReactNode }) => (
    <span className="underline">{children}</span>
  ),
};

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
};

export function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());

  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      const time = date.toLocaleTimeString(dateLocale, {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `${t("common.today")}, ${time}`;
    }
    if (isYesterday) {
      return t("common.yesterday");
    }
    return date.toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
    });
  };

  const displayDate = formatDate(conversation.lastActivityAt);
  const preview =
    conversation.lastMessagePreview?.trim() ??
    conversation.summary?.trim() ??
    conversation.title?.trim() ??
    "";

  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isActive && "bg-muted",
      )}
      aria-current={isActive ? "true" : undefined}
      onClick={onClick}
    >
      <Avatar className="h-9 w-9 shrink-0 md:h-12 md:w-12">
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          <MessageSquare className="h-4 w-4 md:h-6 md:w-6" />
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {displayDate}
        </span>
        {preview ? (
          <div
            className={cn(
              "line-clamp-2 overflow-hidden text-xs text-muted-foreground",
              "[&_p]:inline [&_strong]:font-semibold [&_a]:underline",
            )}
            title={preview}
          >
            <ReactMarkdown
              skipHtml
              remarkPlugins={[remarkGfm]}
              allowedElements={["p", "strong", "em", "code", "del", "a", "br"]}
              unwrapDisallowed
              components={previewComponents}
            >
              {preview}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    </button>
  );
}
