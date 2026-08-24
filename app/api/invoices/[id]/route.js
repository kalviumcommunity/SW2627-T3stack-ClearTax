import { NextResponse } from "next/server";
import { invoices } from "@/lib/invoices";

export async function GET(request, { params }) {
  const { id } = await params;

  const invoice = invoices.find(
    (item) => item.id === Number(id)
  );

  if (!invoice) {
    return NextResponse.json(
      {
        success: false,
        message: "Invoice not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: invoice,
  });
  
}
export async function PATCH(request, { params }) {
  const { id } = await params;
  const invoiceId = Number(id);

  const invoice = invoices.find(
    (item) => item.id === invoiceId
  );

  if (!invoice) {
    return NextResponse.json(
      {
        success: false,
        message: "Invoice not found",
      },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();

    const { status, error } = body;

    const allowedStatuses = [
      "pending",
      "processing",
      "matched",
      "mismatch",
      "failed",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invoice status",
        },
        { status: 400 }
      );
    }

    if (status) {
      invoice.status = status;
    }

    if (error !== undefined) {
      invoice.error = error;
    }

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request data",
      },
      { status: 400 }
    );
  }
}