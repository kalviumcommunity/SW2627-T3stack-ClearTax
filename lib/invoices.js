// In-memory invoice store scoped by userId
// Global Map to persist across hot reloads in Next.js development
const globalInvoicesStore = globalThis.__invoicesStore || new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.__invoicesStore = globalInvoicesStore;
}

export function getUserInvoices(userId) {
  if (!userId) return [];
  const normalizedId = String(userId).trim().toLowerCase();
  if (!globalInvoicesStore.has(normalizedId)) {
    // New users start with an empty invoice list
    globalInvoicesStore.set(normalizedId, []);
  }
  return globalInvoicesStore.get(normalizedId);
}

export function setUserInvoices(userId, invoicesList) {
  if (!userId) return [];
  const normalizedId = String(userId).trim().toLowerCase();
  globalInvoicesStore.set(normalizedId, invoicesList);
  return invoicesList;
}

export function addUserInvoice(userId, invoice) {
  if (!userId) return null;
  const normalizedId = String(userId).trim().toLowerCase();
  const list = getUserInvoices(normalizedId);
  const newInvoice = {
    id: list.length > 0 ? Math.max(...list.map((i) => i.id || 0)) + 1 : 1,
    ...invoice,
  };
  list.push(newInvoice);
  globalInvoicesStore.set(normalizedId, list);
  return newInvoice;
}

export function updateUserInvoice(userId, invoiceId, updates) {
  if (!userId) return null;
  const list = getUserInvoices(userId);
  const target = list.find((item) => item.id === Number(invoiceId));
  if (!target) return null;

  Object.assign(target, updates);
  return target;
}

export function getUserIdFromRequest(request) {
  // Check header first
  const headerUserId = request.headers.get("x-user-id");
  if (headerUserId) return headerUserId.trim().toLowerCase();

  // Check URL search params
  try {
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");
    if (queryUserId) return queryUserId.trim().toLowerCase();
  } catch {
    // URL parsing might fail if relative
  }

  return "default_user";
}

// Default export for backward compatibility
export const invoices = [];