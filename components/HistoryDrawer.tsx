"use client";

import React, { useMemo, useState } from "react";
import { History, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type PaymentStatus =
  | "matched"
  | "partially_paid"
  | "unpaid"
  | "overpaid"
  | "failed";

export type TimingStatus =
  | "on_time"
  | "late"
  | "overdue"
  | "pending"
  | "not_available"
  | "invalid";

export interface InvoiceRecord {
  id: number | string;
  userId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  contact: string;
  customerName: string;
  currency: string;
  amount: number | null;
  tax: number;
  totalAmount: number | null;
  paidAmount: number;
  amountDue: number | null;
  paidDate: string | null;
  paymentStatus: PaymentStatus;
  timingStatus: TimingStatus;
  gstNumber?: string;
  error: string | null;
  createdAt?: string;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceRecord[];
  onSelectInvoice: (invoice: InvoiceRecord) => void;
}

function formatMoney(value: number | null, currency = "INR") {
  if (value === null || Number.isNaN(value)) return "N/A";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function paymentStyle(status: PaymentStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.35rem 0.65rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "matched":
      return {
        ...base,
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    case "partially_paid":
      return {
        ...base,
        background: "#fef3c7",
        color: "#92400e",
        border: "1px solid #fde68a",
      };
    case "unpaid":
      return {
        ...base,
        background: "#f3f4f6",
        color: "#4b5563",
        border: "1px solid #e5e7eb",
      };
    case "overpaid":
      return {
        ...base,
        background: "#ede9fe",
        color: "#6d28d9",
        border: "1px solid #ddd6fe",
      };
    default:
      return {
        ...base,
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fecaca",
      };
  }
}

function paymentLabel(status: PaymentStatus) {
  switch (status) {
    case "matched":
      return "Matched";
    case "partially_paid":
      return "Partially Paid";
    case "unpaid":
      return "Unpaid";
    case "overpaid":
      return "Overpaid";
    default:
      return "Failed";
  }
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
}: HistoryDrawerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvoices = useMemo(() => {
    const list = [...invoices].reverse();
    const query = searchTerm.trim().toLowerCase();
    if (!query) return list;

    return list.filter((invoice) => {
      const number = (invoice.invoiceNumber || "").toLowerCase();
      const contact = (invoice.contact || "").toLowerCase();
      const customer = (invoice.customerName || "").toLowerCase();
      const scanDate = invoice.createdAt ? formatDate(invoice.createdAt).toLowerCase() : "";
      const invoiceDate = invoice.invoiceDate ? formatDate(invoice.invoiceDate).toLowerCase() : "";
      const amount = (invoice.totalAmount ?? invoice.amount ?? "").toString();

      return (
        number.includes(query) ||
        contact.includes(query) ||
        customer.includes(query) ||
        scanDate.includes(query) ||
        invoiceDate.includes(query) ||
        amount.includes(query)
      );
    });
  }, [invoices, searchTerm]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(63, 53, 44, 0.22)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 220,
            }}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "460px",
              height: "100vh",
              background: "#fdfbf7",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-10px 0 30px rgba(63, 53, 44, 0.15)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f7f3ed",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                }}
              >
                <History
                  size={21}
                  style={{ color: "var(--primary)" }}
                />
                <h2
                  style={{
                    margin: 0,
                    color: "#3f352c",
                    fontSize: "1.2rem",
                  }}
                >
                  Invoice History
                </h2>
                <span
                  style={{
                    fontSize: "0.8rem",
                    background: "rgba(181, 154, 122, 0.2)",
                    color: "var(--primary)",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {invoices.length}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "1px solid var(--border)",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b5c4d",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Simple Search Bar without suggestion dropdown */}
            <div
              style={{
                padding: "1rem 1.5rem 0.5rem",
                background: "#fdfbf7",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    color: "var(--muted-foreground)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.75rem 0.6rem 2.2rem",
                    borderRadius: "0.6rem",
                    border: "1px solid var(--border)",
                    background: "#fff",
                    color: "#3f352c",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    style={{
                      position: "absolute",
                      right: "0.6rem",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted-foreground)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.2rem",
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Invoices List with Dates */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0.75rem 1.5rem 1.5rem",
              }}
            >
              {filteredInvoices.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.7rem",
                  }}
                >
                  {filteredInvoices.map((invoice) => {
                    const scanDateFormatted = formatDate(
                      invoice.createdAt || invoice.invoiceDate
                    );

                    return (
                      <button
                        type="button"
                        key={invoice.id}
                        onClick={() => {
                          onClose();
                          onSelectInvoice(invoice);
                        }}
                        style={{
                          textAlign: "left",
                          padding: "0.9rem",
                          borderRadius: "0.7rem",
                          background: "#fff",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "1rem",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                                color: "#3f352c",
                              }}
                            >
                              {invoice.invoiceNumber || "No Number"}
                            </div>
                            <div
                              style={{
                                marginTop: "0.2rem",
                                fontSize: "0.8rem",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              {invoice.contact || invoice.customerName || "N/A"}
                            </div>
                            {/* Date Display */}
                            <div
                              style={{
                                marginTop: "0.35rem",
                                fontSize: "0.75rem",
                                color: "var(--primary)",
                                fontWeight: 600,
                              }}
                            >
                              Date: {scanDateFormatted}
                            </div>
                          </div>

                          <div
                            style={{
                              textAlign: "right",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: "0.35rem",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                color: "var(--primary)",
                              }}
                            >
                              {formatMoney(
                                invoice.totalAmount ?? invoice.amount,
                                invoice.currency
                              )}
                            </div>
                            <span
                              style={paymentStyle(
                                invoice.paymentStatus
                              )}
                            >
                              {paymentLabel(invoice.paymentStatus)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4rem 1rem",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {searchTerm
                    ? "No invoices match your search."
                    : "No invoices found in history."}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
