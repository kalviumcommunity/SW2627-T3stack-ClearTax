ClearTax Bulk Invoice Processing System
Product Requirements Document (PRD)
1. Project Overview
Project Name

ClearTax Bulk Invoice Processing System

Project Description

The ClearTax Bulk Invoice Processing System is a web application designed to simplify the process of managing and processing multiple invoices.

The application provides a user interface where users can navigate through the application, view invoices, upload CSV files, initiate invoice processing, track processing progress, and view invoice statuses.

The current implementation uses Next.js for both the frontend and backend API routes. Invoice data is currently stored in memory using a JavaScript data file.

2. Problem Statement

Businesses may need to process a large number of invoices. Manually reviewing and tracking every invoice can be time-consuming and difficult.

The system aims to provide a simple workflow for bulk invoice processing.

Users should be able to:

Upload a CSV file containing invoice data.
View invoice records.
Start invoice processing.
Track the progress of processing.
View the final processing status of invoices.
Identify invoices that are successfully processed or require attention.
3. Project Goals

The main goals of the project are:

Create a modern and responsive invoice processing interface.
Allow users to upload CSV files.
Display invoice information in a dashboard.
Provide an API for retrieving invoice data.
Process pending invoices.
Track the progress of invoice processing.
Display invoice statuses after processing.
Create a foundation that can later support real CSV parsing, authentication, and database integration.
4. Target Users

The application is intended for users who need to manage and process multiple invoices.

Potential users include:

Businesses
Accountants
Finance teams
Tax professionals
Invoice processing teams
Administrators

5. User Flow

The current application flow is:
User
  ↓
Landing Page
  ↓
Get Started
  ↓
Signup / Login
  ↓
Dashboard
  ↓
View Invoices
  ↓
Upload CSV File
  ↓
Click "Process CSV Now"
  ↓
POST /api/invoices/process
  ↓
Invoices Are Processed
  ↓
Progress Updates to 100%
  ↓
Updated Invoice Status Displayed

6. Features
6.1 Landing Page

The application includes a landing page that introduces the ClearTax Bulk Invoice Processing System.

The landing page includes:

Application title and description.
Get Started button.
Navigation to the signup page.
Animated user interface elements.
Information about security and processing.
6.2 Signup Page

The application includes a signup page as part of the user navigation flow.

Users can navigate to the signup page from the landing page.

The current implementation focuses on the frontend interface.

6.3 Login Page

A login page is included in the application.

The page provides the user interface required for the login flow.

Full authentication integration can be implemented in a future version.

6.4 Invoice Dashboard

The dashboard displays invoice data retrieved from the backend API.

Each invoice contains information such as:

Field	Description
ID	Unique invoice identifier
Invoice Number	Invoice reference number
Customer Name	Name of the customer
Invoice Date	Date of the invoice
Amount	Invoice amount
GST Number	GST identification number
Status	Current invoice processing status
Error	Error information, if applicable

Example invoice data:

{
  "id": 1,
  "invoiceNumber": "INV-001",
  "customerName": "ABC Pvt Ltd",
  "invoiceDate": "2026-08-24",
  "amount": 15000,
  "gstNumber": "27ABCDE1234F1Z5",
  "status": "pending",
  "error": null
}
7. CSV Upload
The dashboard allows users to select and upload a CSV file.

The user can:

Drag and drop a CSV file.
Click the upload area to browse for a file.
View the selected filename.
View the file size.
Start processing using the Process CSV Now button.

The application validates that the selected file is a CSV file.

A sample test file is included:

test-invoices.csv

Example CSV structure:

invoiceNumber,customerName,invoiceDate,amount,gstNumber
INV-003,Test Company,2026-08-25,12000,27ABCDE1234F1Z5
INV-004,Demo Pvt Ltd,2026-08-25,25000,29ABCDE5678G1Z2
8. Invoice Processing

When the user uploads a CSV file and clicks Process CSV Now, the frontend sends a request to:

POST /api/invoices/process

The processing API performs the following workflow:

CSV File Selected
       ↓
Frontend Creates FormData
       ↓
POST Request Sent
       ↓
Backend Receives File
       ↓
Pending Invoices Identified
       ↓
Invoice Status Updated
       ↓
JSON Response Returned
       ↓
Frontend Fetches Updated Invoices
       ↓
Dashboard Updated

The current implementation processes the invoices stored in the application's invoice data.

The uploaded CSV currently acts as a trigger for the processing flow.

9. Invoice Statuses

The system supports the following invoice statuses:

