import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const company = await prisma.company.findFirst({
      include: {
        bankAccounts: true,
        upiDetails: true,
        settings: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load settings" },
      { status: 500 }
    );
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

