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
  Package,
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Tag,
  Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  hsnSac: string | null;
  unit: string;
  defaultRate: number;
  defaultGstRate: number;
  isActive: boolean;
}

const CATEGORIES = ["ALL", "SIGNAGE", "FABRICATION", "PRINTING", "BRANDING"];

export default function ProductsServicesPage() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "SIGNAGE",
    description: "",
    hsnSac: "831000",
    unit: "Sq. ft.",
    defaultRate: 0,
    defaultGstRate: 18,
    isActive: true,
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "ALL") params.append("category", category);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/products-services?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Error loading catalogue", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, search]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      category: category !== "ALL" ? category : "SIGNAGE",
      description: "",
      hsnSac: "831000",
      unit: "Sq. ft.",
      defaultRate: 0,
      defaultGstRate: 18,
      isActive: true,
    });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (it: ServiceItem) => {
    setEditingId(it.id);
    setFormData({
      name: it.name,
      category: it.category,
      description: it.description || "",
      hsnSac: it.hsnSac || "",
      unit: it.unit,
      defaultRate: Number(it.defaultRate),
      defaultGstRate: Number(it.defaultGstRate),
      isActive: it.isActive,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const url = editingId
        ? `/api/products-services/${editingId}`
        : "/api/products-services";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Failed to save catalogue item");
        setFormSubmitting(false);
        return;
      }

      setModalOpen(false);
      resetForm();
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return;
    try {
      await fetch(`/api/products-services/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      alert("Failed to archive item");
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "SIGNAGE":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "FABRICATION":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PRINTING":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "BRANDING":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Products & Services Catalogue
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Standard pricing, HSN/SAC codes, and GST tax classifications for signage and print works
            </p>
          </div>
          <Button onClick={handleOpenAdd} variant="brand" className="gap-2 text-xs h-9">
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </Button>
        </div>

        {/* Filter and Category Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  category === cat
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat === "ALL" ? "All Services" : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Search services or HSN/SAC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Catalogue Table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name & Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>HSN / SAC</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Default Rate</TableHead>
                  <TableHead className="text-center">GST Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                      Loading services catalogue...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-slate-400">
                      No services match your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.id} className="hover:bg-slate-50/80">
                      <TableCell className="max-w-md">
                        <div className="font-semibold text-slate-900 text-xs">
                          {it.name}
                        </div>
                        {it.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {it.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadge(
                            it.category
                          )}`}
                        >
                          {it.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        {it.hsnSac ? (
                          <span className="font-mono text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {it.hsnSac}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {it.unit}
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-slate-900">
                        {formatCurrency(it.defaultRate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                          {it.defaultGstRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-slate-500 hover:text-slate-900"
                            onClick={() => handleOpenEdit(it)}
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDelete(it.id, it.name)}
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
            <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingId ? "Edit Catalogue Service" : "Add Service to Catalogue"}
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

                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Service / Product Name *
                    </label>
                    <Input
                      required
                      placeholder="e.g. 3D Illuminated Channel Letters"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Category *
                      </label>
                      <select
                        className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                      >
                        <option value="SIGNAGE">SIGNAGE</option>
                        <option value="FABRICATION">FABRICATION</option>
                        <option value="PRINTING">PRINTING</option>
                        <option value="BRANDING">BRANDING</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        HSN / SAC Code
                      </label>
                      <Input
                        placeholder="e.g. 831000 or 998399"
                        value={formData.hsnSac}
                        onChange={(e) =>
                          setFormData({ ...formData, hsnSac: e.target.value })
                        }
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Detailed Technical Description
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Specification details, substrate material, LED specs, fabrication notes"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Measurement Unit *
                      </label>
                      <select
                        className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData({ ...formData, unit: e.target.value })
                        }
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
                      <label className="block font-semibold text-slate-700 mb-1">
                        Default Rate (₹) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.defaultRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultRate: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        GST Rate (%) *
                      </label>
                      <select
                        className="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 font-mono font-medium"
                        value={formData.defaultGstRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultGstRate: parseFloat(e.target.value) || 0,
                          })
                        }
                      >
                        <option value="0">0% (Exempt)</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18% (Standard)</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
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
                      ? "Saving Service..."
                      : editingId
                      ? "Update Service"
                      : "Add to Catalogue"}
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

