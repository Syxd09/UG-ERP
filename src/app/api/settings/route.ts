import { NextRequest, NextResponse } from "next/server";
import prisma, { isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const defaultCompanyProfile = {
  id: "default-ug-company",
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
  bankAccounts: [
    {
      id: "ug-bank-default",
      companyId: "default-ug-company",
      accountHolder: "Ultimate Graphics",
      bankName: "HDFC Bank Ltd",
      accountNumber: "50200012345678",
      ifsc: "HDFC0000142",
      branch: "Peenya Industrial Area, Bengaluru",
      isPrimary: true,
    },
  ],
  upiDetails: [
    {
      id: "ug-upi-default",
      companyId: "default-ug-company",
      upiId: "ultimategraphics@hdfcbank",
      payeeName: "Ultimate Graphics",
      isPrimary: true,
    },
  ],
  settings: {
    id: "ug-settings-default",
    companyId: "default-ug-company",
    qtnPrefix: "UG/QTN",
    piPrefix: "UG/PI",
    invPrefix: "UG/INV",
    fiscalYearStartMonth: 4,
    defaultPaymentTerms: "50% advance with confirmed PO, balance against delivery/installation.",
    defaultTermsAndConditions: "1. Delivery and installation: 7-10 working days from approval and advance.\n2. Civil and electrical connections at site to be provided by client.\n3. Quotation valid for 30 calendar days from issue date.",
  },
};

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, data: defaultCompanyProfile });
  }

  try {
    const company = await prisma.company.findFirst({
      include: {
        bankAccounts: true,
        upiDetails: true,
        settings: true,
      },
    });

    if (!company) {
      return NextResponse.json({ success: true, data: defaultCompanyProfile });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.warn("Using default company profile due to DB error:", error);
    return NextResponse.json({ success: true, data: defaultCompanyProfile });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, bank, upi, settings } = body;

    const existingCompany = await prisma.company.findFirst();
    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company profile not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update company profile
      const c = await tx.company.update({
        where: { id: existingCompany.id },
        data: {
          name: company.name,
          legalName: company.legalName,
          tagline: company.tagline,
          gstin: company.gstin ? company.gstin.trim().toUpperCase() : null,
          pan: company.pan ? company.pan.trim().toUpperCase() : null,
          state: company.state,
          stateCode: company.stateCode,
          email: company.email,
          phone: company.phone,
          website: company.website,
          address: company.address,
          city: company.city,
          pincode: company.pincode,
        },
      });

      // 2. Update default Bank Account
      if (bank) {
        const defaultBank = await tx.bankAccount.findFirst({
          where: { companyId: c.id, isDefault: true },
        });

        if (defaultBank) {
          await tx.bankAccount.update({
            where: { id: defaultBank.id },
            data: {
              accountHolder: bank.accountHolder,
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              ifsc: bank.ifsc.toUpperCase(),
              branch: bank.branch,
            },
          });
        }
      }

      // 3. Update default UPI
      if (upi) {
        const defaultUpi = await tx.upiDetail.findFirst({
          where: { companyId: c.id, isDefault: true },
        });

        if (defaultUpi) {
          await tx.upiDetail.update({
            where: { id: defaultUpi.id },
            data: {
              upiId: upi.upiId,
              payeeName: upi.payeeName,
            },
          });
        }
      }

      // 4. Update Document Settings
      if (settings) {
        await tx.companySettings.upsert({
          where: { companyId: c.id },
          update: {
            invoicePrefix: settings.invoicePrefix,
            quotationPrefix: settings.quotationPrefix,
            proformaPrefix: settings.proformaPrefix,
            financialYear: settings.financialYear,
            defaultPaymentTerms: settings.defaultPaymentTerms,
            defaultQuotationValidityDays: Number(settings.defaultQuotationValidityDays) || 30,
            defaultTerms: settings.defaultTerms,
            defaultNotes: settings.defaultNotes,
            enableRoundOff: settings.enableRoundOff,
          },
          create: {
            companyId: c.id,
            invoicePrefix: settings.invoicePrefix || "UG/INV",
            quotationPrefix: settings.quotationPrefix || "UG/QTN",
            proformaPrefix: settings.proformaPrefix || "UG/PI",
            financialYear: settings.financialYear || "2026-27",
            defaultPaymentTerms: settings.defaultPaymentTerms || "",
            defaultQuotationValidityDays: 30,
            defaultTerms: settings.defaultTerms || "",
            defaultNotes: settings.defaultNotes || "",
            enableRoundOff: true,
          },
        });
      }

      return c;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 400 }
    );
  }
}

