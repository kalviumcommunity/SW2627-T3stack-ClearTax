import { NextResponse } from "next/server";
import {
  getUserInvoices,
  updateUserInvoice,
  getUserIdFromRequest,
} from "@/lib/invoices";

export async function GET(request, { params }) {
  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  const userInvoices = getUserInvoices(userId);

  const invoice = userInvoices.find(
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
  const userId = getUserIdFromRequest(request);
  const userInvoices = getUserInvoices(userId);

  const invoice = userInvoices.find(
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

    const updates = {};
    if (status) updates.status = status;
    if (error !== undefined) updates.error = error;

    const updated = updateUserInvoice(userId, invoiceId, updates);

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully",
      data: updated,
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