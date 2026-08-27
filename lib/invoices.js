import { pool } from "./db";

// Get invoices for a specific user
export async function getUserInvoices(userId) {
  if (!userId) return [];

  const normalizedId = String(userId).trim().toLowerCase();

  const result = await pool.query(
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
    [normalizedId]
  );

  return result.rows;
}

// Get single invoice by ID
export async function getInvoiceById(userId, invoiceId) {
  if (!userId || !invoiceId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const result = await pool.query(
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
    WHERE user_id = $1 AND id = $2
    LIMIT 1
    `,
    [normalizedId, Number(invoiceId)]
  );

  return result.rows[0] || null;
}

// Add a new invoice
export async function addUserInvoice(userId, invoice) {
  if (!userId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  const result = await pool.query(
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
      normalizedId,
      invoice.invoiceNumber,
      invoice.customerName,
      invoice.invoiceDate,
      invoice.amount,
      invoice.gstNumber,
      invoice.status || "pending",
      invoice.error || null,
    ]
  );

  return result.rows[0];
}

// Update an existing invoice
export async function updateUserInvoice(userId, invoiceId, updates) {
  if (!userId || !invoiceId) return null;

  const normalizedId = String(userId).trim().toLowerCase();

  // Fetch existing
  const existing = await getInvoiceById(normalizedId, invoiceId);
  if (!existing) return null;

  const customerName = updates.customerName !== undefined ? updates.customerName : existing.customerName;
  const invoiceDate = updates.invoiceDate !== undefined ? updates.invoiceDate : existing.invoiceDate;
  const amount = updates.amount !== undefined ? updates.amount : existing.amount;
  const gstNumber = updates.gstNumber !== undefined ? updates.gstNumber : existing.gstNumber;
  const status = updates.status !== undefined ? updates.status : existing.status;
  const error = updates.error !== undefined ? updates.error : existing.error;

  const result = await pool.query(
    `
    UPDATE invoices
    SET
      customer_name = $1,
      invoice_date = $2,
      amount = $3,
      gst_number = $4,
      status = $5,
      error = $6
    WHERE user_id = $7 AND id = $8
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
      customerName,
      invoiceDate,
      amount,
      gstNumber,
      status,
      error,
      normalizedId,
      Number(invoiceId),
    ]
  );

  return result.rows[0];
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