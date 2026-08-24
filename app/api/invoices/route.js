import { NextResponse } from "next/server";
import { invoices } from "../../../lib/invoices";

export async function GET() {
  return NextResponse.json({
    success: true,
    count: invoices.length,
    data: invoices,
  });
}

export async function POST(request) {
  try {
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

    const existingInvoice = invoices.find(
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

    const newInvoice = {
      id: invoices.length + 1,
      invoiceNumber,
      customerName,
      invoiceDate,
      amount: Number(amount),
      gstNumber,
      status: "pending",
      error: null,
    };

    invoices.push(newInvoice);

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