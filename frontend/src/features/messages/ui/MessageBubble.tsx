"use client";

import { Check } from "lucide-react";
import { useLocale } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn, toDateLocale } from "@/lib/utils";
import type { Message } from "../types/message.types";

type MessageBubbleProps = {
  message: Message;
  isOwn: boolean;
};

const markdownClasses = {
  own: {
    p: "text-sm whitespace-pre-wrap break-words mb-1 last:mb-0",
    ul: "list-disc pl-5 my-2 space-y-0.5",
    ol: "list-decimal pl-5 my-2 space-y-0.5",
    li: "text-sm",
    code: "text-xs px-1.5 py-0.5 rounded bg-primary-foreground/20 font-mono",
    pre: "text-xs p-2 rounded my-2 overflow-x-auto bg-primary-foreground/10 font-mono",
    a: "underline hover:opacity-80",
    strong: "font-semibold",
  },
  other: {
    p: "text-sm whitespace-pre-wrap break-words mb-1 last:mb-0",
    ul: "list-disc pl-5 my-2 space-y-0.5",
    ol: "list-decimal pl-5 my-2 space-y-0.5",
    li: "text-sm",
    code: "text-xs px-1.5 py-0.5 rounded bg-muted-foreground/20 font-mono",
    pre: "text-xs p-2 rounded my-2 overflow-x-auto bg-muted-foreground/10 font-mono",
    a: "underline hover:opacity-80",
    strong: "font-semibold",
  },
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const dateLocale = toDateLocale(useLocale());
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const c = isOwn ? markdownClasses.own : markdownClasses.other;

  const components = {
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className={c.p}>{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className={c.ul}>{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className={c.ol}>{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className={c.li}>{children}</li>
    ),
    code: ({
      className,
      children,
      ...props
    }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
      const isInline = !className;
      return isInline ? (
        <code className={c.code} {...props}>
          {children}
        </code>
      ) : (
        <code className={cn(c.code, "block")} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }: { children?: React.ReactNode }) => (
      <pre className={c.pre}>{children}</pre>
    ),
    a: ({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        className={c.a}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className={c.strong}>{children}</strong>
    ),
  };

  return (
    <div className={cn("flex mb-2", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md",
        )}
      >
        <div className="markdown-content [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
            skipHtml
            allowedElements={[
              "p",
              "strong",
              "em",
              "del",
              "br",
              "ul",
              "ol",
              "li",
              "code",
              "pre",
              "a",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "blockquote",
              "hr",
              "table",
              "thead",
              "tbody",
              "tr",
              "th",
              "td",
            ]}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          <span className="text-[10px]">{formatTime(message.createdAt)}</span>
          {isOwn && message.readAt && <Check className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}
