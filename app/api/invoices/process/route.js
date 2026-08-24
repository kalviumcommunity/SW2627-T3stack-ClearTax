import { NextResponse } from "next/server";
import { invoices } from "../../../../lib/invoices";

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