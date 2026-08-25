import { NextResponse } from "next/server";
import { invoices } from "../../../../lib/invoices";

export async function POST(request) {
  try {
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

    // Check CSV file
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

    // Mark pending invoices as processing
    invoices.forEach((invoice) => {
      if (invoice.status === "pending") {
        invoice.status = "processing";
      }
    });

    // Simulate invoice processing
    invoices.forEach((invoice) => {
      if (invoice.status === "processing") {
        invoice.status = "matched";
      }
    });

    return NextResponse.json({
      success: true,
      message: "Invoices processed successfully",
      data: invoices,
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

export async function GET() {
  const total = invoices.length;

  const processed = invoices.filter(
    (invoice) =>
      invoice.status === "matched" ||
      invoice.status === "mismatch" ||
      invoice.status === "failed"
  ).length;

  const processing = invoices.filter(
    (invoice) => invoice.status === "processing"
  ).length;

  const pending = invoices.filter(
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