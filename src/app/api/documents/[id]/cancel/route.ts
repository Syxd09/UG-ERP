import { NextRequest, NextResponse } from "next/server";
import { cancelDocument } from "@/services/documents/document-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await cancelDocument(params.id);
    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel document" },
      { status: 400 }
    );
  }
}

