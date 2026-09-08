"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  LogOut,
  User as UserIcon,
  History,
  X,
  Eye,
  Clock3,
  CircleDollarSign,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type InvoicePaymentStatus =
  | "matched"
  | "partially_paid"
  | "unpaid"
  | "overpaid"
  | "failed";

type InvoiceTimingStatus =
  | "on_time"
  | "late"
  | "overdue"
  | "pending"
  | "not_available"
  | "invalid";

interface InvoiceRecord {
  id: number;
  userId: string;

  invoiceNumber: string;
  invoiceDate: string | null;
  dueDate: string | null;

  contact: string;
  customerName?: string;

  currency: string;

  amount: number | null;
  tax: number;
  totalAmount: number | null;

  paidAmount: number;
  amountDue: number | null;

  paidDate: string | null;

  paymentStatus: InvoicePaymentStatus;
  timingStatus: InvoiceTimingStatus;

  gstNumber?: string;
  error: string | null;

  createdAt?: string;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
}

function normalizePaymentStatus(value: unknown): InvoicePaymentStatus {
  switch (value) {
    case "matched":
      return "matched";
    case "partially_paid":
      return "partially_paid";
    case "unpaid":
      return "unpaid";
    case "overpaid":
      return "overpaid";
    case "failed":
      return "failed";
    default:
      return "failed";
  }
}

function normalizeTimingStatus(value: unknown): InvoiceTimingStatus {
  switch (value) {
    case "on_time":
      return "on_time";
    case "late":
      return "late";
    case "overdue":
      return "overdue";
    case "pending":
      return "pending";
    case "not_available":
      return "not_available";
    case "invalid":
      return "invalid";
    default:
      return "not_available";
  }
}

function normalizeInvoice(row: any): InvoiceRecord {
  return {
    id: Number(row.id),
    userId: String(row.userId ?? row.user_id ?? ""),

    invoiceNumber: String(row.invoiceNumber ?? row.invoice_number ?? ""),
    invoiceDate:
      row.invoiceDate ??
      row.invoice_date ??
      null,

    dueDate:
      row.dueDate ??
      row.due_date ??
      null,

    contact:
      row.contact ??
      row.customerName ??
      row.customer_name ??
      "",

    customerName:
      row.customerName ??
      row.customer_name ??
      row.contact ??
      "",

    currency:
      row.currency ??
      "INR",

    amount:
      row.amount === null ||
      row.amount === undefined
        ? null
        : Number(row.amount),

    tax:
      row.tax === null ||
      row.tax === undefined
        ? 0
        : Number(row.tax),

    totalAmount:
      row.totalAmount === null ||
      row.totalAmount === undefined
        ? null
        : Number(row.totalAmount),

    paidAmount:
      row.paidAmount === null ||
      row.paidAmount === undefined
        ? 0
        : Number(row.paidAmount),

    amountDue:
      row.amountDue === null ||
      row.amountDue === undefined
        ? null
        : Number(row.amountDue),

    paidDate:
      row.paidDate ??
      row.paid_date ??
      null,

    paymentStatus: normalizePaymentStatus(
      row.paymentStatus ??
        row.payment_status ??
        row.status
    ),

    timingStatus: normalizeTimingStatus(
      row.timingStatus ??
        row.timing_status
    ),

    gstNumber:
      row.gstNumber ??
      row.gst_number ??
      "",

    error: row.error ?? null,

    createdAt:
      row.createdAt ??
      row.created_at ??
      undefined,
  };
}

function currencySymbol(currency: string) {
  switch (currency) {
    case "INR":
      return "₹";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "CHF":
      return "CHF ";
    default:
      return currency ? `${currency} ` : "";
  }
}

