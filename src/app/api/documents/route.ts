import { NextRequest, NextResponse } from "next/server";
import { getDocuments, createDocument } from "@/services/documents/document-service";
import { DocumentType, DocumentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") as DocumentType) || undefined;
    const status = (searchParams.get("status") as DocumentStatus) || undefined;
    const customerId = searchParams.get("customerId") || undefined;
    const search = searchParams.get("search") || undefined;

    const docs = await getDocuments({ type, status, customerId, search });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const doc = await createDocument(body);
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create document" },
      { status: 400 }
    );
  }
}

