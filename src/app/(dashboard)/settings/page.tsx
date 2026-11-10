"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings,
  Building2,
  Receipt,
  CreditCard,
  QrCode,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [companyForm, setCompanyForm] = useState({
    name: "Ultimate Graphics",
    legalName: "Ultimate Graphics Signage & Fabrication",
    tagline: "Signage • Printing • Branding • Fabrication",
    gstin: "29AABCU9603R1ZM",
    pan: "AABCU9603R",
    state: "Karnataka",
    stateCode: "29",
    email: "billing@ultimategraphics.com",
    phone: "+91 98860 12345",
    website: "https://ultimategraphics.com",
    address: "Plot 42, 3rd Phase, Peenya Industrial Area",
    city: "Bengaluru",
    pincode: "560058",
  });

  const [bankForm, setBankForm] = useState({
    accountHolder: "Ultimate Graphics",
    bankName: "HDFC Bank Ltd",
    accountNumber: "50200012345678",
    ifsc: "HDFC0000142",
    branch: "Peenya Industrial Area, Bengaluru",
  });

  const [upiForm, setUpiForm] = useState({
    upiId: "ultimategraphics@hdfcbank",
    payeeName: "Ultimate Graphics",
  });

  const [settingsForm, setSettingsForm] = useState({
    invoicePrefix: "UG/INV",
    quotationPrefix: "UG/QTN",
    proformaPrefix: "UG/PI",
    financialYear: "2026-27",
    defaultPaymentTerms: "50% Advance with Work Order, 50% Balance on Delivery & Installation.",
    defaultQuotationValidityDays: 30,
    defaultTerms: "1. All dimensions and site measurements are subject to final site inspection.\n2. Delivery and installation: 7-10 working days post final artwork and advance clearance.\n3. Civil work, structural load approval, and external 230V electrical feed to be arranged by the client.\n4. Quotation valid for 30 calendar days from issue date.",
    defaultNotes: "Thank you for partnering with Ultimate Graphics. 16 years of signage craftsmanship.",
    enableRoundOff: true,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const c = json.data;
          setCompanyForm({
            name: c.name,
            legalName: c.legalName,
            tagline: c.tagline || "",
            gstin: c.gstin || "",
            pan: c.pan || "",
            state: c.state,
            stateCode: c.stateCode,
            email: c.email,
            phone: c.phone,
            website: c.website || "",
            address: c.address,
            city: c.city,
            pincode: c.pincode,
          });

          if (c.bankAccounts?.[0]) {
            const b = c.bankAccounts[0];
            setBankForm({
              accountHolder: b.accountHolder,
              bankName: b.bankName,
              accountNumber: b.accountNumber,
              ifsc: b.ifsc,
              branch: b.branch || "",
            });
          }

          if (c.upiDetails?.[0]) {
            const u = c.upiDetails[0];
            setUpiForm({
              upiId: u.upiId,
              payeeName: u.payeeName,
            });
          }

          if (c.settings) {
            const s = c.settings;
            setSettingsForm({
              invoicePrefix: s.invoicePrefix,
              quotationPrefix: s.quotationPrefix,
              proformaPrefix: s.proformaPrefix,
              financialYear: s.financialYear,
              defaultPaymentTerms: s.defaultPaymentTerms || "",
              defaultQuotationValidityDays: s.defaultQuotationValidityDays,
              defaultTerms: s.defaultTerms || "",
              defaultNotes: s.defaultNotes || "",
              enableRoundOff: s.enableRoundOff,
            });
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: companyForm,
          bank: bankForm,
          upi: upiForm,
          settings: settingsForm,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setMessage({ type: "error", text: json.error || "Failed to update settings" });
      } else {
        setMessage({ type: "success", text: "Settings and company profile updated successfully." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update settings" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Company & Billing Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure company profile, GST tax details, bank account, UPI QR codes, and document numbering
            </p>
          </div>

          <Button
            onClick={handleSave}
            variant="brand"
            disabled={saving || loading}
            className="text-xs h-9 gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </Button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: BRAND IDENTITY & LOGOS */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Brand Identity & Official Assets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Official Horizontal Logo (Header & Invoices)
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Image
                      src="/logos/main-logo.png"
                      alt="Ultimate Graphics Horizontal Logo"
                      width={200}
                      height={50}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 font-mono">
                    /logos/main-logo.png
                  </span>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Official Circular Favicon / Monogram
                  </div>
                  <div className="p-2 bg-white rounded-full shadow-sm">
                    <Image
                      src="/logos/symbol-logo.jpeg"
                      alt="Ultimate Graphics Circular Monogram"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 font-mono">
                    /logos/symbol-logo.jpeg
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: COMPANY PROFILE & GST */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-600" />
                <span>Company Registration & GST Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Trading Name *
                  </label>
                  <Input
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Legal / Registered Entity Name *
                  </label>
                  <Input
                    value={companyForm.legalName}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, legalName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Business Tagline
                  </label>
                  <Input
                    value={companyForm.tagline}
                    onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GSTIN (15 Digits) *
                  </label>
                  <Input
                    value={companyForm.gstin}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        gstin: e.target.value.toUpperCase(),
                      })
                    }
                    className="font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State Name *
                  </label>
                  <Input
                    value={companyForm.state}
                    onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State Code (GST Jurisdiction Code) *
                  </label>
                  <Input
                    value={companyForm.stateCode}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, stateCode: e.target.value })
                    }
                    className="font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Registered Workshop & Office Address *
                  </label>
                  <Textarea
                    rows={2}
                    value={companyForm.address}
                    onChange={(e) =>
                      setCompanyForm({ ...companyForm, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City *
                  </label>
                  <Input
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pincode *
                  </label>
                  <Input
                    value={companyForm.pincode}
                    onChange={(e) => setCompanyForm({ ...companyForm, pincode: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Billing Phone *
                  </label>
                  <Input
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Billing Email *
                  </label>
                  <Input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 3: BANKING & UPI */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Banking Settlements & UPI Payment QR</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Holder Name *
                  </label>
                  <Input
                    value={bankForm.accountHolder}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, accountHolder: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bank Name *
                  </label>
                  <Input
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Number *
                  </label>
                  <Input
                    value={bankForm.accountNumber}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, accountNumber: e.target.value })
                    }
                    className="font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    IFSC Code *
                  </label>
                  <Input
                    value={bankForm.ifsc}
                    onChange={(e) =>
                      setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })
                    }
                    className="font-mono uppercase font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch Name & Location
                  </label>
                  <Input
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Business UPI ID *
                  </label>
                  <Input
                    value={upiForm.upiId}
                    onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                    className="font-mono font-bold text-cyan-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    UPI Payee Name
                  </label>
                  <Input
                    value={upiForm.payeeName}
                    onChange={(e) => setUpiForm({ ...upiForm, payeeName: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: DOCUMENT PREFIXES & NUMBERING */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-600" />
                <span>Document Numbering Sequences & Default Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quotation Prefix
                  </label>
                  <Input
                    value={settingsForm.quotationPrefix}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        quotationPrefix: e.target.value.toUpperCase(),
                      })
                    }
                    className="font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Proforma Prefix
                  </label>
                  <Input
                    value={settingsForm.proformaPrefix}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        proformaPrefix: e.target.value.toUpperCase(),
                      })
                    }
                    className="font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tax Invoice Prefix
                  </label>
                  <Input
                    value={settingsForm.invoicePrefix}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        invoicePrefix: e.target.value.toUpperCase(),
                      })
                    }
                    className="font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Financial Year
                  </label>
                  <Input
                    value={settingsForm.financialYear}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        financialYear: e.target.value,
                      })
                    }
                    className="font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Payment Terms
                  </label>
                  <Input
                    value={settingsForm.defaultPaymentTerms}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        defaultPaymentTerms: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Terms & Commercial Conditions
                  </label>
                  <Textarea
                    rows={4}
                    value={settingsForm.defaultTerms}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        defaultTerms: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}
