import prisma from "@/lib/db";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export async function getFinancialReports() {
  if (!process.env.DATABASE_URL) {
    return {
      totalDocuments: 0,
      totalQuotations: 0,
      totalProformas: 0,
      totalTaxInvoices: 0,
      totalBilledRevenue: 0,
      totalTaxableValue: 0,
      totalCgstCollected: 0,
      totalSgstCollected: 0,
      totalIgstCollected: 0,
      totalGstCollected: 0,
      totalAmountReceived: 0,
      outstandingAmount: 0,
      overdueAmount: 0,
      monthlyTrends: [],
      customerReceivables: [],
      databaseConnected: false,
    };
  }

  // 1. Fetch all documents
  const allDocs = await prisma.document.findMany({
    include: {
      items: true,
      taxSummaries: true,
      payments: true,
    },
  });

  const taxInvoices = allDocs.filter(
    (d) => d.documentType === "TAX_INVOICE" && d.status !== "CANCELLED"
  );
  const quotations = allDocs.filter((d) => d.documentType === "QUOTATION");
  const proformas = allDocs.filter((d) => d.documentType === "PROFORMA_INVOICE");

  // Totals calculated strictly from actual database records
  const totalBilledRevenue = taxInvoices.reduce((acc, d) => acc + Number(d.totalAmount), 0);
  const totalTaxableValue = taxInvoices.reduce((acc, d) => acc + Number(d.taxableAmount), 0);
  const totalCgstCollected = taxInvoices.reduce((acc, d) => acc + Number(d.cgstAmount), 0);
  const totalSgstCollected = taxInvoices.reduce((acc, d) => acc + Number(d.sgstAmount), 0);
  const totalIgstCollected = taxInvoices.reduce((acc, d) => acc + Number(d.igstAmount), 0);
  const totalGstCollected = totalCgstCollected + totalSgstCollected + totalIgstCollected;

  // Payments collected from all payments
  const allPayments = await prisma.payment.findMany();
  const totalAmountReceived = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  // Outstanding receivables on tax invoices
  const outstandingAmount = taxInvoices.reduce((acc, d) => acc + Number(d.balanceDue), 0);

  // Overdue calculation (due date passed and balanceDue > 0)
  const now = new Date();
  const overdueDocs = taxInvoices.filter(
    (d) => d.dueDate && new Date(d.dueDate) < now && Number(d.balanceDue) > 0
  );
  const overdueAmount = overdueDocs.reduce((acc, d) => acc + Number(d.balanceDue), 0);

  // Monthly Billing Trends (past 6 months)
  const monthlyTrends: { month: string; billed: number; collected: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = subMonths(now, i);
    const mStart = startOfMonth(targetDate);
    const mEnd = endOfMonth(targetDate);
    const label = format(targetDate, "MMM yyyy");

    const monthInvoices = taxInvoices.filter((d) => {
      const dt = new Date(d.issueDate);
      return dt >= mStart && dt <= mEnd;
    });

    const monthPayments = allPayments.filter((p) => {
      const dt = new Date(p.paymentDate);
      return dt >= mStart && dt <= mEnd;
    });

    monthlyTrends.push({
      month: label,
      billed: monthInvoices.reduce((acc, d) => acc + Number(d.totalAmount), 0),
      collected: monthPayments.reduce((acc, p) => acc + Number(p.amount), 0),
    });
  }

  // Customer-wise Billing Breakdown
  const customerMap = new Map<string, { name: string; billed: number; received: number; balance: number }>();
  for (const inv of taxInvoices) {
    const cName = inv.customerName;
    const existing = customerMap.get(cName) || {
      name: cName,
      billed: 0,
      received: 0,
      balance: 0,
    };
    existing.billed += Number(inv.totalAmount);
    existing.received += Number(inv.amountReceived);
    existing.balance += Number(inv.balanceDue);
    customerMap.set(cName, existing);
  }
  const customerBreakdown = Array.from(customerMap.values()).sort((a, b) => b.billed - a.billed);

  // GST HSN Tax Liability Breakdown
  const hsnMap = new Map<string, { hsnSac: string; gstRate: number; taxable: number; tax: number }>();
  for (const inv of taxInvoices) {
    for (const ts of inv.taxSummaries) {
      const key = `${ts.hsnSac || "NA"}_${ts.gstRate}`;
      const existing = hsnMap.get(key) || {
        hsnSac: ts.hsnSac || "NA",
        gstRate: Number(ts.gstRate),
        taxable: 0,
        tax: 0,
      };
      existing.taxable += Number(ts.taxableAmount);
      existing.tax += Number(ts.totalTax);
      hsnMap.set(key, existing);
    }
  }
  const gstBreakdown = Array.from(hsnMap.values());

  return {
    totalDocuments: allDocs.length,
    totalQuotations: quotations.length,
    totalProformas: proformas.length,
    totalTaxInvoices: taxInvoices.length,
    totalBilledRevenue,
    totalTaxableValue,
    totalCgstCollected,
    totalSgstCollected,
    totalIgstCollected,
    totalGstCollected,
    totalAmountReceived,
    outstandingAmount,
    overdueAmount,
    overdueCount: overdueDocs.length,
    monthlyTrends,
    customerBreakdown,
    gstBreakdown,
  };
}

