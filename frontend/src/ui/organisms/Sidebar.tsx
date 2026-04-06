"use client";

import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { sidebarNavItems, type NavItem } from "@/lib/config/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/ui/atoms/Logo";

type SidebarProps = {
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

type NavItemComponentProps = {
  item: NavItem;
  collapsed: boolean;
};

function getInitials(
  user: { name?: string; lastName?: string } | null,
): string {
  if (!user) return "?";
  const n = (user.name ?? "").trim();
  const l = (user.lastName ?? "").trim();
  const first = n.charAt(0).toUpperCase();
  const second = l.charAt(0).toUpperCase();
  if (first || second) return `${first}${second}`;
  return "?";
}

function NavItemComponent({ item, collapsed }: NavItemComponentProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = pathname.startsWith(item.href);
  const Icon = item.icon;

  if (collapsed && item.children) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
                aria-label={t(item.titleKey)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {t(item.titleKey)}
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          side="right"
          align="start"
          className="w-48 p-2 bg-sidebar text-sidebar-foreground border-sidebar-border"
        >
          <div className="space-y-0.5">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === child.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {t(child.titleKey)}
              </Link>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            aria-label={t(item.titleKey)}
          >
            <Icon className="h-4 w-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {t(item.titleKey)}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (item.children) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          )}
        >
          <span className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {t(item.titleKey)}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>
        {isOpen && (
          <div className="ml-6 mt-1 space-y-1 border-l border-sidebar-border pl-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === child.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                {t(child.titleKey)}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {t(item.titleKey)}
    </Link>
  );
}

export function Sidebar({
  className,
  collapsed = false,
  onCollapsedChange: _onCollapsedChange,
}: SidebarProps) {
  const t = useTranslations();
  const { user, isLoading, logout } = useAuth();
  const displayName = user
    ? `${user.name} ${user.lastName}`.trim()
    : isLoading
      ? "…"
      : "";
  const displayEmail = user?.email ?? "";

  return (
    <aside
      role="complementary"
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-sidebar-border",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <Logo size="md" textClassName="text-white" showText={!collapsed} />
      </div>

      <Separator className="bg-sidebar-border" />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav
          className={cn(
            "space-y-1",
            collapsed && "flex flex-col items-center gap-1",
          )}
          aria-label={t("navigation.sidebar")}
        >
          {sidebarNavItems.map((navItem) => (
            <NavItemComponent
              key={navItem.href}
              item={navItem}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      <div className={cn("p-3", collapsed && "flex justify-center")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "default"}
              className={cn(
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !collapsed && "w-full justify-start gap-3 px-3",
              )}
              aria-label={collapsed ? t("auth.userMenu") : undefined}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {getInitials(user ?? null)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1 flex flex-col items-start text-left overflow-hidden">
                  {displayName && (
                    <span className="text-sm font-medium truncate w-full">
                      {displayName}
                    </span>
                  )}
                  {displayEmail && (
                    <span className="text-xs text-sidebar-foreground/70 truncate w-full">
                      {displayEmail}
                    </span>
                  )}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => void logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("auth.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
