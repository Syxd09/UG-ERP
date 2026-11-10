"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FileCheck2,
  Receipt,
  FileSpreadsheet,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavSubItem {
  name: string;
  href: string;
  icon?: React.ElementType;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: NavSubItem[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Documents",
    href: "/documents",
    icon: FileText,
    subItems: [
      { name: "All Documents", href: "/documents" },
      { name: "Quotations", href: "/documents?type=QUOTATION", icon: FileCheck2 },
      { name: "Proforma Invoices", href: "/documents?type=PROFORMA_INVOICE", icon: FileSpreadsheet },
      { name: "GST Tax Invoices", href: "/documents?type=TAX_INVOICE", icon: Receipt },
    ],
  },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products & Services", href: "/products-services", icon: Package },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [documentsOpen, setDocumentsOpen] = useState(true);

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 text-slate-300 select-none z-30 app-sidebar">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white shadow-sm ring-1 ring-white/10 group-hover:scale-105 transition-transform">
            <Image
              src="/logos/symbol-logo.jpeg"
              alt="UG Logo"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide leading-tight flex items-center gap-1.5">
              <span>ULTIMATE</span>
              <span className="text-[10px] bg-gradient-to-r from-cyan-400 via-rose-400 to-orange-400 text-transparent bg-clip-text font-black">
                GRAPHICS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Billing Management
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Menu
        </div>

        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const hasChildren = Boolean(item.subItems && item.subItems.length > 0);

          if (hasChildren) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setDocumentsOpen(!documentsOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-cyan-400" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-slate-400 transition-transform",
                      documentsOpen && "rotate-180"
                    )}
                  />
                </button>

                {documentsOpen && (
                  <div className="pl-6 pr-1 space-y-1 pt-0.5">
                    {item.subItems?.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors",
                            isSubActive
                              ? "bg-gradient-to-r from-cyan-500/10 via-rose-500/10 to-orange-500/10 text-cyan-300 font-medium border-l-2 border-cyan-400 pl-2.5"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                          )}
                        >
                          <span>{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors",
                isActive
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-cyan-400" : "text-slate-400"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] bg-cyan-950 text-cyan-400 rounded border border-cyan-800 font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Brand Accent Footer Card */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30">
        <div className="p-3 rounded-lg bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-white font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>16 Years of Craft</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Architectural Signage, CNC & Laser Cutting
          </p>
        </div>
      </div>
    </aside>
  );
}
