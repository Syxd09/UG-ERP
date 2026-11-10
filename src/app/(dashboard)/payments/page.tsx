"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  CreditCard,
  Search,
  IndianRupee,
  Calendar,
  Building2,
  ExternalLink,
  Receipt,
  FileCheck2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentItem {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string | null;
  bankName: string | null;
  notes: string | null;
  document: {
    id: string;
    documentNumber: string;
    documentType: string;
    customerName: string;
    totalAmount: number;
    balanceDue: number;
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (method !== "ALL") params.append("method", method);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data);
      }
    } catch (err) {
      console.error("Error loading payments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [method, search]);

  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Payment Receipts & Collections
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Historical ledger of customer settlements, advance transfers, and outstanding clearances
            </p>
          </div>
        </div>

        {/* Stats and Totals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Collected (Filtered)
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
                  {formatCurrency(totalCollected)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600">
                <IndianRupee className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Transactions
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {payments.length}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600">
                <CreditCard className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Average Settlement
                </div>
                <div className="text-xl font-bold text-slate-800 mt-1 font-mono">
                  {payments.length > 0
                    ? formatCurrency(totalCollected / payments.length)
                    : "₹0.00"}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Receipt className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "ALL", label: "All Methods" },
                { id: "BANK_TRANSFER", label: "Bank Transfer" },
                { id: "UPI", label: "UPI" },
                { id: "CASH", label: "Cash" },
                { id: "CHEQUE", label: "Cheque" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    method === m.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search receipt #, invoice #, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer & Invoice</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Transaction Ref / Bank</TableHead>
                  <TableHead className="text-right">Amount Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                      Loading payment transactions...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                      No payment transactions recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono font-bold text-xs text-slate-900">
                        {p.paymentNumber}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {formatDate(p.paymentDate)}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-xs">
                          {p.document.customerName}
                        </div>
                        <Link
                          href={`/documents/${p.document.id}`}
                          className="text-[11px] text-cyan-600 hover:underline font-mono flex items-center gap-1 mt-0.5"
                        >
                          <span>{p.document.documentNumber}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {p.paymentMethod.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {p.transactionRef && (
                          <div className="font-mono text-slate-800">
                            {p.transactionRef}
                          </div>
                        )}
                        {p.bankName && (
                          <div className="text-[11px] text-slate-400">{p.bankName}</div>
                        )}
                        {!p.transactionRef && !p.bankName && (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-xs text-emerald-600">
                        {formatCurrency(p.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

