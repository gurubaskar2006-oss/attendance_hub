# School Operations Platform
### Multi-Tenant School Attendance & Management Platform
**Product Owner:** 6th Civilians Corporation  
**Commercial Model:** Permanent Software Licensing Model (One-Time License Purchase)  
**Supported Locales:** English, Tamil (தமிழ்)

---

## 1. Executive & Architectural Overview

The **School Operations Platform** is an enterprise-grade, centralized, multi-tenant school administration and student management solution built specifically for the Indian school ecosystem (Matriculation, CBSE, ICSE, State Board).

### Core Pillars
- **Strict Multi-Tenant Isolation:** Centralized single-database architecture where all school-owned data is strictly partitioned by an immutable `tenantId`. Tenant context is enforced exclusively on the backend from verified JWT tokens—never from client headers or payloads. Cross-tenant tampering attempts are immediately blocked with HTTP 403 Forbidden and recorded in immutable security audit logs.
- **One-Time Permanent Software License Model:** Schools acquire a lifetime perpetual license key. Modules (Attendance, Exams, Student Information, Reports, SMS/WhatsApp) are unlocked permanently. Recurring commercial costs are confined to external usage-based services (SMS gateways, Meta WhatsApp Business API, Cloud Storage, and AMC).
- **Role-Based Access Control (RBAC):** Granular access across 6 dedicated user roles:
  1. **Company Super Admin (6th Civilians Corp):** Platform health, school onboarding, license issuance, module entitlements, audited license transfers, and gateway configurations.
  2. **School Admin:** Academic setup, classes, sections, subjects, teacher assignments, student/staff directories, bulk CSV onboarding, and institutional settings.
  3. **Principal:** Executive campus KPIs, class-wise attendance rankings, chronic absenteeism alerts, teacher directory, and academic summaries.
  4. **Academic Coordinator:** Class & section allocations, subject curriculum assignments, marks-entry coordination, and timetable oversight.
  5. **Teacher:** Ultra-fast, mobile-friendly 1-click attendance ("Mark All Present"), quick status toggling, live summary counters, submission locking, and marks entry.
  6. **Parent:** Mobile-first portal with verified multi-child switcher, daily status, interactive monthly attendance calendar, leave applications, downloadable PDF report cards, and bilingual (English/Tamil) notification alerts.
- **Audited Attendance & Corrections:** Complete lifecycle tracking for daily sessions (Morning/Afternoon/Full Day) with statuses: `Present`, `Absent`, `Late`, `Half Day`, and `Approved Leave`. Every post-submission modification generates an immutable audit record capturing previous status, new status, justification reason, author, and timestamp.
- **Automated PDF Engine:** Server-side PDF generation using `pdfkit` for Student Progress Report Cards and Monthly Class Attendance Registers.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query, React Router v6, Axios |
| **Backend** | Node.js, Express.js, TypeScript, Mongoose ODM, Zod, JWT, Helmet, Morgan, Winston-style Logger |
| **Database** | MongoDB (Production) / Auto-booting embedded `MongoMemoryServer` (Development & Testing) |
| **Reporting** | Server-side PDF generation via `pdfkit` with custom layout & institutional branding |
| **Messaging** | Bilingual SMS (MSG91-ready) & WhatsApp (Meta Cloud API-ready) adapters with simulated fallback |
| **Testing** | Jest, Supertest, ts-jest (15 comprehensive automated multi-tenancy, security, and logic tests) |

---

## 3. Project Structure

