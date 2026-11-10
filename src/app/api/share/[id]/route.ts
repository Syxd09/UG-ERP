import { NextRequest, NextResponse } from "next/server";
import { getDocumentById } from "@/services/documents/document-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await getDocumentById(params.id);
    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Document not found or link has expired." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load document" },
      { status: 500 }
    );
  }
}