function formatMoney(
  value: number | null | undefined,
  currency = "INR"
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "-";
  }

  return `${currencySymbol(currency)}${value.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<UserSession | null>(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [file, setFile] =
    useState<File | null>(null);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [invoices, setInvoices] =
    useState<InvoiceRecord[]>([]);

  const [isLoadingInvoices, setIsLoadingInvoices] =
    useState(true);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [isHistoryOpen, setIsHistoryOpen] =
    useState(false);

  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceRecord | null>(null);

  const ITEM_PER_PAGE = 15;

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const totalPages = Math.max(
    1,
    Math.ceil(
      invoices.length / ITEM_PER_PAGE
    )
  );

  const startIndex =
    (currentPage - 1) * ITEM_PER_PAGE;

  const endIndex =
    startIndex + ITEM_PER_PAGE;

  const currentInvoices =
    invoices.slice(
      startIndex,
      endIndex
    );

  const fetchInvoices = useCallback(
    async (userId: string) => {
      setIsLoadingInvoices(true);

      try {
        const response = await fetch(
          `/api/invoices?userId=${encodeURIComponent(
            userId
          )}`,
          {
            headers: {
              "x-user-id": userId,
            },
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to load invoices"
          );
        }

        if (result.success) {
          const normalized =
            Array.isArray(result.data)
              ? result.data.map(normalizeInvoice)
              : [];

          setInvoices(normalized);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error(
          "Failed to fetch invoices:",
          error
        );
      } finally {
        setIsLoadingInvoices(false);
      }
    },
    []
  );

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "cleartax_user"
        );

      if (stored) {
        const parsed =
          JSON.parse(stored);

        if (
          parsed &&
          parsed.id
        ) {
          queueMicrotask(() => {
            setUser(parsed);
            fetchInvoices(
              String(parsed.id)
            );
          });

          return;
        }
      }
    } catch (error) {
      console.error(
        "Failed to restore session:",
        error
      );
    }

    router.push("/login");
  }, [router, fetchInvoices]);

  const handleLogout = () => {
    localStorage.removeItem(
      "cleartax_user"
    );

    router.push("/login");
  };

  const handleDragOver = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (
    e: React.DragEvent
  ) => {
    e.preventDefault();
    setIsDragging(false);

    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0
    ) {
      handleFile(
        e.dataTransfer.files[0]
      );
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (
      e.target.files &&
      e.target.files.length > 0
    ) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (
    selectedFile: File
  ) => {
    if (
      selectedFile.type !==
        "text/csv" &&
      !selectedFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      alert(
        "Please upload a valid CSV file."
      );

      return;
    }

    setFile(selectedFile);
    setProgress(0);
  };

  const startProcessing = async () => {
    if (!file || !user) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      setProgress(25);

      const response = await fetch(
        "/api/invoices/process",
        {
          method: "POST",
          headers: {
            "x-user-id": user.id,
          },
          body: formData,
        }
      );

      setProgress(65);

      const text =
        await response.text();

      if (!text) {
        throw new Error(
          "Server returned an empty response"
        );
      }

      const result =
        JSON.parse(text);

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Failed to process invoices"
        );
      }

      const normalized =
        Array.isArray(result.data)
          ? result.data.map(
              normalizeInvoice
            )
          : [];

      setInvoices(normalized);
      setCurrentPage(1);
      setProgress(100);
    } catch (error) {
      console.error(
        "Processing error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while processing invoices."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setSelectedInvoice(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const matchedCount =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus ===
        "matched"
    ).length;

  const partiallyPaidCount =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus ===
        "partially_paid"
    ).length;

  const unpaidCount =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus ===
        "unpaid"
    ).length;

  const overpaidCount =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus ===
        "overpaid"
    ).length;

  const failedCount =
    invoices.filter(
      (invoice) =>
        invoice.paymentStatus ===
        "failed"
    ).length;

  const overdueCount =
    invoices.filter(
      (invoice) =>
        invoice.timingStatus ===
        "overdue"
    ).length;

  const totalAmount =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        (invoice.amount ?? 0),
      0
    );

  const totalTax =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        (invoice.tax ?? 0),
      0
    );

  const totalPayable =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        (invoice.totalAmount ?? 0),
      0
    );

  const totalPaid =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        (invoice.paidAmount ?? 0),
      0
    );

  const totalOutstanding =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        Math.max(
          invoice.amountDue ?? 0,
          0
        ),
      0
    );

  const totalOverpaid =
    invoices.reduce(
      (sum, invoice) =>
        sum +
        Math.max(
          (invoice.paidAmount ?? 0) -
            (invoice.totalAmount ?? 0),
          0
        ),
      0
    );

  const renderPaymentStatusBadge = (
    status: InvoicePaymentStatus
  ) => {
    switch (status) {
      case "matched":
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={15} />
            Matched
          </span>
        );

      case "partially_paid":
        return (
          <span className="badge badge-warning">
            <AlertTriangle size={15} />
            Partially Paid
          </span>
        );

      case "unpaid":
        return (
          <span className="badge badge-error">
            <XCircle size={15} />
            Unpaid
          </span>
        );

      case "overpaid":
        return (
          <span className="badge badge-warning">
            <CircleDollarSign size={15} />
            Overpaid
          </span>
        );

      case "failed":
        return (
          <span className="badge badge-error">
            <XCircle size={15} />
            Failed
          </span>
        );

      default:
        return null;
    }
  };

  const renderTimingBadge = (
    status: InvoiceTimingStatus
  ) => {
    switch (status) {
      case "on_time":
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={14} />
            On Time
          </span>
        );

      case "late":
        return (
          <span className="badge badge-warning">
            <Clock3 size={14} />
            Late
          </span>
        );

      case "overdue":
        return (
          <span className="badge badge-error">
            <AlertTriangle size={14} />
            Overdue
          </span>
        );

      case "pending":
        return (
          <span className="badge badge-warning">
            <Clock3 size={14} />
            Pending
          </span>
        );

      case "not_available":
        return (
          <span className="badge">
            N/A
          </span>
        );

      case "invalid":
        return (
          <span className="badge badge-error">
            <XCircle size={14} />
            Invalid
          </span>
        );

      default:
        return null;
    }
  };

  const containerVariants: import("framer-motion").Variants =
    {
      hidden: {
        opacity: 0,
      },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
        },
      },
    };

  const itemVariants: import("framer-motion").Variants =
    {
      hidden: {
        opacity: 0,
        y: 14,
      },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.35,
        },
      },
    };

  return (
    <main
      className="container"
      style={{
        paddingTop: "2rem",
        paddingBottom: "4rem",
      }}
    >
      {/* Account Bar */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1rem 1.5rem",
          background:
            "rgba(139, 121, 104, 0.05)",
          backdropFilter:
            "blur(12px)",
          borderRadius: "1rem",
          border:
            "1px solid var(--border)",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              background:
                "rgba(166, 124, 82, 0.15)",
              color:
                "var(--primary)",
              padding: "0.55rem",
              borderRadius: "50%",
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            <UserIcon size={20} />
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#3f352c",
                fontSize:
                  "0.95rem",
              }}
            >
              {user?.name ||
                "Account"}
            </div>

            <div
              style={{
                fontSize: "0.8rem",
                color:
                  "var(--muted-foreground)",
              }}
            >
              {user?.email || ""}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setIsHistoryOpen(
                true
              )
            }
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "0.5rem",
              background:
                "#ede5da",
              color:
                "var(--primary)",
              border:
                "1px solid var(--border)",
              padding:
                "0.55rem 1rem",
              borderRadius:
                "0.6rem",
              fontSize:
                "0.875rem",
              fontWeight: 700,
              cursor:
                "pointer",
            }}
          >
            <History size={16} />
            History
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "0.5rem",
              background:
                "rgba(239, 68, 68, 0.1)",
              color: "#dc2626",
              border:
                "1px solid rgba(239, 68, 68, 0.2)",
              padding:
                "0.55rem 1rem",
              borderRadius:
                "0.6rem",
              fontSize:
                "0.875rem",
              fontWeight: 700,
              cursor:
                "pointer",
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      <motion.div
        className="card"
        variants={
          containerVariants
        }
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.h1
          variants={itemVariants}
        >
          ClearTax Invoice
          Reconciliation
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="subtitle"
        >
          Upload a CSV batch and
          reconcile invoice value,
          tax, payments,
          outstanding amounts,
          and payment timing for{" "}
          <span
            style={{
              color:
                "var(--primary)",
              fontWeight: 700,
            }}
          >
            {user?.email}
          </span>
          .
        </motion.p>

        {/* Upload */}
        <AnimatePresence
          mode="wait"
        >
          {!isProcessing &&
            progress === 0 && (
              <motion.div
                key="upload-zone"
                variants={
                  itemVariants
                }
                initial="hidden"
                animate="show"
                exit={{
                  opacity: 0,
                  scale: 0.97,
                }}
                className={`upload-zone ${
                  isDragging
                    ? "drag-active"
                    : ""
                }`}
                onDragOver={
                  handleDragOver
                }
                onDragLeave={
                  handleDragLeave
                }
                onDrop={handleDrop}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={
                    handleFileChange
                  }
                  style={{
                    display: "none",
                  }}
                />

                {file ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="flex flex-col items-center"
                  >
                    <FileText className="upload-icon" />

                    <h3>
                      {file.name}
                    </h3>

                    <p
                      className="subtitle"
                      style={{
                        marginBottom: 0,
                      }}
                    >
                      {(
                        file.size / 1024
                      ).toFixed(
                        2
                      )}{" "}
                      KB
                    </p>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        startProcessing();
                      }}
                      style={{
                        marginTop:
                          "1.5rem",
                      }}
                    >
                      Process CSV Now
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    className="flex flex-col items-center"
                  >
                    <UploadCloud className="upload-icon" />

                    <h3>
                      Drag & Drop
                      your CSV here
                    </h3>

                    <p>
                      or click to
                      browse files
                      from your
                      computer
                    </p>

                    <p
                      style={{
                        marginTop:
                          "0.5rem",
                        fontSize:
                          "0.78rem",
                        color:
                          "var(--muted-foreground)",
                      }}
                    >
                      Required:
                      invoice number,
                      invoice date,
                      due date,
                      contact,
                      amount,
                      tax and
                      payment
                      information
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
        </AnimatePresence>

        {/* Progress */}
        <AnimatePresence>
          {(isProcessing ||
            progress > 0) && (
            <motion.div
              key="progress"
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              className="progress-container"
            >
              <div className="progress-header">
                <span>
                  {isProcessing
                    ? "Processing Invoices..."
                    : "Processing Complete"}
                </span>

                <span>
                  {progress}%
                </span>
              </div>

              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        {invoices.length > 0 && (
          <>
           <motion.div
  variants={itemVariants}
  style={{
    marginTop: "1.75rem",
  }}
>
  {/* ==================== RECONCILIATION STATUS ==================== */}
  <div
    style={{
      background: "#faf8f4",
      border: "1px solid var(--border)",
      borderRadius: "1rem",
      padding: "1.25rem",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#3f352c",
          }}
        >
          Reconciliation Summary
        </h2>

        <p
          style={{
            margin: "0.3rem 0 0",
            color: "var(--muted-foreground)",
            fontSize: "0.85rem",
          }}
        >
          {invoices.length} invoices processed
        </p>
      </div>
    </div>

    {/* First row: 4 cards */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(4, minmax(0, 1fr))",
        gap: "0.85rem",
        marginTop: "1rem",
      }}
    >
      <SummaryCard
        label="Total Invoices"
        value={String(invoices.length)}
        icon={<FileText size={18} />}
      />

      <SummaryCard
        label="Matched"
        value={String(matchedCount)}
        icon={<CheckCircle2 size={18} />}
      />

      <SummaryCard
        label="Partially Paid"
        value={String(partiallyPaidCount)}
        icon={<AlertTriangle size={18} />}
      />

      <SummaryCard
        label="Unpaid"
        value={String(unpaidCount)}
        icon={<XCircle size={18} />}
      />
    </div>

    {/* Second row: centered 3 cards */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(3, minmax(0, 1fr))",
        gap: "0.85rem",
        maxWidth: "75%",
        margin: "0.85rem auto 0",
      }}
    >
      <SummaryCard
        label="Overpaid"
        value={String(overpaidCount)}
        icon={<CircleDollarSign size={18} />}
      />

      <SummaryCard
        label="Failed"
        value={String(failedCount)}
        icon={<XCircle size={18} />}
      />

      <SummaryCard
        label="Overdue"
        value={String(overdueCount)}
        icon={<Clock3 size={18} />}
      />
    </div>
  </div>

  {/* ==================== FINANCIAL OVERVIEW ==================== */}
  <div
    style={{
      marginTop: "1.25rem",
      background: "#f7f3ed",
      border: "1px solid var(--border)",
      borderRadius: "1rem",
      padding: "1.25rem",
    }}
  >
    <div
      style={{
        marginBottom: "1rem",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "1.1rem",
          fontWeight: 800,
          color: "#3f352c",
        }}
      >
        Financial Overview
      </h2>

      <p
        style={{
          margin: "0.3rem 0 0",
          color: "var(--muted-foreground)",
          fontSize: "0.82rem",
        }}
      >
        Summary of invoice value, tax, payments and outstanding balance
      </p>
    </div>

    {/* First row: 3 cards */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(3, minmax(0, 1fr))",
        gap: "0.85rem",
      }}
    >
      <FinanceCard
        label="Invoice Value"
        value={formatMoney(totalAmount)}
      />

      <FinanceCard
        label="Total Tax"
        value={formatMoney(totalTax)}
      />

      <FinanceCard
        label="Total Payable"
        value={formatMoney(totalPayable)}
      />
    </div>

    {/* Second row: 3 cards */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(3, minmax(0, 1fr))",
        gap: "0.85rem",
        marginTop: "0.85rem",
      }}
    >
      <FinanceCard
        label="Total Paid"
        value={formatMoney(totalPaid)}
      />

      <FinanceCard
        label="Outstanding"
        value={formatMoney(totalOutstanding)}
      />

      <FinanceCard
        label="Overpaid"
        value={formatMoney(totalOverpaid)}
      />
    </div>
  </div>
</motion.div>

            {/* Invoice Table */}
            <motion.div
              variants={
                itemVariants
              }
              className="table-container"
              style={{
                marginTop:
                  "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "1rem",
                  marginBottom:
                    "1rem",
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize:
                        "1.15rem",
                    }}
                  >
                    Invoice
                    Reconciliation
                  </h3>

                  <div
                    style={{
                      marginTop:
                        "0.25rem",
                      color:
                        "var(--muted-foreground)",
                      fontSize:
                        "0.82rem",
                    }}
                  >
                    Showing{" "}
                    {startIndex +
                      1}
                    –
                    {Math.min(
                      endIndex,
                      invoices.length
                    )}{" "}
                    of{" "}
                    {invoices.length}
                  </div>
                </div>
              </div>

              <div
                style={{
                  overflowX:
                    "auto",
                  width: "100%",
                }}
              >
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>
                        Invoice #
                      </th>

                      <th>
                        Contact
                      </th>

                      <th>
                        Invoice Date
                      </th>

                      <th>
                        Due Date
                      </th>

                      <th>
                        Total
                      </th>

                      <th>
                        Paid
                      </th>

                      <th>
                        Due
                      </th>

                      <th>
                        Payment Status
                      </th>

                      <th>
                        Timing
                      </th>

                      <th>
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <AnimatePresence>
                      {currentInvoices.map(
                        (invoice) => (
                          <motion.tr
                            key={
                              invoice.id
                            }
                            initial={{
                              opacity: 0,
                              x: -10,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              duration:
                                0.25,
                            }}
                          >
                            <td
                              style={{
                                fontWeight:
                                  750,
                              }}
                            >
                              {
                                invoice.invoiceNumber
                              }
                            </td>

                            <td>
                              {invoice.contact ||
                                invoice.customerName ||
                                "-"}
                            </td>

                            <td>
                              {formatDate(
                                invoice.invoiceDate
                              )}
                            </td>

                            <td>
                              {formatDate(
                                invoice.dueDate
                              )}
                            </td>

                            <td
                              style={{
                                fontWeight:
                                  700,
                              }}
                            >
                              {formatMoney(
                                invoice.totalAmount,
                                invoice.currency
                              )}
                            </td>

                            <td>
                              {formatMoney(
                                invoice.paidAmount,
                                invoice.currency
                              )}
                            </td>

                            <td
                              style={{
                                fontWeight:
                                  700,
                                color:
                                  (invoice.amountDue ??
                                    0) >
                                  0
                                    ? "#dc2626"
                                    : "#059669",
                              }}
                            >
                              {formatMoney(
                                Math.max(
                                  invoice.amountDue ??
                                    0,
                                  0
                                ),
                                invoice.currency
                              )}
                            </td>

                            <td>
                              {renderPaymentStatusBadge(
                                invoice.paymentStatus
                              )}
                            </td>

                            <td>
                              {renderTimingBadge(
                                invoice.timingStatus
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedInvoice(
                                    invoice
                                  )
                                }
                                aria-label={`View ${invoice.invoiceNumber}`}
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  width:
                                    "36px",
                                  height:
                                    "36px",
                                  borderRadius:
                                    "50%",
                                  border:
                                    "1px solid var(--border)",
                                  background:
                                    "#f1ece5",
                                  color:
                                    "var(--primary)",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                <Eye
                                  size={17}
                                />
                              </button>
                            </td>
                          </motion.tr>
                        )
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    alignItems:
                      "center",
                    gap: "0.5rem",
                    marginTop:
                      "1.5rem",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (prev) =>
                          Math.max(
                            prev - 1,
                            1
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="btn-secondary"
                  >
                    Previous
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (_, index) =>
                      index + 1
                  ).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        style={{
                          minWidth:
                            "40px",
                          padding:
                            "0.5rem 0.75rem",
                          borderRadius:
                            "0.5rem",
                          border:
                            "1px solid var(--border)",
                          background:
                            currentPage ===
                            page
                              ? "var(--primary)"
                              : "white",
                          color:
                            currentPage ===
                            page
                              ? "white"
                              : "#4a4036",
                          fontWeight:
                            currentPage ===
                            page
                              ? 700
                              : 500,
                          cursor:
                            "pointer",
                        }}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (prev) =>
                          Math.min(
                            prev + 1,
                            totalPages
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Empty state */}
        {invoices.length === 0 &&
          !isLoadingInvoices && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              style={{
                marginTop:
                  "2.5rem",
                padding:
                  "2.5rem 1.5rem",
                textAlign:
                  "center",
                background:
                  "rgba(139, 121, 104, 0.03)",
                borderRadius:
                  "0.75rem",
                border:
                  "1px dashed var(--border)",
              }}
            >
              <FileText
                size={34}
                style={{
                  margin:
                    "0 auto 0.75rem",
                  color:
                    "var(--muted-foreground)",
                }}
              />

              <p
                style={{
                  color:
                    "var(--muted-foreground)",
                  fontSize:
                    "0.95rem",
                  margin: 0,
                }}
              >
                No invoices found
                for this account.
              </p>

              <p
                style={{
                  color:
                    "var(--muted-foreground)",
                  fontSize:
                    "0.85rem",
                  marginTop:
                    "0.3rem",
                }}
              >
                Upload a CSV
                batch to start
                reconciliation.
              </p>
            </motion.div>
          )}

        {/* Upload another batch */}
        <AnimatePresence>
          {!isProcessing &&
            progress === 100 && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                style={{
                  marginTop:
                    "2rem",
                  display: "flex",
                  justifyContent:
                    "center",
                }}
              >
                <button
                  type="button"
                  className="btn-primary"
                  onClick={
                    resetUpload
                  }
                >
                  Upload Another
                  Batch
                </button>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      {/* Invoice Details Drawer */}
      <AnimatePresence>
        {selectedInvoice && (
          <div
            style={{
              position:
                "fixed",
              inset: 0,
              zIndex: 60,
              display: "flex",
              justifyContent:
                "flex-end",
              background:
                "rgba(63, 53, 44, 0.28)",
              backdropFilter:
                "blur(4px)",
            }}
            onClick={() =>
              setSelectedInvoice(
                null
              )
            }
          >
            <motion.div
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                damping: 26,
                stiffness: 220,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              style={{
                width: "100%",
                maxWidth:
                  "520px",
                height:
                  "100vh",
                background:
                  "#fff",
                borderLeft:
                  "1px solid var(--border)",
                boxShadow:
                  "-14px 0 35px rgba(63, 53, 44, 0.16)",
                overflowY:
                  "auto",
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding:
                    "1.25rem 1.5rem",
                  borderBottom:
                    "1px solid var(--border)",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  position:
                    "sticky",
                  top: 0,
                  background:
                    "#fff",
                  zIndex: 2,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize:
                        "0.78rem",
                      color:
                        "var(--muted-foreground)",
                      marginBottom:
                        "0.15rem",
                    }}
                  >
                    Invoice
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "1.25rem",
                    }}
                  >
                    {
                      selectedInvoice.invoiceNumber
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedInvoice(
                      null
                    )
                  }
                  style={{
                    width:
                      "38px",
                    height:
                      "38px",
                    borderRadius:
                      "50%",
                    border:
                      "1px solid var(--border)",
                    background:
                      "#f1ece5",
                    color:
                      "#5d5146",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    cursor:
                      "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  padding:
                    "1.5rem",
                }}
              >
                {/* Status */}
                <div
                  style={{
                    display:
                      "flex",
                    gap: "0.6rem",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "1.5rem",
                  }}
                >
                  {renderPaymentStatusBadge(
                    selectedInvoice.paymentStatus
                  )}

                  {renderTimingBadge(
                    selectedInvoice.timingStatus
                  )}
                </div>

                {/* Invoice Information */}
                <DetailSection
                  title="Invoice Information"
                >
                  <DetailRow
                    label="Contact"
                    value={
                      selectedInvoice.contact ||
                      selectedInvoice.customerName ||
                      "-"
                    }
                  />

                  <DetailRow
                    label="Currency"
                    value={
                      selectedInvoice.currency ||
                      "-"
                    }
                  />

                  <DetailRow
                    label="Invoice Date"
                    value={formatDate(
                      selectedInvoice.invoiceDate
                    )}
                  />

                  <DetailRow
                    label="Due Date"
                    value={formatDate(
                      selectedInvoice.dueDate
                    )}
                  />

                  <DetailRow
                    label="Paid Date"
                    value={formatDate(
                      selectedInvoice.paidDate
                    )}
                  />
                </DetailSection>

                {/* Financial */}
                <DetailSection
                  title="Financial Summary"
                >
                  <DetailRow
                    label="Invoice Amount"
                    value={formatMoney(
                      selectedInvoice.amount,
                      selectedInvoice.currency
                    )}
                  />

                  <DetailRow
                    label="Tax"
                    value={formatMoney(
                      selectedInvoice.tax,
                      selectedInvoice.currency
                    )}
                  />

                  <DetailRow
                    label="Total Payable"
                    value={formatMoney(
                      selectedInvoice.totalAmount,
                      selectedInvoice.currency
                    )}
                    strong
                  />

                  <DetailRow
                    label="Paid Amount"
                    value={formatMoney(
                      selectedInvoice.paidAmount,
                      selectedInvoice.currency
                    )}
                  />

                  <DetailRow
                    label="Amount Due"
                    value={formatMoney(
                      Math.max(
                        selectedInvoice.amountDue ??
                          0,
                        0
                      ),
                      selectedInvoice.currency
                    )}
                    strong
                  />

                  {selectedInvoice.paymentStatus ===
                    "overpaid" && (
                    <DetailRow
                      label="Overpaid Amount"
                      value={formatMoney(
                        Math.max(
                          selectedInvoice.paidAmount -
                            (selectedInvoice.totalAmount ??
                              0),
                          0
                        ),
                        selectedInvoice.currency
                      )}
                      strong
                    />
                  )}
                </DetailSection>

                {/* Reconciliation */}
                <DetailSection
                  title="Reconciliation Result"
                >
                  <div
                    style={{
                      padding:
                        "0.9rem 1rem",
                    }}
                  >
                    {selectedInvoice.paymentStatus ===
                      "matched" && (
                      <p
                        style={{
                          margin: 0,
                          color:
                            "#047857",
                          fontSize:
                            "0.9rem",
                        }}
                      >
                        Paid amount
                        matches the
                        total payable
                        amount.
                      </p>
                    )}

                    {selectedInvoice.paymentStatus ===
                      "partially_paid" && (
                      <p
                        style={{
                          margin: 0,
                          color:
                            "#a16207",
                          fontSize:
                            "0.9rem",
                        }}
                      >
                        Payment is
                        less than the
                        total payable
                        amount.
                      </p>
                    )}

                    {selectedInvoice.paymentStatus ===
                      "unpaid" && (
                      <p
                        style={{
                          margin: 0,
                          color:
                            "#b91c1c",
                          fontSize:
                            "0.9rem",
                        }}
                      >
                        No payment has
                        been recorded
                        for this
                        invoice.
                      </p>
                    )}

                    {selectedInvoice.paymentStatus ===
                      "overpaid" && (
                      <p
                        style={{
                          margin: 0,
                          color:
                            "#a16207",
                          fontSize:
                            "0.9rem",
                        }}
                      >
                        Recorded payment
                        exceeds the
                        total payable
                        amount.
                      </p>
                    )}

                    {selectedInvoice.paymentStatus ===
                      "failed" && (
                      <p
                        style={{
                          margin: 0,
                          color:
                            "#b91c1c",
                          fontSize:
                            "0.9rem",
                        }}
                      >
                        This invoice
                        could not be
                        fully reconciled.
                      </p>
                    )}
                  </div>

                  {selectedInvoice.error && (
                    <div
                      className="error-text"
                      style={{
                        margin:
                          "0 1rem 1rem",
                        padding:
                          "0.75rem",
                        borderRadius:
                          "0.6rem",
                        background:
                          "rgba(239, 68, 68, 0.07)",
                      }}
                    >
                      <AlertTriangle
                        size={15}
                      />
                      {
                        selectedInvoice.error
                      }
                    </div>
                  )}
                </DetailSection>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div
            style={{
              position:
                "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              justifyContent:
                "flex-end",
              background:
                "rgba(63, 53, 44, 0.22)",
              backdropFilter:
                "blur(4px)",
            }}
            onClick={() =>
              setIsHistoryOpen(
                false
              )
            }
          >
            <motion.div
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 220,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              style={{
                width: "100%",
                maxWidth:
                  "480px",
                height:
                  "100vh",
                background:
                  "#fff",
                borderLeft:
                  "1px solid var(--border)",
                display:
                  "flex",
                flexDirection:
                  "column",
                boxShadow:
                  "-10px 0 30px rgba(63, 53, 44, 0.15)",
                overflow:
                  "hidden",
              }}
            >
              <div
                style={{
                  padding:
                    "1.5rem",
                  borderBottom:
                    "1px solid var(--border)",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  background:
                    "#f7f3ed",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "0.6rem",
                  }}
                >
                  <History
                    size={22}
                    style={{
                      color:
                        "var(--primary)",
                    }}
                  />

                  <h2
                    style={{
                      fontSize:
                        "1.25rem",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Invoice History
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsHistoryOpen(
                      false
                    )
                  }
                  style={{
                    width:
                      "38px",
                    height:
                      "38px",
                    borderRadius:
                      "50%",
                    border:
                      "1px solid var(--border)",
                    background:
                      "#f1ece5",
                    color:
                      "#5d5146",
                    cursor:
                      "pointer",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY:
                    "auto",
                  padding:
                    "1.25rem 1.5rem",
                }}
              >
                {invoices.length >
                0 ? (
                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap:
                        "0.75rem",
                    }}
                  >
                    {invoices.map(
                      (invoice) => (
                        <button
                          key={
                            invoice.id
                          }
                          type="button"
                          onClick={() => {
                            setIsHistoryOpen(
                              false
                            );
                            setSelectedInvoice(
                              invoice
                            );
                          }}
                          style={{
                            width:
                              "100%",
                            padding:
                              "1rem",
                            borderRadius:
                              "0.65rem",
                            background:
                              "#faf8f4",
                            border:
                              "1px solid var(--border)",
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap:
                              "1rem",
                            textAlign:
                              "left",
                            cursor:
                              "pointer",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight:
                                  700,
                                color:
                                  "#3f352c",
                                fontSize:
                                  "0.95rem",
                              }}
                            >
                              {
                                invoice.invoiceNumber
                              }
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "0.83rem",
                                color:
                                  "var(--muted-foreground)",
                                marginTop:
                                  "0.2rem",
                              }}
                            >
                              {invoice.contact ||
                                invoice.customerName ||
                                "-"}
                            </div>
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              alignItems:
                                "flex-end",
                              gap:
                                "0.35rem",
                            }}
                          >
                            <span
                              style={{
                                fontWeight:
                                  700,
                                color:
                                  "var(--primary)",
                                fontSize:
                                  "0.9rem",
                              }}
                            >
                              {formatMoney(
                                invoice.totalAmount,
                                invoice.currency
                              )}
                            </span>

                            {renderPaymentStatusBadge(
                              invoice.paymentStatus
                            )}
                          </div>
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "4rem 1rem",
                      color:
                        "var(--muted-foreground)",
                    }}
                  >
                    <FileText
                      size={36}
                      style={{
                        margin:
                          "0 auto 1rem",
                        opacity:
                          0.4,
                      }}
                    />

                    <p
                      style={{
                        margin: 0,
                        fontSize:
                          "0.95rem",
                      }}
                    >
                      No invoices
                      found in
                      history.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border:
          "1px solid var(--border)",
        borderRadius:
          "0.8rem",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
        }}
      >
        <span
          style={{
            fontSize:
              "0.78rem",
            color:
              "var(--muted-foreground)",
            fontWeight: 600,
          }}
        >
          {label}
        </span>

        <span
          style={{
            color:
              "var(--primary)",
            display:
              "inline-flex",
          }}
        >
          {icon}
        </span>
      </div>

      <div
        style={{
          marginTop:
            "0.45rem",
          fontSize:
            "1.5rem",
          lineHeight: 1,
          fontWeight: 800,
          color:
            "#3f352c",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FinanceCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background:
          "#f7f3ed",
        border:
          "1px solid var(--border)",
        borderRadius:
          "0.8rem",
        padding: "1rem",
      }}
    >
      <div
        style={{
          fontSize:
            "0.78rem",
          color:
            "var(--muted-foreground)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            "0.4rem",
          fontWeight: 800,
          fontSize:
            "1.2rem",
          color:
            "#3f352c",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginBottom:
          "1.5rem",
      }}
    >
      <h3
        style={{
          margin:
            "0 0 0.8rem",
          fontSize:
            "0.95rem",
          fontWeight: 800,
          color:
            "#3f352c",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          border:
            "1px solid var(--border)",
          borderRadius:
            "0.75rem",
          overflow:
            "hidden",
          background:
            "#faf8f4",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: "1rem",
        padding:
          "0.8rem 1rem",
        borderBottom:
          "1px solid var(--border)",
      }}
    >
      <span
        style={{
          color:
            "var(--muted-foreground)",
          fontSize:
            "0.84rem",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color:
            "#3f352c",
          fontSize:
            "0.88rem",
          fontWeight:
            strong
              ? 800
              : 600,
          textAlign:
            "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}