import prisma from "@/lib/db";
import { DocumentType, DocumentStatus, DiscountType, Role } from "@prisma/client";
import {
  calculateDocumentFinancials,
  ItemCalculationInput,
} from "@/services/calculations/tax-engine";
import { getNextDocumentNumber } from "./sequence-engine";
import { z } from "zod";

export const documentItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().nullable(),
  hsnSac: z.string().optional().nullable(),
  unit: z.string().default("Nos"),
  dimensions: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitRate: z.number().min(0, "Unit rate cannot be negative"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.number().min(0).default(0),
  gstRate: z.number().min(0).max(28).default(18),
  isGstInclusive: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

export const documentSchema = z.object({
  id: z.string().optional(),
  documentType: z.enum(["QUOTATION", "PROFORMA_INVOICE", "TAX_INVOICE"]),
  documentNumber: z.string().optional(),
  status: z.enum([
    "DRAFT",
    "ISSUED",
    "ACCEPTED",
    "REJECTED",
    "PARTIALLY_PAID",
    "PAID",
    "CANCELLED",
  ]).default("DRAFT"),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).optional().nullable(),
  validityDate: z.string().or(z.date()).optional().nullable(),
  referenceNo: z.string().optional().nullable(),
  projectRef: z.string().optional().nullable(),
  projectName: z.string().optional().nullable(),
  projectLocation: z.string().optional().nullable(),
  siteAddress: z.string().optional().nullable(),

  customerId: z.string().optional().nullable(),
  customerName: z.string().min(2, "Customer name is required"),
  customerContactPerson: z.string().optional().nullable(),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerGstin: z.string().optional().nullable(),
  customerBillingAddress: z.string().min(2, "Customer billing address is required"),
  customerShippingAddress: z.string().optional().nullable(),
  placeOfSupplyState: z.string().default("Karnataka"),
  placeOfSupplyCode: z.string().default("29"),

  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.number().min(0).default(0),

  advancePercentage: z.number().optional().nullable(),
  advanceAmount: z.number().optional().nullable(),

  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),

  items: z.array(documentItemSchema).min(1, "At least one item is required"),
});

export type DocumentFormData = z.infer<typeof documentSchema>;

export async function getDocuments(filter: {
  type?: DocumentType;
  status?: DocumentStatus;
  customerId?: string;
  search?: string;
}) {
  const where: any = {};

  if (filter.type) {
    where.documentType = filter.type;
  }
  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.customerId) {
    where.customerId = filter.customerId;
  }
  if (filter.search && filter.search.trim()) {
    const q = filter.search.trim();
    where.OR = [
      { documentNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { projectName: { contains: q, mode: "insensitive" } },
      { referenceNo: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.document.findMany({
    where,
    orderBy: { issueDate: "desc" },
    include: {
      items: true,
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });
}

export async function getDocumentById(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        orderBy: { sortOrder: "asc" },
      },
      taxSummaries: true,
      payments: {
        orderBy: { paymentDate: "desc" },
      },
      conversionsAsSource: {
        include: { targetDocument: true },
      },
      conversionsAsTarget: {
        include: { sourceDocument: true },
      },
    },
  });
}

