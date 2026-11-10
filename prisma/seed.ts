import { PrismaClient, DocumentType, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Ultimate Graphics Billing Management System...");

  // 1. Create or update Admin User
  const passwordHash = await bcrypt.hash("Admin@UG2026", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ultimategraphics.com" },
    update: {
      passwordHash,
      role: Role.ADMIN,
      name: "Ultimate Graphics Admin",
    },
    create: {
      email: "admin@ultimategraphics.com",
      name: "Ultimate Graphics Admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log("Admin user created:", admin.email);

  // 2. Company Profile
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
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
        logoUrl: "/logos/main-logo.png",
        symbolLogoUrl: "/logos/symbol-logo.jpeg",
      },
    });
  }

  // 3. Bank Account
  await prisma.bankAccount.deleteMany({ where: { companyId: company.id } });
  await prisma.bankAccount.create({
    data: {
      companyId: company.id,
      accountHolder: "Ultimate Graphics",
      bankName: "HDFC Bank Ltd",
      accountNumber: "50200012345678",
      ifsc: "HDFC0000142",
      branch: "Peenya Industrial Area, Bengaluru",
      isDefault: true,
    },
  });

  // 4. UPI Detail
  await prisma.upiDetail.deleteMany({ where: { companyId: company.id } });
  await prisma.upiDetail.create({
    data: {
      companyId: company.id,
      upiId: "ultimategraphics@hdfcbank",
      payeeName: "Ultimate Graphics",
      isDefault: true,
    },
  });

  // 5. Company Settings
  await prisma.companySettings.upsert({
    where: { companyId: company.id },
    update: {
      invoicePrefix: "UG/INV",
      quotationPrefix: "UG/QTN",
      proformaPrefix: "UG/PI",
      financialYear: "2026-27",
    },
    create: {
      companyId: company.id,
      invoicePrefix: "UG/INV",
      quotationPrefix: "UG/QTN",
      proformaPrefix: "UG/PI",
      financialYear: "2026-27",
      defaultPaymentTerms: "50% Advance with Work Order, 50% Balance on Delivery & Installation.",
      defaultQuotationValidityDays: 30,
      defaultTaxRate: 18.00,
      defaultNotes: "Thank you for partnering with Ultimate Graphics. With 16 years of craft, precision, and passion, we guarantee excellence in every installation.",
      defaultTerms: "1. All dimensions and site measurements are subject to final site inspection.\n2. Delivery and installation: 7-10 working days post final artwork and advance clearance.\n3. Civil work, structural load approval, and external 230V electrical feed to be arranged by the client.\n4. Quotation valid for 30 calendar days from issue date.\n5. Warranty: 12 months on LED modules and power supplies against manufacturer defects.",
      enableRoundOff: true,
    },
  });

  // 6. Document Sequences
  const docTypes = [
    { type: DocumentType.QUOTATION, prefix: "UG/QTN" },
    { type: DocumentType.PROFORMA_INVOICE, prefix: "UG/PI" },
    { type: DocumentType.TAX_INVOICE, prefix: "UG/INV" },
  ];

  for (const doc of docTypes) {
    await prisma.documentSequence.upsert({
      where: {
        companyId_docType_financialYear: {
          companyId: company.id,
          docType: doc.type,
          financialYear: "2026-27",
        },
      },
      update: {},
      create: {
        companyId: company.id,
        docType: doc.type,
        prefix: doc.prefix,
        financialYear: "2026-27",
        currentNumber: 100, // Starts at 101
      },
    });
  }

  // 7. Seed Products & Services Catalogue
  const catalogue = [
    // SIGNAGE
    {
      name: "Cabinet Signs",
      category: "SIGNAGE",
      description: "Heavy-gauge extruded aluminium box with polycarbonate face, internal Samsung LED illumination and Meanwell drivers.",
      hsnSac: "831000",
      unit: "Sq. ft.",
      defaultRate: 850.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Station Signs",
      category: "SIGNAGE",
      description: "Architectural railway/metro grade station identification signs with vitreous enamel / reflective retro-grade sheeting.",
      hsnSac: "831000",
      unit: "Sq. ft.",
      defaultRate: 1150.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Neon Signs",
      category: "SIGNAGE",
      description: "Custom hand-crafted flex neon or traditional glass tube neon mounted on CNC contoured acrylic backer with 12V adapter.",
      hsnSac: "940540",
      unit: "Running ft.",
      defaultRate: 1450.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Digital Signage",
      category: "SIGNAGE",
      description: "Commercial high-brightness P2.5/P4 indoor/outdoor LED video wall display with cloud CMS controller.",
      hsnSac: "852859",
      unit: "Sq. ft.",
      defaultRate: 4500.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Directional Signs",
      category: "SIGNAGE",
      description: "Modular curved aluminium wayfinding way-markers, directory totems, and suspended directional arrows.",
      hsnSac: "831000",
      unit: "Nos",
      defaultRate: 3200.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Custom Signs",
      category: "SIGNAGE",
      description: "Architectural bespoke sign assembly combining brushed brass, acrylic, and halo illumination.",
      hsnSac: "831000",
      unit: "Lot",
      defaultRate: 15000.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Engraved Signs",
      category: "SIGNAGE",
      description: "Rotary/laser engraved multi-ply acrylic, brass or anodised aluminium plates with enamel paint fill.",
      hsnSac: "831000",
      unit: "Sq. ft.",
      defaultRate: 650.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Channel Letters",
      category: "SIGNAGE",
      description: "3D fabricated aluminium return letters with cast acrylic face and internal LED halo/face lighting.",
      hsnSac: "940540",
      unit: "Running ft.",
      defaultRate: 1250.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Metal Letters",
      category: "SIGNAGE",
      description: "Precision waterjet/laser cut stainless steel 304 grade (brushed/mirror gold/rose gold PVD finish) letters.",
      hsnSac: "831000",
      unit: "Running ft.",
      defaultRate: 1650.00,
      defaultGstRate: 18.00,
    },

    // BRANDING
    {
      name: "Vehicle Branding",
      category: "BRANDING",
      description: "Full or partial commercial vehicle branding using 3M IJ180 Cast wrap film with matching gloss/matte overlaminate.",
      hsnSac: "998399",
      unit: "Sq. ft.",
      defaultRate: 240.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Vehicle Stickering",
      category: "BRANDING",
      description: "Precision contour-cut Avery/3M vinyl lettering and logos for corporate fleet identification.",
      hsnSac: "998399",
      unit: "Sq. ft.",
      defaultRate: 160.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Glass Frosting",
      category: "BRANDING",
      description: "Architectural frosted/dusted vinyl with precision plotter patterned bands and company logos.",
      hsnSac: "998399",
      unit: "Sq. ft.",
      defaultRate: 95.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Vinyl Banners",
      category: "BRANDING",
      description: "Heavy duty 440 GSM frontlit banner with reinforced hemmed edges and brass eyelets.",
      hsnSac: "998912",
      unit: "Sq. ft.",
      defaultRate: 45.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Stickering",
      category: "BRANDING",
      description: "Custom die-cut self-adhesive vinyl decals and labels with UV cure inks.",
      hsnSac: "998912",
      unit: "Sq. ft.",
      defaultRate: 75.00,
      defaultGstRate: 18.00,
    },

    // FABRICATION
    {
      name: "Metal Laser Cutting",
      category: "FABRICATION",
      description: "Fiber laser precision profiling of MS up to 16mm, SS up to 10mm, and Aluminium up to 8mm with nitrogen assist.",
      hsnSac: "998898",
      unit: "Hours",
      defaultRate: 2800.00,
      defaultGstRate: 18.00,
    },
    {
      name: "CNC Router",
      category: "FABRICATION",
      description: "5-Axis precision CNC routing of ACP, acrylic, MDF, solid surface Corian, and foam sheets.",
      hsnSac: "998898",
      unit: "Hours",
      defaultRate: 1200.00,
      defaultGstRate: 18.00,
    },

    // PRINTING
    {
      name: "Printing",
      category: "PRINTING",
      description: "Eco-solvent / UV high-resolution 1440 DPI photographic printing on vinyl, back-lit film or canvas.",
      hsnSac: "998912",
      unit: "Sq. ft.",
      defaultRate: 65.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Plotting",
      category: "PRINTING",
      description: "High-precision CAD plotting and line drawings on 80/100 GSM bond paper.",
      hsnSac: "998912",
      unit: "Sq. m.",
      defaultRate: 50.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Sun Board Printing",
      category: "PRINTING",
      description: "Direct UV flatbed printing on 3mm / 5mm high-density sunboard sheet.",
      hsnSac: "998912",
      unit: "Sq. ft.",
      defaultRate: 110.00,
      defaultGstRate: 18.00,
    },
    {
      name: "Business Card Printing",
      category: "PRINTING",
      description: "Premium 350 GSM matte laminated corporate business cards with spot UV and velvet touch finish.",
      hsnSac: "998912",
      unit: "Set",
      defaultRate: 850.00,
      defaultGstRate: 18.00,
    },
  ];

  for (const item of catalogue) {
    const existing = await prisma.productService.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.productService.create({ data: item });
    }
  }
  console.log(`Catalogue seeded with ${catalogue.length} services.`);

  // 8. Seed Sample Customers
  const customers = [
    {
      companyName: "Prestige Estates Projects Ltd",
      contactPerson: "Mr. Rajesh Sharma (Head of Facilities)",
      email: "rajesh.sharma@prestigeconstructions.com",
      phone: "+91 98450 11223",
      gstin: "29AAACP1234A1Z5",
      pan: "AAACP1234A",
      billingAddress: "The Falcon Tower, No. 19, Brunton Road",
      billingCity: "Bengaluru",
      billingState: "Karnataka",
      billingStateCode: "29",
      billingPincode: "560025",
      shippingAddress: "Prestige Tech Park, Marathahalli-Sarjapur Outer Ring Road",
      shippingCity: "Bengaluru",
      shippingState: "Karnataka",
      shippingStateCode: "29",
      shippingPincode: "560103",
      notes: "Key enterprise client. Requires prior security clearance for site installations.",
    },
    {
      companyName: "Sobha Developers Ltd",
      contactPerson: "Ms. Anita Desai (Procurement Manager)",
      email: "anita.desai@sobha.com",
      phone: "+91 98800 44556",
      gstin: "29AAACS5678B1Z2",
      pan: "AAACS5678B",
      billingAddress: "SOBHA Corporate Office, Sarjapur-Marathahalli Road",
      billingCity: "Bengaluru",
      billingState: "Karnataka",
      billingStateCode: "29",
      billingPincode: "560103",
      shippingAddress: "Sobha Dream Acres Site Office, Balagere",
      shippingCity: "Bengaluru",
      shippingState: "Karnataka",
      shippingStateCode: "29",
      shippingPincode: "560087",
      notes: "Standard 30-day payment cycle. High volume exterior directional signage.",
    },
    {
      companyName: "TechCorp Global Solutions",
      contactPerson: "Kunal Verma (Brand Lead)",
      email: "kunal.verma@techcorpglobal.in",
      phone: "+91 99200 77889",
      gstin: "27AABCT9999C1Z8", // Maharashtra GSTIN - Inter-state IGST test case!
      pan: "AABCT9999C",
      billingAddress: "Tower 4, Nesco IT Park, Western Express Highway, Goregaon East",
      billingCity: "Mumbai",
      billingState: "Maharashtra",
      billingStateCode: "27",
      billingPincode: "400063",
      shippingAddress: "Tower 4, Nesco IT Park, Western Express Highway, Goregaon East",
      shippingCity: "Mumbai",
      shippingState: "Maharashtra",
      shippingStateCode: "27",
      shippingPincode: "400063",
      notes: "Inter-state account. All invoices must be billed with 18% IGST.",
    },
  ];

  for (const cust of customers) {
    const existing = await prisma.customer.findFirst({ where: { companyName: cust.companyName } });
    if (!existing) {
      await prisma.customer.create({ data: cust });
    }
  }
  console.log(`Customers seeded (${customers.length} records).`);

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

