"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Users,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface CustomerItem {
  id: string;
  companyName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  billingAddress: string;
  billingCity: string | null;
  billingState: string;
  billingStateCode: string;
  totalBilled: number;
  totalReceived: number;
  balanceDue: number;
  documentsCount: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstin: "",
    pan: "",
    billingAddress: "",
    billingCity: "",
    billingState: "Karnataka",
    billingStateCode: "29",
    billingPincode: "",
    shippingAddress: "",
    notes: "",
  });

  const fetchCustomers = async (q: string = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      }
    } catch (err) {
      console.error("Error loading customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      gstin: "",
      pan: "",
      billingAddress: "",
      billingCity: "",
      billingState: "Karnataka",
      billingStateCode: "29",
      billingPincode: "",
      shippingAddress: "",
      notes: "",
    });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (c: CustomerItem) => {
    setEditingId(c.id);
    setFormData({
      companyName: c.companyName,
      contactPerson: c.contactPerson || "",
      email: c.email || "",
      phone: c.phone || "",
      gstin: c.gstin || "",
      pan: "",
      billingAddress: c.billingAddress,
      billingCity: c.billingCity || "",
      billingState: c.billingState || "Karnataka",
      billingStateCode: c.billingStateCode || "29",
      billingPincode: "",
      shippingAddress: "",
      notes: "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save customer");
        setFormSubmitting(false);
        return;
      }

      setModalOpen(false);
      resetForm();
      fetchCustomers(search);
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive ${name}?`)) return;
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      fetchCustomers(search);
    } catch (err) {
      alert("Failed to archive customer");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Customer Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage client billing records, GSTIN classifications, and outstanding accounts
            </p>
          </div>
          <Button onClick={handleOpenAdd} variant="brand" className="gap-2 text-xs h-9">
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </Button>
        </div>

        {/* Search & Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Active Clients
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {customers.length}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Tax Billed
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(
                    customers.reduce((acc, c) => acc + c.totalBilled, 0)
                  )}
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
                  Outstanding Receivables
                </div>
                <div className="text-xl font-bold text-rose-600 mt-1">
                  {formatCurrency(
                    customers.reduce((acc, c) => acc + c.balanceDue, 0)
                  )}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600">
                <Building2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search by company name, contact person, GSTIN, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company & Contact</TableHead>
                  <TableHead>GSTIN & Location</TableHead>
                  <TableHead className="text-right">Total Billed</TableHead>
                  <TableHead className="text-right">Total Received</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-center">Docs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                      Loading customer records...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                      No customer accounts found. Click &quot;Add New Customer&quot; above to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        <div className="font-semibold text-slate-900 text-xs">
                          {c.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          {c.contactPerson && <span>{c.contactPerson}</span>}
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {c.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.gstin ? (
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">
                            {c.gstin}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Unregistered / Consumer
                          </span>
                        )}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {c.billingState} (Code: {c.billingStateCode})
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs text-slate-900">
                        {formatCurrency(c.totalBilled)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs text-emerald-600">
                        {formatCurrency(c.totalReceived)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs">
                        {c.balanceDue > 0 ? (
                          <span className="text-rose-600">
                            {formatCurrency(c.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0.00</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">
                          {c.documentsCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/documents/new?customerId=${c.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 text-[11px]"
                              title="Create Invoice/Quotation"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Bill
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-500 hover:text-slate-900"
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDelete(c.id, c.companyName)}
                            title="Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingId ? "Edit Customer Master" : "Add New Customer Account"}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Company / Client Legal Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. Prestige Estates Projects Ltd"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact Person
                    </label>
                    <Input
                      placeholder="e.g. Mr. Rajesh Sharma"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPerson: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <Input
                      placeholder="+91 98860 XXXXX"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="billing@client.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      GSTIN (15 Digits)
                    </label>
                    <Input
                      placeholder="29AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        let stateCode = formData.billingStateCode;
                        if (val.length >= 2 && !isNaN(Number(val.slice(0, 2)))) {
                          stateCode = val.slice(0, 2);
                        }
                        setFormData({
                          ...formData,
                          gstin: val,
                          billingStateCode: stateCode,
                        });
                      }}
                      className="font-mono uppercase"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Billing Address *
                    </label>
                    <Textarea
                      required
                      rows={2}
                      placeholder="Complete registered billing address"
                      value={formData.billingAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, billingAddress: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      State Name
                    </label>
                    <Input
                      placeholder="Karnataka"
                      value={formData.billingState}
                      onChange={(e) =>
                        setFormData({ ...formData, billingState: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      State Code (GST Code)
                    </label>
                    <Input
                      placeholder="29"
                      value={formData.billingStateCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingStateCode: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <Input
                      placeholder="Bengaluru"
                      value={formData.billingCity}
                      onChange={(e) =>
                        setFormData({ ...formData, billingCity: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pincode
                    </label>
                    <Input
                      placeholder="560001"
                      value={formData.billingPincode}
                      onChange={(e) =>
                        setFormData({ ...formData, billingPincode: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Shipping / Site Address (Optional)
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Installation site or warehouse delivery address"
                      value={formData.shippingAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, shippingAddress: e.target.value })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Client Notes / Terms
                    </label>
                    <Input
                      placeholder="Special commercial terms, contact notes, or delivery restrictions"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="brand" disabled={formSubmitting}>
                    {formSubmitting
                      ? "Saving Customer..."
                      : editingId
                      ? "Update Customer Master"
                      : "Save Customer Record"}
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