export async function createDocument(data: DocumentFormData) {
  const validated = documentSchema.parse(data);

  const company = await prisma.company.findFirst({
    include: {
      bankAccounts: { where: { isDefault: true } },
      upiDetails: { where: { isDefault: true } },
      settings: true,
    },
  });

  if (!company) {
    throw new Error("Company configuration missing. Please seed or configure settings.");
  }

  const supplierStateCode = company.stateCode || "29";
  const placeOfSupplyCode = validated.placeOfSupplyCode || supplierStateCode;

  // Run pure tax engine calculations server-side (NEVER trust browser client totals)
  const calcInputs: ItemCalculationInput[] = validated.items.map((it) => ({
    name: it.name,
    description: it.description,
    hsnSac: it.hsnSac,
    unit: it.unit,
    dimensions: it.dimensions,
    specifications: it.specifications,
    quantity: it.quantity,
    unitRate: it.unitRate,
    discountType: it.discountType,
    discountValue: it.discountValue,
    gstRate: it.gstRate,
    isGstInclusive: it.isGstInclusive,
  }));

  const calcResult = calculateDocumentFinancials({
    supplierStateCode,
    placeOfSupplyStateCode: placeOfSupplyCode,
    items: calcInputs,
    documentDiscountType: validated.discountType,
    documentDiscountValue: validated.discountValue,
    enableRoundOff: company.settings?.enableRoundOff ?? true,
  });

  // Generate atomic sequential document number if not supplied
  const docNumber =
    validated.documentNumber && validated.documentNumber.trim() !== ""
      ? validated.documentNumber.trim()
      : await getNextDocumentNumber(validated.documentType, company.id);

  // Take immutable snapshots of company, bank and upi records
  const companySnapshot = {
    name: company.name,
    legalName: company.legalName,
    tagline: company.tagline,
    gstin: company.gstin,
    pan: company.pan,
    state: company.state,
    stateCode: company.stateCode,
    email: company.email,
    phone: company.phone,
    website: company.website,
    address: company.address,
    city: company.city,
    pincode: company.pincode,
    logoUrl: company.logoUrl,
    symbolLogoUrl: company.symbolLogoUrl,
  };

  const defaultBank = company.bankAccounts[0] || null;
  const bankSnapshot = defaultBank
    ? {
        accountHolder: defaultBank.accountHolder,
        bankName: defaultBank.bankName,
        accountNumber: defaultBank.accountNumber,
        ifsc: defaultBank.ifsc,
        branch: defaultBank.branch,
      }
    : null;

  const defaultUpi = company.upiDetails[0] || null;
  const upiSnapshot = defaultUpi
    ? {
        upiId: defaultUpi.upiId,
        payeeName: defaultUpi.payeeName,
        qrCodeUrl: defaultUpi.qrCodeUrl,
      }
    : null;

  // Execute database transaction to guarantee atomic integrity
  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: {
        documentNumber: docNumber,
        documentType: validated.documentType,
        status: validated.status,
        issueDate: new Date(validated.issueDate),
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        validityDate: validated.validityDate ? new Date(validated.validityDate) : null,
        referenceNo: validated.referenceNo || null,
        projectRef: validated.projectRef || null,
        projectName: validated.projectName || null,
        projectLocation: validated.projectLocation || null,
        siteAddress: validated.siteAddress || null,

        customerId: validated.customerId || null,
        customerName: validated.customerName,
        customerContactPerson: validated.customerContactPerson || null,
        customerEmail: validated.customerEmail || null,
        customerPhone: validated.customerPhone || null,
        customerGstin: validated.customerGstin ? validated.customerGstin.trim().toUpperCase() : null,
        customerBillingAddress: validated.customerBillingAddress,
        customerShippingAddress: validated.customerShippingAddress || null,
        placeOfSupplyState: validated.placeOfSupplyState,
        placeOfSupplyCode: placeOfSupplyCode,
        isInterState: calcResult.isInterState,

        subtotal: calcResult.subtotal,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        discountAmount: calcResult.documentDiscountAmount,
        taxableAmount: calcResult.totalTaxableAmount,
        cgstAmount: calcResult.totalCgstAmount,
        sgstAmount: calcResult.totalSgstAmount,
        igstAmount: calcResult.totalIgstAmount,
        totalTaxAmount: calcResult.totalTaxAmount,
        roundOff: calcResult.roundOff,
        totalAmount: calcResult.totalAmount,

        advancePercentage: validated.advancePercentage || null,
        advanceAmount: validated.advanceAmount || null,
        amountReceived: 0,
        balanceDue: calcResult.totalAmount,

        paymentTerms: validated.paymentTerms || company.settings?.defaultPaymentTerms,
        notes: validated.notes || company.settings?.defaultNotes,
        termsAndConditions: validated.termsAndConditions || company.settings?.defaultTerms,

        companySnapshot: companySnapshot as any,
        bankSnapshot: (bankSnapshot || undefined) as any,
        upiSnapshot: (upiSnapshot || undefined) as any,

        items: {
          create: calcResult.items.map((it, idx) => ({
            name: it.name,
            description: it.description || null,
            hsnSac: it.hsnSac || null,
            unit: it.unit,
            dimensions: it.dimensions || null,
            specifications: it.specifications || null,
            quantity: it.quantity,
            unitRate: it.unitRate,
            discountType: it.discountType,
            discountValue: it.discountValue,
            discountAmount: it.discountAmount,
            taxableAmount: it.taxableAmount,
            gstRate: it.gstRate,
            isGstInclusive: it.isGstInclusive,
            cgstRate: it.cgstRate,
            cgstAmount: it.cgstAmount,
            sgstRate: it.sgstRate,
            sgstAmount: it.sgstAmount,
            igstRate: it.igstRate,
            igstAmount: it.igstAmount,
            totalTax: it.totalTax,
            finalAmount: it.finalAmount,
            sortOrder: idx,
          })),
        },

        taxSummaries: {
          create: calcResult.taxSummaries.map((ts) => ({
            hsnSac: ts.hsnSac,
            gstRate: ts.gstRate,
            taxableAmount: ts.taxableAmount,
            cgstAmount: ts.cgstAmount,
            sgstAmount: ts.sgstAmount,
            igstAmount: ts.igstAmount,
            totalTax: ts.totalTax,
          })),
        },
      },
      include: {
        items: true,
        taxSummaries: true,
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        entityType: "Document",
        entityId: doc.id,
        action: "CREATE",
        details: {
          docNumber: doc.documentNumber,
          type: doc.documentType,
          total: doc.totalAmount,
        },
      },
    });

    return doc;
  });
}

