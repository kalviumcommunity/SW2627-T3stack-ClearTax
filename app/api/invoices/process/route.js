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
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
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


// Convert different common date formats to YYYY-MM-DD
function normalizeDate(value) {
  if (!value) {
    return {
      valid: false,
      date: null,
      error: "Date is missing",
    };
  }

  const input = String(value).trim();

  // YYYY-MM-DD
  let match = input.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return {
        valid: true,
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        error: null,
      };
    }
  }

  // MM/DD/YYYY or DD/MM/YYYY
  match = input.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (match) {
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = Number(match[3]);

    let month;
    let day;

    // If first value > 12, it must be DD/MM/YYYY
    if (first > 12) {
      day = first;
      month = second;
    } else {
      // Our built-in CSV will use MM/DD/YYYY when slash format is used
      month = first;
      day = second;
    }

    const date = new Date(
      Date.UTC(year, month - 1, day)
    );

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
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
    error: `Invalid date: ${input}`,
  };
}


function parseMoney(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return {
      valid: false,
      value: null,
    };
  }

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/,/g, "")
    .trim();

  const number = Number(cleaned);

  if (!Number.isFinite(number)) {
    return {
      valid: false,
      value: null,
    };
  }

  return {
    valid: true,
    value: number,
  };
}


function calculateStatuses({
  amount,
  tax,
  paidAmount,
  dueDate,
  paidDate,
}) {
  if (
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return {
      paymentStatus: "failed",
      timingStatus: "invalid",
      error: "Invoice amount is invalid",
    };
  }

  if (
    !Number.isFinite(tax) ||
    tax < 0
  ) {
    return {
      paymentStatus: "failed",
      timingStatus: "invalid",
      error: "Tax amount is invalid",
    };
  }

  if (
    !Number.isFinite(paidAmount) ||
    paidAmount < 0
  ) {
    return {
      paymentStatus: "failed",
      timingStatus: "invalid",
      error: "Paid amount is invalid",
    };
  }

  const totalAmount = Number(
    (amount + tax).toFixed(2)
  );

  const amountDue = Number(
    (totalAmount - paidAmount).toFixed(2)
  );

  let paymentStatus;

  if (paidAmount > totalAmount) {
    paymentStatus = "overpaid";
  } else if (Math.abs(paidAmount - totalAmount) < 0.01) {
    paymentStatus = "matched";
  } else if (paidAmount > 0) {
    paymentStatus = "partially_paid";
  } else {
    paymentStatus = "unpaid";
  }

  let timingStatus = "pending";

  if (!dueDate) {
    timingStatus = "not_available";
  } else if (paidDate) {
    timingStatus =
      paidDate <= dueDate
        ? "on_time"
        : "late";
  } else {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    timingStatus =
      today > dueDate
        ? "overdue"
        : "pending";
  }

  return {
    totalAmount,
    amountDue,
    paymentStatus,
    timingStatus,
    error: null,
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
      .filter(Boolean);

    if (lines.length <= 1) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is empty or missing data rows",
        },
        { status: 400 }
      );
    }

    const headers = parseCSVLine(lines[0]).map(
      (header) =>
        header
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
    );

    const findHeader = (...names) =>
      headers.findIndex((header) =>
        names.includes(header)
      );

    const invoiceNumberIdx = findHeader(
      "invoicenumber",
      "invoiceid",
      "invoice"
    );

    const invoiceDateIdx = findHeader(
      "invoicedate",
      "date"
    );

    const dueDateIdx = findHeader(
      "duedate"
    );

    const contactIdx = findHeader(
      "contact",
      "customer",
      "customername",
      "client"
    );

    const currencyIdx = findHeader(
      "currency"
    );

    const amountIdx = findHeader(
      "amount",
      "invoiceamount"
    );

    const taxIdx = findHeader(
      "tax",
      "taxamount",
      "gst",
      "gstamount"
    );

    const paidAmountIdx = findHeader(
      "paidamount",
      "paid"
    );

    const paidDateIdx = findHeader(
      "paiddate"
    );

    if (
      invoiceNumberIdx === -1 ||
      invoiceDateIdx === -1 ||
      dueDateIdx === -1 ||
      contactIdx === -1 ||
      amountIdx === -1 ||
      paidAmountIdx === -1
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "CSV is missing required columns. Required columns: invoiceNumber, invoiceDate, dueDate, contact, amount, paidAmount",
        },
        { status: 400 }
      );
    }

    const existingInvoices =
      await getUserInvoices(userId);

    let processedCount = 0;
    let failedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;

      try {
        const row = parseCSVLine(lines[i]);

        const invoiceNumber =
          row[invoiceNumberIdx]?.trim() || "";

        const contact =
          row[contactIdx]?.trim() || "";

        const currency =
          currencyIdx !== -1
            ? row[currencyIdx]?.trim() || "INR"
            : "INR";

        const rawInvoiceDate =
          row[invoiceDateIdx]?.trim() || "";

        const rawDueDate =
          row[dueDateIdx]?.trim() || "";

        const rawAmount =
          row[amountIdx]?.trim() || "";

        const rawTax =
          taxIdx !== -1
            ? row[taxIdx]?.trim()
            : "0";

        const rawPaidAmount =
          row[paidAmountIdx]?.trim() || "";

        const rawPaidDate =
          paidDateIdx !== -1
            ? row[paidDateIdx]?.trim() || ""
            : "";

        const invoiceDateResult =
          normalizeDate(rawInvoiceDate);

        const dueDateResult =
          normalizeDate(rawDueDate);

        const paidDateResult =
          rawPaidDate
            ? normalizeDate(rawPaidDate)
            : {
                valid: true,
                date: null,
                error: null,
              };

        const amountResult =
          parseMoney(rawAmount);

        const taxResult =
          rawTax === ""
            ? { valid: true, value: 0 }
            : parseMoney(rawTax);

        const paidAmountResult =
          rawPaidAmount === ""
            ? { valid: true, value: 0 }
            : parseMoney(rawPaidAmount);

        let paymentStatus = "failed";
        let timingStatus = "invalid";
        let totalAmount = null;
        let amountDue = null;
        let error = null;

        if (!invoiceNumber) {
          error = "Invoice number is missing";
        } else if (!contact) {
          error = "Contact is required";
        } else if (!invoiceDateResult.valid) {
          error = invoiceDateResult.error;
        } else if (!dueDateResult.valid) {
          error = dueDateResult.error;
        } else if (!amountResult.valid) {
          error = `Invalid amount: ${rawAmount}`;
        } else if (!taxResult.valid) {
          error = `Invalid tax amount: ${rawTax}`;
        } else if (!paidAmountResult.valid) {
          error = `Invalid paid amount: ${rawPaidAmount}`;
        } else if (!paidDateResult.valid) {
          error = paidDateResult.error;
        }

        if (!error) {
          const calculation =
            calculateStatuses({
              amount: amountResult.value,
              tax: taxResult.value,
              paidAmount: paidAmountResult.value,
              dueDate: dueDateResult.date,
              paidDate: paidDateResult.date,
            });

          totalAmount =
            calculation.totalAmount;

          amountDue =
            calculation.amountDue;

          paymentStatus =
            calculation.paymentStatus;

          timingStatus =
            calculation.timingStatus;

          error =
            calculation.error;
        } else {
          failedCount++;
        }

        if (error) {
          paymentStatus = "failed";
          timingStatus = "invalid";
        }

        const existing =
          existingInvoices.find(
            (invoice) =>
              invoice.invoiceNumber ===
              invoiceNumber
          );

        const invoiceData = {
          invoiceNumber,
          invoiceDate:
            invoiceDateResult.valid
              ? invoiceDateResult.date
              : null,
          dueDate:
            dueDateResult.valid
              ? dueDateResult.date
              : null,
          contact,
          currency,
          amount:
            amountResult.valid
              ? amountResult.value
              : null,
          tax:
            taxResult.valid
              ? taxResult.value
              : 0,
          totalAmount,
          paidAmount:
            paidAmountResult.valid
              ? paidAmountResult.value
              : 0,
          amountDue,
          paidDate:
            paidDateResult.valid
              ? paidDateResult.date
              : null,
          paymentStatus,
          timingStatus,
          error,
        };

        if (existing) {
          await updateUserInvoice(
            userId,
            existing.id,
            invoiceData
          );
        } else {
          await addUserInvoice(
            userId,
            invoiceData
          );
        }

        processedCount++;
      } catch (rowError) {
        failedCount++;

        console.error(
          `Error processing CSV row ${rowNumber}:`,
          rowError
        );
      }
    }

    const updatedInvoices =
      await getUserInvoices(userId);

    return NextResponse.json({
      success: true,
      message: "Invoice batch processed successfully",
      summary: {
        total: lines.length - 1,
        processed: processedCount,
        failed: failedCount,
      },
      data: updatedInvoices,
    });
  } catch (error) {
    console.error(
      "Invoice processing error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Invoice processing failed",
      },
      { status: 500 }
    );
  }
}


export async function GET(request) {
  try {
    const userId = getUserIdFromRequest(request);

    const invoices =
      await getUserInvoices(userId);

    const processed =
      invoices.filter(
        (invoice) =>
          invoice.paymentStatus === "matched" ||
          invoice.paymentStatus === "partially_paid" ||
          invoice.paymentStatus === "unpaid" ||
          invoice.paymentStatus === "overpaid"
      ).length;

    const failed =
      invoices.filter(
        (invoice) =>
          invoice.paymentStatus === "failed"
      ).length;

    return NextResponse.json({
      success: true,
      progress: {
        total: invoices.length,
        processed,
        failed,
        percentage:
          invoices.length === 0
            ? 0
            : Math.round(
                (processed / invoices.length) *
                  100
              ),
      },
    });
  } catch (error) {
    console.error(
      "GET invoice progress error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch progress",
      },
      { status: 500 }
    );
  }
}