```
attendance hub/
├── package.json                   # Monorepo scripts (dev, build, test, seed, start)
├── README.md                      # Comprehensive architecture and run guide
├── server/                        # Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                # Environment variables and database connection (Mongo / Memory)
│   │   ├── middleware/            # JWT Auth, Strict Tenant Isolation, RBAC, Validation, Error Handling
│   │   ├── models/                # 17 Mongoose models with tenantId & compound indexes
│   │   ├── modules/               # Domain REST controllers & routes
│   │   │   ├── auth/              # Login, logout, refresh token, demo authentication
│   │   │   ├── platform/          # Super Admin dashboard, onboarding, licensing, audit logs
│   │   │   ├── academic/          # Academic years, classes, sections, subjects, teacher allocations
│   │   │   ├── students/          # Student CRUD, filters, search, bulk CSV import
│   │   │   ├── staff/             # Teacher & staff directory, account creation, activation toggles
│   │   │   ├── parents/           # Parent profiles, verified student-child linking, my-children API
│   │   │   ├── attendance/        # Attendance marking, bulk submit, audited corrections, calendar
│   │   │   ├── examinations/      # Exam schedules, max marks validation, marks entry, grades
│   │   │   ├── leave/             # Parent leave requests, school admin approvals
│   │   │   ├── announcements/     # School-wide & role-targeted notices
│   │   │   ├── notifications/     # Notification dispatch & audit history
│   │   │   └── reports/           # PDF Report Card & Monthly Attendance Register streaming
│   │   ├── services/              # PDF generation, SMS adapter, WhatsApp adapter, async task queue
│   │   ├── tests/                 # Jest integration tests (Multi-tenancy isolation, auth, attendance, marks)
│   │   └── scripts/               # Seed script with realistic Indian schools, students, and demo logins
│   ├── dist/                      # Compiled backend production JavaScript
│   ├── jest.config.js             # Jest test configuration
│   └── tsconfig.json              # TypeScript compiler configuration
├── client/                        # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/            # Reusable UI (Layout, Modal, Badge, StatCard)
│   │   ├── context/               # AuthContext (JWT tokens, role guards, active child switcher)
│   │   ├── pages/                 # Full feature views across all 6 roles
│   │   │   ├── auth/              # LoginPage (with 1-click Demo Quick Fill buttons)
│   │   │   ├── super-admin/       # Platform Overview, Schools, Licenses, Settings, Audit Logs
│   │   │   ├── school-admin/      # Academic Setup, Students, Staff, Parents, Dashboard
│   │   │   ├── principal/         # Executive KPIs, Chronic Absenteeism, Class Rankings
│   │   │   ├── coordinator/       # Class/Section oversight, Teacher allocations
│   │   │   ├── teacher/           # 1-Click Fast Attendance, Summary Counters, Locking
│   │   │   ├── parent/            # Child switcher, Calendar, Leave modal, Report cards, Tamil alerts
│   │   │   ├── examinations/      # Exam lists, Marks entry grid, Grade calculations
│   │   │   ├── reports/           # PDF Download triggers
│   │   │   ├── announcements/     # Broadcasts & Target Audiences
│   │   │   └── notifications/     # In-app notification center
│   │   ├── services/              # Axios API client with Bearer token interceptor
│   │   └── types/                 # Shared TypeScript interfaces
│   ├── dist/                      # Production frontend bundle
│   └── vite.config.ts             # Vite configuration with API proxy
```

---

## 4. Quick Start Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **pnpm** or **npm**
- **Operating System:** Windows, macOS, or Linux
- *Note:* An external MongoDB installation is **NOT required** for development or evaluation. The system automatically boots an embedded in-memory MongoDB runner when an external database is not detected.

### 1. Installation
Clone the repository and install root, server, and client dependencies:
```bash
# In the repository root:
pnpm install
```

### 2. Running the Automated Test Suite
Run the 15 automated integration tests validating tenant isolation, JWT security, attendance locking/corrections, and marks grading:
```bash
# Run Jest tests
npm test
```
*Expected Result:*
```
PASS src/tests/tenant-isolation.test.ts
PASS src/tests/marks.test.ts
PASS src/tests/attendance.test.ts
PASS src/tests/auth.test.ts

Test Suites: 4 passed, 4 total
Tests:       15 passed, 15 total
Snapshots:   0 total
```

### 3. Seeding Demo Data
To populate the database with realistic Indian schools, students, classes, examinations, and demo accounts:
```bash
npm run seed
```
*(The backend also automatically auto-seeds demo data on first boot if an empty database is detected).*

### 4. Running the Development Servers
Start both the Express API backend (Port 5000) and the Vite frontend (Port 5173):
```bash
npm run dev
```
- **Frontend URL:** `http://localhost:5173`
- **Backend Health Check:** `http://localhost:5000/health`
- **API Base URL:** `http://localhost:5000/api/v1`

---

## 5. Demo Credentials

Every role has a pre-configured account with the default password: **`Password@123`**.  
*Tip: The Login Page includes 1-click **"Demo Fill"** buttons for instantaneous testing without typing.*

| Role | Email | School Code | Primary Capabilities |
|---|---|---|---|
| **Super Admin** | `superadmin@6thcivilians.com` | *(None)* | Platform monitoring, school onboarding, lifetime licenses, gateway setup |
| **School Admin** | `admin@stxaviers.edu.in` | `SXMHSS` | Academic setup, classes, student CRUD, staff directory, bulk CSV import |
| **Principal** | `principal@stxaviers.edu.in` | `SXMHSS` | Campus KPIs, chronic absenteeism alerts, class rankings |
| **Coordinator** | `coordinator@stxaviers.edu.in` | `SXMHSS` | Curriculum allocation, teacher subject assignments, timetable |
| **Teacher** | `kavitha.math@stxaviers.edu.in` | `SXMHSS` | 1-Click Fast Attendance, live counters, submit & lock, marks entry |
| **Parent 1** | `subramanian.parent@gmail.com` | `SXMHSS` | Linked child: Divya Subramanian (Class 10-A), attendance calendar, PDF report card |
| **Parent 2** | `ramesh.parent@gmail.com` | `SXMHSS` | Linked child: Kaviya Ramesh (Class 10-A), apply leave, bilingual alerts |
| **School 2 Admin**| `admin@greenwood.edu.in` | `GIPS` | Isolated tenant (Greenwood International School, Bengaluru) |