export async function updateDocument(id: string, data: DocumentFormData) {
  const existing = await prisma.document.findUnique({
    where: { id },
    include: { payments: true },
  });

  if (!existing) {
    throw new Error("Document not found");
  }

  if (existing.isLocked) {
    throw new Error(
      "Document is finalized and locked. Modifications must follow an authorized credit/debit adjustment workflow."
    );
  }

  const validated = documentSchema.parse(data);

  const company = await prisma.company.findFirst({
    include: { settings: true },
  });
  const supplierStateCode = company?.stateCode || "29";
  const placeOfSupplyCode = validated.placeOfSupplyCode || supplierStateCode;

  const calcInputs: ItemCalculationInput[] = validated.items.map((it) => ({
    name: it.name,
    description: it.description,
    hsnSac: it.hsnSac,
    unit: it.unit,
    dimensions: it.dimensions,
    specifications: it.specifications,
    quantity: it.quantity,
    unitRate: it.unitRate,
    discountType: it.discountType,
    discountValue: it.discountValue,
    gstRate: it.gstRate,
    isGstInclusive: it.isGstInclusive,
  }));

  const calcResult = calculateDocumentFinancials({
    supplierStateCode,
    placeOfSupplyStateCode: placeOfSupplyCode,
    items: calcInputs,
    documentDiscountType: validated.discountType,
    documentDiscountValue: validated.discountValue,
    enableRoundOff: company?.settings?.enableRoundOff ?? true,
  });

  const totalReceived = Number(existing.amountReceived);
  const balanceDue = Math.max(0, calcResult.totalAmount - totalReceived);

  let newStatus = existing.status;
  if (totalReceived > 0) {
    newStatus = balanceDue === 0 ? DocumentStatus.PAID : DocumentStatus.PARTIALLY_PAID;
  } else if (validated.status) {
    newStatus = validated.status;
  }

  return prisma.$transaction(async (tx) => {
    // Delete existing items and tax summaries
    await tx.documentItem.deleteMany({ where: { documentId: id } });
    await tx.documentTaxSummary.deleteMany({ where: { documentId: id } });

    const updated = await tx.document.update({
      where: { id },
      data: {
        status: newStatus,
        issueDate: new Date(validated.issueDate),
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        validityDate: validated.validityDate ? new Date(validated.validityDate) : null,
        referenceNo: validated.referenceNo || null,
        projectRef: validated.projectRef || null,
        projectName: validated.projectName || null,
        projectLocation: validated.projectLocation || null,
        siteAddress: validated.siteAddress || null,

        customerId: validated.customerId || null,
        customerName: validated.customerName,
        customerContactPerson: validated.customerContactPerson || null,
        customerEmail: validated.customerEmail || null,
        customerPhone: validated.customerPhone || null,
        customerGstin: validated.customerGstin ? validated.customerGstin.trim().toUpperCase() : null,
        customerBillingAddress: validated.customerBillingAddress,
        customerShippingAddress: validated.customerShippingAddress || null,
        placeOfSupplyState: validated.placeOfSupplyState,
        placeOfSupplyCode: placeOfSupplyCode,
        isInterState: calcResult.isInterState,

        subtotal: calcResult.subtotal,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        discountAmount: calcResult.documentDiscountAmount,
        taxableAmount: calcResult.totalTaxableAmount,
        cgstAmount: calcResult.totalCgstAmount,
        sgstAmount: calcResult.totalSgstAmount,
        igstAmount: calcResult.totalIgstAmount,
        totalTaxAmount: calcResult.totalTaxAmount,
        roundOff: calcResult.roundOff,
        totalAmount: calcResult.totalAmount,

        advancePercentage: validated.advancePercentage || null,
        advanceAmount: validated.advanceAmount || null,
        balanceDue,

        paymentTerms: validated.paymentTerms || null,
        notes: validated.notes || null,
        termsAndConditions: validated.termsAndConditions || null,

        items: {
          create: calcResult.items.map((it, idx) => ({
            name: it.name,
            description: it.description || null,
            hsnSac: it.hsnSac || null,
            unit: it.unit,
            dimensions: it.dimensions || null,
            specifications: it.specifications || null,
            quantity: it.quantity,
            unitRate: it.unitRate,
            discountType: it.discountType,
            discountValue: it.discountValue,
            discountAmount: it.discountAmount,
            taxableAmount: it.taxableAmount,
            gstRate: it.gstRate,
            isGstInclusive: it.isGstInclusive,
            cgstRate: it.cgstRate,
            cgstAmount: it.cgstAmount,
            sgstRate: it.sgstRate,
            sgstAmount: it.sgstAmount,
            igstRate: it.igstRate,
            igstAmount: it.igstAmount,
            totalTax: it.totalTax,
            finalAmount: it.finalAmount,
            sortOrder: idx,
          })),
        },

        taxSummaries: {
          create: calcResult.taxSummaries.map((ts) => ({
            hsnSac: ts.hsnSac,
            gstRate: ts.gstRate,
            taxableAmount: ts.taxableAmount,
            cgstAmount: ts.cgstAmount,
            sgstAmount: ts.sgstAmount,
            igstAmount: ts.igstAmount,
            totalTax: ts.totalTax,
          })),
        },
      },
      include: {
        items: true,
        taxSummaries: true,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "Document",
        entityId: id,
        action: "UPDATE",
        details: { totalAmount: updated.totalAmount },
      },
    });

    return updated;
  });
}

