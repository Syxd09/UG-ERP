"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Plus,
  User,
  LogOut,
  ChevronRight,
  Home,
  FileCheck2,
  FileSpreadsheet,
  Receipt,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Parse path segments for breadcrumbs
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 app-header">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link
          href="/dashboard"
          className="hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          const href = "/" + segments.slice(0, idx + 1).join("/");
          const title =
            seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");

          return (
            <div key={seg} className="flex items-center space-x-2">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {isLast ? (
                <span className="font-semibold text-slate-800 capitalize">
                  {title}
                </span>
              ) : (
                <Link
                  href={href}
                  className="hover:text-slate-900 capitalize transition-colors"
                >
                  {title}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Actions */}
      <div className="flex items-center space-x-3">
        {/* Quick Create Dropdown */}
        <div className="relative">
          <Button
            size="sm"
            variant="brand"
            className="gap-1.5 shadow-sm text-xs font-medium"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Plus className="w-4 h-4" />
            <span>Create New</span>
          </Button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
              onClick={() => setDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Billing Documents
              </div>
              <Link
                href="/documents/new?type=QUOTATION"
                className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileCheck2 className="w-4 h-4 text-cyan-600" />
                <div>
                  <div className="font-medium text-slate-900">New Quotation</div>
                  <div className="text-[10px] text-slate-400">Estimate for signage or print</div>
                </div>
              </Link>
              <Link
                href="/documents/new?type=PROFORMA_INVOICE"
                className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="font-medium text-slate-900">New Proforma Invoice</div>
                  <div className="text-[10px] text-slate-400">Advance payment request</div>
                </div>
              </Link>
              <Link
                href="/documents/new?type=TAX_INVOICE"
                className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-medium text-slate-900">New GST Tax Invoice</div>
                  <div className="text-[10px] text-slate-400">Final tax invoice with GSTIN</div>
                </div>
              </Link>
              <div className="my-1 border-t border-slate-100" />
              <Link
                href="/customers?action=new"
                className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span className="font-medium">Add Customer</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications Mock/Indicator */}
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
              {session?.user?.name ? session.user.name.charAt(0) : "A"}
            </div>
            <span className="text-xs font-medium text-slate-700 hidden md:inline pr-1">
              {session?.user?.name || "Admin"}
            </span>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs"
              onClick={() => setProfileOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-medium text-slate-900">
                  {session?.user?.name || "Administrator"}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {session?.user?.email || "admin@ultimategraphics.com"}
                </div>
              </div>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Company Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
