# Invoice Validation Rules

## 1. Purpose

This document defines the validation rules and invoice statuses for the ClearTax invoice processing workflow.

The goal is to make the validation and status behavior clear before backend implementation.

---

## 2. Invoice Statuses

### Pending

The invoice has been uploaded successfully but processing has not started yet.

### Processing

The invoice is currently being processed and validated.

### Matched

The invoice has been processed successfully and all required validation checks have passed.

### Mismatched

The invoice has been processed, but one or more invoice values do not match the expected/reference values.

### Failed

The invoice could not be processed because of invalid data, invalid format, or another processing error.

---

## 3. Status Flow

The normal invoice processing flow is:

Pending → Processing → Matched

If validation finds a mismatch:

Pending → Processing → Mismatched

If processing fails:

Pending → Processing → Failed

---

## 4. CSV Validation Rules

Before processing a CSV file, the following checks should be performed:

- The uploaded file must be a CSV file.
- The CSV file must not be empty.
- Required columns must be present.
- Each invoice must have a valid invoice ID.
- Customer information must be present.
- Invoice amount must be valid.
- GST information must be valid.
- Invoice date must be valid.
- Each invoice row should be validated independently.

---

## 5. Required CSV Fields

The initial required fields are:

| Field | Description |
|---|---|
| Invoice ID | Unique identifier for the invoice |
| Customer Name | Name of the customer |
| Amount | Invoice amount |
| GST | GST information |
| Date | Invoice date |

---

## 6. Row-Level Failure Handling

If one invoice row fails validation, the remaining valid rows should continue processing.

For example:

| Invoice | Result |
|---|---|
| INV001 | Matched |
| INV002 | Failed |
| INV003 | Matched |

A failed invoice must not stop processing of the other invoice rows.

---

## 7. Invalid CSV Structure

If the CSV structure is invalid, such as missing required columns, the upload should be rejected with a clear validation error.

If the CSV structure is valid, individual invoice rows can be processed and assigned their appropriate status.

---

## 8. Validation Result

Each processed invoice should end with one of the following statuses:

- Pending
- Processing
- Matched
- Mismatched
- Failed