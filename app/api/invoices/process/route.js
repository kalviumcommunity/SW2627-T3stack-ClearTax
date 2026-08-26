import { NextResponse } from "next/server";
import {
  getUserInvoices,
  addUserInvoice,
  updateUserInvoice,
  getUserIdFromRequest,
} from "../../../../lib/invoices";

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No CSV file uploaded",
        },
        { status: 400 }
      );
    }

    // Check CSV file format
    if (
      file.type !== "text/csv" &&
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload a valid CSV file",
        },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is empty or missing data rows",
        },
        { status: 400 }
      );
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    // Map column indices
    const invNumIdx = headers.findIndex(
      (h) => h.includes("invoicenumber") || h.includes("invoiceid") || h === "id"
    );
    const custIdx = headers.findIndex(
      (h) => h.includes("customer") || h.includes("client")
    );
    const dateIdx = headers.findIndex(
      (h) => h.includes("date")
    );
    const amountIdx = headers.findIndex(
      (h) => h.includes("amount") || h.includes("total") || h.includes("price")
    );
    const gstIdx = headers.findIndex(
      (h) => h.includes("gst") || h.includes("tax")
    );

    const userInvoices = getUserInvoices(userId);

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const invoiceNumber = invNumIdx !== -1 ? row[invNumIdx] : `INV-${Date.now()}-${i}`;
      const customerName = custIdx !== -1 ? row[custIdx] : row[1] || "Unknown Customer";
      const invoiceDate = dateIdx !== -1 ? row[dateIdx] : new Date().toISOString().split("T")[0];
      const rawAmount = amountIdx !== -1 ? row[amountIdx] : row[3];
      const gstNumber = gstIdx !== -1 ? row[gstIdx] : row[4] || "N/A";

      const amount = Number(rawAmount);
      let status = "matched";
      let error = null;

      // Validation
      if (!invoiceNumber) {
        status = "failed";
        error = "Invoice ID is missing";
      } else if (!customerName) {
        status = "failed";
        error = "Customer Name is required";
      } else if (isNaN(amount) || amount <= 0) {
        status = "failed";
        error = `Invalid invoice amount: ${rawAmount}`;
      } else if (!gstNumber || gstNumber === "N/A") {
        status = "mismatch";
        error = "GST information missing or unverifiable";
      }

      // Check if this invoice already exists for this user
      const existing = userInvoices.find(
        (inv) => inv.invoiceNumber === invoiceNumber
      );

      if (existing) {
        updateUserInvoice(userId, existing.id, {
          customerName,
          invoiceDate,
          amount: isNaN(amount) ? 0 : amount,
          gstNumber,
          status,
          error,
        });
      } else {
        addUserInvoice(userId, {
          invoiceNumber,
          customerName,
          invoiceDate,
          amount: isNaN(amount) ? 0 : amount,
          gstNumber,
          status,
          error,
        });
      }
    }

    const updatedInvoices = getUserInvoices(userId);

    return NextResponse.json({
      success: true,
      message: "Invoices processed successfully",
      data: updatedInvoices,
    });
  } catch (error) {
    console.error("Processing error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while processing invoices",
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const userId = getUserIdFromRequest(request);
  const userInvoices = getUserInvoices(userId);
  const total = userInvoices.length;

  const processed = userInvoices.filter(
    (invoice) =>
      invoice.status === "matched" ||
      invoice.status === "mismatch" ||
      invoice.status === "failed"
  ).length;

  const processing = userInvoices.filter(
    (invoice) => invoice.status === "processing"
  ).length;

  const pending = userInvoices.filter(
    (invoice) => invoice.status === "pending"
  ).length;

  const percentage =
    total === 0 ? 0 : Math.round((processed / total) * 100);

  return NextResponse.json({
    success: true,
    progress: {
      total,
      processed,
      processing,
      pending,
      percentage,
    },
  });
}