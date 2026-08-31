import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

function getUserIdFromRequest(request) {
  // Check header first
  const headerUserId = request.headers.get("x-user-id");

  if (headerUserId) {
    return headerUserId.trim().toLowerCase();
  }

  // Check URL query parameter
  try {
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");

    if (queryUserId) {
      return queryUserId.trim().toLowerCase();
    }
  } catch {
    // Ignore URL parsing errors
  }

  return "default_user";
}

// GET /api/invoices
export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);

    const result = await query(
      `
      SELECT
        id,
        user_id AS "userId",
        invoice_number AS "invoiceNumber",
        customer_name AS "customerName",
        TO_CHAR(invoice_date, 'YYYY-MM-DD') AS "invoiceDate",
        amount,
        gst_number AS "gstNumber",
        status,
        error,
        created_at AS "createdAt"
      FROM invoices
      WHERE user_id = $1
      ORDER BY id DESC
      `,
      [userId]
    );

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
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
    const existingInvoice = await query(
      `
      SELECT id
      FROM invoices
      WHERE user_id = $1
      AND invoice_number = $2
      LIMIT 1
      `,
      [userId, invoiceNumber]
    );

    if (existingInvoice.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invoice number already exists",
        },
        { status: 409 }
      );
    }

    // Insert invoice into PostgreSQL
    const result = await query(
      `
      INSERT INTO invoices (
        user_id,
        invoice_number,
        customer_name,
        invoice_date,
        amount,
        gst_number,
        status,
        error
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        user_id AS "userId",
        invoice_number AS "invoiceNumber",
        customer_name AS "customerName",
        TO_CHAR(invoice_date, 'YYYY-MM-DD') AS "invoiceDate",
        amount,
        gst_number AS "gstNumber",
        status,
        error,
        created_at AS "createdAt"
      `,
      [
        userId,
        invoiceNumber,
        customerName,
        invoiceDate,
        numericAmount,
        gstNumber,
        "pending",
        null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Invoice created successfully",
        data: result.rows[0],
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