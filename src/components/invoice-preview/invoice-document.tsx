"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { formatCurrency, formatDate, numberToWordsINR } from "@/lib/utils";
import { CalculatedItem, TaxSummaryBreakdown } from "@/services/calculations/tax-engine";

export interface InvoiceDocumentData {
  documentType: "QUOTATION" | "PROFORMA_INVOICE" | "TAX_INVOICE";
  documentNumber: string;
  issueDate: string | Date;
  dueDate?: string | Date | null;
  validityDate?: string | Date | null;
  referenceNo?: string | null;
  projectName?: string | null;
  projectLocation?: string | null;
  siteAddress?: string | null;

  customerName: string;
  customerContactPerson?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerGstin?: string | null;
  customerBillingAddress: string;
  customerShippingAddress?: string | null;
  placeOfSupplyState: string;
  placeOfSupplyCode: string;
  isInterState: boolean;

  items: CalculatedItem[];
  subtotal: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  totalAmount: number;

  advancePercentage?: number | null;
  advanceAmount?: number | null;
  amountReceived?: number;
  balanceDue?: number;

  paymentTerms?: string | null;
  notes?: string | null;
  termsAndConditions?: string | null;

  companySnapshot?: {
    name?: string;
    legalName?: string;
    tagline?: string;
    gstin?: string;
    pan?: string;
    state?: string;
    stateCode?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    pincode?: string;
    logoUrl?: string;
    symbolLogoUrl?: string;
  } | null;

  bankSnapshot?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    branch?: string;
  } | null;

  upiSnapshot?: {
    upiId?: string;
    payeeName?: string;
    qrCodeUrl?: string;
  } | null;

  taxSummaries?: TaxSummaryBreakdown[];
}

interface InvoiceDocumentProps {
  data: InvoiceDocumentData;
  id?: string;
}

interface PageSlice {
  pageNumber: number;
  items: CalculatedItem[];
  startIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  isContinuation: boolean;
  showCommercialSummary: boolean;
}

/**
 * Calculates visual vertical weight of an item based on its length and specifications
 */
function getItemWeight(item: CalculatedItem): number {
  let weight = 36; // Base row with name, qty, unit, rate, amount
  if (item.description && item.description.trim().length > 0) {
    const chars = item.description.trim().length;
    weight += Math.max(16, Math.ceil(chars / 65) * 14);
  }
  if (item.dimensions || item.specifications) {
    weight += 18;
  }
  return weight;
}

/**
 * High-precision A4 multi-page pagination algorithm
 * Maximizes space utilization on Page 1 before overflowing to continuation sheets.
 */
