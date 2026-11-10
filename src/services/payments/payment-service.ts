import prisma from "@/lib/db";
import { PaymentMethod, DocumentStatus } from "@prisma/client";
import { z } from "zod";

export const paymentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  amount: z.number().positive("Payment amount must be greater than zero"),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  transactionRef: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receivedBy: z.string().optional().nullable(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export async function getPayments(filter?: {
  method?: PaymentMethod;
  search?: string;
}) {
  const where: any = {};
  if (filter?.method) {
    where.paymentMethod = filter.method;
  }
  if (filter?.search && filter.search.trim()) {
    const q = filter.search.trim();
    where.OR = [
      { paymentNumber: { contains: q, mode: "insensitive" } },
      { transactionRef: { contains: q, mode: "insensitive" } },
      { document: { documentNumber: { contains: q, mode: "insensitive" } } },
      { document: { customerName: { contains: q, mode: "insensitive" } } },
    ];
  }

  return prisma.payment.findMany({
    where,
    orderBy: { paymentDate: "desc" },
    include: {
      document: {
        select: {
          id: true,
          documentNumber: true,
          documentType: true,
          customerName: true,
          totalAmount: true,
          balanceDue: true,
        },
      },
    },
  });
}

export async function recordPayment(data: PaymentInput) {
  const validated = paymentSchema.parse(data);

  const document = await prisma.document.findUnique({
    where: { id: validated.documentId },
    include: { payments: true },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const currentBalance = Number(document.balanceDue);
  if (validated.amount > currentBalance + 0.01) {
    throw new Error(
      `Payment amount (₹${validated.amount}) cannot exceed outstanding balance (₹${currentBalance}).`
    );
  }

  const count = await prisma.payment.count();
  const paymentNumber = `UG/REC/26-27/${String(count + 1).padStart(4, "0")}`;

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        documentId: document.id,
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        transactionRef: validated.transactionRef || null,
        bankName: validated.bankName || null,
        notes: validated.notes || null,
        receivedBy: validated.receivedBy || null,
      },
    });

    const newAmountReceived = Number(document.amountReceived) + validated.amount;
    const newBalanceDue = Math.max(0, Number(document.totalAmount) - newAmountReceived);

    const newStatus =
      newBalanceDue <= 0.01 ? DocumentStatus.PAID : DocumentStatus.PARTIALLY_PAID;

    await tx.document.update({
      where: { id: document.id },
      data: {
        amountReceived: newAmountReceived,
        balanceDue: newBalanceDue,
        status: newStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "Payment",
        entityId: payment.id,
        action: "PAYMENT_RECORDED",
        details: {
          paymentNumber,
          documentNumber: document.documentNumber,
          amount: validated.amount,
        },
      },
    });

    return payment;
  });
}