Status	Description
pending	Invoice is waiting to be processed
processing	Invoice is currently being processed
matched	Invoice was successfully processed
mismatch	Invoice contains a mismatch
failed	Invoice processing failed

The general status flow is:

Pending
   ↓
Processing
   ↓
Matched / Mismatch / Failed
10. Progress Tracking

The application calculates invoice processing progress.

The progress information includes:

Total invoices.
Processed invoices.
Invoices currently processing.
Pending invoices.
Completion percentage.

Example progress response:

{
  "success": true,
  "progress": {
    "total": 2,
    "processed": 2,
    "processing": 0,
    "pending": 0,
    "percentage": 100
  }
}

The dashboard displays a progress bar to show the processing state.

When processing is complete, the user sees:

Processing Complete
100%

The application also provides an Upload Another Batch button.

11. Functional Requirements
FR-1: View Landing Page

The system shall provide a landing page that introduces the application.

FR-2: Navigate to Signup

The user shall be able to click the Get Started button and navigate to the signup page.

FR-3: Access Authentication Pages

The system shall provide login and signup user interfaces.

FR-4: View Invoices

The dashboard shall retrieve and display invoice data from the invoice API.

FR-5: Upload CSV File

The user shall be able to upload a .csv file using drag and drop or file selection.

FR-6: Validate File Type

The application shall reject files that are not CSV files.

FR-7: Process Invoices

The user shall be able to click Process CSV Now to trigger invoice processing.

FR-8: Display Progress

The system shall display the current processing progress as a percentage.

FR-9: Update Invoice Status

The system shall update and display invoice statuses after processing.

FR-10: Upload Another Batch

After processing is complete, the user shall be able to reset the interface and upload another file.

12. API Requirements
12.1 Get All Invoices
Endpoint
GET /api/invoices
Purpose

Returns all available invoice records.

Example Response
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "invoiceNumber": "INV-001",
      "customerName": "ABC Pvt Ltd",
      "invoiceDate": "2026-08-24",
      "amount": 15000,
      "gstNumber": "27ABCDE1234F1Z5",
      "status": "pending",
      "error": null
    },
    {
      "id": 2,
      "invoiceNumber": "INV-002",
      "customerName": "XYZ Enterprises",
      "invoiceDate": "2026-08-24",
      "amount": 25000,
      "gstNumber": "29ABCDE5678G1Z2",
      "status": "pending",
      "error": null
    }
  ]
}
12.2 Process Invoices
Endpoint
POST /api/invoices/process
Purpose

Receives the CSV file request and starts invoice processing.

Request

The frontend sends the uploaded file using FormData.

Example:

file: test-invoices.csv
Example Response
{
  "success": true,
  "message": "Invoices processed successfully",
  "data": []
}
13. Technology Stack
Technology	Purpose
Next.js	Full-stack web framework
React	Frontend user interface
TypeScript	Type safety for frontend components
JavaScript	API route implementation
Node.js	JavaScript runtime
Framer Motion	UI animations
Lucide React	Icons
CSS	Application styling
Git	Version control
GitHub	Repository hosting and Pull Requests
14. System Architecture

The application currently follows a simple client-server architecture.

                    ┌───────────────┐
                    │     User      │
                    └───────┬───────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Next.js Frontend    │
                │                       │
                │ • Landing Page        │
                │ • Login / Signup      │
                │ • Dashboard           │
                │ • CSV Upload          │
                │ • Progress Display    │
                └───────────┬───────────┘
                            │
                            │ HTTP Requests
                            ▼
                ┌───────────────────────┐
                │   Next.js API Routes  │
                │                       │
                │ GET /api/invoices     │
                │ POST /api/invoices/   │
                │      process          │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Invoice Data Store  │
                │                       │
                │    lib/invoices.js    │
                └───────────────────────┘
15. Project Structure
cleartax/
│
├── app/
│   │
│   ├── api/
│   │   └── invoices/
│   │       ├── route.js
│   │       │
│   │       └── process/
│   │           └── route.js
│   │
│   ├── dashboard/
│   │   └── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── signup/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.module.css
│   └── page.tsx
│
├── components/
│   └── MouseTracker.tsx
│
├── docs/
│   └── PRD.md
│
├── lib/
│   └── invoices.js
│
├── test-invoices.csv
├── README.md
├── package.json
├── package-lock.json
└── tsconfig.json
16. Testing Performed

The following functionality was tested during development.

Frontend Testing
Landing page successfully loaded.
Dashboard successfully loaded.
Login page was added.
Signup page was added.
Missing frontend dependencies were installed.
Required TypeScript packages were installed.
UI animations and icons were successfully loaded.
API Testing

