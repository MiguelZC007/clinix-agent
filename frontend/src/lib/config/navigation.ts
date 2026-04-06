import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  MessageSquare,
} from "lucide-react";

export type NavItem = {
  titleKey: string;
  href: string;
  icon: typeof LayoutDashboard;
  children?: { titleKey: string; href: string }[];
};

export const sidebarNavItems: NavItem[] = [
  {
    titleKey: "navigation.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    titleKey: "navigation.patients",
    href: "/patients",
    icon: Users,
    children: [
      { titleKey: "patients.title", href: "/patients" },
      { titleKey: "patients.newPatient", href: "/patients/new" },
    ],
  },
  {
    titleKey: "navigation.appointments",
    href: "/appointments",
    icon: Calendar,
  },
  {
    titleKey: "navigation.messages",
    href: "/messages",
    icon: MessageSquare,
  },
  {
    titleKey: "navigation.clinicalHistories",
    href: "/clinical-histories",
    icon: FileText,
  },
];
