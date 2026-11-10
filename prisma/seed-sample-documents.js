const { PrismaClient, DocumentType, DocumentStatus, PaymentMethod } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample real-world documents for Ultimate Graphics...");

  const company = await prisma.company.findFirst({
    include: { bankAccounts: true, upiDetails: true, settings: true },
  });

  const prestige = await prisma.customer.findFirst({
    where: { companyName: { contains: "Prestige" } },
  });

  const sobha = await prisma.customer.findFirst({
    where: { companyName: { contains: "Sobha" } },
  });

  const techcorp = await prisma.customer.findFirst({
    where: { companyName: { contains: "TechCorp" } },
  });

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
  };

  const bankSnapshot = company.bankAccounts[0]
    ? {
        accountHolder: company.bankAccounts[0].accountHolder,
        bankName: company.bankAccounts[0].bankName,
        accountNumber: company.bankAccounts[0].accountNumber,
        ifsc: company.bankAccounts[0].ifsc,
        branch: company.bankAccounts[0].branch,
      }
    : null;

  const upiSnapshot = company.upiDetails[0]
    ? {
        upiId: company.upiDetails[0].upiId,
        payeeName: company.upiDetails[0].payeeName,
      }
    : null;

  // 1. Create Quotation
  const qtn1 = await prisma.document.upsert({
    where: { documentNumber: "UG/QTN/26-27/0101" },
    update: {},
    create: {
      documentNumber: "UG/QTN/26-27/0101",
      documentType: DocumentType.QUOTATION,
      status: DocumentStatus.ISSUED,
      issueDate: new Date("2026-11-01"),
      validityDate: new Date("2026-11-30"),
      referenceNo: "PR-REQ-9921",
      projectName: "Prestige Tech Park External Wayfinding Totems",
      projectLocation: "Marathahalli-Sarjapur Ring Road",
      siteAddress: "Building 2 Main Entrance, Prestige Tech Park",

      customerId: prestige.id,
      customerName: prestige.companyName,
      customerContactPerson: prestige.contactPerson,
      customerEmail: prestige.email,
      customerPhone: prestige.phone,
      customerGstin: prestige.gstin,
      customerBillingAddress: prestige.billingAddress,
      customerShippingAddress: prestige.shippingAddress,
      placeOfSupplyState: prestige.billingState,
      placeOfSupplyCode: prestige.billingStateCode,
      isInterState: false,

      subtotal: 75000.00,
      discountValue: 5.00,
      discountAmount: 3750.00,
      taxableAmount: 71250.00,
      cgstAmount: 6412.50,
      sgstAmount: 6412.50,
      igstAmount: 0.00,
      totalTaxAmount: 12825.00,
      roundOff: 0.00,
      totalAmount: 84075.00,
      amountReceived: 0.00,
      balanceDue: 84075.00,

      paymentTerms: "50% Advance with Purchase Order, 50% Balance on Delivery & Installation.",
      notes: "Quotation valid for 30 calendar days from issue date.",
      termsAndConditions: company.settings?.defaultTerms,

      companySnapshot,
      bankSnapshot,
      upiSnapshot,
      isLocked: true,

      items: {
        create: [
          {
            name: "3D Illuminated Channel Letters",
            description: "High-grade aluminium returns with Samsung LED lighting and Meanwell power supply",
            hsnSac: "940540",
            unit: "Running ft.",
            dimensions: "24 ft length x 3 ft height",
            specifications: "Cast acrylic face, 12V waterproof modules",
            quantity: 24,
            unitRate: 1500.00,
            taxableAmount: 36000.00,
            gstRate: 18.00,
            cgstRate: 9.00,
            cgstAmount: 3240.00,
            sgstRate: 9.00,
            sgstAmount: 3240.00,
            totalTax: 6480.00,
            finalAmount: 42480.00,
            sortOrder: 0,
          },
          {
            name: "Cabinet Signs",
            description: "Heavy-gauge extruded aluminium box with polycarbonate face and internal lighting",
            hsnSac: "831000",
            unit: "Sq. ft.",
            dimensions: "10 ft x 4 ft",
            specifications: "Extruded frame with powder coating finish",
            quantity: 40,
            unitRate: 850.00,
            taxableAmount: 34000.00,
            gstRate: 18.00,
            cgstRate: 9.00,
            cgstAmount: 3060.00,
            sgstRate: 9.00,
            sgstAmount: 3060.00,
            totalTax: 6120.00,
            finalAmount: 40120.00,
            sortOrder: 1,
          },
          {
            name: "Metal Laser Cutting",
            description: "Laser profiling of mounting brackets and base plates in 3mm SS 304",
            hsnSac: "998898",
            unit: "Hours",
            quantity: 2,
            unitRate: 2500.00,
            taxableAmount: 5000.00,
            gstRate: 18.00,
            cgstRate: 9.00,
            cgstAmount: 450.00,
            sgstRate: 9.00,
            sgstAmount: 450.00,
            totalTax: 900.00,
            finalAmount: 5900.00,
            sortOrder: 2,
          },
        ],
      },
      taxSummaries: {
        create: [
          {
            hsnSac: "940540",
            gstRate: 18.00,
            taxableAmount: 34200.00,
            cgstAmount: 3078.00,
            sgstAmount: 3078.00,
            igstAmount: 0.00,
            totalTax: 6156.00,
          },
          {
            hsnSac: "831000",
            gstRate: 18.00,
            taxableAmount: 32300.00,
            cgstAmount: 2907.00,
            sgstAmount: 2907.00,
            igstAmount: 0.00,
            totalTax: 5814.00,
          },
          {
            hsnSac: "998898",
            gstRate: 18.00,
            taxableAmount: 4750.00,
            cgstAmount: 427.50,
            sgstAmount: 427.50,
            igstAmount: 0.00,
            totalTax: 855.00,
          },
        ],
      },
    },
  });
  console.log("Quotation seeded:", qtn1.documentNumber);

  // 2. Create Proforma Invoice with Advance Payment
  const pi1 = await prisma.document.upsert({
    where: { documentNumber: "UG/PI/26-27/0101" },
    update: {},
    create: {
      documentNumber: "UG/PI/26-27/0101",
      documentType: DocumentType.PROFORMA_INVOICE,
      status: DocumentStatus.PARTIALLY_PAID,
      issueDate: new Date("2026-11-03"),
      dueDate: new Date("2026-11-17"),
      referenceNo: "SOBHA-WO-4091",
      projectName: "Sobha Dream Acres Clubhouse Neon & Wayfinding",
      projectLocation: "Balagere, East Bengaluru",
      siteAddress: "Clubhouse Reception Lobby & Corridor",

      customerId: sobha.id,
      customerName: sobha.companyName,
      customerContactPerson: sobha.contactPerson,
      customerEmail: sobha.email,
      customerPhone: sobha.phone,
      customerGstin: sobha.gstin,
      customerBillingAddress: sobha.billingAddress,
      customerShippingAddress: sobha.shippingAddress,
      placeOfSupplyState: sobha.billingState,
      placeOfSupplyCode: sobha.billingStateCode,
      isInterState: false,

      subtotal: 58000.00,
      discountValue: 0.00,
      discountAmount: 0.00,
      taxableAmount: 58000.00,
      cgstAmount: 5220.00,
      sgstAmount: 5220.00,
      igstAmount: 0.00,
      totalTaxAmount: 10440.00,
      roundOff: 0.00,
      totalAmount: 68440.00,
      advancePercentage: 50.00,
      advanceAmount: 34220.00,
      amountReceived: 34220.00,
      balanceDue: 34220.00,

      paymentTerms: "50% Advance with Work Order, 50% Balance on Delivery & Installation.",
      notes: "Advance cleared. Fabrication in progress at Central London Industrial Workshop.",
      termsAndConditions: company.settings?.defaultTerms,

      companySnapshot,
      bankSnapshot,
      upiSnapshot,
      isLocked: true,

      items: {
        create: [
          {
            name: "Neon Signs",
            description: "Custom hand-crafted flex neon mounted on CNC contoured acrylic backer with 12V adapter",
            hsnSac: "940540",
            unit: "Running ft.",
            dimensions: "20 ft neon run",
            specifications: "Dual tone cyan & warm white LED neon flex",
            quantity: 20,
            unitRate: 1450.00,
            taxableAmount: 29000.00,
            gstRate: 18.00,
            cgstRate: 9.00,
            cgstAmount: 2610.00,
            sgstRate: 9.00,
            sgstAmount: 2610.00,
            totalTax: 5220.00,
            finalAmount: 34220.00,
            sortOrder: 0,
          },
          {
            name: "Directional Signs",
            description: "Modular curved aluminium wayfinding markers and directory totems",
            hsnSac: "831000",
            unit: "Nos",
            quantity: 8,
            unitRate: 3625.00,
            taxableAmount: 29000.00,
            gstRate: 18.00,
            cgstRate: 9.00,
            cgstAmount: 2610.00,
            sgstRate: 9.00,
            sgstAmount: 2610.00,
            totalTax: 5220.00,
            finalAmount: 34220.00,
            sortOrder: 1,
          },
        ],
      },
      taxSummaries: {
        create: [
          {
            hsnSac: "940540",
            gstRate: 18.00,
            taxableAmount: 29000.00,
            cgstAmount: 2610.00,
            sgstAmount: 2610.00,
            igstAmount: 0.00,
            totalTax: 5220.00,
          },
          {
            hsnSac: "831000",
            gstRate: 18.00,
            taxableAmount: 29000.00,
            cgstAmount: 2610.00,
            sgstAmount: 2610.00,
            igstAmount: 0.00,
            totalTax: 5220.00,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentNumber: "UG/REC/26-27/0101",
            amount: 34220.00,
            paymentMethod: PaymentMethod.BANK_TRANSFER,
            transactionRef: "HDFC_CMS_9941827",
            bankName: "HDFC Bank",
            notes: "50% Advance received against Proforma Invoice",
          },
        ],
      },
    },
  });
  console.log("Proforma Invoice seeded:", pi1.documentNumber);

  // 3. Create GST Tax Invoice (Inter-State IGST Example) with Full Payment Settled
  const inv1 = await prisma.document.upsert({
    where: { documentNumber: "UG/INV/26-27/0101" },
    update: {},
    create: {
      documentNumber: "UG/INV/26-27/0101",
      documentType: DocumentType.TAX_INVOICE,
      status: DocumentStatus.PAID,
      issueDate: new Date("2026-11-05"),
      dueDate: new Date("2026-11-20"),
      referenceNo: "TECH-IN-2026-088",
      projectName: "TechCorp Mumbai Headquarters Branding & Frosting",
      projectLocation: "Goregaon East, Mumbai",
      siteAddress: "Floor 8, Tower 4, Nesco IT Park, Western Express Highway",

      customerId: techcorp.id,
      customerName: techcorp.companyName,
      customerContactPerson: techcorp.contactPerson,
      customerEmail: techcorp.email,
      customerPhone: techcorp.phone,
      customerGstin: techcorp.gstin,
      customerBillingAddress: techcorp.billingAddress,
      customerShippingAddress: techcorp.shippingAddress,
      placeOfSupplyState: "Maharashtra",
      placeOfSupplyCode: "27",
      isInterState: true, // Inter-state Karnataka -> Maharashtra!

      subtotal: 98000.00,
      discountValue: 0.00,
      discountAmount: 0.00,
      taxableAmount: 98000.00,
      cgstAmount: 0.00,
      sgstAmount: 0.00,
      igstAmount: 17640.00, // 18% IGST
      totalTaxAmount: 17640.00,
      roundOff: 0.00,
      totalAmount: 115640.00,
      amountReceived: 115640.00,
      balanceDue: 0.00,

      paymentTerms: "Net 15 Days. 100% Payment settled.",
      notes: "Installation complete and inspected by facilities brand manager.",
      termsAndConditions: company.settings?.defaultTerms,

      companySnapshot,
      bankSnapshot,
      upiSnapshot,
      isLocked: true,

      items: {
        create: [
          {
            name: "Metal Letters",
            description: "Precision laser cut stainless steel 304 grade with PVD Titanium mirror gold finish",
            hsnSac: "831000",
            unit: "Running ft.",
            dimensions: "28 ft total wordmark length",
            specifications: "SS 304 grade 2mm face with 25mm returns",
            quantity: 28,
            unitRate: 1750.00,
            taxableAmount: 49000.00,
            gstRate: 18.00,
            cgstRate: 0.00,
            cgstAmount: 0.00,
            sgstRate: 0.00,
            sgstAmount: 0.00,
            igstRate: 18.00,
            igstAmount: 8820.00,
            totalTax: 8820.00,
            finalAmount: 57820.00,
            sortOrder: 0,
          },
          {
            name: "Glass Frosting",
            description: "Architectural dusted vinyl with precision plotter patterned bands and company logos",
            hsnSac: "998399",
            unit: "Sq. ft.",
            dimensions: "350 Sq. ft. partitioned glass panels",
            specifications: "3M Fasara style architectural film",
            quantity: 350,
            unitRate: 140.00,
            taxableAmount: 49000.00,
            gstRate: 18.00,
            cgstRate: 0.00,
            cgstAmount: 0.00,
            sgstRate: 0.00,
            sgstAmount: 0.00,
            igstRate: 18.00,
            igstAmount: 8820.00,
            totalTax: 8820.00,
            finalAmount: 57820.00,
            sortOrder: 1,
          },
        ],
      },
      taxSummaries: {
        create: [
          {
            hsnSac: "831000",
            gstRate: 18.00,
            taxableAmount: 49000.00,
            cgstAmount: 0.00,
            sgstAmount: 0.00,
            igstAmount: 8820.00,
            totalTax: 8820.00,
          },
          {
            hsnSac: "998399",
            gstRate: 18.00,
            taxableAmount: 49000.00,
            cgstAmount: 0.00,
            sgstAmount: 0.00,
            igstAmount: 8820.00,
            totalTax: 8820.00,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentNumber: "UG/REC/26-27/0102",
            amount: 115640.00,
            paymentMethod: PaymentMethod.UPI,
            transactionRef: "UPI_AXIS_771029384",
            bankName: "HDFC Bank",
            notes: "100% full invoice settlement via corporate UPI",
          },
        ],
      },
    },
  });
  console.log("GST Tax Invoice seeded:", inv1.documentNumber);

  console.log("Real-world sample document seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding sample documents:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
