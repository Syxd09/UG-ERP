"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileCheck2,
  FileSpreadsheet,
  Receipt,
  IndianRupee,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Users,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/reports").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()),
      fetch("/api/payments").then((r) => r.json()),
    ])
      .then(([repRes, docRes, payRes]) => {
        if (repRes.success) setData(repRes.data);
        if (docRes.success) setRecentDocs(docRes.data.slice(0, 5));
        if (payRes.success) setRecentPayments(payRes.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Banner with Quick Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-xl border border-slate-800 text-white shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                Ultimate Graphics Billing Core
              </span>
              <span className="text-xs text-slate-400">• 16 Years of Craft</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Operational Billing Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live financial overview, GST tax records, quotations, and accounts receivable
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/documents/new?type=QUOTATION">
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs h-9"
              >
                <FileCheck2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                <span>Create Quotation</span>
              </Button>
            </Link>
            <Link href="/documents/new?type=PROFORMA_INVOICE">
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs h-9"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Create Proforma</span>
              </Button>
            </Link>
            <Link href="/documents/new?type=TAX_INVOICE">
              <Button size="sm" variant="brand" className="text-xs h-9">
                <Receipt className="w-3.5 h-3.5 mr-1.5" />
                <span>Create Tax Invoice</span>
              </Button>
            </Link>
            <Link href="/customers?action=new">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white text-xs h-9"
              >
                <Users className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
                <span>Add Customer</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Metrics Cards (Calculated directly from Database) */}
        {loading || !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-lg border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Billed Revenue
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                  {formatCurrency(data.totalBilledRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  From {data.totalTaxInvoices} Tax Invoices
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Amount Received
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono">
                  {formatCurrency(data.totalAmountReceived)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Settled into bank & UPI
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Outstanding Balance
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600 mt-2 font-mono">
                  {formatCurrency(data.outstandingAmount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Active client receivables
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    GST Tax Collected
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600 mt-2 font-mono">
                  {formatCurrency(data.totalGstCollected)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  CGST + SGST + IGST liability
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secondary Document Stats */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Total Documents: </span>
                <span className="font-bold text-slate-900">{data.totalDocuments}</span>
              </div>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Quotations: </span>
                <span className="font-bold text-cyan-600">{data.totalQuotations}</span>
              </div>
              <FileCheck2 className="w-4 h-4 text-cyan-500" />
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Proforma Invoices: </span>
                <span className="font-bold text-amber-600">{data.totalProformas}</span>
              </div>
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Tax Invoices: </span>
                <span className="font-bold text-emerald-600">{data.totalTaxInvoices}</span>
              </div>
              <Receipt className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        )}

        {/* Recent Invoices & Payments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Documents (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <span>Recent Billing Documents</span>
                </CardTitle>
                <Link
                  href="/documents"
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doc Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-xs">
                          No documents created yet. Click &quot;Create Quotation&quot; to begin.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentDocs.map((d) => (
                        <TableRow key={d.id} className="hover:bg-slate-50/80">
                          <TableCell className="font-mono font-bold text-xs">
                            <Link href={`/documents/${d.id}`} className="hover:text-cyan-600">
                              {d.documentNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                            {d.customerName}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-slate-900">
                            {formatCurrency(d.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {d.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/documents/${d.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-cyan-600 text-[11px]"
                              >
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Recent Settlements</span>
                </CardTitle>
                <Link
                  href="/payments"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  <span>Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-slate-400 text-xs">
                          No payments received yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map((p) => (
                        <TableRow key={p.id} className="hover:bg-slate-50/80">
                          <TableCell>
                            <div className="font-semibold text-slate-900 text-xs truncate max-w-[130px]">
                              {p.document.customerName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {p.paymentNumber}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {p.paymentMethod.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-emerald-600">
                            {formatCurrency(p.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
