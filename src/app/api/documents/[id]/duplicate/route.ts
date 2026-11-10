import { NextRequest, NextResponse } from "next/server";
import { duplicateDocument } from "@/services/documents/document-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const copy = await duplicateDocument(params.id);
    return NextResponse.json({ success: true, data: copy }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to duplicate document" },
      { status: 400 }
    );
  }
}

