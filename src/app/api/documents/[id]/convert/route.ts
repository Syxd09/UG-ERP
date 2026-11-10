import { NextRequest, NextResponse } from "next/server";
import { convertDocument } from "@/services/documents/document-service";
import { DocumentType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const targetType = body.targetType as DocumentType;

    if (!targetType) {
      return NextResponse.json(
        { success: false, error: "Target document type is required" },
        { status: 400 }
      );
    }

    const convertedDoc = await convertDocument(params.id, targetType);
    return NextResponse.json({ success: true, data: convertedDoc });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to convert document" },
      { status: 400 }
    );
  }
}
