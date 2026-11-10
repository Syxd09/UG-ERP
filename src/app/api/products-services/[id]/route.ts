import { NextRequest, NextResponse } from "next/server";
import {
  updateProductService,
  deleteProductService,
} from "@/services/catalogue/catalogue-service";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await updateProductService(params.id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update service" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteProductService(params.id);
    return NextResponse.json({
      success: true,
      message: "Service archived successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete service" },
      { status: 400 }
    );
  }
}
