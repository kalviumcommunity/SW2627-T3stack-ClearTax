"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real invoices from backend
  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");

      const result = await response.json();

      if (result.success) {
        setInvoices(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  // Temporary processing function
  // We will connect this to POST /api/invoices/process next
 const startProcessing = async () => {
  if (!file) return;

  try {
    setIsProcessing(true);
    setProgress(20);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/invoices/process", {
      method: "POST",
      body: formData,
    });

    // Get response as text first
    const text = await response.text();

    // Check if the server returned anything
    if (!text) {
      throw new Error("Server returned an empty response");
    }

    const result = JSON.parse(text);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to process invoices");
    }

    setProgress(100);

    // Fetch updated invoices
    const invoicesResponse = await fetch("/api/invoices");
    const invoicesResult = await invoicesResponse.json();

    if (invoicesResult.success) {
      setInvoices(invoicesResult.data);
    }

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
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <main className="container">
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
          Securely upload and process your invoices in the background.
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
              className={`upload-zone ${
                isDragging ? "drag-active" : ""
              }`}
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

        {invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="table-container"
          >
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
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
                      <td>{inv.invoiceNumber}</td>

                      <td>{inv.customerName}</td>

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
                  fetchInvoices();
                }}
              >
                Upload Another Batch
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}