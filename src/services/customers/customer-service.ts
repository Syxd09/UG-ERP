import prisma from "@/lib/db";
import { z } from "zod";

export const customerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  gstin: z.string().optional().nullable().or(z.literal("")),
  pan: z.string().optional().nullable().or(z.literal("")),
  billingAddress: z.string().min(3, "Billing address is required"),
  billingCity: z.string().optional().nullable(),
  billingState: z.string().default("Karnataka"),
  billingStateCode: z.string().default("29"),
  billingPincode: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  shippingState: z.string().optional().nullable(),
  shippingStateCode: z.string().optional().nullable(),
  shippingPincode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

export async function getCustomers(search?: string) {
  const where: any = { isActive: true };
  if (search && search.trim() !== "") {
    const q = search.trim();
    where.OR = [
      { companyName: { contains: q, mode: "insensitive" } },
      { contactPerson: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { gstin: { contains: q, mode: "insensitive" } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { companyName: "asc" },
    include: {
      documents: {
        select: {
          id: true,
          documentType: true,
          status: true,
          totalAmount: true,
          amountReceived: true,
          balanceDue: true,
        },
      },
    },
  });

  return customers.map((c) => {
    // Only calculate billed and receivables from TAX_INVOICE (actual legal billing)
    const taxInvoices = c.documents.filter((d) => d.documentType === "TAX_INVOICE" && d.status !== "CANCELLED");
    const totalBilled = taxInvoices.reduce((acc, d) => acc + Number(d.totalAmount), 0);
    const totalReceived = taxInvoices.reduce((acc, d) => acc + Number(d.amountReceived), 0);
    const balanceDue = taxInvoices.reduce((acc, d) => acc + Number(d.balanceDue), 0);

    return {
      ...c,
      totalBilled,
      totalReceived,
      balanceDue,
      documentsCount: c.documents.length,
    };
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { issueDate: "desc" },
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      },
    },
  });
}

export async function createCustomer(data: CustomerFormData) {
  const validated = customerSchema.parse(data);
  return prisma.customer.create({
    data: {
      companyName: validated.companyName,
      contactPerson: validated.contactPerson || null,
      email: validated.email || null,
      phone: validated.phone || null,
      gstin: validated.gstin ? validated.gstin.trim().toUpperCase() : null,
      pan: validated.pan ? validated.pan.trim().toUpperCase() : null,
      billingAddress: validated.billingAddress,
      billingCity: validated.billingCity || null,
      billingState: validated.billingState || "Karnataka",
      billingStateCode: validated.billingStateCode || "29",
      billingPincode: validated.billingPincode || null,
      shippingAddress: validated.shippingAddress || validated.billingAddress,
      shippingCity: validated.shippingCity || validated.billingCity || null,
      shippingState: validated.shippingState || validated.billingState || "Karnataka",
      shippingStateCode: validated.shippingStateCode || validated.billingStateCode || "29",
      shippingPincode: validated.shippingPincode || validated.billingPincode || null,
      notes: validated.notes || null,
    },
  });
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const validated = customerSchema.parse(data);
  return prisma.customer.update({
    where: { id },
    data: {
      companyName: validated.companyName,
      contactPerson: validated.contactPerson || null,
      email: validated.email || null,
      phone: validated.phone || null,
      gstin: validated.gstin ? validated.gstin.trim().toUpperCase() : null,
      pan: validated.pan ? validated.pan.trim().toUpperCase() : null,
      billingAddress: validated.billingAddress,
      billingCity: validated.billingCity || null,
      billingState: validated.billingState || "Karnataka",
      billingStateCode: validated.billingStateCode || "29",
      billingPincode: validated.billingPincode || null,
      shippingAddress: validated.shippingAddress || null,
      shippingCity: validated.shippingCity || null,
      shippingState: validated.shippingState || null,
      shippingStateCode: validated.shippingStateCode || null,
      shippingPincode: validated.shippingPincode || null,
      notes: validated.notes || null,
    },
  });
}

export async function deleteCustomer(id: string) {
  // Soft delete to maintain audit integrity
  return prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });
}
