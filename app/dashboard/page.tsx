"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type InvoiceStatus =
  | "pending"
  | "processing"
  | "matched"
  | "mismatch"
  | "failed";

interface InvoiceRecord {
  id: number;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  amount: number;
  gstNumber: string;
  status: InvoiceStatus;
  error: string | null;
}

interface UserSession {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  // Minimal History state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch invoices for active user
  const fetchInvoices = useCallback(async (userId: string) => {
    setIsLoadingInvoices(true);
    try {
      const response = await fetch(`/api/invoices?userId=${encodeURIComponent(userId)}`, {
        headers: {
          "x-user-id": userId,
        },
      });

      const result = await response.json();
      if (result.success) {
        setInvoices(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  // Check user session
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cleartax_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          queueMicrotask(() => {
            setUser(parsed);
            fetchInvoices(parsed.id);
          });
          return;
        }
      }
    } catch {
      // Fallback
    }

    // If no active session, redirect to login
    router.push("/login");
  }, [router, fetchInvoices]);

  const handleLogout = () => {
    localStorage.removeItem("cleartax_user");
    router.push("/login");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (
      selectedFile.type !== "text/csv" &&
      !selectedFile.name.endsWith(".csv")
    ) {
      alert("Please upload a valid CSV file.");
      return;
    }

    setFile(selectedFile);
  };

  const startProcessing = async () => {
    if (!file || !user) return;

    try {
      setIsProcessing(true);
      setProgress(25);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/invoices/process", {
        method: "POST",
        headers: {
          "x-user-id": user.id,
        },
        body: formData,
      });

      const text = await response.text();
      if (!text) {
        throw new Error("Server returned an empty response");
      }

