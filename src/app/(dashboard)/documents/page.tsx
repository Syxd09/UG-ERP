"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Plus,
  Search,
  FileCheck2,
  FileSpreadsheet,
  Receipt,
  Eye,
  Edit2,
  Printer,
  ChevronRight,
  CreditCard,
  Building2,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DocumentListItem {
  id: string;
  documentNumber: string;
  documentType: "QUOTATION" | "PROFORMA_INVOICE" | "TAX_INVOICE";
  status: string;
  issueDate: string;
  dueDate: string | null;
  customerName: string;
  projectName: string | null;
  totalAmount: number;
  amountReceived: number;
  balanceDue: number;
  isLocked: boolean;
}

function DocumentsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "ALL";

  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<string>(initialType);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (initialType && initialType !== docType) {
      setDocType(initialType);
    }
  }, [initialType]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (docType !== "ALL") params.append("type", docType);
      if (status !== "ALL") params.append("status", status);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/documents?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDocs(json.data);
      }
    } catch (err) {
      console.error("Error loading documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [docType, status, search]);

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "QUOTATION":
        return {
          label: "Quotation",
          class: "bg-cyan-50 text-cyan-700 border-cyan-200",
          icon: FileCheck2,
        };
      case "PROFORMA_INVOICE":
        return {
          label: "Proforma",
          class: "bg-amber-50 text-amber-700 border-amber-200",
          icon: FileSpreadsheet,
        };
      case "TAX_INVOICE":
        return {
          label: "Tax Invoice",
          class: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: Receipt,
        };
      default:
        return {
          label: type,
          class: "bg-slate-50 text-slate-700 border-slate-200",
          icon: FileText,
        };
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "DRAFT":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "ISSUED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ACCEPTED":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "PARTIALLY_PAID":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Billing Documents
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage client quotations, advance proforma invoices, and statutory GST tax invoices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/documents/new?type=QUOTATION">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-9">
              <FileCheck2 className="w-4 h-4 text-cyan-600" />
              <span>New Quotation</span>
            </Button>
          </Link>
          <Link href="/documents/new?type=TAX_INVOICE">
            <Button size="sm" variant="brand" className="gap-1.5 text-xs h-9">
              <Receipt className="w-4 h-4" />
              <span>New Tax Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Type Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: "ALL", label: "All Types" },
                { id: "QUOTATION", label: "Quotations" },
                { id: "PROFORMA_INVOICE", label: "Proforma Invoices" },
                { id: "TAX_INVOICE", label: "GST Tax Invoices" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDocType(t.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    docType === t.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status and Search */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="h-9 border border-slate-300 rounded text-xs px-2.5 bg-white text-slate-700"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Search doc #, customer, project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doc Number & Type</TableHead>
                <TableHead>Customer & Project</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    No documents found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((d) => {
                  const typeBadge = getDocTypeBadge(d.documentType);
                  const TypeIcon = typeBadge.icon;
                  return (
                    <TableRow key={d.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <Link
                          href={`/documents/${d.id}`}
                          className="font-mono font-bold text-xs text-slate-900 hover:text-cyan-600 flex items-center gap-1.5"
                        >
                          <TypeIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{d.documentNumber}</span>
                        </Link>
                        <div className="mt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeBadge.class}`}
                          >
                            {typeBadge.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-xs">
                          {d.customerName}
                        </div>
                        {d.projectName && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                            {d.projectName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(d.issueDate)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-slate-900 font-mono">
                        {formatCurrency(d.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-emerald-600 font-mono font-medium">
                        {d.amountReceived > 0 ? formatCurrency(d.amountReceived) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold">
                        {d.balanceDue > 0 ? (
                          <span className="text-rose-600">
                            {formatCurrency(d.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${getStatusBadge(
                            d.status
                          )}`}
                        >
                          {d.status.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/documents/${d.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-[11px]"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View
                            </Button>
                          </Link>

                          {!d.isLocked && (
                            <Link href={`/documents/${d.id}/edit`}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-slate-500 hover:text-slate-900"
                                title="Edit Document"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-slate-400">Loading documents...</div>}>
        <DocumentsContent />
      </Suspense>
    </AppShell>
  );
}