---

## 6. Multi-Tenant Security & Tenant Isolation Rules

The platform follows a zero-trust multi-tenant security architecture:
1. **Token-Derived Tenant Context:** Every authenticated request resolves `req.tenantId` strictly from the server-validated JWT payload.
2. **Tampering Interception:** The `enforceTenant` middleware inspects `req.body`, `req.params`, `req.query`, and custom headers. If a user attempts to supply a mismatched `tenantId`, the request is immediately aborted with `HTTP 403 Forbidden` and logged in `AuditLog` under action `CROSS_TENANT_ACCESS_BLOCKED`.
3. **Compound Database Indexes:** Every query applies `{ tenantId: req.tenantId, ... }` to ensure zero cross-tenant leakage.
4. **Data Isolation Tests:** Automated tests prove that School A cannot view, query, or mutate records belonging to School B, even when targeting exact MongoDB ObjectIDs.

---

## 7. Permanent Licensing Model Specification

6th Civilians Corporation licenses this software under a **one-time permanent purchase agreement**:
- **License Keys:** Cryptographically unique license strings (e.g., `LIC-SXMHSS-2025-PERM-94812`).
- **Module Entitlements:** Array of licensed modules (e.g., `ATTENDANCE`, `EXAMINATIONS`, `REPORTS`, `STUDENTS`, `NOTIFICATIONS`).
- **Status Lifecycle:** `ACTIVE`, `SUSPENDED`, `REVOKED`. If a license is marked `SUSPENDED`, school users receive `HTTP 403` with a prompt to contact platform administration.
- **Audited Transfers:** School ownership transfers or re-activations record legal agreement references, previous owner, new owner, and authorized officer signatures.
- **Separate Commercial Services:** External messaging (SMS/WhatsApp) and cloud backup storage are managed as separate metered add-ons without disabling core platform software access.

---

## 8. Automated API Endpoints Reference

### Authentication (`/api/v1/auth`)
- `POST /login` - Multi-role login with school code validation & JWT issuance
- `POST /logout` - Invalidate session & clear HTTP-only cookies
- `GET /me` - Retrieve current user profile, tenant information, and license entitlements
- `POST /refresh` - Refresh expired access token using refresh token

### Platform Administration (`/api/v1/platform`) *(Super Admin Only)*
- `GET /dashboard` - Global platform metrics (schools, licenses, students, system health)
- `GET /schools` - List all registered schools with license status
- `POST /schools` - Register new school, generate unique tenant ID, and issue permanent license
- `PATCH /schools/:tenantId/status` - Activate or suspend school access
- `GET /licenses` - Global license registry with module breakdown
- `PATCH /licenses/:licenseKey/status` - Update license status
- `POST /licenses/:licenseKey/transfer` - Audited license ownership transfer
- `GET /settings` - SMS / WhatsApp gateway health and platform settings
- `GET /audit-logs` - Platform-wide security and operational audit trail

### Academic Architecture (`/api/v1/academic`)
- `GET /years` & `POST /years` - Academic year management
- `GET /classes` & `POST /classes` - Grade level configuration
- `GET /sections` & `POST /sections` - Section creation
- `GET /subjects` & `POST /subjects` - Subject catalog
- `GET /allocations` & `POST /allocations` - Assign teachers to classes and subjects

### Attendance Management (`/api/v1/attendance`)
- `GET /today-overview` - Campus attendance KPIs and class-wise status
- `GET /class-sheet` - Retrieve student roster for attendance marking
- `POST /submit` - Submit daily attendance sheet (supports 1-click batch submit)
- `POST /correct` - Authorized attendance correction with audit reason logging
- `GET /calendar` - Monthly attendance calendar with color-coded status badges

### Student Management (`/api/v1/students`)
- `GET /` - Paginated student directory with class/section/search filters
- `POST /` - Register new student (duplicate admission number check)
- `GET /:id` & `PUT /:id` - Retrieve and update student profile
- `POST /bulk-import` - Bulk CSV upload with row-by-row validation

### PDF Reports (`/api/v1/reports`)
- `GET /student/:studentId/exam/:examinationId/pdf` - Download Student Report Card PDF
- `GET /class/:classId/section/:sectionId/monthly-attendance/pdf` - Download Monthly Attendance Register PDF

---

## 9. Verification & Quality Assurance Summary

- **TypeScript Compilation:** 100% clean build (`server/dist` and `client/dist`) with 0 warnings or errors.
- **Automated Tests:** 15 out of 15 Jest tests passing.
- **End-to-End Smoke Tests:**
  - Super Admin Dashboard API: Verified
  - School Admin Login & Student Directory: Verified
  - Teacher 1-Click Attendance Flow: Verified
  - Parent Child Switcher & Verified Relations: Verified
  - PDF Generation (Report Cards & Attendance Registers): Verified
  - Tamil and English Notification Localization: Verified

