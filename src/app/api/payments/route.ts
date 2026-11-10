import { NextRequest, NextResponse } from "next/server";
import { getPayments, recordPayment } from "@/services/payments/payment-service";
import { PaymentMethod } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const method = (searchParams.get("method") as PaymentMethod) || undefined;
    const search = searchParams.get("search") || undefined;

    const payments = await getPayments({ method, search });
    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payment = await recordPayment(body);
    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 400 }
    );
  }
}

