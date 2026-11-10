const test = require("node:test");
const assert = require("node:assert");
const { PrismaClient, DocumentType, DocumentStatus, PaymentMethod } = require("@prisma/client");

const prisma = new PrismaClient();

test("Complete End-to-End Billing Lifecycle & Workflows", async (t) => {
  console.log("\nStarting Complete Billing Lifecycle Integration Test...");

  // 1. Create a Test Customer
  const customer = await prisma.customer.create({
    data: {
      companyName: "Nexus Malls & Retail Corp",
      contactPerson: "Vikram Malhotra",
      email: "vikram@nexusmalls.com",
      phone: "+91 99887 66554",
      gstin: "29AABCN1234D1Z9",
      billingAddress: "Nexus Koramangala Mall, Hosur Road",
      billingCity: "Bengaluru",
      billingState: "Karnataka",
      billingStateCode: "29",
    },
  });
  assert.ok(customer.id, "Customer created successfully");
  console.log("✔ Step 1: Customer created:", customer.companyName);

  // 2. Create a Quotation with multiple signage line items & discounts
  const quotationNumber = "UG/QTN/26-27/TEST01";
  const quotation = await prisma.document.create({
    data: {
      documentNumber: quotationNumber,
      documentType: DocumentType.QUOTATION,
      status: DocumentStatus.DRAFT,
      issueDate: new Date(),
      customerName: customer.companyName,
      customerBillingAddress: customer.billingAddress,
      customerGstin: customer.gstin,
      placeOfSupplyState: customer.billingState,
      placeOfSupplyCode: customer.billingStateCode,
      isInterState: false, // Karnataka to Karnataka -> Intra-state
      subtotal: 50000.00,
      discountAmount: 5000.00, // 10% discount
      taxableAmount: 45000.00,
      cgstAmount: 4050.00, // 9%
      sgstAmount: 4050.00, // 9%
      igstAmount: 0.00,
      totalTaxAmount: 8100.00,
      totalAmount: 53100.00,
      amountReceived: 0.00,
      balanceDue: 53100.00,
      items: {
        create: [
          {
            name: "Channel Letters 3D LED",
            quantity: 20,
            unit: "Running ft.",
            unitRate: 1500.00,
            taxableAmount: 30000.00,
            gstRate: 18.00,
            cgstRate: 9.00,
            cgstAmount: 2700.00,
            sgstRate: 9.00,
            sgstAmount: 2700.00,
            igstRate: 0.00,
            igstAmount: 0.00,
            totalTax: 5400.00,
            finalAmount: 35400.00,
          },
          {
            name: "Metal Laser Cutting Stainless Steel Facade",
            quantity: 10,
            unit: "Hours",
            unitRate: 2000.00,
            taxableAmount: 20000.00,
            gstRate: 18.00,
            cgstRate: 9.00,
            cgstAmount: 1800.00,
            sgstRate: 9.00,
            sgstAmount: 1800.00,
            igstRate: 0.00,
            igstAmount: 0.00,
            totalTax: 3600.00,
            finalAmount: 23600.00,
          },
        ],
      },
    },
    include: { items: true },
  });

  assert.strictEqual(quotation.documentType, DocumentType.QUOTATION);
  assert.strictEqual(quotation.items.length, 2);
  console.log("✔ Step 2: Quotation created with 2 signage items, Grand Total: ₹53,100");

  // 3. Finalize Quotation (Status: ISSUED, Locked)
  const issuedQuotation = await prisma.document.update({
    where: { id: quotation.id },
    data: { status: DocumentStatus.ISSUED, isLocked: true },
  });
  assert.strictEqual(issuedQuotation.status, DocumentStatus.ISSUED);
  assert.strictEqual(issuedQuotation.isLocked, true);
  console.log("✔ Step 3: Quotation finalized and locked against accidental alteration");

  // 4. Convert Quotation to Proforma Invoice
  const proformaNumber = "UG/PI/26-27/TEST01";
  const proforma = await prisma.document.create({
    data: {
      documentNumber: proformaNumber,
      documentType: DocumentType.PROFORMA_INVOICE,
      status: DocumentStatus.ISSUED,
      convertedFromId: quotation.id,
      customerName: quotation.customerName,
      customerBillingAddress: quotation.customerBillingAddress,
      placeOfSupplyState: quotation.placeOfSupplyState,
      placeOfSupplyCode: quotation.placeOfSupplyCode,
      subtotal: quotation.subtotal,
      taxableAmount: quotation.taxableAmount,
      totalTaxAmount: quotation.totalTaxAmount,
      totalAmount: quotation.totalAmount,
      amountReceived: 0,
      balanceDue: quotation.totalAmount,
    },
  });

  // Track conversion lineage
  await prisma.documentConversion.create({
    data: {
      sourceDocumentId: quotation.id,
      targetDocumentId: proforma.id,
      sourceDocNumber: quotation.documentNumber,
      targetDocNumber: proforma.documentNumber,
      sourceType: DocumentType.QUOTATION,
      targetType: DocumentType.PROFORMA_INVOICE,
    },
  });

  console.log("✔ Step 4: Quotation converted to Proforma Invoice with conversion lineage");

  // 5. Record 50% Advance Payment on Proforma (₹26,550)
  const advancePayment = await prisma.payment.create({
    data: {
      paymentNumber: "UG/REC/26-27/TEST01",
      documentId: proforma.id,
      amount: 26550.00,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      transactionRef: "HDFC_NEFT_99812",
      bankName: "HDFC Bank",
      notes: "50% Advance as per Work Order",
    },
  });

  const updatedProforma = await prisma.document.update({
    where: { id: proforma.id },
    data: {
      amountReceived: 26550.00,
      balanceDue: 26550.00,
      status: DocumentStatus.PARTIALLY_PAID,
    },
  });

  assert.strictEqual(Number(updatedProforma.amountReceived), 26550.00);
  assert.strictEqual(Number(updatedProforma.balanceDue), 26550.00);
  assert.strictEqual(updatedProforma.status, DocumentStatus.PARTIALLY_PAID);
  console.log("✔ Step 5: Advance payment of ₹26,550 recorded. Status: PARTIALLY_PAID");

  // 6. Convert Proforma to GST Tax Invoice upon installation
  const taxInvoiceNumber = "UG/INV/26-27/TEST01";
  const taxInvoice = await prisma.document.create({
    data: {
      documentNumber: taxInvoiceNumber,
      documentType: DocumentType.TAX_INVOICE,
      status: DocumentStatus.PARTIALLY_PAID,
      convertedFromId: proforma.id,
      customerName: quotation.customerName,
      customerBillingAddress: quotation.customerBillingAddress,
      customerGstin: quotation.customerGstin,
      placeOfSupplyState: quotation.placeOfSupplyState,
      placeOfSupplyCode: quotation.placeOfSupplyCode,
      subtotal: quotation.subtotal,
      taxableAmount: quotation.taxableAmount,
      cgstAmount: quotation.cgstAmount,
      sgstAmount: quotation.sgstAmount,
      totalTaxAmount: quotation.totalTaxAmount,
      totalAmount: quotation.totalAmount,
      amountReceived: 26550.00,
      balanceDue: 26550.00,
    },
  });

  console.log("✔ Step 6: GST Tax Invoice generated:", taxInvoice.documentNumber);

  // 7. Record Balance Payment Settlement
  const balancePayment = await prisma.payment.create({
    data: {
      paymentNumber: "UG/REC/26-27/TEST02",
      documentId: taxInvoice.id,
      amount: 26550.00,
      paymentMethod: PaymentMethod.UPI,
      transactionRef: "UPI_RR_9988776655",
      notes: "Balance final clearance on installation handover",
    },
  });

  const finalInvoice = await prisma.document.update({
    where: { id: taxInvoice.id },
    data: {
      amountReceived: 53100.00,
      balanceDue: 0.00,
      status: DocumentStatus.PAID,
      isLocked: true,
    },
  });

  assert.strictEqual(Number(finalInvoice.amountReceived), 53100.00);
  assert.strictEqual(Number(finalInvoice.balanceDue), 0.00);
  assert.strictEqual(finalInvoice.status, DocumentStatus.PAID);
  assert.strictEqual(finalInvoice.isLocked, true);
  console.log("✔ Step 7: Final settlement payment recorded. Balance: ₹0.00, Status: PAID, Locked: true");

  // Clean up test data
  await prisma.payment.deleteMany({ where: { id: { in: [advancePayment.id, balancePayment.id] } } });
  await prisma.documentConversion.deleteMany({ where: { sourceDocumentId: quotation.id } });
  await prisma.document.deleteMany({ where: { id: { in: [quotation.id, proforma.id, taxInvoice.id] } } });
  await prisma.customer.delete({ where: { id: customer.id } });

  console.log("✔ Step 8: Test cleanup completed cleanly.");
  await prisma.$disconnect();
});
