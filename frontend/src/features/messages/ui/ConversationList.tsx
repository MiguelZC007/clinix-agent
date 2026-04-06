"use client";

import { MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListItemSkeleton } from "@/ui/molecules/ListItemSkeleton";
import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "../types/message.types";

const CONVERSATION_SKELETON_COUNT = 7;

type ConversationListProps = {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation?: () => void;
  isLoading?: boolean;
};

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading = false,
}: ConversationListProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col h-full border-r" data-testid="conversation-list">
      <div className="border-b p-3 md:p-4">
        <div className="mb-2 flex items-center justify-between md:mb-4">
          <h2 className="text-base font-semibold md:text-lg">
            {t("messages.title")}
          </h2>
          {onNewConversation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewConversation}
              title={t("messages.newConversation")}
              aria-label={t("messages.newConversation")}
              data-testid="btn-new-conversation"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: CONVERSATION_SKELETON_COUNT }).map((_, i) => (
              <ListItemSkeleton key={i} avatarSize="md" lines={2} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center p-4">
            <p className="text-muted-foreground">
              {t("messages.noConversations")}
            </p>
          </div>
        ) : (
          <div className="divide-y" data-testid="conversation-items">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
