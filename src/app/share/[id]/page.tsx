"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  IndianRupee,
  CreditCard,
  QrCode,
  ShieldCheck,
  Building2,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  InvoiceDocument,
  InvoiceDocumentData,
} from "@/components/invoice-preview/invoice-document";
import { printInvoiceDocument } from "@/lib/print-utils";
import { exportDocumentToPdf } from "@/lib/pdf-export";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PublicShareInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        const res = await fetch(`/api/share/${params.id}`);
        const json = await res.json();
        if (!json.success || !json.data) {
          setError(json.error || "Document not found or access link expired.");
          return;
        }
        setDoc(json.data);
      } catch (err: any) {
        setError(err.message || "Failed to load document.");
      } finally {
        setLoading(false);
      }
    }
    loadDocument();
  }, [params.id]);

  const handleDownloadPdf = async () => {
    if (!doc) return;
    try {
      setDownloading(true);
      const filename = `${doc.documentNumber.replace(/[\/\\]/g, "_")}.pdf`;
      await exportDocumentToPdf("printable-invoice-sheet", filename);
    } catch (err) {
      console.error("PDF export error", err);
      printInvoiceDocument("printable-invoice-sheet");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="text-sm font-medium">Loading Ultimate Graphics Document...</span>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Document Not Available</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || "The document you are attempting to view could not be retrieved."}
          </p>
          <div className="pt-2 text-[11px] text-slate-500">
            Please contact Ultimate Graphics at{" "}
            <a
              href="mailto:billing@ultimategraphics.com"
              className="text-cyan-400 underline font-mono"
            >
              billing@ultimategraphics.com
            </a>{" "}
            for assistance.
          </div>
        </div>
      </div>
    );
  }

  // Format document data for InvoiceDocument component
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
      gstRate: Number(it.gstRate),
      isGstInclusive: it.isGstInclusive,
      taxableAmount: Number(it.taxableAmount),
      cgstAmount: Number(it.cgstAmount),
      sgstAmount: Number(it.sgstAmount),
      igstAmount: Number(it.igstAmount),
      totalTaxAmount: Number(it.totalTaxAmount),
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

  const isPaid = doc.status === "PAID";
  const balanceDue = Number(doc.balanceDue) || 0;
  const isQuotation = doc.documentType === "QUOTATION";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-text">
      {/* Top Client Portal Navigation Bar */}
      <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-md print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Brand & Document Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-slate-800 shrink-0 bg-slate-950 flex items-center justify-center">
              <Image
                src="/logos/symbol-logo.jpeg"
                alt="UG Logo"
                width={36}
                height={36}
                unoptimized
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight">
                  Ultimate Graphics
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="font-mono text-cyan-400 font-bold text-xs">
                  {doc.documentNumber}
                </span>
                <Badge
                  variant={isPaid ? "success" : "secondary"}
                  className="text-[10px] uppercase font-bold py-0"
                >
                  {doc.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400">
                Prepared for: <strong className="text-slate-200">{doc.customerName}</strong> • {formatDate(doc.issueDate)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8 bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
              onClick={() => printInvoiceDocument("printable-invoice-sheet")}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </Button>

            <Button
              size="sm"
              variant="brand"
              className="gap-1.5 text-xs h-8"
              disabled={downloading}
              onClick={handleDownloadPdf}
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{downloading ? "Generating PDF..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-start print:p-0 print:m-0 print:bg-white">
        {/* Settlement Summary Pill if Unpaid */}
        {!isQuotation && !isPaid && balanceDue > 0 && (
          <div className="max-w-3xl w-full mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-300">
                  Total Balance Outstanding
                </div>
                <div className="font-mono text-xl font-black text-cyan-400">
                  {formatCurrency(balanceDue)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Instant settlement via UPI QR code or bank transfer listed on the invoice below.</span>
            </div>
          </div>
        )}

        {/* The Official A4 Multi-Page Document Sheet */}
        <div className="w-full flex justify-center">
          <InvoiceDocument data={docData} id="printable-invoice-sheet" />
        </div>
      </main>

      {/* Public Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Official Document Portal • Ultimate Graphics</span>
          </div>
          <div>
            Need assistance? Email{" "}
            <a href="mailto:billing@ultimategraphics.com" className="text-cyan-400 underline">
              billing@ultimategraphics.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

