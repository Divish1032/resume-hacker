"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquareQuote, 
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Optimizer",
    href: "/optimizer",
    icon: FileText,
    description: "Tailor resume to job descriptions"
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Track applications & saved resumes"
  },
  {
    title: "Interview Prep",
    href: "/interview",
    icon: MessageSquareQuote,
    description: "Mock questions & STAR flashcards"
  },
  {
    title: "Networking",
    href: "/networking",
    icon: Network,
    description: "LinkedIn outreach & headlines"
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 lg:w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transition-all duration-300">
      <div className="flex flex-col gap-2 p-4 pt-6">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href) || (pathname === '/' && item.href === '/optimizer');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-sm font-medium",
                isActive 
                  ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-500" : "text-slate-400 dark:text-slate-500")} />
              <div className="hidden lg:flex flex-col overflow-hidden">
                <span className="truncate">{item.title}</span>
                {isActive && <span className="text-[10px] font-normal opacity-80 truncate hidden xl:inline-block">{item.description}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
