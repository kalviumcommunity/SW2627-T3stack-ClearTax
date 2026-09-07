import { supabase } from "./supabase.js";

// Get invoices for a specific user
export async function getUserInvoices(userId) {
  if (!userId) return [];

  const normalizedId = String(userId).trim().toLowerCase();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      amount,
      gst_number,
      status,
      error,
      created_at
      `
    )
    .eq("user_id", normalizedId)
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase error while fetching invoices:", error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    customerName: row.customer_name,
    invoiceDate: row.invoice_date,
    amount: Number(row.amount),
    gstNumber: row.gst_number,
    status: row.status,
    error: row.error,
    createdAt: row.created_at,
  }));
}


// Get single invoice by ID
export async function getInvoiceById(userId, invoiceId) {
  if (!userId || !invoiceId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      amount,
      gst_number,
      status,
      error,
      created_at
      `
    )
    .eq("user_id", normalizedId)
    .eq("id", Number(invoiceId))
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Supabase error while fetching invoice:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    invoiceNumber: data.invoice_number,
    customerName: data.customer_name,
    invoiceDate: data.invoice_date,
    amount: Number(data.amount),
    gstNumber: data.gst_number,
    status: data.status,
    error: data.error,
    createdAt: data.created_at,
  };
}


// Add a new invoice
export async function addUserInvoice(userId, invoice) {
  if (!userId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: normalizedId,
      invoice_number: invoice.invoiceNumber,
      customer_name: invoice.customerName,
      invoice_date: invoice.invoiceDate,
      amount: Number(invoice.amount),
      gst_number: invoice.gstNumber,
      status: invoice.status || "pending",
      error: invoice.error || null,
    })
    .select(
      `
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      amount,
      gst_number,
      status,
      error,
      created_at
      `
    )
    .single();

  if (error) {
    console.error("Supabase error while adding invoice:", error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    userId: data.user_id,
    invoiceNumber: data.invoice_number,
    customerName: data.customer_name,
    invoiceDate: data.invoice_date,
    amount: Number(data.amount),
    gstNumber: data.gst_number,
    status: data.status,
    error: data.error,
    createdAt: data.created_at,
  };
}


// Update an existing invoice
export async function updateUserInvoice(userId, invoiceId, updates) {
  if (!userId || !invoiceId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const updateData = {};

  if (updates.customerName !== undefined) {
    updateData.customer_name = updates.customerName;
  }

  if (updates.invoiceDate !== undefined) {
    updateData.invoice_date = updates.invoiceDate;
  }

  if (updates.amount !== undefined) {
    updateData.amount = Number(updates.amount);
  }

  if (updates.gstNumber !== undefined) {
    updateData.gst_number = updates.gstNumber;
  }

  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  if (updates.error !== undefined) {
    updateData.error = updates.error;
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("user_id", normalizedId)
    .eq("id", Number(invoiceId))
    .select(
      `
      id,
      user_id,
      invoice_number,
      customer_name,
      invoice_date,
      amount,
      gst_number,
      status,
      error,
      created_at
      `
    )
    .maybeSingle();

  if (error) {
    console.error("Supabase error while updating invoice:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    invoiceNumber: data.invoice_number,
    customerName: data.customer_name,
    invoiceDate: data.invoice_date,
    amount: Number(data.amount),
    gstNumber: data.gst_number,
    status: data.status,
    error: data.error,
    createdAt: data.created_at,
  };
}


// Get user ID from request
export function getUserIdFromRequest(request) {
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