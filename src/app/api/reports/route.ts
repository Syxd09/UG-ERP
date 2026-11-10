import { NextResponse } from "next/server";
import { getFinancialReports } from "@/services/reports/analytics-service";

export async function GET() {
  try {
    const data = await getFinancialReports();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate financial reports" },
      { status: 500 }
    );
  }
}