function paginateInvoiceItems(items: CalculatedItem[]): PageSlice[] {
  const SINGLE_PAGE_MAX_WEIGHT = 150; // Max items weight that can fit on Page 1 alongside commercial summary
  const PAGE1_BUDGET = 620; // Full printable items budget on Page 1 when multi-page
  const CONTINUATION_BUDGET = 860; // Maximum items budget on continuation pages
  const LAST_PAGE_BUDGET_WITH_SUMMARY = 420; // Maximum items budget on the final page alongside commercial summary

  if (!items || items.length === 0) {
    return [
      {
        pageNumber: 1,
        items: [],
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
        isContinuation: false,
        showCommercialSummary: true,
      },
    ];
  }

  const weights = items.map(getItemWeight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // 1. Single Page Case: Fits completely on 1 sheet
  if (totalWeight <= SINGLE_PAGE_MAX_WEIGHT) {
    return [
      {
        pageNumber: 1,
        items,
        startIndex: 0,
        isFirstPage: true,
        isLastPage: true,
        isContinuation: false,
        showCommercialSummary: true,
      },
    ];
  }

  // 2. Multi-Page Case: Split across Page 1, Page 2, and further continuation sheets
  const pages: PageSlice[] = [];
  let currentIndex = 0;
  let pageNumber = 1;

  while (currentIndex < items.length) {
    const isFirstPage = pageNumber === 1;
    const startIndex = currentIndex;
    const pageItems: CalculatedItem[] = [];
    let accumulated = 0;

    const remainingItems = items.slice(currentIndex);
    const remainingWeight = weights.slice(currentIndex).reduce((a, b) => a + b, 0);

    // If we are on a continuation page and all remaining items fit WITH the commercial summary:
    if (!isFirstPage && remainingWeight <= LAST_PAGE_BUDGET_WITH_SUMMARY) {
      pages.push({
        pageNumber,
        items: remainingItems,
        startIndex,
        isFirstPage: false,
        isLastPage: true,
        isContinuation: true,
        showCommercialSummary: true,
      });
      break;
    }

    const budget = isFirstPage ? PAGE1_BUDGET : CONTINUATION_BUDGET;

    while (currentIndex < items.length) {
      const w = weights[currentIndex];
      const itemsLeftAfterThis = items.length - (currentIndex + 1);

      if (pageItems.length > 0 && accumulated + w > budget) {
        break;
      }

      // If multi-page, ensure we leave at least 1 item for the final summary sheet
      // so the final sheet is never an orphan sheet with zero items!
      if (itemsLeftAfterThis < 1) {
        break;
      }

      pageItems.push(items[currentIndex]);
      accumulated += w;
      currentIndex++;
    }

    const isLast = currentIndex >= items.length;
    const canFitSummary = isLast && !isFirstPage && accumulated <= LAST_PAGE_BUDGET_WITH_SUMMARY;

    pages.push({
      pageNumber,
      items: pageItems,
      startIndex,
      isFirstPage,
      isLastPage: isLast && canFitSummary,
      isContinuation: !isFirstPage,
      showCommercialSummary: canFitSummary,
    });

    pageNumber++;
  }

  // If the last page filled up to continuation budget without room for summary, add a final summary page
  const lastPage = pages[pages.length - 1];
  if (!lastPage.showCommercialSummary) {
    pages.push({
      pageNumber: pages.length + 1,
      items: [],
      startIndex: items.length,
      isFirstPage: false,
      isLastPage: true,
      isContinuation: true,
      showCommercialSummary: true,
    });
  }

  return pages;
}

export function InvoiceDocument({ data, id = "printable-invoice-sheet" }: InvoiceDocumentProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const company = data.companySnapshot || {
    name: "Ultimate Graphics",
    legalName: "Ultimate Graphics Signage & Fabrication",
    tagline: "Signage • Printing • Branding • Fabrication",
    gstin: "29AABCU9603R1ZM",
    state: "Karnataka",
    stateCode: "29",
    email: "billing@ultimategraphics.com",
    phone: "+91 98860 12345",
    website: "https://ultimategraphics.com",
    address: "Plot 42, 3rd Phase, Peenya Industrial Area",
    city: "Bengaluru",
    pincode: "560058",
    logoUrl: "/logos/main-logo-light-bg.png",
    symbolLogoUrl: "/logos/symbol-logo.jpeg",
  };

  const bank = data.bankSnapshot || {
    accountHolder: "Ultimate Graphics",
    bankName: "HDFC Bank Ltd",
    accountNumber: "50200012345678",
    ifsc: "HDFC0000142",
    branch: "Peenya Industrial Area, Bengaluru",
  };

  const upi = data.upiSnapshot || {
    upiId: "ultimategraphics@hdfcbank",
    payeeName: "Ultimate Graphics",
  };

  // Generate genuine high-resolution UPI QR Code
  useEffect(() => {
    if (upi.upiId) {
      const upiUrl = `upi://pay?pa=${encodeURIComponent(upi.upiId)}&pn=${encodeURIComponent(
        upi.payeeName || "Ultimate Graphics"
      )}&am=${encodeURIComponent(
        ((data.balanceDue ?? 0) > 0 ? data.balanceDue! : data.totalAmount).toFixed(2)
      )}&cu=INR&tn=${encodeURIComponent(data.documentNumber || "Bill Settlement")}`;

      QRCode.toDataURL(upiUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      })
        .then(setQrCodeUrl)
        .catch((e) => console.error("Error generating QR", e));
    }
  }, [upi.upiId, upi.payeeName, data.totalAmount, data.balanceDue, data.documentNumber]);

  const docTitle =
    data.documentType === "QUOTATION"
      ? "QUOTATION"
      : data.documentType === "PROFORMA_INVOICE"
      ? "PROFORMA INVOICE"
      : "TAX INVOICE";

  const isQuotation = data.documentType === "QUOTATION";
  const isTaxInvoice = data.documentType === "TAX_INVOICE";
  const isInterState = data.isInterState;

  // Compute pagination slices
  const pages = useMemo(() => paginateInvoiceItems(data.items), [data.items]);
  const totalPages = pages.length;

  return (
    <div id={id} className="print-container space-y-8 print:space-y-0">
      {pages.map((page, pIdx) => {
        const isMultiPage = totalPages > 1;

        return (
          <div
            key={pIdx}
            className="a4-sheet bg-white text-slate-900 mx-auto relative shadow-2xl print:shadow-none p-8 sm:p-10 flex flex-col justify-between font-sans leading-normal select-text"
            data-page={page.pageNumber}
          >
            {/* Signature Ultimate Graphics Gradient Top Accent Strip */}
            <div className="absolute top-0 right-0 w-80 h-2 bg-gradient-to-r from-cyan-400 via-rose-500 to-orange-400" />
            <div className="absolute top-0 left-0 w-32 h-1.5 bg-gradient-to-r from-cyan-400 to-cyan-500" />

            {/* MAIN DOCUMENT BODY */}
            <div>
              {/* =========================================================
                  PAGE 1: FULL BRAND HEADER & METADATA
                  ========================================================= */}
              {page.isFirstPage ? (
                <>
                  <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                    <div>
                      {/* Authentic Brand Header with Circular Monogram & Official High-Contrast Logo */}
                      <div className="flex items-center gap-3.5 mb-2">
                        <div className="w-12 h-12 overflow-hidden border border-slate-900 shrink-0 bg-slate-950 flex items-center justify-center">
                          <Image
                            src="/logos/symbol-logo.jpeg"
                            alt="UG Emblem"
                            width={48}
                            height={48}
                            unoptimized
                            priority
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <div className="h-9 flex items-center">
                            <Image
                              src="/logos/main-logo-light-bg.png"
                              alt="Ultimate Graphics"
                              width={180}
                              height={44}
                              unoptimized
                              priority
                              className="h-9 w-auto object-contain"
                            />
                          </div>
                          <div className="text-[9px] font-bold tracking-widest text-slate-600 uppercase mt-0.5">
                            Architectural Signage • CNC & Laser Cutting • Fleet Branding
                          </div>
                        </div>
                      </div>

                      {/* Company Legal Information */}
                      <div className="text-[11px] text-slate-600 space-y-0.5 pl-0.5">
                        <div className="font-bold text-slate-900">{company.legalName}</div>
                        <div>{company.address}, {company.city} - {company.pincode}</div>
                        <div>
                          State: <span className="font-semibold text-slate-800">{company.state}</span> (Code:{" "}
                          <span className="font-semibold text-slate-800">{company.stateCode}</span>)
                        </div>
                        <div className="flex items-center gap-3 pt-0.5">
                          <span>Tel: {company.phone}</span>
                          <span>•</span>
                          <span>{company.email}</span>
                        </div>
                        {company.gstin && (
                          <div className="pt-1 flex items-center gap-1.5 text-[11px]">
                            <span className="font-bold text-slate-900">GSTIN:</span>
                            <span className="font-mono font-bold tracking-wider text-slate-950">
                              {company.gstin}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Title & Reference Block */}
                    <div className="text-right">
                      <div className="inline-block">
                        <h1 className="text-2xl font-black tracking-wider text-slate-950 uppercase">
                          {docTitle}
                        </h1>
                        <div className="h-0.5 w-full bg-gradient-to-r from-cyan-400 via-rose-500 to-orange-400 mt-1" />
                      </div>

                      <div className="mt-3 text-xs space-y-1 font-medium">
                        <div className="flex justify-end gap-3 items-center">
                          <span className="text-slate-500">
                            {isQuotation ? "Quotation No:" : isTaxInvoice ? "Invoice No:" : "Proforma No:"}
                          </span>
                          <span className="font-mono font-bold text-slate-950 text-sm">
                            {data.documentNumber || "DRAFT"}
                          </span>
                        </div>

                        <div className="flex justify-end gap-3">
                          <span className="text-slate-500">Date:</span>
                          <span className="text-slate-900 font-semibold">
                            {formatDate(data.issueDate)}
                          </span>
                        </div>

                        {data.validityDate && (
                          <div className="flex justify-end gap-3">
                            <span className="text-slate-500">Valid Until:</span>
                            <span className="text-slate-900 font-semibold">{formatDate(data.validityDate)}</span>
                          </div>
                        )}

                        {data.dueDate && !data.validityDate && (
                          <div className="flex justify-end gap-3">
                            <span className="text-slate-500">Due Date:</span>
                            <span className="text-slate-900 font-semibold">{formatDate(data.dueDate)}</span>
                          </div>
                        )}

                        {data.referenceNo && (
                          <div className="flex justify-end gap-3">
                            <span className="text-slate-500">Ref / PO No:</span>
                            <span className="text-slate-900 font-mono font-semibold">{data.referenceNo}</span>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-0.5 text-[11px]">
                          <span className="text-slate-500">Place of Supply:</span>
                          <span className="text-slate-900 font-bold">
                            {data.placeOfSupplyState} ({data.placeOfSupplyCode})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BILLED TO / SHIPPED TO / PROJECT INFORMATION */}
                  <div className="grid grid-cols-2 gap-8 py-3 text-xs border-b border-slate-200">
                    <div className="pr-4 border-r border-slate-200">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Billed To</span>
                        {data.customerGstin && (
                          <span className="text-slate-400 font-mono text-[9px]">
                            State Code: {data.placeOfSupplyCode}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-950 text-sm">
                        {data.customerName || "Customer Name"}
                      </div>
                      {data.customerContactPerson && (
                        <div className="text-slate-700 font-medium mt-0.5">
                          Attn: {data.customerContactPerson}
                        </div>
                      )}
                      <div className="text-slate-600 mt-1 whitespace-pre-line leading-relaxed text-[11px]">
                        {data.customerBillingAddress}
                      </div>
                      <div className="text-slate-600 mt-1 flex flex-wrap gap-x-3 text-[11px]">
                        {data.customerPhone && <span>Ph: {data.customerPhone}</span>}
                        {data.customerEmail && <span>{data.customerEmail}</span>}
                      </div>
                      {data.customerGstin && (
                        <div className="mt-1.5 text-slate-900 flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-500 font-medium">GSTIN:</span>
                          <span className="font-mono font-bold tracking-wide">
                            {data.customerGstin}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pl-2">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Project Execution & Site Installation
                      </div>
                      {data.projectName ? (
                        <div className="font-bold text-slate-950 text-sm">
                          {data.projectName}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic">Signage & Branding Works</div>
                      )}

                      {data.projectLocation && (
                        <div className="text-slate-700 mt-0.5 text-[11px]">
                          <span className="text-slate-500 font-medium">Location: </span>
                          <span className="font-semibold text-slate-900">{data.projectLocation}</span>
                        </div>
                      )}

                      {data.siteAddress && (
                        <div className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                          <span className="text-slate-500 font-medium">Site Address: </span>
                          {data.siteAddress}
                        </div>
                      )}

                      {data.customerShippingAddress &&
                        data.customerShippingAddress !== data.customerBillingAddress && (
                          <div className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                            <span className="text-slate-500 font-medium">Dispatch: </span>
                            {data.customerShippingAddress}
                          </div>
                        )}
                    </div>
                  </div>
                </>
              ) : (
                /* =========================================================
                   PAGE 2+ (CONTINUATION SHEETS): RUNNING HEADER
                   ========================================================= */
                <div className="pb-3 mb-3 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden border border-slate-900 shrink-0 bg-slate-950 flex items-center justify-center">
                      <Image
                        src="/logos/symbol-logo.jpeg"
                        alt="UG Emblem"
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-slate-950 text-xs tracking-tight flex items-center gap-2">
                        <span>ULTIMATE GRAPHICS</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-slate-950 font-bold">
                          {data.documentNumber || "DRAFT"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">
                          {docTitle} (Continuation)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Client: <strong className="text-slate-700">{data.customerName}</strong>
                        {data.projectName && <span> • Project: {data.projectName}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Date: {formatDate(data.issueDate)}
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      Sheet {page.pageNumber} of {totalPages}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================
                  ITEMISED SERVICES TABLE (Current Slice)
                  ========================================================= */}
              <div className="pt-2 pb-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="py-2 pl-3 pr-2 w-8 text-center">#</th>
                      <th className="py-2 px-2">Scope of Works & Specifications</th>
                      <th className="py-2 px-2 text-center w-16">HSN/SAC</th>
                      <th className="py-2 px-2 text-center w-14">Qty</th>
                      <th className="py-2 px-2 text-center w-16">Unit</th>
                      <th className="py-2 px-2 text-right w-20">Rate (₹)</th>
                      {isTaxInvoice && (
                        <th className="py-2 px-2 text-center w-14">GST</th>
                      )}
                      <th className="py-2 pr-3 pl-2 text-right w-24">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {page.items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isTaxInvoice ? 8 : 7}
                          className="py-6 text-center text-slate-400 italic text-xs"
                        >
                          {page.isFirstPage
                            ? "No items added to this document yet."
                            : "Items continued on previous page."}
                        </td>
                      </tr>
                    ) : (
                      page.items.map((it, idx) => {
                        const globalItemIndex = page.startIndex + idx + 1;
                        return (
                          <tr key={idx} className="avoid-break align-top hover:bg-slate-50/50">
                            <td className="py-2.5 pl-3 pr-2 text-center text-slate-500 font-mono text-[11px]">
                              {globalItemIndex}
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="font-bold text-slate-950 text-[12px]">{it.name}</div>
                              {it.description && (
                                <div className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                                  {it.description}
                                </div>
                              )}
                              {(it.dimensions || it.specifications) && (
                                <div className="text-[10px] text-slate-600 mt-1 flex flex-wrap gap-x-4">
                                  {it.dimensions && (
                                    <span>
                                      <span className="font-semibold text-slate-700">Dim:</span> {it.dimensions}
                                    </span>
                                  )}
                                  {it.specifications && (
                                    <span>
                                      <span className="font-semibold text-slate-700">Specs:</span> {it.specifications}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-600">
                              {it.hsnSac || "-"}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-slate-950">
                              {it.quantity}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-600 text-[11px]">
                              {it.unit}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-900 font-medium">
                              {it.unitRate.toFixed(2)}
                            </td>
                            {isTaxInvoice && (
                              <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-700 font-semibold">
                                {it.gstRate}%
                              </td>
                            )}
                            <td className="py-2.5 pr-3 pl-2 text-right font-mono font-bold text-slate-950">
                              {it.taxableAmount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Continuation Notice at bottom of table if more items follow */}
              {!page.isLastPage && (
                <div className="mt-2 py-1.5 border-t border-b border-dashed border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    — Continued on Sheet {page.pageNumber + 1} —
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Displaying Items {page.startIndex + 1} to {page.startIndex + page.items.length} of {data.items.length}
                  </span>
                </div>
              )}

              {/* =========================================================
                  PAGE COMMERCIAL SUMMARY (Only Rendered on Last Page)
                  ========================================================= */}
              {page.showCommercialSummary && (
                <div className="mt-3 pt-3 border-t-2 border-slate-900 space-y-3 avoid-break">
                  <div className="grid grid-cols-12 gap-5">
                    {/* Left Column: Amount in Words & HSN Tax Summary */}
                    <div className="col-span-7 space-y-2.5">
                      {/* Amount in words */}
                      <div className="border-b border-slate-200 pb-2">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Total Invoice Amount in Words
                        </div>
                        <div className="font-bold text-slate-950 text-xs mt-0.5 leading-relaxed">
                          {numberToWordsINR(data.totalAmount)}
                        </div>
                      </div>

                      {/* HSN/SAC Tax Summary Table */}
                      {(isTaxInvoice || (data.taxSummaries && data.taxSummaries.length > 0)) && (
                        <div className="border border-slate-200">
                          <div className="bg-slate-100 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-800 flex justify-between border-b border-slate-200">
                            <span>GST Tax Breakdown (HSN / SAC Wise)</span>
                            <span className="font-mono text-[9px] text-slate-500">
                              {isInterState ? "Inter-State (IGST 100%)" : "Intra-State (CGST 50% + SGST 50%)"}
                            </span>
                          </div>
                          <table className="w-full text-[9px] text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                              <tr>
                                <th className="py-1 px-2 font-bold">HSN/SAC</th>
                                <th className="py-1 px-2 text-right font-bold">Taxable (₹)</th>
                                {isInterState ? (
                                   <th className="py-1 px-2 text-right font-bold">IGST (₹)</th>
                                ) : (
                                  <>
                                    <th className="py-1 px-2 text-right font-bold">CGST (₹)</th>
                                    <th className="py-1 px-2 text-right font-bold">SGST (₹)</th>
                                  </>
                                )}
                                <th className="py-1 px-2 text-right font-bold">Total Tax (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono">
                              {data.taxSummaries?.map((ts, i) => (
                                <tr key={i}>
                                  <td className="py-0.5 px-2 text-slate-800">{ts.hsnSac || "NA"} ({ts.gstRate}%)</td>
                                  <td className="py-0.5 px-2 text-right">{ts.taxableAmount.toFixed(2)}</td>
                                  {isInterState ? (
                                    <td className="py-0.5 px-2 text-right">{ts.igstAmount.toFixed(2)}</td>
                                  ) : (
                                    <>
                                      <td className="py-0.5 px-2 text-right">{ts.cgstAmount.toFixed(2)}</td>
                                      <td className="py-0.5 px-2 text-right">{ts.sgstAmount.toFixed(2)}</td>
                                    </>
                                  )}
                                  <td className="py-0.5 px-2 text-right font-bold text-slate-900">{ts.totalTax.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Commercial Financial Calculations */}
                    <div className="col-span-5 space-y-1 text-xs">
                      <div className="flex justify-between py-0.5 text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-mono font-semibold text-slate-900">{formatCurrency(data.subtotal)}</span>
                      </div>

                      {data.discountAmount > 0 && (
                        <div className="flex justify-between py-0.5 text-rose-600 font-medium">
                          <span>
                            Discount {data.discountType === "PERCENTAGE" ? `(${data.discountValue}%)` : ""}:
                          </span>
                          <span className="font-mono">-{formatCurrency(data.discountAmount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-0.5 text-slate-800 font-bold border-t border-slate-200">
                        <span>Taxable Value:</span>
                        <span className="font-mono">{formatCurrency(data.taxableAmount)}</span>
                      </div>

                      {isInterState ? (
                        <div className="flex justify-between py-0.5 text-slate-600 text-[11px]">
                          <span>Integrated GST (IGST):</span>
                          <span className="font-mono font-medium">{formatCurrency(data.igstAmount)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between py-0.5 text-slate-600 text-[11px]">
                            <span>Central GST (CGST):</span>
                            <span className="font-mono font-medium">{formatCurrency(data.cgstAmount)}</span>
                          </div>
                          <div className="flex justify-between py-0.5 text-slate-600 text-[11px]">
                            <span>State GST (SGST):</span>
                            <span className="font-mono font-medium">{formatCurrency(data.sgstAmount)}</span>
                          </div>
                        </>
                      )}

                      {data.roundOff !== 0 && (
                        <div className="flex justify-between py-0.5 text-slate-500 text-[10px]">
                          <span>Round Off:</span>
                          <span className="font-mono">
                            {data.roundOff > 0 ? `+${data.roundOff.toFixed(2)}` : data.roundOff.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Total Grand Presentation */}
                      <div className="mt-2 py-2 px-3 bg-slate-950 text-white flex justify-between items-center">
                        <span className="font-black text-xs tracking-wider uppercase">
                          Total Amount:
                        </span>
                        <span className="font-mono font-black text-base text-white">
                          {formatCurrency(data.totalAmount)}
                        </span>
                      </div>

                      {/* Advance / Balance presentation if applicable */}
                      {((data.amountReceived ?? 0) > 0 || Boolean(data.advanceAmount)) && (
                        <div className="pt-1.5 space-y-0.5 text-xs border-t border-slate-200">
                          {Boolean(data.advanceAmount) && (
                            <div className="flex justify-between text-slate-600 text-[11px]">
                              <span>Advance Required:</span>
                              <span className="font-mono font-semibold">{formatCurrency(data.advanceAmount)}</span>
                            </div>
                          )}
                          {(data.amountReceived ?? 0) > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                              <span>Amount Received:</span>
                              <span className="font-mono">{formatCurrency(data.amountReceived)}</span>
                            </div>
                          )}
                          {data.balanceDue !== undefined && (
                            <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                              <span>Balance Due:</span>
                              <span className="font-mono text-rose-600">{formatCurrency(data.balanceDue)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BANK DETAILS, UPI QR & TERMS SECTION */}
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-12 gap-4 text-xs avoid-break">
                    {/* Bank & Payment Information */}
                    <div className="col-span-8 flex gap-3.5 border border-slate-200 p-2.5">
                      {qrCodeUrl && (
                        <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-200 shrink-0">
                          <Image
                            src={qrCodeUrl}
                            alt="UPI Payment QR"
                            width={72}
                            height={72}
                            unoptimized
                            className="w-16 h-16 object-contain"
                          />
                          <div className="text-[7px] font-black text-slate-700 uppercase tracking-widest mt-0.5">
                            Scan to Pay
                          </div>
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Bank Transfer & UPI Settlement Details
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                          <div>
                            <span className="text-slate-500">Bank: </span>
                            <span className="font-bold text-slate-950">{bank.bankName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">A/C Holder: </span>
                            <span className="font-semibold text-slate-950">{bank.accountHolder}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">A/C No: </span>
                            <span className="font-mono font-bold text-slate-950">{bank.accountNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">IFSC: </span>
                            <span className="font-mono font-bold text-slate-950">{bank.ifsc}</span>
                          </div>
                          <div className="col-span-2 pt-0.5">
                            <span className="text-slate-500">Branch: </span>
                            <span className="text-slate-800">{bank.branch}</span>
                          </div>
                          {upi.upiId && (
                            <div className="col-span-2 pt-0.5 font-semibold text-slate-900">
                              <span className="text-slate-500">UPI ID: </span>
                              <span className="font-mono text-slate-950 font-bold">{upi.upiId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Authorised Signature Block */}
                    <div className="col-span-4 flex flex-col justify-between items-center text-center p-2">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        For {company.legalName}
                      </div>

                      <div className="h-10 flex items-center justify-center">
                        <div className="text-slate-300 italic text-[10px] font-serif border-b border-dashed border-slate-300 px-6 py-0.5">
                          Authorised Signatory
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-600 font-medium">
                        Authorised Representative
                      </div>
                    </div>
                  </div>

                  {/* TERMS AND CONDITIONS */}
                  <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-500 leading-relaxed avoid-break">
                    <div className="font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                      Terms & Commercial Conditions:
                    </div>
                    <div className="whitespace-pre-line text-slate-600">
                      {data.termsAndConditions ||
                        "1. Goods/Services once delivered & accepted cannot be returned.\n2. Warranty on LED modules and power supplies: 1 Year against manufacturing defects.\n3. All disputes are subject to local judicial jurisdiction."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =========================================================
                PAGE FOOTER ACCENT BAR
                ========================================================= */}
            <div className="pt-3 mt-auto border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
              <span>Ultimate Graphics • Architectural Signage, CNC Fabrication & Commercial Print</span>
              <span className="font-semibold text-slate-600">
                Sheet {page.pageNumber} of {totalPages}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
