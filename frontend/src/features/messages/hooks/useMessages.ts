"use client";

import { useState, useEffect, useCallback } from "react";
import { toError } from "@/lib/utils";
import type { PaginatedData } from "@/types/contracts/api-response";
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  patchConversation,
} from "../api/messages.api";
import type {
  Conversation,
  Message,
  SendMessageRequest,
} from "../types/message.types";

type UseConversationsState = {
  data: PaginatedData<Conversation> | null;
  isLoading: boolean;
  error: Error | null;
};

export function useConversations() {
  const [state, setState] = useState<UseConversationsState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchConversations = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getConversations();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    ...state,
    refetch: fetchConversations,
  };
}

type UseConversationState = {
  data: Conversation | null;
  isLoading: boolean;
  error: Error | null;
};

export function useConversation(conversationId: string | null) {
  const [state, setState] = useState<UseConversationState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getConversation(conversationId);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return {
    ...state,
    refetch: fetchConversation,
  };
}

type UseMessagesState = {
  data: PaginatedData<Message> | null;
  isLoading: boolean;
  error: Error | null;
};

export function useMessages(conversationId: string | null) {
  const [state, setState] = useState<UseMessagesState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getMessages(conversationId);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    ...state,
    refetch: fetchMessages,
  };
}

type MutationState = {
  isLoading: boolean;
  error: Error | null;
};

export function useSendMessage() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (data: SendMessageRequest): Promise<Message> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await sendMessage(data);
        setState({ isLoading: false, error: null });
        return result;
      } catch (error) {
        setState({ isLoading: false, error: toError(error) });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    mutate,
  };
}

export function useMarkAsRead() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (conversationId: string): Promise<void> => {
    setState({ isLoading: true, error: null });
    try {
      await markAsRead(conversationId);
      setState({ isLoading: false, error: null });
    } catch (error) {
      setState({ isLoading: false, error: toError(error) });
      throw error;
    }
  }, []);

  return {
    ...state,
    mutate,
  };
}

export function usePatchConversation() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (conversationId: string): Promise<Conversation> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await patchConversation(conversationId, {});
        setState({ isLoading: false, error: null });
        return result;
      } catch (error) {
        setState({ isLoading: false, error: toError(error) });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    mutate,
  };
}