      const result = JSON.parse(text);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to process invoices");
      }

      setProgress(100);

      if (result.data && Array.isArray(result.data)) {
        setInvoices(result.data);
      }

      // Refresh invoices for active user
      await fetchInvoices(user.id);
    } catch (error) {
      console.error("Processing error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while processing invoices."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="badge badge-warning">
            <AlertTriangle size={16} /> Pending
          </span>
        );

      case "processing":
        return (
          <span className="badge">
            <FileText size={16} /> Processing
          </span>
        );

      case "matched":
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={16} /> Matched
          </span>
        );

      case "mismatch":
        return (
          <span className="badge badge-warning">
            <AlertTriangle size={16} /> Mismatch
          </span>
        );

      case "failed":
        return (
          <span className="badge badge-error">
            <XCircle size={16} /> Failed
          </span>
        );
    }
  };

  const containerVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <main className="container" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Top Navigation Bar with User Info & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1rem 1.5rem",
          background: "rgba(139, 121, 104, 0.05)",
          backdropFilter: "blur(12px)",
          borderRadius: "1rem",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              background: "rgba(181, 154, 122, 0.15)",
              color: "var(--primary)",
              padding: "0.5rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserIcon size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#4a4036", fontSize: "0.95rem" }}>
              {user?.name || "Account"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
              {user?.email || ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => setIsHistoryOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(181, 154, 122, 0.15)",
              color: "var(--primary)",
              border: "1px solid rgba(181, 154, 122, 0.3)",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(181, 154, 122, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(181, 154, 122, 0.15)";
            }}
          >
            <History size={16} /> History
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <motion.div
        className="card"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.h1 variants={itemVariants}>
          ClearTax Bulk Upload
        </motion.h1>

        <motion.p variants={itemVariants} className="subtitle">
          Securely upload and process your invoices in the background for account:{" "}
          <span style={{ color: "var(--primary)", fontWeight: 500 }}>
            {user?.email}
          </span>
        </motion.p>

        <AnimatePresence mode="wait">
          {!isProcessing && progress === 0 && (
            <motion.div
              key="upload-zone"
              variants={itemVariants}
              initial="hidden"
              animate="show"
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.2 },
              }}
              className={`upload-zone ${isDragging ? "drag-active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              {file ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center"
                >
                  <FileText className="upload-icon" />

                  <h3>{file.name}</h3>

                  <p
                    className="subtitle"
                    style={{ marginBottom: 0 }}
                  >
                    {(file.size / 1024).toFixed(2)} KB
                  </p>

                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      startProcessing();
                    }}
                    style={{ marginTop: "1.5rem" }}
                  >
                    Process CSV Now
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <UploadCloud className="upload-icon" />

                  <h3>Drag & Drop your CSV here</h3>

                  <p>
                    or click to browse files from your computer
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(isProcessing || progress > 0) && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="progress-container"
            >
              <div className="progress-header">
                <span>
                  {isProcessing
                    ? "Processing Invoices..."
                    : "Processing Complete"}
                </span>

                <span>{progress}%</span>
              </div>

              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {invoices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="table-container"
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Invoices List</h3>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--muted-foreground)",
                    background: "rgba(139, 121, 104, 0.05)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "1rem",
                  }}
                >
                  Total: {invoices.length}
                </span>
              </div>
            </div>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence>
                  {invoices.map((inv) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>

                      <td>{inv.customerName}</td>

                      <td style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                        {inv.invoiceDate}
                      </td>

                      <td>
                        ₹{inv.amount.toLocaleString()}
                      </td>

                      <td>
                        {renderStatusBadge(inv.status)}

                        {inv.error && (
                          <div className="error-text">
                            <AlertTriangle size={14} /> {inv.error}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        ) : (
          !isLoadingInvoices && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: "2.5rem",
                padding: "2.5rem 1.5rem",
                textAlign: "center",
                background: "rgba(139, 121, 104, 0.03)",
                borderRadius: "0.75rem",
                border: "1px dashed var(--border)",
              }}
            >
              <FileText
                size={32}
                style={{
                  margin: "0 auto 0.75rem auto",
                  color: "var(--muted-foreground)",
                  opacity: 0.6,
                }}
              />
              <p style={{ color: "var(--muted-foreground)", fontSize: "0.95rem", margin: 0 }}>
                No invoices found for this account ID.
              </p>
              <p style={{ color: "rgba(74, 64, 54, 0.5)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                Upload a CSV file above to process and match invoices.
              </p>
            </motion.div>
          )
        )}

        <AnimatePresence>
          {!isProcessing && progress === 100 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginTop: "3rem",
                textAlign: "center",
              }}
            >
              <button
                className="btn-primary"
                onClick={() => {
                  setFile(null);
                  setProgress(0);
                  if (user) {
                    fetchInvoices(user.id);
                  }
                }}
              >
                Upload Another Batch
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Minimal History Slide-Over Drawer Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              justifyContent: "flex-end",
              background: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setIsHistoryOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "480px",
                height: "100vh",
                background: "#fdfbf7",
                borderLeft: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "-10px 0 30px rgba(139, 121, 104, 0.2)",
                overflow: "hidden",
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(139, 121, 104, 0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <History size={22} style={{ color: "var(--primary)" }} />
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#4a4036" }}>
                    Invoice History
                  </h2>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  style={{
                    background: "rgba(139, 121, 104, 0.05)",
                    border: "1px solid var(--border)",
                    color: "#8b7968",
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#4a4036")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8b7968")}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Minimal Invoices List (Only the invoices) */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
                {invoices.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "0.6rem",
                          background: "rgba(139, 121, 104, 0.03)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#4a4036", fontSize: "0.95rem" }}>
                            {inv.invoiceNumber}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--muted-foreground)", marginTop: "0.2rem" }}>
                            {inv.customerName}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                          <span style={{ fontWeight: 600, color: "#b59a7a", fontSize: "0.95rem" }}>
                            ₹{inv.amount.toLocaleString()}
                          </span>
                          {renderStatusBadge(inv.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "4rem 1rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    <FileText size={36} style={{ margin: "0 auto 1rem auto", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#8b7968" }}>
                      No invoices found in history.
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
