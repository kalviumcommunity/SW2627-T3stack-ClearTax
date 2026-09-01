import { NextResponse } from "next/server";
import {
  getUserInvoices,
  addUserInvoice,
  getUserIdFromRequest,
} from "../../../lib/invoices";

// GET /api/invoices
export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);
    const invoices = await getUserInvoices(userId);

    return NextResponse.json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    console.error("GET /api/invoices error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch invoices",
      },
      { status: 500 }
    );
  }
}

// POST /api/invoices
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

    // Validate required fields
    if (
      !invoiceNumber ||
      !customerName ||
      !invoiceDate ||
      amount === undefined ||
      amount === null ||
      amount === "" ||
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

    // Validate amount
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return NextResponse.json(
        {
          success: false,
          message: "Amount must be a valid number",
        },
        { status: 400 }
      );
    }

    // Check duplicate invoice number for this user
    const existingInvoices = await getUserInvoices(userId);
    const existingInvoice = existingInvoices.find(
      (inv) => inv.invoiceNumber === invoiceNumber
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

    const newInvoice = await addUserInvoice(userId, {
      invoiceNumber,
      customerName,
      invoiceDate,
      amount: numericAmount,
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
  } catch (error) {
    console.error("POST /api/invoices error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create invoice",
      },
      { status: 500 }
    );
  }
}