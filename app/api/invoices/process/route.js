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
function normalizeDate(value) {
  if (!value) {
    return {
      valid: false,
      date: null,
      error: "Invoice date is missing",
    };
  }

  const date = String(value).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);

    const parsed = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return {
        valid: true,
        date,
        error: null,
      };
    }
  }

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [day, month, year] = date.split("/").map(Number);

    const parsed = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return {
        valid: true,
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        error: null,
      };
    }
  }

  // MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const [month, day, year] = date.split("/").map(Number);

    const parsed = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return {
        valid: true,
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        error: null,
      };
    }
  }

  return {
    valid: false,
    date: null,
    error: `Invalid invoice date: ${date}`,
  };
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
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length <= 1) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is empty or missing data rows",
        },
        { status: 400 }
      );
    }

    // Parse CSV header
    const headers = parseCSVLine(lines[0]).map((header) =>
      header.toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    // Find column indexes
    const invNumIdx = headers.findIndex(
      (header) =>
        header.includes("invoicenumber") ||
        header.includes("invoiceid") ||
        header === "id"
    );

    const custIdx = headers.findIndex(
      (header) =>
        header.includes("customer") ||
        header.includes("client")
    );

    const dateIdx = headers.findIndex(
      (header) => header.includes("date")
    );

    const amountIdx = headers.findIndex(
      (header) =>
        header.includes("amount") ||
        header.includes("total") ||
        header.includes("price")
    );

    const gstIdx = headers.findIndex(
      (header) =>
        header.includes("gst") ||
        header.includes("tax")
    );

    // Get existing invoices for this user
    const userInvoices = await getUserInvoices(userId);

    // Process every CSV row
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);

      if (
        row.length === 0 ||
        (row.length === 1 && !row[0])
      ) {
        continue;
      }

      const invoiceNumber =
        invNumIdx !== -1
          ? row[invNumIdx]?.trim()
          : `INV-${Date.now()}-${i}`;

      const customerName =
        custIdx !== -1
          ? row[custIdx]?.trim()
          : row[1]?.trim() || "Unknown Customer";

      const rawInvoiceDate =
  dateIdx !== -1
    ? row[dateIdx]?.trim()
    : "";

const dateResult = normalizeDate(rawInvoiceDate);

const invoiceDate = dateResult.valid
  ? dateResult.date
  : "2000-01-01";

      const rawAmount =
        amountIdx !== -1
          ? row[amountIdx]?.trim()
          : row[3]?.trim();

      const gstNumber =
        gstIdx !== -1
          ? row[gstIdx]?.trim()
          : row[4]?.trim() || "N/A";

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
} else if (!dateResult.valid) {
  status = "failed";
  error = dateResult.error;
} else if (!Number.isFinite(amount) || amount <= 0) {
  status = "failed";
  error = `Invalid invoice amount: ${rawAmount}`;
} else if (!gstNumber || gstNumber === "N/A") {
  status = "mismatch";
  error = "GST information missing or unverifiable";
}

      // Check for existing invoice
      const existing = userInvoices.find(
        (invoice) =>
          invoice.invoiceNumber === invoiceNumber
      );

      if (existing) {
        await updateUserInvoice(
          userId,
          existing.id,
          {
            customerName,
            invoiceDate,
            amount: Number.isFinite(amount) ? amount : 0,
            gstNumber,
            status,
            error,
          }
        );
      } else {
        await addUserInvoice(
          userId,
          {
            invoiceNumber,
            customerName,
            invoiceDate,
            amount: Number.isFinite(amount) ? amount : 0,
            gstNumber,
            status,
            error,
          }
        );
      }
    }

    // Fetch final invoice list
    const updatedInvoices = await getUserInvoices(userId);

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
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while processing invoices",
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);

    const userInvoices = await getUserInvoices(userId);
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
      total === 0
        ? 0
        : Math.round((processed / total) * 100);

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
  } catch (error) {
    console.error("GET /api/invoices/process error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch processing progress",
      },
      { status: 500 }
    );
  }
}