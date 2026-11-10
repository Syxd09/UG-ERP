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
  Clock,
  Percent,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [repRes, docRes, payRes] = await Promise.all([
        fetch("/api/reports").then((r) => r.json()),
        fetch("/api/documents").then((r) => r.json()),
        fetch("/api/payments").then((r) => r.json()),
      ]);

      if (repRes.success) setData(repRes.data);
      if (docRes.success) setRecentDocs(docRes.data.slice(0, 6));
      if (payRes.success) setRecentPayments(payRes.data.slice(0, 6));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Helper for document status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 text-[10px]">PAID</Badge>;
      case "PARTIALLY_PAID":
        return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200 text-[10px]">PARTIAL</Badge>;
      case "ISSUED":
        return <Badge className="bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/20 border-cyan-200 text-[10px]">ISSUED</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 border-indigo-200 text-[10px]">ACCEPTED</Badge>;
      case "CANCELLED":
        return <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200 text-[10px]">CANCELLED</Badge>;
      case "DRAFT":
      default:
        return <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-300 text-[10px]">DRAFT</Badge>;
    }
  };

  // Helper for document type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "QUOTATION":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">QTN</span>;
      case "PROFORMA_INVOICE":
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">PI</span>;
      case "TAX_INVOICE":
      default:
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">INV</span>;
    }
  };

  // Calculate collection recovery rate percentage
  const collectionRate =
    data && data.totalBilledRevenue > 0
      ? Math.min(100, Math.round((data.totalAmountReceived / data.totalBilledRevenue) * 100))
      : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Banner with Quick Actions */}
        <div className="relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
          {/* Decorative Brand Accent Line */}
          <div className="absolute top-0 right-0 w-96 h-1 bg-gradient-to-r from-cyan-400 via-rose-500 to-orange-400" />

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 font-mono tracking-wide">
                ULTIMATE GRAPHICS
              </span>
              <span className="text-xs text-slate-400 font-medium">16 Years Industry Authority</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Operational Billing Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Live financial governance: track quotations, proformas, statutory GST tax invoices, and real-time bank settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/documents/new?type=QUOTATION">
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800 text-xs h-9 shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                <span>Create Quotation</span>
              </Button>
            </Link>

            <Link href="/documents/new?type=PROFORMA_INVOICE">
              <Button
                size="sm"
                variant="outline"
                className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800 text-xs h-9 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                <span>Create Proforma</span>
              </Button>
            </Link>

            <Link href="/documents/new?type=TAX_INVOICE">
              <Button size="sm" variant="brand" className="text-xs h-9 shadow-md shadow-cyan-950/40">
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

            <Button
              size="sm"
              variant="ghost"
              onClick={loadDashboardData}
              disabled={refreshing}
              className="text-slate-400 hover:text-white text-xs h-9 px-2.5"
              title="Refresh Dashboard Figures"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Cloud Database Alert Notice if running without external DB */}
        {data && data.databaseConnected === false && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">
                Cloud Database Notice (Preview Mode)
              </p>
              <p className="text-amber-800">
                The application is running in serverless preview mode. To persist live documents permanently in production, connect your PostgreSQL database (e.g. Neon or Supabase) by setting the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">DATABASE_URL</code> environment variable in your Vercel Project Settings.
              </p>
            </div>
          </div>
        )}

        {/* Primary Financial Metric Cards */}
        {loading || !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse shadow-sm"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Billed Revenue */}
            <Card className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Billed Revenue
                  </span>
                  <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-950 mt-2 font-mono tracking-tight">
                  {formatCurrency(data.totalBilledRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>From {data.totalTaxInvoices} Tax Invoices</span>
                  <span className="text-cyan-700 font-semibold">{collectionRate}% collected</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Amount Received */}
            <Card className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Amount Received
                  </span>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2 font-mono tracking-tight">
                  {formatCurrency(data.totalAmountReceived)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Bank NEFT / RTGS & UPI settlements
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Balance */}
            <Card className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Outstanding Receivables
                  </span>
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-600 mt-2 font-mono tracking-tight">
                  {formatCurrency(data.outstandingAmount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Active customer balances due
                </div>
              </CardContent>
            </Card>

            {/* GST Tax Liability */}
            <Card className="border-slate-200/80 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    GST Tax Collected
                  </span>
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600 mt-2 font-mono tracking-tight">
                  {formatCurrency(data.totalGstCollected)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  CGST + SGST + IGST liability
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secondary Document Counters Bar */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/documents"
              className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between transition-colors shadow-sm"
            >
              <div>
                <span className="text-slate-500">Total Documents: </span>
                <span className="font-bold text-slate-900 text-sm ml-1 font-mono">{data.totalDocuments}</span>
              </div>
              <FileText className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/documents?type=QUOTATION"
              className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between transition-colors shadow-sm"
            >
              <div>
                <span className="text-slate-500">Quotations: </span>
                <span className="font-bold text-cyan-600 text-sm ml-1 font-mono">{data.totalQuotations}</span>
              </div>
              <FileCheck2 className="w-4 h-4 text-cyan-500" />
            </Link>

            <Link
              href="/documents?type=PROFORMA_INVOICE"
              className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between transition-colors shadow-sm"
            >
              <div>
                <span className="text-slate-500">Proforma Invoices: </span>
                <span className="font-bold text-amber-600 text-sm ml-1 font-mono">{data.totalProformas}</span>
              </div>
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            </Link>

            <Link
              href="/documents?type=TAX_INVOICE"
              className="p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between transition-colors shadow-sm"
            >
              <div>
                <span className="text-slate-500">Tax Invoices: </span>
                <span className="font-bold text-purple-600 text-sm ml-1 font-mono">{data.totalTaxInvoices}</span>
              </div>
              <Receipt className="w-4 h-4 text-purple-500" />
            </Link>
          </div>
        )}

        {/* Recent Invoices & Payments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Documents Table (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <span>Recent Billing Documents</span>
                </CardTitle>
                <Link
                  href="/documents"
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="w-16">Type</TableHead>
                      <TableHead>Doc Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total (₹)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDocs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center text-slate-400 text-xs">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-medium text-slate-600">No documents created yet.</p>
                          <Link href="/documents/new?type=QUOTATION" className="inline-block mt-2">
                            <Button size="sm" variant="brand" className="text-xs h-8">
                              Create First Quotation
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentDocs.map((d) => (
                        <TableRow key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell>{getTypeBadge(d.documentType)}</TableCell>
                          <TableCell className="font-mono font-bold text-xs text-slate-950">
                            <Link href={`/documents/${d.id}`} className="hover:text-cyan-600 hover:underline">
                              {d.documentNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                            {d.customerName}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-slate-950">
                            {formatCurrency(d.totalAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(d.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/documents/${d.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-cyan-600 hover:text-cyan-700 text-[11px] font-semibold"
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

          {/* Recent Settlements Table (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden">
              <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Recent Settlements</span>
                </CardTitle>
                <Link
                  href="/payments"
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-40 text-center text-slate-400 text-xs">
                          <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-medium text-slate-600">No payment settlements recorded yet.</p>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            Settlements appear as payments are logged against invoices.
                          </span>
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map((p) => (
                        <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell>
                            <div className="font-semibold text-slate-900 text-xs truncate max-w-[130px]">
                              {p.document.customerName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {p.paymentNumber} • {formatDate(p.paymentDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            <span className="font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                              {p.paymentMethod.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-emerald-600">
                            +{formatCurrency(p.amount)}
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