export async function finalizeDocument(id: string) {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.update({
      where: { id },
      data: {
        status: DocumentStatus.ISSUED,
        isLocked: true,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "Document",
        entityId: id,
        action: "FINALIZE",
        details: { documentNumber: doc.documentNumber },
      },
    });

    return doc;
  });
}

export async function cancelDocument(id: string) {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.update({
      where: { id },
      data: {
        status: DocumentStatus.CANCELLED,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "Document",
        entityId: id,
        action: "CANCEL",
        details: { documentNumber: doc.documentNumber },
      },
    });

    return doc;
  });
}

/**
 * Converts a Quotation -> Proforma Invoice or GST Tax Invoice,
 * or Proforma Invoice -> GST Tax Invoice preserving all line items, customer specs,
 * commercial terms, and maintaining conversion audit lineage.
 */
export async function convertDocument(sourceDocId: string, targetType: DocumentType) {
  const source = await prisma.document.findUnique({
    where: { id: sourceDocId },
    include: {
      items: true,
      taxSummaries: true,
    },
  });

  if (!source) {
    throw new Error("Source document not found");
  }

  const nextNumber = await getNextDocumentNumber(targetType);

  return prisma.$transaction(async (tx) => {
    const targetDoc = await tx.document.create({
      data: {
        documentNumber: nextNumber,
        documentType: targetType,
        status: DocumentStatus.ISSUED,
        issueDate: new Date(),
        dueDate: source.dueDate,
        validityDate: targetType === DocumentType.QUOTATION ? source.validityDate : null,
        referenceNo: source.documentNumber, // Cross-reference source doc
        projectRef: source.projectRef,
        projectName: source.projectName,
        projectLocation: source.projectLocation,
        siteAddress: source.siteAddress,

        customerId: source.customerId,
        customerName: source.customerName,
        customerContactPerson: source.customerContactPerson,
        customerEmail: source.customerEmail,
        customerPhone: source.customerPhone,
        customerGstin: source.customerGstin,
        customerBillingAddress: source.customerBillingAddress,
        customerShippingAddress: source.customerShippingAddress,
        placeOfSupplyState: source.placeOfSupplyState,
        placeOfSupplyCode: source.placeOfSupplyCode,
        isInterState: source.isInterState,

        subtotal: source.subtotal,
        discountType: source.discountType,
        discountValue: source.discountValue,
        discountAmount: source.discountAmount,
        taxableAmount: source.taxableAmount,
        cgstAmount: source.cgstAmount,
        sgstAmount: source.sgstAmount,
        igstAmount: source.igstAmount,
        totalTaxAmount: source.totalTaxAmount,
        roundOff: source.roundOff,
        totalAmount: source.totalAmount,

        advancePercentage: source.advancePercentage,
        advanceAmount: source.advanceAmount,
        amountReceived: 0,
        balanceDue: source.totalAmount,

        paymentTerms: source.paymentTerms,
        notes: source.notes,
        termsAndConditions: source.termsAndConditions,

        companySnapshot: source.companySnapshot as any,
        bankSnapshot: source.bankSnapshot as any,
        upiSnapshot: source.upiSnapshot as any,

        convertedFromId: source.id,

        items: {
          create: source.items.map((it) => ({
            name: it.name,
            description: it.description,
            hsnSac: it.hsnSac,
            unit: it.unit,
            dimensions: it.dimensions,
            specifications: it.specifications,
            quantity: it.quantity,
            unitRate: it.unitRate,
            discountType: it.discountType,
            discountValue: it.discountValue,
            discountAmount: it.discountAmount,
            taxableAmount: it.taxableAmount,
            gstRate: it.gstRate,
            isGstInclusive: it.isGstInclusive,
            cgstRate: it.cgstRate,
            cgstAmount: it.cgstAmount,
            sgstRate: it.sgstRate,
            sgstAmount: it.sgstAmount,
            igstRate: it.igstRate,
            igstAmount: it.igstAmount,
            totalTax: it.totalTax,
            finalAmount: it.finalAmount,
            sortOrder: it.sortOrder,
          })),
        },

        taxSummaries: {
          create: source.taxSummaries.map((ts) => ({
            hsnSac: ts.hsnSac,
            gstRate: ts.gstRate,
            taxableAmount: ts.taxableAmount,
            cgstAmount: ts.cgstAmount,
            sgstAmount: ts.sgstAmount,
            igstAmount: ts.igstAmount,
            totalTax: ts.totalTax,
          })),
        },
      },
    });

    // Update source document with link to target
    await tx.document.update({
      where: { id: source.id },
      data: {
        convertedToId: targetDoc.id,
        status: DocumentStatus.ACCEPTED,
      },
    });

    // Record conversion audit lineage
    await tx.documentConversion.create({
      data: {
        sourceDocumentId: source.id,
        targetDocumentId: targetDoc.id,
        sourceDocNumber: source.documentNumber,
        targetDocNumber: targetDoc.documentNumber,
        sourceType: source.documentType,
        targetType: targetType,
        notes: `Converted from ${source.documentType} ${source.documentNumber} to ${targetType} ${targetDoc.documentNumber}`,
      },
    });

    return targetDoc;
  });
}

