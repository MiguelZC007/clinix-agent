"use client";

import { useEffect, useRef } from "react";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import type { Conversation, Message } from "../types/message.types";

const CIRCLE_SIZE = 28;
const CIRCLE_STROKE = 3;
const CIRCLE_R = (CIRCLE_SIZE - CIRCLE_STROKE) / 2;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R;

type ChatWindowProps = {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => Promise<void> | void;
  onBack?: () => void;
  isSending?: boolean;
  isLoadingMessages?: boolean;
};

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isSending = false,
  isLoadingMessages = false,
}: ChatWindowProps) {
  const t = useTranslations();
  const locale = useLocale();
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/30" data-testid="chat-window">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">
          {t("messages.noMessages")}
        </p>
      </div>
    );
  }

  const title =
    conversation.title ??
    conversation.summary?.slice(0, 50) ??
    t("messages.conversation");

  return (
    <div className="flex flex-col h-full overflow-hidden" data-testid="chat-window">
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onBack}
              aria-label={t("common.back")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              <MessageSquare className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium truncate max-w-[200px]">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {t("messages.assistant")}
            </p>
          </div>
        </div>
        {typeof conversation.contextTokenLimit === "number" &&
          conversation.contextTokenLimit > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("messages.contextUsage")}
                >
                  <svg
                    width={CIRCLE_SIZE}
                    height={CIRCLE_SIZE}
                    className="rotate-[-90deg]"
                    aria-hidden
                  >
                    <circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={CIRCLE_R}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={CIRCLE_STROKE}
                      className="text-muted"
                    />
                    <circle
                      cx={CIRCLE_SIZE / 2}
                      cy={CIRCLE_SIZE / 2}
                      r={CIRCLE_R}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={CIRCLE_STROKE}
                      strokeDasharray={CIRCLE_C}
                      strokeDashoffset={
                        CIRCLE_C *
                        (1 -
                          Math.min(
                            1,
                            (conversation.contextTokensUsed ?? 0) /
                              conversation.contextTokenLimit,
                          ))
                      }
                      strokeLinecap="round"
                      className="text-primary transition-all duration-300"
                    />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {t("messages.contextUsage")}:{" "}
                {(conversation.contextTokensUsed ?? 0).toLocaleString(locale)} /{" "}
                {conversation.contextTokenLimit.toLocaleString(locale)}
              </TooltipContent>
            </Tooltip>
          )}
      </div>

      <ScrollArea className="flex-1 min-h-0 p-4">
        {isLoadingMessages ? (
          <div className="space-y-2">
            <div className="flex justify-start">
              <Skeleton className="w-[75%] max-w-[280px] h-14 rounded-2xl rounded-bl-md" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="w-[60%] max-w-[220px] h-10 rounded-2xl rounded-br-md" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="w-[65%] max-w-[240px] h-16 rounded-2xl rounded-bl-md" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="w-[55%] max-w-[200px] h-12 rounded-2xl rounded-br-md" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="w-[70%] max-w-[260px] h-12 rounded-2xl rounded-bl-md" />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.role === "user"}
              />
            ))}
            {isSending && (
              <div className="flex justify-start mb-2">
                <div className="max-w-[70%] rounded-2xl px-4 py-2 bg-muted rounded-bl-md">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                    {t("messages.assistantWriting")}
                  </p>
                </div>
              </div>
            )}
            <div ref={scrollAnchorRef} />
          </div>
        )}
      </ScrollArea>

      <MessageInput
        onSendMessage={onSendMessage}
        disabled={isSending || !currentUserId}
      />
    </div>
  );
}
