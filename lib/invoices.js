import { supabase } from "./supabase.js";

// Convert database row to application invoice object
function mapInvoice(row) {
  return {
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    contact: row.contact || row.customer_name || "",
    customerName: row.customer_name || row.contact || "",
    currency: row.currency || "INR",
    amount: row.amount === null ? null : Number(row.amount),
    tax: row.tax === null ? 0 : Number(row.tax),
    totalAmount:
      row.total_amount === null
        ? null
        : Number(row.total_amount),
    paidAmount:
      row.paid_amount === null
        ? 0
        : Number(row.paid_amount),
    amountDue:
      row.amount_due === null
        ? null
        : Number(row.amount_due),
    paidDate: row.paid_date,
    paymentStatus: row.payment_status,
    timingStatus: row.timing_status,
    status: row.payment_status,
    gstNumber: row.gst_number || "",
    error: row.error,
    createdAt: row.created_at,
  };
}


// Get all invoices for a user
export async function getUserInvoices(userId) {
  if (!userId) return [];

  const normalizedId = String(userId).trim().toLowerCase();

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      due_date,
      contact,
      currency,
      amount,
      tax,
      total_amount,
      paid_amount,
      amount_due,
      paid_date,
      gst_number,
      payment_status,
      timing_status,
      error,
      created_at
    `)
    .eq("user_id", normalizedId)
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase error while fetching invoices:", error);
    throw new Error(error.message);
  }

  return (data || []).map(mapInvoice);
}


// Get single invoice
export async function getInvoiceById(userId, invoiceId) {
  if (!userId || !invoiceId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      due_date,
      contact,
      currency,
      amount,
      tax,
      total_amount,
      paid_amount,
      amount_due,
      paid_date,
      gst_number,
      payment_status,
      timing_status,
      error,
      created_at
    `)
    .eq("user_id", normalizedId)
    .eq("id", Number(invoiceId))
    .maybeSingle();

  if (error) {
    console.error("Supabase error while fetching invoice:", error);
    throw new Error(error.message);
  }

  return data ? mapInvoice(data) : null;
}


// Add invoice
export async function addUserInvoice(userId, invoice) {
  if (!userId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: normalizedId,
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.contact || invoice.customerName || "",
      invoice_date: invoice.invoiceDate || null,
      due_date: invoice.dueDate || null,
      contact: invoice.contact || invoice.customerName || "",
      currency: invoice.currency || "INR",
      amount:
        invoice.amount === null ||
        invoice.amount === undefined
          ? null
          : Number(invoice.amount),
      tax:
        invoice.tax === null ||
        invoice.tax === undefined
          ? 0
          : Number(invoice.tax),
      total_amount:
        invoice.totalAmount === null ||
        invoice.totalAmount === undefined
          ? null
          : Number(invoice.totalAmount),
      paid_amount:
        invoice.paidAmount === null ||
        invoice.paidAmount === undefined
          ? 0
          : Number(invoice.paidAmount),
      amount_due:
        invoice.amountDue === null ||
        invoice.amountDue === undefined
          ? null
          : Number(invoice.amountDue),
      paid_date: invoice.paidDate || null,
      gst_number: invoice.gstNumber || null,
      payment_status: invoice.paymentStatus || "failed",
      timing_status: invoice.timingStatus || null,
      error: invoice.error || null,
    })
    .select(`
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      due_date,
      contact,
      currency,
      amount,
      tax,
      total_amount,
      paid_amount,
      amount_due,
      paid_date,
      gst_number,
      payment_status,
      timing_status,
      error,
      created_at
    `)
    .single();

  if (error) {
    console.error("Supabase error while adding invoice:", error);
    throw new Error(error.message);
  }

  return mapInvoice(data);
}


// Update invoice
export async function updateUserInvoice(userId, invoiceId, updates) {
  if (!userId || !invoiceId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const updateData = {};

  if (updates.invoiceDate !== undefined) {
    updateData.invoice_date = updates.invoiceDate;
  }

  if (updates.dueDate !== undefined) {
    updateData.due_date = updates.dueDate;
  }

  if (updates.contact !== undefined) {
    updateData.contact = updates.contact;
    updateData.customer_name = updates.contact;
  }

  if (updates.currency !== undefined) {
    updateData.currency = updates.currency;
  }

  if (updates.amount !== undefined) {
    updateData.amount = updates.amount;
  }

  if (updates.tax !== undefined) {
    updateData.tax = updates.tax;
  }

  if (updates.totalAmount !== undefined) {
    updateData.total_amount = updates.totalAmount;
  }

  if (updates.paidAmount !== undefined) {
    updateData.paid_amount = updates.paidAmount;
  }

  if (updates.amountDue !== undefined) {
    updateData.amount_due = updates.amountDue;
  }

  if (updates.paidDate !== undefined) {
    updateData.paid_date = updates.paidDate;
  }

  if (updates.paymentStatus !== undefined) {
    updateData.payment_status = updates.paymentStatus;
  }

  if (updates.timingStatus !== undefined) {
    updateData.timing_status = updates.timingStatus;
  }

  if (updates.error !== undefined) {
    updateData.error = updates.error;
  }

  if (updates.gstNumber !== undefined) {
    updateData.gst_number = updates.gstNumber;
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("user_id", normalizedId)
    .eq("id", Number(invoiceId))
    .select(`
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      due_date,
      contact,
      currency,
      amount,
      tax,
      total_amount,
      paid_amount,
      amount_due,
      paid_date,
      gst_number,
      payment_status,
      timing_status,
      error,
      created_at
    `)
    .maybeSingle();

  if (error) {
    console.error("Supabase error while updating invoice:", error);
    throw new Error(error.message);
  }

  return data ? mapInvoice(data) : null;
}


// Get user ID from request
export function getUserIdFromRequest(request) {
  const headerUserId = request.headers.get("x-user-id");

  if (headerUserId) {
    return headerUserId.trim().toLowerCase();
  }

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