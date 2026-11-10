"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Printer,
  Edit2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Ban,
  Share2,
  Lock,
  Layers,
  ChevronRight,
  IndianRupee,
  Calendar,
  X,
  AlertCircle,
} from "lucide-react";
import {
  InvoiceDocument,
  InvoiceDocumentData,
} from "@/components/invoice-preview/invoice-document";
import { PreviewControls } from "@/components/invoice-preview/preview-controls";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(0.9);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [bankName, setBankName] = useState<string>("HDFC Bank");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchDoc = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setDoc(json.data);
        setPaymentAmount(Number(json.data.balanceDue) || 0);
      }
    } catch (err) {
      console.error("Error loading document", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [params.id]);

  const handleFinalize = async () => {
    if (!confirm("Finalize and issue this document? This will lock it from silent modifications.")) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/documents/${params.id}/finalize`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        fetchDoc();
      }
    } catch (err) {
      alert("Failed to finalize document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async (targetType: string) => {
    if (
      !confirm(
        `Convert this ${doc.documentType.replace(/_/g, " ")} to a new ${targetType.replace(/_/g, " ")}?`
      )
    )
      return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/documents/${params.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/documents/${json.data.id}`);
      } else {
        alert(json.error || "Failed to convert document");
      }
    } catch (err: any) {
      alert(err.message || "Failed to convert document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel this document? This marks it as cancelled in all reports.")) return;
    try {
      setActionLoading(true);
      await fetch(`/api/documents/${params.id}/cancel`, { method: "POST" });
      fetchDoc();
    } catch {
      alert("Failed to cancel document");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (paymentAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }

    try {
      const res = await fetch(`/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc.id,
          amount: paymentAmount,
          paymentMethod,
          transactionRef: transactionRef || null,
          bankName: bankName || null,
          notes: paymentNotes || null,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setPaymentError(json.error || "Failed to record payment");
        return;
      }

      setPaymentModalOpen(false);
      fetchDoc();
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment");
    }
  };

  if (loading || !doc) {
    return (
      <AppShell>
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          Loading document details...
        </div>
      </AppShell>
    );
  }

  // Construct document data model
  const docData: InvoiceDocumentData = {
    documentType: doc.documentType,
    documentNumber: doc.documentNumber,
    issueDate: doc.issueDate,
    dueDate: doc.dueDate,
    validityDate: doc.validityDate,
    referenceNo: doc.referenceNo,
    projectName: doc.projectName,
    projectLocation: doc.projectLocation,
    siteAddress: doc.siteAddress,

    customerName: doc.customerName,
    customerContactPerson: doc.customerContactPerson,
    customerEmail: doc.customerEmail,
    customerPhone: doc.customerPhone,
    customerGstin: doc.customerGstin,
    customerBillingAddress: doc.customerBillingAddress,
    customerShippingAddress: doc.customerShippingAddress,
    placeOfSupplyState: doc.placeOfSupplyState,
    placeOfSupplyCode: doc.placeOfSupplyCode,
    isInterState: doc.isInterState,

    items: doc.items.map((it: any) => ({
      name: it.name,
      description: it.description,
      hsnSac: it.hsnSac,
      unit: it.unit,
      dimensions: it.dimensions,
      specifications: it.specifications,
      quantity: Number(it.quantity),
      unitRate: Number(it.unitRate),
      discountType: it.discountType,
      discountValue: Number(it.discountValue),
      discountAmount: Number(it.discountAmount),
      grossAmount: Number(it.quantity) * Number(it.unitRate),
      taxableAmount: Number(it.taxableAmount),
      gstRate: Number(it.gstRate),
      isGstInclusive: it.isGstInclusive,
      cgstRate: Number(it.cgstRate),
      cgstAmount: Number(it.cgstAmount),
      sgstRate: Number(it.sgstRate),
      sgstAmount: Number(it.sgstAmount),
      igstRate: Number(it.igstRate),
      igstAmount: Number(it.igstAmount),
      totalTax: Number(it.totalTax),
      finalAmount: Number(it.finalAmount),
    })),

    subtotal: Number(doc.subtotal),
    discountType: doc.discountType,
    discountValue: Number(doc.discountValue),
    discountAmount: Number(doc.discountAmount),
    taxableAmount: Number(doc.taxableAmount),
    cgstAmount: Number(doc.cgstAmount),
    sgstAmount: Number(doc.sgstAmount),
    igstAmount: Number(doc.igstAmount),
    totalTaxAmount: Number(doc.totalTaxAmount),
    roundOff: Number(doc.roundOff),
    totalAmount: Number(doc.totalAmount),

    advancePercentage: doc.advancePercentage ? Number(doc.advancePercentage) : null,
    advanceAmount: doc.advanceAmount ? Number(doc.advanceAmount) : null,
    amountReceived: Number(doc.amountReceived),
    balanceDue: Number(doc.balanceDue),

    paymentTerms: doc.paymentTerms,
    notes: doc.notes,
    termsAndConditions: doc.termsAndConditions,

    companySnapshot: doc.companySnapshot,
    bankSnapshot: doc.bankSnapshot,
    upiSnapshot: doc.upiSnapshot,

    taxSummaries: doc.taxSummaries?.map((ts: any) => ({
      hsnSac: ts.hsnSac,
      gstRate: Number(ts.gstRate),
      taxableAmount: Number(ts.taxableAmount),
      cgstAmount: Number(ts.cgstAmount),
      sgstAmount: Number(ts.sgstAmount),
      igstAmount: Number(ts.igstAmount),
      totalTax: Number(ts.totalTax),
    })),
  };

  const isDraft = doc.status === "DRAFT";
  const isQuotation = doc.documentType === "QUOTATION";
  const isProforma = doc.documentType === "PROFORMA_INVOICE";
  const isTaxInvoice = doc.documentType === "TAX_INVOICE";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Action & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link href="/documents">
              <Button size="icon" variant="outline" className="h-9 w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-mono text-slate-900">
                  {doc.documentNumber}
                </h1>
                <Badge
                  variant={doc.status === "PAID" ? "success" : "secondary"}
                  className="text-xs uppercase"
                >
                  {doc.status.replace(/_/g, " ")}
                </Badge>
                {doc.isLocked && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {doc.customerName} • {formatDate(doc.issueDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!doc.isLocked && (
              <Link href={`/documents/${doc.id}/edit`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              </Link>
            )}

            {isDraft && (
              <Button
                size="sm"
                variant="brand"
                onClick={handleFinalize}
                disabled={actionLoading}
                className="gap-1.5 text-xs h-8"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Finalize & Issue</span>
              </Button>
            )}

            {/* Document Conversion Workflows */}
            {isQuotation && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConvert("PROFORMA_INVOICE")}
                  disabled={actionLoading}
                  className="gap-1.5 text-xs h-8 text-amber-700 hover:bg-amber-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Convert to Proforma</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConvert("TAX_INVOICE")}
                  disabled={actionLoading}
                  className="gap-1.5 text-xs h-8 text-emerald-700 hover:bg-emerald-50"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Convert to Tax Invoice</span>
                </Button>
              </>
            )}

            {isProforma && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConvert("TAX_INVOICE")}
                disabled={actionLoading}
                className="gap-1.5 text-xs h-8 text-emerald-700 hover:bg-emerald-50"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Convert to GST Tax Invoice</span>
              </Button>
            )}

            {/* Record Payment Button */}
            {!isQuotation && doc.status !== "CANCELLED" && Number(doc.balanceDue) > 0 && (
              <Button
                size="sm"
                variant="brand"
                onClick={() => setPaymentModalOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
              className="gap-1.5 text-xs h-8"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </Button>

            {doc.status !== "CANCELLED" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs h-8"
              >
                <Ban className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Audit Lineage Cards (if converted) */}
        {(doc.convertedFromId || doc.convertedToId) && (
          <div className="p-3 bg-cyan-50/60 border border-cyan-200 rounded-lg text-xs flex items-center justify-between text-cyan-950">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              {doc.convertedFromId && (
                <span>
                  Converted from:{" "}
                  <Link
                    href={`/documents/${doc.convertedFromId}`}
                    className="font-bold underline ml-1"
                  >
                    Original Document
                  </Link>
                </span>
              )}
              {doc.convertedToId && (
                <span>
                  Converted into:{" "}
                  <Link
                    href={`/documents/${doc.convertedToId}`}
                    className="font-bold underline ml-1"
                  >
                    Target Document
                  </Link>
                </span>
              )}
            </div>
            <span className="text-[10px] text-cyan-700 font-mono">
              Audit lineage preserved
            </span>
          </div>
        )}

        {/* Payment History Ledger (if any) */}
        {doc.payments?.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Payment Receipts Recorded Against this Invoice</span>
                </div>
                <div className="text-xs font-semibold text-emerald-600 font-mono">
                  Total Collected: {formatCurrency(doc.amountReceived)}
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {doc.payments.map((p: any) => (
                  <div key={p.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-800">
                        {p.paymentNumber}
                      </span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-600">{formatDate(p.paymentDate)}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="font-semibold text-slate-700">
                        {p.paymentMethod.replace(/_/g, " ")}
                      </span>
                      {p.transactionRef && (
                        <span className="text-slate-500 ml-2 font-mono text-[11px]">
                          (Ref: {p.transactionRef})
                        </span>
                      )}
                    </div>
                    <div className="font-mono font-bold text-emerald-600">
                      {formatCurrency(p.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document A4 Preview Canvas */}
        <div className="bg-slate-200/70 p-4 sm:p-8 rounded-xl flex flex-col items-center justify-center print:bg-white print:p-0">
          <PreviewControls
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            onResetZoom={() => setZoom(0.9)}
            onPrint={() => window.print()}
            title={`${doc.documentType}: ${doc.documentNumber}`}
          />

          <div
            className="transition-transform origin-top print:transform-none mt-4"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="print-container">
              <InvoiceDocument data={docData} />
            </div>
          </div>
        </div>

        {/* Record Payment Modal */}
        {paymentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-xs">
                    Record Payment: {doc.documentNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-5 space-y-3 text-xs">
                {paymentError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-600 text-xs">
                    {paymentError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Invoice Total & Balance Due
                  </label>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex justify-between font-mono">
                    <span>Total: {formatCurrency(doc.totalAmount)}</span>
                    <span className="font-bold text-rose-600">
                      Balance: {formatCurrency(doc.balanceDue)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Payment Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={Number(doc.balanceDue)}
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="font-mono font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Payment Method *
                    </label>
                    <select
                      className="w-full h-9 border border-slate-300 rounded text-xs px-2 bg-white"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Receiving Bank
                    </label>
                    <Input
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    UTR / Cheque / Transaction Ref
                  </label>
                  <Input
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UTR123456789 or Cheque #4421"
                    className="font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Notes / Remarks
                  </label>
                  <Input
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Advance or milestone payment remarks"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPaymentModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="brand">
                    Confirm & Record Payment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
