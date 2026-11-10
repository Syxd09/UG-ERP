"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Copy,
  Save,
  CheckCircle,
  FileCheck2,
  FileSpreadsheet,
  Receipt,
  Search,
  Building2,
  Sparkles,
  ArrowRight,
  Layers,
  Percent,
} from "lucide-react";
import {
  calculateDocumentFinancials,
  ItemCalculationInput,
} from "@/services/calculations/tax-engine";
import {
  InvoiceDocument,
  InvoiceDocumentData,
} from "@/components/invoice-preview/invoice-document";
import { PreviewControls } from "@/components/invoice-preview/preview-controls";
import { printInvoiceDocument } from "@/lib/print-utils";

interface CustomerOption {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  billingAddress: string;
  billingState: string;
  billingStateCode: string;
  shippingAddress: string | null;
}

interface CatalogueOption {
  id: string;
  name: string;
  category: string;
  description: string | null;
  hsnSac: string | null;
  unit: string;
  defaultRate: number;
  defaultGstRate: number;
}

interface ItemState extends ItemCalculationInput {
  id?: string;
}

interface DocumentEditorProps {
  initialData?: any;
  defaultDocType?: "QUOTATION" | "PROFORMA_INVOICE" | "TAX_INVOICE";
  preselectedCustomerId?: string;
}

