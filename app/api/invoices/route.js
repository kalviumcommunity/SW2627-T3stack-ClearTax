import { NextResponse } from "next/server";
import {
  getUserInvoices,
  addUserInvoice,
  getUserIdFromRequest,
} from "../../../lib/invoices";

export async function GET(request) {
  const userId = getUserIdFromRequest(request);
  const userInvoices = getUserInvoices(userId);

  return NextResponse.json({
    success: true,
    count: userInvoices.length,
    data: userInvoices,
  });
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    const {
      invoiceNumber,
      customerName,
      invoiceDate,
      amount,
      gstNumber,
    } = body;

    if (
      !invoiceNumber ||
      !customerName ||
      !invoiceDate ||
      !amount ||
      !gstNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All invoice fields are required",
        },
        { status: 400 }
      );
    }

    const userInvoices = getUserInvoices(userId);
    const existingInvoice = userInvoices.find(
      (invoice) => invoice.invoiceNumber === invoiceNumber
    );

    if (existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice number already exists",
        },
        { status: 409 }
      );
    }

    const newInvoice = addUserInvoice(userId, {
      invoiceNumber,
      customerName,
      invoiceDate,
      amount: Number(amount),
      gstNumber,
      status: "pending",
      error: null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invoice created successfully",
        data: newInvoice,
      },
      { status: 201 }
    );
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