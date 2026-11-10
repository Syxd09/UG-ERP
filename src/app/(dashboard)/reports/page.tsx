"use client";

import { useEffect, useState } from "react";
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
import {
  BarChart3,
  Download,
  IndianRupee,
  Receipt,
  Building2,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data) return;

    let csv = "Category,Metric,Value\n";
    csv += `Sales,Total Billed Revenue,${data.totalBilledRevenue}\n`;
    csv += `Sales,Total Taxable Value,${data.totalTaxableValue}\n`;
    csv += `GST,Total GST Collected,${data.totalGstCollected}\n`;
    csv += `Collections,Total Received,${data.totalAmountReceived}\n`;
    csv += `Receivables,Outstanding Balance,${data.outstandingAmount}\n\n`;

    csv += "Customer,Total Billed,Total Received,Balance Due\n";
    for (const c of data.customerBreakdown) {
      csv += `"${c.name}",${c.billed},${c.received},${c.balance}\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Ultimate_Graphics_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Financial Reports & GST Summary
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Statutory tax records, collection summaries, and customer receivable breakdown
            </p>
          </div>

          <Button
            onClick={exportCSV}
            variant="outline"
            className="gap-2 text-xs h-9"
            disabled={loading || !data}
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Export Financial CSV</span>
          </Button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            Calculating report metrics from database...
          </div>
        ) : !data ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            No report data available.
          </div>
        ) : (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Invoiced (Tax Invoices)
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                    {formatCurrency(data.totalBilledRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Taxable: {formatCurrency(data.totalTaxableValue)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    GST Tax Liability (GSTR-1)
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono">
                    {formatCurrency(data.totalGstCollected)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex gap-2">
                    <span>CGST+SGST: {formatCurrency(data.totalCgstCollected + data.totalSgstCollected)}</span>
                    <span>•</span>
                    <span>IGST: {formatCurrency(data.totalIgstCollected)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Cash / Bank Received
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                    {formatCurrency(data.totalAmountReceived)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    Settled payments in ledger
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Total Outstanding Balance
                  </div>
                  <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
                    {formatCurrency(data.outstandingAmount)}
                  </div>
                  <div className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Overdue: {formatCurrency(data.overdueAmount)} ({data.overdueCount} docs)</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends Table */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  <span>Monthly Billing & Collection Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Billed Invoices</TableHead>
                      <TableHead className="text-right">Collected Settlements</TableHead>
                      <TableHead className="text-right">Net Differential</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthlyTrends.map((m: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-xs text-slate-900">
                          {m.month}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-900 font-medium">
                          {formatCurrency(m.billed)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-emerald-600 font-medium">
                          {formatCurrency(m.collected)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold">
                          {formatCurrency(m.billed - m.collected)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Bottom Two Columns: Customer-wise and GST Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Sales Table */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="py-4 px-6 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <span>Customer Billing & Receivables Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Billed</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.customerBreakdown.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-slate-400 text-xs">
                            No customer invoices billed yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.customerBreakdown.map((c: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold text-xs text-slate-900">
                              {c.name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(c.billed)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-emerald-600">
                              {formatCurrency(c.received)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold text-rose-600">
                              {formatCurrency(c.balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* GST Tax Summary (HSN-wise) */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="py-4 px-6 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>GST Tax Breakdown (HSN / SAC Wise)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>HSN / SAC</TableHead>
                        <TableHead className="text-center">Rate</TableHead>
                        <TableHead className="text-right">Taxable Value</TableHead>
                        <TableHead className="text-right">Tax Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.gstBreakdown.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-slate-400 text-xs">
                            No GST transactions recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.gstBreakdown.map((g: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs text-slate-800">
                              {g.hsnSac}
                            </TableCell>
                            <TableCell className="text-center font-mono text-xs">
                              {g.gstRate}%
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(g.taxable)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold text-indigo-600">
                              {formatCurrency(g.tax)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