The following endpoint was tested:

GET /api/invoices

The API successfully returned invoice data.

The invoice processing endpoint was also tested:

POST /api/invoices/process

The processing route successfully returned a JSON response.

CSV Upload Testing

The following flow was tested:

Select CSV File
       ↓
CSV File Uploaded
       ↓
Click Process CSV Now
       ↓
POST Request Sent
       ↓
Invoice Processing Started
       ↓
Invoices Updated
       ↓
Progress Reached 100%
       ↓
Processing Complete

The final test successfully showed invoices with the status:

Matched
17. Challenges Faced and Solutions
Challenge 1: Missing Frontend Dependencies

The application initially produced module errors for:

framer-motion
lucide-react
Solution

The required npm packages were installed.

After installing the dependencies, the frontend was able to compile and load successfully.

Challenge 2: Duplicate Next.js Pages

The project contained both:

app/page.js

and:

app/page.tsx

Both files attempted to handle the root route.

Solution

The old JavaScript page was removed and the TypeScript page was used.

Challenge 3: Invoice Import Issue

An earlier issue occurred when importing the invoice data because the exported variable name did not match the imported name.

Solution

The invoice data export was corrected to:

export const invoices = [
  // invoice data
];

The API route was then able to import the invoice data correctly.

Challenge 4: Empty JSON Response

During CSV processing, the frontend produced the error:

Unexpected end of JSON input

The frontend attempted to parse the server response using:

response.json()

However, the backend processing route did not properly handle the POST request.

Solution

A POST handler was added to the invoice processing route.

The backend now returns a JSON response using:

NextResponse.json()
Challenge 5: Incorrect API URL

An error occurred while testing an API route because the incorrect URL was entered.

Solution

The correct API endpoint was identified and tested successfully.

18. Current Limitations

The current project is a working prototype.

The following limitations currently exist:

Invoice data is stored in memory.
Data may reset when the development server restarts.
The uploaded CSV currently triggers the processing flow.
CSV rows are not yet fully parsed and added as new invoice records.
Authentication is currently represented through frontend pages.
A production database is not yet integrated.
Processing is currently simulated through the existing invoice data.
19. Future Improvements

The following features are planned for future development.

19.1 Real CSV Parsing

The uploaded CSV should be read and converted into invoice records.

The future flow will be:

Upload CSV
    ↓
Read CSV File
    ↓
Parse CSV Rows
    ↓
Validate Invoice Data
    ↓
Create Invoice Records
    ↓
Store Invoices
    ↓
Process Invoices
    ↓
Display Results
19.2 Database Integration

The current in-memory invoice array can be replaced with a database.

Possible database options include:

PostgreSQL
MySQL
MongoDB

A database would allow invoice records to persist after the server restarts.

19.3 Authentication

Future authentication features may include:

User registration.
User login.
Password security.
Session management.
Protected dashboard routes.
User-specific invoice data.
19.4 Invoice Validation

Future invoice validation can include:

GST number validation.
Invoice number validation.
Duplicate invoice detection.
Required field validation.
Amount validation.
Invalid date detection.
19.5 Background Processing

For large invoice batches, processing could be moved to a background job system.

This would allow the application to:

Process large CSV files.
Continue processing without blocking the user interface.
Provide real-time status updates.
Handle failed jobs.
Retry unsuccessful invoice processing.
20. Success Criteria

The current phase of the project is considered successful if:

 The Next.js application runs successfully.
 The landing page loads.
 Login and signup pages are available.
 The dashboard loads successfully.
 Invoice data is retrieved from the API.
 CSV files can be selected.
 Invalid file types are rejected.
 Invoice processing can be triggered.
 Processing progress is displayed.
 Processing reaches 100%.
 Processed invoices display updated statuses.
 API responses return valid JSON.
21. Conclusion

The ClearTax Bulk Invoice Processing System provides a working foundation for a bulk invoice management and processing application.

The current implementation successfully demonstrates the complete basic workflow from the frontend to the backend:

User Interaction
      ↓
CSV Selection
      ↓
Invoice Processing Request
      ↓
Next.js API Route
      ↓
Invoice Status Update
      ↓
JSON Response
      ↓
Dashboard Update
      ↓
Processing Complete

The project currently includes a modern frontend, landing page, authentication interfaces, invoice dashboard, CSV upload interface, invoice API integration, processing flow, progress tracking, and invoice status updates.

The next major development milestone is real CSV parsing, where uploaded CSV rows will be validated, converted into invoice records, and processed dynamically.