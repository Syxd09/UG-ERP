import prisma from "@/lib/db";
import { DocumentType } from "@prisma/client";

/**
 * Atomically generates the next transaction-safe sequential document number.
 * e.g., "UG/INV/26-27/0101", "UG/QTN/26-27/0101", "UG/PI/26-27/0101"
 */
export async function getNextDocumentNumber(
  docType: DocumentType,
  companyId?: string
): Promise<string> {
  const company = companyId
    ? await prisma.company.findUnique({ where: { id: companyId }, include: { settings: true } })
    : await prisma.company.findFirst({ include: { settings: true } });

  if (!company) {
    throw new Error("Company configuration not found");
  }

  const settings = company.settings;
  const financialYear = settings?.financialYear || "2026-27";

  let prefix = "UG/DOC";
  if (docType === DocumentType.QUOTATION) {
    prefix = settings?.quotationPrefix || "UG/QTN";
  } else if (docType === DocumentType.PROFORMA_INVOICE) {
    prefix = settings?.proformaPrefix || "UG/PI";
  } else if (docType === DocumentType.TAX_INVOICE) {
    prefix = settings?.invoicePrefix || "UG/INV";
  }

  // Format financial year abbreviation: "2026-27" -> "26-27"
  const fyShort = financialYear.replace(/^20(\d\d)-20?(\d\d)$/, "$1-$2");

  // Perform atomic sequence increment inside a database transaction
  const nextNumber = await prisma.$transaction(async (tx) => {
    const seq = await tx.documentSequence.upsert({
      where: {
        companyId_docType_financialYear: {
          companyId: company.id,
          docType,
          financialYear,
        },
      },
      update: {
        currentNumber: {
          increment: 1,
        },
      },
      create: {
        companyId: company.id,
        docType,
        prefix,
        financialYear,
        currentNumber: 101, // Starts at 101
      },
    });

    return seq.currentNumber;
  });

  const paddedNum = String(nextNumber).padStart(4, "0");
  return `${prefix}/${fyShort}/${paddedNum}`;
}

