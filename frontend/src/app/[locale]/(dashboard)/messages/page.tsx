"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createConversation } from "@/features/messages/api/messages.api";
import {
  useConversations,
  useConversation,
  useMessages,
  useSendMessage,
  usePatchConversation,
} from "@/features/messages/hooks/useMessages";
import type { Conversation } from "@/features/messages/types/message.types";
import { ChatWindow } from "@/features/messages/ui/ChatWindow";
import { ConversationList } from "@/features/messages/ui/ConversationList";
import { useAuth } from "@/lib/auth/hooks";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";

export default function MessagesPage() {
  const t = useTranslations();
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useConversations();
  const { data: conversationDetail, refetch: refetchConversationDetail } =
    useConversation(activeConversation?.id ?? null);
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useMessages(activeConversation?.id || null);
  const { mutate: sendMessageMutation, isLoading: isSending } =
    useSendMessage();
  const { mutate: patchConversationMutation } = usePatchConversation();

  const conversations = conversationsData?.items || [];
  const messages = messagesData?.items || [];
  const conversationForChat = conversationDetail ?? activeConversation;

  useEffect(() => {
    if (messagesError) {
      toast.error(t("messages.loadError"));
    }
  }, [messagesError, t]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!activeConversation) return;
      if (!currentUserId) {
        toast.error(t("messages.unauthorized"));
        throw new Error("Missing current user id");
      }

      try {
        await sendMessageMutation({
          conversationId: activeConversation.id,
          content,
        });
        refetchMessages();
        refetchConversationDetail();
        refetchConversations();
      } catch (_error) {
        toast.error(t("messages.sendError"));
        throw _error;
      }
    },
    [
      activeConversation,
      currentUserId,
      sendMessageMutation,
      refetchMessages,
      refetchConversationDetail,
      refetchConversations,
      t,
    ],
  );

  const handleBack = useCallback(() => {
    if (activeConversation) {
      patchConversationMutation(activeConversation.id).catch((err) => {
        console.error("Failed to mark conversation as read:", err);
      });
    }
    setActiveConversation(null);
  }, [activeConversation, patchConversationMutation]);

  const handleNewConversation = useCallback(async () => {
    try {
      const newConv = await createConversation();
      setActiveConversation(newConv);
      refetchConversations();
    } catch (error) {
      toast.error(t("messages.createError"));
      throw error;
    }
  }, [refetchConversations, t]);

  if (conversationsError) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-destructive">
            {getSafeErrorMessage(conversationsError, t)}
          </p>
          <button
            type="button"
            className="text-sm text-primary underline hover:text-primary/80"
            onClick={() => refetchConversations()}
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-background rounded-lg border overflow-hidden">
      <div
        className={`w-full shrink-0 md:w-64 lg:w-80 ${
          activeConversation ? "hidden md:block" : "block"
        }`}
      >
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id || null}
          onSelectConversation={setActiveConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoadingConversations}
        />
      </div>
      <div
        className={`flex-1 flex flex-col h-full ${
          activeConversation ? "block" : "hidden md:block"
        }`}
      >
        {activeConversation ? (
          messagesError ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 p-4 text-center">
              <p className="text-destructive text-sm">
                {t("messages.loadError")}
              </p>
              <button
                type="button"
                className="text-sm text-primary underline hover:text-primary/80"
                onClick={() => refetchMessages()}
              >
                {t("common.retry")}
              </button>
            </div>
          ) : (
            <ChatWindow
              conversation={conversationForChat}
              messages={messages}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              isSending={isSending}
              isLoadingMessages={isLoadingMessages}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">
              {t("messages.selectConversation")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