export function DocumentEditor({
  initialData,
  defaultDocType = "QUOTATION",
  preselectedCustomerId,
}: DocumentEditorProps) {
  const router = useRouter();

  // Document metadata state
  const [docType, setDocType] = useState<"QUOTATION" | "PROFORMA_INVOICE" | "TAX_INVOICE">(
    initialData?.documentType || defaultDocType
  );
  const [documentNumber, setDocumentNumber] = useState<string>(
    initialData?.documentNumber || ""
  );
  const [issueDate, setIssueDate] = useState<string>(
    initialData?.issueDate
      ? new Date(initialData.issueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [validityDate, setValidityDate] = useState<string>(
    initialData?.validityDate
      ? new Date(initialData.validityDate).toISOString().split("T")[0]
      : ""
  );
  const [referenceNo, setReferenceNo] = useState<string>(
    initialData?.referenceNo || ""
  );
  const [projectName, setProjectName] = useState<string>(
    initialData?.projectName || ""
  );
  const [projectLocation, setProjectLocation] = useState<string>(
    initialData?.projectLocation || ""
  );
  const [siteAddress, setSiteAddress] = useState<string>(
    initialData?.siteAddress || ""
  );

  // Customer state
  const [customerId, setCustomerId] = useState<string>(
    initialData?.customerId || preselectedCustomerId || ""
  );
  const [customerName, setCustomerName] = useState<string>(
    initialData?.customerName || ""
  );
  const [customerContactPerson, setCustomerContactPerson] = useState<string>(
    initialData?.customerContactPerson || ""
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    initialData?.customerEmail || ""
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialData?.customerPhone || ""
  );
  const [customerGstin, setCustomerGstin] = useState<string>(
    initialData?.customerGstin || ""
  );
  const [customerBillingAddress, setCustomerBillingAddress] = useState<string>(
    initialData?.customerBillingAddress || ""
  );
  const [customerShippingAddress, setCustomerShippingAddress] = useState<string>(
    initialData?.customerShippingAddress || ""
  );
  const [placeOfSupplyState, setPlaceOfSupplyState] = useState<string>(
    initialData?.placeOfSupplyState || "Karnataka"
  );
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState<string>(
    initialData?.placeOfSupplyCode || "29"
  );

  // Discount & terms
  const [docDiscountType, setDocDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    initialData?.discountType || "PERCENTAGE"
  );
  const [docDiscountValue, setDocDiscountValue] = useState<number>(
    initialData?.discountValue ? Number(initialData.discountValue) : 0
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialData?.paymentTerms ||
      "50% Advance with Work Order, 50% Balance on Delivery & Installation."
  );
  const [notes, setNotes] = useState<string>(
    initialData?.notes ||
      "Thank you for choosing Ultimate Graphics. 16 years of signage & fabrication craftsmanship."
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    initialData?.termsAndConditions ||
      "1. Delivery and installation: 7-10 working days from approval and advance.\n2. Civil and electrical connections at site to be provided by client.\n3. Quotation valid for 30 calendar days from issue date."
  );

  // Items State
  const [items, setItems] = useState<ItemState[]>(
    initialData?.items?.length
      ? initialData.items.map((it: any) => ({
          name: it.name,
          description: it.description || "",
          hsnSac: it.hsnSac || "",
          unit: it.unit || "Nos",
          dimensions: it.dimensions || "",
          specifications: it.specifications || "",
          quantity: Number(it.quantity) || 1,
          unitRate: Number(it.unitRate) || 0,
          discountType: it.discountType || "PERCENTAGE",
          discountValue: Number(it.discountValue) || 0,
          gstRate: Number(it.gstRate) || 18,
          isGstInclusive: it.isGstInclusive || false,
        }))
      : [
          {
            name: "3D Illuminated Channel Letters",
            description: "High-grade aluminium returns with Samsung LED lighting and Meanwell power supply",
            hsnSac: "940540",
            unit: "Running ft.",
            dimensions: "12 ft length x 2 ft letter height",
            specifications: "Cast acrylic face, 12V waterproof modules",
            quantity: 12,
            unitRate: 1250,
            discountType: "PERCENTAGE",
            discountValue: 0,
            gstRate: 18,
            isGstInclusive: false,
          },
        ]
  );

  // Master options
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [catalogueList, setCatalogueList] = useState<CatalogueOption[]>([]);
  const [zoom, setZoom] = useState(0.85);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch customers and catalogue options
  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomersList(data.data);
          if (preselectedCustomerId) {
            const found = data.data.find((c: CustomerOption) => c.id === preselectedCustomerId);
            if (found) selectCustomer(found);
          }
        }
      });

    fetch("/api/products-services")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCatalogueList(data.data);
      });
  }, [preselectedCustomerId]);

  const selectCustomer = (cust: CustomerOption) => {
    setCustomerId(cust.id);
    setCustomerName(cust.companyName);
    setCustomerContactPerson(cust.contactPerson || "");
    setCustomerEmail(cust.email || "");
    setCustomerPhone(cust.phone || "");
    setCustomerGstin(cust.gstin || "");
    setCustomerBillingAddress(cust.billingAddress || "");
    setCustomerShippingAddress(cust.shippingAddress || cust.billingAddress || "");
    setPlaceOfSupplyState(cust.billingState || "Karnataka");
    setPlaceOfSupplyCode(cust.billingStateCode || "29");
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        name: "",
        description: "",
        hsnSac: "831000",
        unit: "Nos",
        dimensions: "",
        specifications: "",
        quantity: 1,
        unitRate: 0,
        discountType: "PERCENTAGE",
        discountValue: 0,
        gstRate: 18,
        isGstInclusive: false,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const duplicateItem = (index: number) => {
    const itemToDup = items[index];
    const newItems = [...items];
    newItems.splice(index + 1, 0, { ...itemToDup });
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof ItemState, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const populateFromCatalogue = (index: number, serviceId: string) => {
    const service = catalogueList.find((s) => s.id === serviceId);
    if (!service) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      name: service.name,
      description: service.description || "",
      hsnSac: service.hsnSac || "",
      unit: service.unit,
      unitRate: Number(service.defaultRate),
      gstRate: Number(service.defaultGstRate),
    };
    setItems(updated);
  };

  // Real-time calculation using pure GST calculation engine
  const calcResult = useMemo(() => {
    return calculateDocumentFinancials({
      supplierStateCode: "29", // Ultimate Graphics Karnataka
      placeOfSupplyStateCode: placeOfSupplyCode || "29",
      items,
      documentDiscountType: docDiscountType,
      documentDiscountValue: docDiscountValue,
      enableRoundOff: true,
    });
  }, [items, placeOfSupplyCode, docDiscountType, docDiscountValue]);

  // Construct Document Data Model for Real-Time Live Preview
  const previewData: InvoiceDocumentData = useMemo(() => {
    return {
      documentType: docType,
      documentNumber: documentNumber || `UG/${docType === "QUOTATION" ? "QTN" : docType === "PROFORMA_INVOICE" ? "PI" : "INV"}/PREVIEW`,
      issueDate: new Date(issueDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      validityDate: validityDate ? new Date(validityDate) : null,
      referenceNo,
      projectName,
      projectLocation,
      siteAddress,

      customerName: customerName || "Client Business Name",
      customerContactPerson,
      customerEmail,
      customerPhone,
      customerGstin,
      customerBillingAddress: customerBillingAddress || "Client Billing Address Line 1\nCity, State - Pincode",
      customerShippingAddress,
      placeOfSupplyState,
      placeOfSupplyCode,
      isInterState: calcResult.isInterState,

      items: calcResult.items,
      subtotal: calcResult.subtotal,
      discountType: docDiscountType,
      discountValue: docDiscountValue,
      discountAmount: calcResult.documentDiscountAmount,
      taxableAmount: calcResult.totalTaxableAmount,
      cgstAmount: calcResult.totalCgstAmount,
      sgstAmount: calcResult.totalSgstAmount,
      igstAmount: calcResult.totalIgstAmount,
      totalTaxAmount: calcResult.totalTaxAmount,
      roundOff: calcResult.roundOff,
      totalAmount: calcResult.totalAmount,

      paymentTerms,
      notes,
      termsAndConditions,
      taxSummaries: calcResult.taxSummaries,
    };
  }, [
    docType,
    documentNumber,
    issueDate,
    dueDate,
    validityDate,
    referenceNo,
    projectName,
    projectLocation,
    siteAddress,
    customerName,
    customerContactPerson,
    customerEmail,
    customerPhone,
    customerGstin,
    customerBillingAddress,
    customerShippingAddress,
    placeOfSupplyState,
    placeOfSupplyCode,
    calcResult,
    docDiscountType,
    docDiscountValue,
    paymentTerms,
    notes,
    termsAndConditions,
  ]);

  const handleSave = async (status: "DRAFT" | "ISSUED") => {
    setSubmitting(true);
    setErrorMessage(null);

    if (!customerName.trim() || !customerBillingAddress.trim()) {
      setErrorMessage("Please select or enter the customer name and billing address.");
      setSubmitting(false);
      return;
    }

    const payload = {
      documentType: docType,
      documentNumber: documentNumber.trim() || undefined,
      status,
      issueDate,
      dueDate: dueDate || null,
      validityDate: validityDate || null,
      referenceNo: referenceNo || null,
      projectName: projectName || null,
      projectLocation: projectLocation || null,
      siteAddress: siteAddress || null,

      customerId: customerId || null,
      customerName,
      customerContactPerson: customerContactPerson || null,
      customerEmail: customerEmail || null,
      customerPhone: customerPhone || null,
      customerGstin: customerGstin || null,
      customerBillingAddress,
      customerShippingAddress: customerShippingAddress || null,
      placeOfSupplyState,
      placeOfSupplyCode,

      discountType: docDiscountType,
      discountValue: docDiscountValue,

      paymentTerms,
      notes,
      termsAndConditions,

      items: items.map((it, idx) => ({
        name: it.name,
        description: it.description || null,
        hsnSac: it.hsnSac || null,
        unit: it.unit,
        dimensions: it.dimensions || null,
        specifications: it.specifications || null,
        quantity: Number(it.quantity) || 1,
        unitRate: Number(it.unitRate) || 0,
        discountType: it.discountType,
        discountValue: Number(it.discountValue) || 0,
        gstRate: Number(it.gstRate) || 18,
        isGstInclusive: it.isGstInclusive || false,
        sortOrder: idx,
      })),
    };

    try {
      const url = initialData?.id ? `/api/documents/${initialData.id}` : "/api/documents";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMessage(json.error || "Failed to save document");
        setSubmitting(false);
        return;
      }

      router.push(`/documents/${json.data.id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save document");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    printInvoiceDocument("printable-invoice-sheet");
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-slate-100 print:h-auto print:overflow-visible print:bg-white">
      {/* ========================================================
          LEFT SIDE: DOCUMENT EDITOR PANEL (Scrollable)
      ======================================================== */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto p-4 sm:p-6 border-r border-slate-200 bg-white editor-panel print:hidden">
        <div className="space-y-6 max-w-2xl mx-auto pb-16">
          {/* Top Document Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Document Workspace
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {calcResult.isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {initialData?.id ? `Edit ${docType}` : `Create New ${docType}`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave("DRAFT")}
                disabled={submitting}
                className="gap-1.5 text-xs h-8"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Save Draft</span>
              </Button>
              <Button
                variant="brand"
                size="sm"
                onClick={() => handleSave("ISSUED")}
                disabled={submitting}
                className="gap-1.5 text-xs h-8"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Finalize & Issue</span>
              </Button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-600 text-xs">
              {errorMessage}
            </div>
          )}

          {/* SECTION A: DOCUMENT TYPE & DETAILS */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600" />
                <span>A. Document Specifications</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDocType("QUOTATION")}
                  className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                    docType === "QUOTATION"
                      ? "border-cyan-500 bg-cyan-50/50 text-cyan-900 ring-1 ring-cyan-500"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 mb-1 text-cyan-600" />
                  <span className="font-bold">Quotation</span>
                  <span className="text-[10px] text-slate-500">Price Estimate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType("PROFORMA_INVOICE")}
                  className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                    docType === "PROFORMA_INVOICE"
                      ? "border-amber-500 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 mb-1 text-amber-600" />
                  <span className="font-bold">Proforma</span>
                  <span className="text-[10px] text-slate-500">Advance Request</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType("TAX_INVOICE")}
                  className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                    docType === "TAX_INVOICE"
                      ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-1 ring-emerald-500"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <Receipt className="w-4 h-4 mb-1 text-emerald-600" />
                  <span className="font-bold">GST Tax Invoice</span>
                  <span className="text-[10px] text-slate-500">Final Bill</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Document Number (Auto or Custom)
                  </label>
                  <Input
                    placeholder="Auto-generated upon save"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Issue Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {docType === "QUOTATION" ? (
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Validity Date
                    </label>
                    <Input
                      type="date"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Client PO / Work Order Reference
                  </label>
                  <Input
                    placeholder="e.g. PO-2026-9921"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Project Name
                  </label>
                  <Input
                    placeholder="e.g. Prestige Tech Park Wayfinding Signage"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION B: CUSTOMER INFORMATION */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-600" />
                  <span>B. Customer & Place of Supply</span>
                </div>
                {customersList.length > 0 && (
                  <div className="w-60">
                    <select
                      className="w-full h-8 px-2 border border-slate-300 rounded text-xs bg-slate-50 font-medium text-slate-800"
                      value={customerId}
                      onChange={(e) => {
                        const sel = customersList.find((c) => c.id === e.target.value);
                        if (sel) selectCustomer(sel);
                      }}
                    >
                      <option value="">-- Choose Existing Customer --</option>
                      {customersList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Client / Company Legal Name *
                  </label>
                  <Input
                    required
                    placeholder="Company Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Client GSTIN (15 Digits)
                  </label>
                  <Input
                    placeholder="29AAAAA0000A1Z5"
                    value={customerGstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      let sCode = placeOfSupplyCode;
                      if (val.length >= 2 && !isNaN(Number(val.slice(0, 2)))) {
                        sCode = val.slice(0, 2);
                      }
                      setCustomerGstin(val);
                      setPlaceOfSupplyCode(sCode);
                    }}
                    className="text-xs font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Contact Person Name
                  </label>
                  <Input
                    placeholder="Attn: Mr. Rajesh"
                    value={customerContactPerson}
                    onChange={(e) => setCustomerContactPerson(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Phone Number
                  </label>
                  <Input
                    placeholder="+91 98860 XXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">
                    Registered Billing Address *
                  </label>
                  <Textarea
                    required
                    rows={2}
                    placeholder="Full street address, city, state and pincode"
                    value={customerBillingAddress}
                    onChange={(e) => setCustomerBillingAddress(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Place of Supply (State Name)
                  </label>
                  <Input
                    placeholder="Karnataka"
                    value={placeOfSupplyState}
                    onChange={(e) => setPlaceOfSupplyState(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Place of Supply (State Code) *
                  </label>
                  <Input
                    placeholder="29"
                    value={placeOfSupplyCode}
                    onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
                    className="text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION C: ITEMS & SERVICES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>C. Line Items & Signage Works ({items.length})</span>
              </div>
              <Button
                type="button"
                onClick={addItem}
                variant="brand"
                size="sm"
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={index} className="border-slate-200 shadow-sm relative group">
                <CardContent className="p-4 space-y-3 text-xs">
                  {/* Item Quick Catalogue Selector & Controls */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </span>
                      {catalogueList.length > 0 && (
                        <select
                          className="h-7 px-2 border border-slate-300 rounded text-[11px] bg-slate-50 text-slate-700 max-w-xs"
                          onChange={(e) => populateFromCatalogue(index, e.target.value)}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            -- Choose from Catalogue --
                          </option>
                          {catalogueList.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              [{cat.category}] {cat.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-slate-700"
                        onClick={() => duplicateItem(index)}
                        title="Duplicate line item"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => removeItem(index)}
                        disabled={items.length <= 1}
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Description, Specs & Dimensions */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-slate-600 font-medium mb-1">
                        Service / Item Title *
                      </label>
                      <Input
                        required
                        placeholder="e.g. 3D Illuminated Channel Letters"
                        value={item.name}
                        onChange={(e) => updateItem(index, "name", e.target.value)}
                        className="text-xs font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-slate-600 font-medium mb-1">
                        HSN / SAC Code
                      </label>
                      <Input
                        placeholder="831000 / 998399"
                        value={item.hsnSac || ""}
                        onChange={(e) => updateItem(index, "hsnSac", e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-12">
                      <label className="block text-slate-600 font-medium mb-1">
                        Detailed Description & Scope
                      </label>
                      <Textarea
                        rows={1}
                        placeholder="Technical description of works"
                        value={item.description || ""}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-slate-600 font-medium mb-1">
                        Dimensions
                      </label>
                      <Input
                        placeholder="e.g. 10 ft x 3 ft (30 Sq.ft.)"
                        value={item.dimensions || ""}
                        onChange={(e) => updateItem(index, "dimensions", e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label className="block text-slate-600 font-medium mb-1">
                        Specifications & Materials
                      </label>
                      <Input
                        placeholder="e.g. 3mm ACP, Cast Acrylic, Samsung LED"
                        value={item.specifications || ""}
                        onChange={(e) => updateItem(index, "specifications", e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Quantity, Rate, Unit, GST & Line Financials */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Quantity *
                      </label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="text-xs font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Unit
                      </label>
                      <select
                        className="w-full h-9 border border-slate-300 rounded text-xs bg-white px-2"
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                      >
                        <option value="Nos">Nos</option>
                        <option value="Sq. ft.">Sq. ft.</option>
                        <option value="Sq. m.">Sq. m.</option>
                        <option value="Running ft.">Running ft.</option>
                        <option value="Running m.">Running m.</option>
                        <option value="Kg">Kg</option>
                        <option value="Set">Set</option>
                        <option value="Hours">Hours</option>
                        <option value="Lot">Lot</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Rate (₹) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={item.unitRate}
                        onChange={(e) =>
                          updateItem(index, "unitRate", parseFloat(e.target.value) || 0)
                        }
                        className="text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        GST Rate (%)
                      </label>
                      <select
                        className="w-full h-9 border border-slate-300 rounded text-xs bg-white px-2 font-mono font-bold"
                        value={item.gstRate}
                        onChange={(e) =>
                          updateItem(index, "gstRate", parseFloat(e.target.value) || 0)
                        }
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Line Discount (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountValue}
                        onChange={(e) =>
                          updateItem(index, "discountValue", parseFloat(e.target.value) || 0)
                        }
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* SECTION D: COMMERCIAL TERMS & DOCUMENT DISCOUNT */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                <Percent className="w-4 h-4 text-cyan-600" />
                <span>D. Document Discount & Commercial Terms</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Overall Document Discount
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="w-32 h-9 border border-slate-300 rounded text-xs bg-white px-2"
                      value={docDiscountType}
                      onChange={(e) => setDocDiscountType(e.target.value as any)}
                    >
                      <option value="PERCENTAGE">Percent (%)</option>
                      <option value="FIXED">Fixed (₹)</option>
                    </select>
                    <Input
                      type="number"
                      min="0"
                      value={docDiscountValue}
                      onChange={(e) => setDocDiscountValue(parseFloat(e.target.value) || 0)}
                      className="text-xs font-mono font-bold flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Payment Terms
                  </label>
                  <Input
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 50% Advance with PO, 50% on Delivery"
                    className="text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">
                    Terms & Conditions
                  </label>
                  <Textarea
                    rows={3}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================
          RIGHT SIDE: REAL-TIME LIVE A4 PREVIEW PANEL
      ======================================================== */}
      <div className="w-full lg:w-1/2 h-full flex flex-col bg-slate-200/70 overflow-hidden print:w-full print:h-auto print:bg-white print:overflow-visible">
        {/* Preview Toolbar */}
        <PreviewControls
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(1.5, z + 0.1))}
          onZoomOut={() => setZoom((z) => Math.max(0.4, z - 0.1))}
          onResetZoom={() => setZoom(0.85)}
          onPrint={handlePrint}
          title={`${docType.replace(/_/g, " ")}: ${customerName || "Untitled"}`}
          documentNumber={documentNumber || `${docType}_preview`}
        />

        {/* Live A4 Canvas Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start print:p-0 print:m-0 print:overflow-visible print:w-full">
          <div
            className="transition-transform origin-top print:!transform-none print:m-0 print:p-0"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="print-container">
              <InvoiceDocument data={previewData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