export async function duplicateDocument(sourceDocId: string) {
  return await prisma.$transaction(async (tx) => {
    const source = await tx.document.findUnique({
      where: { id: sourceDocId },
      include: {
        items: true,
        taxSummaries: true,
      },
    });

    if (!source) {
      throw new Error("Source document not found");
    }

    // Generate a fresh sequential number for the copy
    const newDocNumber = await getNextDocumentNumber(source.documentType);

    const copyDoc = await tx.document.create({
      data: {
        documentType: source.documentType,
        documentNumber: newDocNumber,
        status: DocumentStatus.DRAFT,
        isLocked: false,
        issueDate: new Date(),
        dueDate: source.dueDate,
        validityDate: source.validityDate,
        referenceNo: source.referenceNo ? `${source.referenceNo} (Copy)` : undefined,
        projectRef: source.projectRef,
        projectName: source.projectName,
        projectLocation: source.projectLocation,
        siteAddress: source.siteAddress,

        customerId: source.customerId,
        customerName: source.customerName,
        customerContactPerson: source.customerContactPerson,
        customerEmail: source.customerEmail,
        customerPhone: source.customerPhone,
        customerGstin: source.customerGstin,
        customerBillingAddress: source.customerBillingAddress,
        customerShippingAddress: source.customerShippingAddress,
        placeOfSupplyState: source.placeOfSupplyState,
        placeOfSupplyCode: source.placeOfSupplyCode,
        isInterState: source.isInterState,

        subtotal: source.subtotal,
        discountType: source.discountType,
        discountValue: source.discountValue,
        discountAmount: source.discountAmount,
        taxableAmount: source.taxableAmount,
        cgstAmount: source.cgstAmount,
        sgstAmount: source.sgstAmount,
        igstAmount: source.igstAmount,
        totalTaxAmount: source.totalTaxAmount,
        roundOff: source.roundOff,
        totalAmount: source.totalAmount,

        advancePercentage: source.advancePercentage,
        advanceAmount: source.advanceAmount,
        amountReceived: 0,
        balanceDue: source.totalAmount,

        paymentTerms: source.paymentTerms,
        notes: source.notes,
        termsAndConditions: source.termsAndConditions,

        companySnapshot: (source.companySnapshot || undefined) as any,
        bankSnapshot: (source.bankSnapshot || undefined) as any,
        upiSnapshot: (source.upiSnapshot || undefined) as any,

        items: {
          create: source.items.map((it) => ({
            name: it.name,
            description: it.description,
            hsnSac: it.hsnSac,
            unit: it.unit,
            dimensions: it.dimensions,
            specifications: it.specifications,
            quantity: it.quantity,
            unitRate: it.unitRate,
            discountType: it.discountType,
            discountValue: it.discountValue,
            discountAmount: it.discountAmount,
            gstRate: it.gstRate,
            isGstInclusive: it.isGstInclusive,
            taxableAmount: it.taxableAmount,
            cgstRate: it.cgstRate,
            cgstAmount: it.cgstAmount,
            sgstRate: it.sgstRate,
            sgstAmount: it.sgstAmount,
            igstRate: it.igstRate,
            igstAmount: it.igstAmount,
            totalTax: it.totalTax,
            finalAmount: it.finalAmount,
            sortOrder: it.sortOrder,
          })),
        },

        taxSummaries: {
          create: source.taxSummaries.map((ts) => ({
            hsnSac: ts.hsnSac,
            gstRate: ts.gstRate,
            taxableAmount: ts.taxableAmount,
            cgstAmount: ts.cgstAmount,
            sgstAmount: ts.sgstAmount,
            igstAmount: ts.igstAmount,
            totalTax: ts.totalTax,
          })),
        },
      },
    });

    return copyDoc;
  });
}

export async function deleteDraftDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
  });

  if (!doc) {
    throw new Error("Document not found");
  }

  if (doc.status !== DocumentStatus.DRAFT || doc.isLocked) {
    throw new Error(
      "Only unfinalized draft documents can be deleted. Issued or finalized documents must be cancelled to preserve financial audit compliance."
    );
  }

  return await prisma.$transaction(async (tx) => {
    await tx.documentItem.deleteMany({ where: { documentId: id } });
    await tx.documentTaxSummary.deleteMany({ where: { documentId: id } });
    await tx.payment.deleteMany({ where: { documentId: id } });
    await tx.documentConversion.deleteMany({
      where: {
        OR: [{ sourceDocumentId: id }, { targetDocumentId: id }],
      },
    });
    return await tx.document.delete({ where: { id } });
  });
}
