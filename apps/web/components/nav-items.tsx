import {
  AlertTriangle, BadgeIndianRupee, BriefcaseBusiness, CalendarCheck, CalendarDays, CheckSquare,
  CircleHelp, FileCheck2, FileText, Fingerprint, GitFork, HeartPulse, IdCard, Landmark, Layers3,
  LayoutDashboard, Megaphone, MessageSquareText, ReceiptText, Settings, ShieldCheck, Sparkles,
  Target, TrendingUp, Trophy, Users, GraduationCap, Plane, CalendarClock, Boxes, BookOpenCheck,
} from "lucide-react";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";

export type NavItem = { href: Route; label: string; icon: LucideIcon; group: string };

// Group order for the sidebar (sections/01 §2).
export const GROUP_ORDER = ["My Space", "People", "Time", "Money", "Talent", "Workplace", "Insights", "Admin"] as const;

export const nav: NavItem[] = [
  // My Space
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "My Space" },
  { href: "/approvals", label: "Inbox", icon: CheckSquare, group: "My Space" },
  // People
  { href: "/employees", label: "Directory", icon: Users, group: "People" },
  { href: "/organization", label: "Org Chart", icon: GitFork, group: "People" },
  { href: "/documents", label: "Documents", icon: FileCheck2, group: "People" },
  { href: "/cards", label: "ID & Visiting Card", icon: IdCard, group: "People" },
  // Time
  { href: "/attendance", label: "Attendance", icon: Fingerprint, group: "Time" },
  { href: "/leave", label: "Leave", icon: CalendarCheck, group: "Time" },
  { href: "/holidays", label: "Holidays", icon: CalendarDays, group: "Time" },
  // Money
  { href: "/payroll", label: "Payroll", icon: BadgeIndianRupee, group: "Money" },
  { href: "/compliance", label: "Compliance", icon: Landmark, group: "Money" },
  { href: "/expenses", label: "Expenses", icon: ReceiptText, group: "Money" },
  { href: "/insurance", label: "Insurance", icon: HeartPulse, group: "Money" },
  // Talent
  { href: "/performance", label: "Performance", icon: Target, group: "Talent" },
  { href: "/recruitment" as Route, label: "Recruitment", icon: BriefcaseBusiness, group: "Talent" },
  { href: "/training" as Route, label: "Training & Skills", icon: GraduationCap, group: "Talent" },
  { href: "/travel" as Route, label: "Travel Desk", icon: Plane, group: "Talent" },
  { href: "/rewards", label: "Rewards", icon: Trophy, group: "Talent" },
  // Workplace
  { href: "/support", label: "Helpdesk", icon: CircleHelp, group: "Workplace" },
  { href: "/grievance" as Route, label: "Grievance", icon: AlertTriangle, group: "Workplace" },
  { href: "/assets", label: "Assets", icon: Boxes, group: "Workplace" },
  { href: "/policies" as Route, label: "Policies", icon: BookOpenCheck, group: "Workplace" },
  { href: "/surveys" as Route, label: "Surveys", icon: FileText, group: "Workplace" },
  { href: "/social", label: "SkyNexus", icon: MessageSquareText, group: "Workplace" },
  { href: "/notifications", label: "Notifications", icon: Megaphone, group: "Workplace" },
  { href: "/reminders" as Route, label: "Reminders", icon: CalendarClock, group: "Workplace" },
  // Insights
  { href: "/analytics", label: "Analytics", icon: TrendingUp, group: "Insights" },
  { href: "/reports", label: "Reports", icon: FileText, group: "Insights" },
  // Admin
  { href: "/setup", label: "Setup Wizard", icon: Sparkles, group: "Admin" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Admin" },
  { href: "/security", label: "Security", icon: ShieldCheck, group: "Admin" },
  { href: "/saas", label: "Billing & Plan", icon: Layers3, group: "Admin" },
  { href: "/saas-admin" as Route, label: "SaaS Admin", icon: ShieldCheck, group: "Admin" },
];

export function groupedNav(): { group: string; items: NavItem[] }[] {
  return GROUP_ORDER.map((group) => ({ group, items: nav.filter((n) => n.group === group) })).filter((g) => g.items.length > 0);
}
