# ClearTax Bulk Invoice Processing

A bulk invoice processing application built with Next.js.

## Current Features

### Invoice APIs

- Get all invoices
- Create a new invoice
- Get a single invoice by ID
- Update invoice status and error details

### Processing

Invoices currently follow this lifecycle:

pending → processing → matched / mismatch / failed

### Progress Tracking

The application tracks:

- Total invoices
- Pending invoices
- Processing invoices
- Processed invoices
- Processing percentage

## API Endpoints

### Get All Invoices

GET `/api/invoices`

Returns all available invoices.

### Create Invoice

POST `/api/invoices`

Creates a new invoice with validation.

### Get Invoice by ID

GET `/api/invoices/:id`

Returns a specific invoice.

### Update Invoice

PATCH `/api/invoices/:id`

Updates the invoice status and error information.

Possible statuses:

- pending
- processing
- matched
- mismatch
- failed

### Start Processing

POST `/api/invoices/process`

Changes pending invoices to processing.

### Get Processing Progress

GET `/api/invoices/progress`

Returns the current invoice processing progress.

## Current Project Flow

Create Invoice
↓
Pending
↓
Start Processing
↓
Processing
↓
Matched / Mismatch / Failed
↓
Track Progress

## Current Limitation

The project currently uses in-memory data from `lib/invoices.js`. The data resets when the server restarts.

## Upcoming Features

- CSV invoice upload
- Bulk invoice processing
- Row-level error handling
- Background processing
- Database integration
- Frontend invoice table
- Live progress bar

## Tech Stack

- Next.js
- React
- Next.js Route Handlers