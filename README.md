# 🏠 nestRoom Hostels Backend

> A production-ready REST API for hostel management — built with Node.js, Express, and MongoDB.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com/atlas)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-blue)](https://razorpay.com)

---

## Table of Contents

- [What This Project Does](#what-this-project-does)
- [Who Is This For](#who-is-this-for)
- [Project Architecture](#project-architecture)
- [Complete File Structure](#complete-file-structure)
- [Prerequisites](#prerequisites)
- [Step-by-Step Setup](#step-by-step-setup)
- [Getting API Keys](#getting-api-keys)
- [Environment Variables Reference](#environment-variables-reference)
- [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [How Authentication Works](#how-authentication-works)
- [How Payments Work](#how-payments-work)
- [How Attendance Works](#how-attendance-works)
- [Deployment to Vercel](#deployment-to-vercel)
- [Common Errors and Fixes](#common-errors-and-fixes)

---

## What This Project Does

nestRoom is a **hostel management platform** backend. It handles everything a hostel owner needs:

| Feature | What it does |
|---------|-------------|
| 🔐 Authentication | Owner signup, employee/resident login, 2FA, password reset |
| 🏨 Hostel Management | Manage hostel profile, bank details, buildings, rooms, beds |
| 👩‍🎓 Resident Management | Add residents, KYC document upload and verification |
| 💳 Payments | Razorpay online payments + manual cash/check recording |
| 📍 Attendance | GPS-based geofence attendance with live location check |
| 🌴 Leave Management | Residents apply for leave; staff approve/reject |
| 📢 Notifications | Send announcements and polls to residents |
| 🗳️ Complaints | Residents raise issues; staff manage resolution |
| 🍽️ Food Schedule | Weekly meal plans with per-meal resident feedback |
| 🔍 Audit Logs | Every action logged with TTL (auto-deletes after 2 years) |

---

## Who Is This For

- **Backend developers** building a hostel/PG/co-living SaaS product
- **Full-stack developers** connecting a React/Next.js frontend
- **Students** learning production Node.js architecture

You don't need deep backend experience — this guide explains every step.

---

## Project Architecture

```
Client (React / Next.js)
        |
        |  HTTPS + JWT Bearer token
        v
+---------------------------+
|   Express App (app.js)    |
|  Middleware Pipeline:     |
|  helmet > cors >          |
|  rate-limit > body-parser |
|  > authenticate > routes  |
+---------------------------+
        |
        v
+---------------------------+
|   MongoDB Atlas           |
|   14 Collections         |
+---------------------------+
        |
  +-----+------+
  v            v
Cloudinary   Razorpay
(images)    (payments)
```

**Request lifecycle:**
```
Request
  -> authenticate (JWT check)
  -> rbac (permission check)
  -> validate (Joi schema)
  -> controller (business logic + MongoDB)
  -> auditLog (background write, non-blocking)
  -> Response
```

---

## Complete File Structure

```
nestroom-hostels-backend/
|
+-- index.js                    <- Entry point. Starts the server.
+-- vercel.json                 <- Vercel deployment config.
+-- .env                        <- Your secret keys (NEVER commit this!)
+-- .env.example                <- Template - copy this to .env
+-- package.json                <- npm scripts and dependencies
|
+-- src/
    |
    +-- app.js                  <- Express app setup (middleware, routes)
    |
    +-- config/                 <- Third-party service connections
    |   +-- db.js               <- MongoDB connection with retry logic
    |   +-- cloudinary.js       <- Cloudinary SDK (image uploads)
    |   +-- mailer.js           <- Nodemailer SMTP setup (emails)
    |   +-- razorpay.js         <- Razorpay client (lazy-loaded proxy)
    |
    +-- models/                 <- MongoDB schemas (14 collections)
    |   +-- User.model.js       <- Auth users (owner/employee/resident)
    |   +-- Hostel.model.js     <- Hostel profile + bank details + geo
    |   +-- Building.model.js   <- Buildings within a hostel
    |   +-- Room.model.js       <- Rooms with pricing tiers
    |   +-- Bed.model.js        <- Individual beds + allocation history
    |   +-- Resident.model.js   <- Resident profile + KYC + fee info
    |   +-- Employee.model.js   <- Staff with 30-flag RBAC permissions
    |   +-- Payment.model.js    <- Payment records (Razorpay + manual)
    |   +-- AttendanceRecord.model.js  <- Daily attendance + GPS data
    |   +-- LeaveApplication.model.js  <- Leave requests + approval flow
    |   +-- Notification.model.js      <- Announcements + polls + analytics
    |   +-- Complaint.model.js         <- Complaints with status workflow
    |   +-- FoodSchedule.model.js      <- Weekly meal plans + feedback
    |   +-- AuditLog.model.js          <- Immutable audit trail (2yr TTL)
    |
    +-- controllers/            <- Business logic for each module
    |   +-- auth.controller.js       <- Signup, login, OTP, 2FA, reset
    |   +-- hostel.controller.js     <- Hostel + building + room CRUD
    |   +-- resident.controller.js   <- Resident add, KYC, profile
    |   +-- payment.controller.js    <- Razorpay + manual payments
    |   +-- attendance.controller.js <- Geofenced attendance
    |   +-- leave.controller.js      <- Leave apply/approve/reject
    |   +-- notification.controller.js <- Send, poll, analytics
    |   +-- complaint.controller.js  <- Raise, track, resolve
    |   +-- food.controller.js       <- Schedule + meal feedback
    |
    +-- routes/                 <- URL routing for each module
    |   +-- auth.routes.js      <- /v1/auth/*
    |   +-- hostel.routes.js    <- /v1/hostels/*  (management side)
    |   +-- resident.routes.js  <- /v1/residents/* (self-service)
    |
    +-- middlewares/            <- Request processing layers
    |   +-- authenticate.js     <- Verifies JWT Bearer token
    |   +-- rbac.js             <- Role + permission checks
    |   +-- validate.js         <- Joi request body/query validation
    |   +-- upload.js           <- Multer + Cloudinary file uploads
    |   +-- auditLog.js         <- Background audit log writer
    |   +-- errorHandler.js     <- Central error handler + asyncHandler
    |
    +-- services/               <- Reusable business logic
    |   +-- otp.js              <- In-memory OTP (6-digit, 10min TTL)
    |   +-- email.js            <- Email templates (OTP, credentials, receipt)
    |   +-- whatsapp.js         <- Meta WhatsApp Cloud API sender
    |   +-- geofence.js         <- Haversine distance + geofence check
    |   +-- encryption.js       <- AES-256 encrypt/decrypt/mask
    |
    +-- utils/
    |   +-- idGenerator.js      <- Custom IDs (RES_001_2024, PAY_001_2024)
    |   +-- responseHelper.js   <- Standard JSON response format
    |   +-- validators/
    |       +-- auth.validator.js    <- Joi schemas for auth endpoints
    |       +-- hostel.validator.js  <- Joi schemas for hostel/room/employee
    |       +-- domain.validator.js  <- Joi schemas for all other modules
    |
    +-- jobs/
        +-- cronJobs.js         <- 4 scheduled background tasks
```

---

## Prerequisites

Before you start, make sure you have these installed:

| Tool | Minimum Version | How to check |
|------|----------------|--------------|
| **Node.js** | 18.0.0+ | `node --version` |
| **npm** | 8.0.0+ | `npm --version` |
| **Git** | Any | `git --version` |

> **Don't have Node.js?** Download it from [nodejs.org](https://nodejs.org) — install the LTS version.

---

## Step-by-Step Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/nestroom-hostels-backend.git
cd nestroom-hostels-backend
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json` (Express, Mongoose, JWT, Razorpay, etc.).

### Step 3 — Create your `.env` file

```bash
cp .env.example .env
```

Now open `.env` in your editor. You need to fill in the values — see [Getting API Keys](#getting-api-keys) below.

### Step 4 — Start the development server

```bash
npm run dev
```

You should see:
```
🚀 nestRoom API running on http://localhost:5000
   Environment : development
   Base URL    : http://localhost:5000/v1
```

Test it's working:
```bash
curl http://localhost:5000/health
# Response: {"success":true,"data":{"status":"healthy"}}
```

---

## Getting API Keys

Here is exactly where to get every secret in your `.env` file.

---

### MongoDB Atlas (Database)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and **Sign up free**
2. Click **"Build a Database"** → Choose **"Free (M0 Shared)"** → Select a region
3. Create a **username and password** (save these!)
4. Under **"Network Access"** → Add IP → **"Allow Access from Anywhere"** (`0.0.0.0/0`)
5. Go to **Clusters** → **Connect** → **"Connect your application"**
6. Copy the connection string. It looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Add `/nestroom` before the `?` to specify the database name:
   ```
   MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/nestroom?retryWrites=true&w=majority
   ```

---

### JWT Secrets

These are random secret strings you generate yourself:

```bash
# Run this in your terminal to generate a secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it **twice** — use the first output for `JWT_SECRET`, the second for `JWT_REFRESH_SECRET`.

```env
JWT_SECRET=a3f8c2d1e9b7...
JWT_REFRESH_SECRET=91bc4d2e7a...
```

---

### Cloudinary (Image uploads — KYC docs, hostel photos)

1. Go to [cloudinary.com](https://cloudinary.com) and **Sign up free**
2. After login, go to your **Dashboard**
3. You'll see your **Cloud Name**, **API Key**, and **API Secret** right there

```env
CLOUDINARY_CLOUD_NAME=dxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

---

### Razorpay (Payment gateway)

1. Go to [razorpay.com](https://razorpay.com) and **Sign up**
2. For testing: go to **Settings** → **API Keys** → Switch to **Test Mode** → **Generate Key**
3. You'll get a **Key ID** (starts with `rzp_test_`) and a **Key Secret**

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

> **Note:** The app starts without Razorpay keys — payment endpoints just won't work until keys are set. All other features work fine.

---

### Meta WhatsApp Cloud API (OTPs via WhatsApp)

> **Skip this** if you just want to run locally. The app works without it — OTPs will log to console instead of being sent to WhatsApp.

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an App → Choose **Business** → Add **WhatsApp** product
3. Go to **WhatsApp** → **Getting Started**
4. Note your **Phone Number ID** and copy the **Temporary Access Token**
5. For production: create a permanent **System User Token** in Business Manager

```env
META_WHATSAPP_TOKEN=EAAG...your_long_token
META_PHONE_NUMBER_ID=123456789012345
META_WHATSAPP_API_VERSION=v19.0
```

---

### SMTP Email (Gmail)

1. Use your Gmail account
2. Enable **2-Step Verification** on your Google account (required for App Passwords)
3. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Create an App Password for "Mail" on "Other (Custom Name)" → name it "nestRoom"
5. Copy the 16-character password shown

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=nestRoom <yourname@gmail.com>
```

---

### Encryption Secret (AES-256)

This encrypts sensitive data like bank account numbers before saving to the database.

```bash
# Generate a 32-character key:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

```env
ENCRYPTION_SECRET=your32characterhexstringhere1234
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 5000) | Server port |
| `NODE_ENV` | No | `development` or `production` |
| `FRONTEND_URL` | No | CORS allowed origin |
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Access token signing key (32+ chars) |
| `JWT_EXPIRES_IN` | No (default: 7d) | Access token lifetime |
| `JWT_REFRESH_SECRET` | **Yes** | Refresh token signing key (32+ chars) |
| `JWT_REFRESH_EXPIRES_IN` | No (default: 30d) | Refresh token lifetime |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Optional* | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Optional* | Razorpay key secret |
| `META_WHATSAPP_TOKEN` | Optional* | WhatsApp Cloud API token |
| `META_PHONE_NUMBER_ID` | Optional* | WhatsApp phone number ID |
| `META_WHATSAPP_API_VERSION` | No (default: v19.0) | API version |
| `META_OTP_TEMPLATE_NAME` | No (default: otp) | WhatsApp template name |
| `META_TEMPLATE_LANGUAGE_CODE` | No (default: en) | Template language |
| `SMTP_HOST` | **Yes** | Mail server host |
| `SMTP_PORT` | **Yes** | Mail server port |
| `SMTP_SECURE` | No (default: false) | Use TLS |
| `SMTP_USER` | **Yes** | Email username |
| `SMTP_PASS` | **Yes** | Email password / app password |
| `EMAIL_FROM` | No | Sender display name + email |
| `ENCRYPTION_SECRET` | **Yes** | AES-256 encryption key (32 chars) |

> Optional* = App starts without it, but that specific feature won't work.

**Minimum 8 variables to get running:**
```env
MONGODB_URI=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_USER=...
SMTP_PASS=...
ENCRYPTION_SECRET=...
```

---

## Running the Server

```bash
# Development — auto-restarts when you edit files
npm run dev

# Production
npm start

# Run tests
npm test
```

---

## API Reference

All endpoints are prefixed with `/v1`.

Protected routes require this header:
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

---

### Auth Endpoints — `/v1/auth`

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| POST | `/auth/owner/signup` | No | Register as hostel owner |
| POST | `/auth/owner/verify-email` | No | Verify email OTP |
| POST | `/auth/owner/verify-whatsapp` | No | Verify WhatsApp OTP → receive tokens |
| POST | `/auth/resident/login` | No | Resident login (needs hostel code) |
| POST | `/auth/login` | No | Owner/Employee login |
| POST | `/auth/logout` | Yes | Invalidate current session |
| POST | `/auth/refresh-token` | No | Exchange refresh token for new access token |
| POST | `/auth/setup-2fa` | Yes | Get TOTP QR code for Google Authenticator |
| POST | `/auth/verify-2fa` | Yes | Confirm 2FA setup |
| POST | `/auth/forgot-password` | No | Send OTP to reset password |
| POST | `/auth/reset-password` | No | Reset password with OTP |

**Signup example:**
```bash
curl -X POST http://localhost:5000/v1/auth/owner/signup \
  -H "Content-Type: application/json" \
  -d '{
    "hostelName": "Sunrise PG",
    "ownerName": "Raj Kumar",
    "email": "raj@example.com",
    "whatsappNumber": "+919876543210",
    "password": "SecurePass@123",
    "confirmPassword": "SecurePass@123"
  }'
```

---

### Hostel Management — `/v1/hostels` (Owner/Employee only)

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| GET | `/hostels` | Owner | List all your hostels |
| GET | `/hostels/:id` | Owner/Employee | Hostel profile |
| PUT | `/hostels/:id` | Owner | Update profile |
| PUT | `/hostels/:id/bank-details` | Owner | Bank info (saved encrypted) |
| GET | `/hostels/:id/profile-completion` | Owner | Completion percentage |
| POST | `/hostels/:id/employees` | Owner | Add employee |
| GET | `/hostels/:id/employees` | canManageEmployees | List employees |
| GET | `/hostels/:id/buildings` | Any | List buildings |
| POST | `/hostels/:id/buildings` | Owner | Add building |
| GET | `/hostels/:id/rooms` | Any | Room grid (grouped by building/floor) |
| POST | `/hostels/:id/rooms` | canManageRooms | Add room (auto-creates beds) |
| PUT | `/hostels/:id/rooms/:roomId` | canManageRooms | Update room |
| DELETE | `/hostels/:id/rooms/:roomId` | Owner | Archive room |
| POST | `/hostels/:id/residents` | canAddResidents | Add resident + email credentials |
| GET | `/hostels/:id/residents` | canViewPayments | List residents |
| GET | `/hostels/:id/residents/:id` | canEditResidents | Get one resident |
| PUT | `/hostels/:id/residents/:id` | canEditResidents | Update resident |
| PUT | `/hostels/:id/residents/:id/kyc` | canApproveKYC | Approve/reject KYC |
| GET | `/hostels/:id/revenue` | canViewRevenue | Revenue dashboard |
| GET | `/hostels/:id/payments` | canViewPayments | All payment history |
| POST | `/hostels/:id/payments/manual` | canMarkPaymentManual | Record cash payment |
| POST | `/hostels/:id/attendance/config` | Owner | Set geofence location |
| POST | `/hostels/:id/attendance/request` | canInitiateAttendance | Trigger daily attendance |
| GET | `/hostels/:id/attendance` | canViewAttendance | View records |
| GET | `/hostels/:id/leaves` | canApproveLeaves | All leave applications |
| PUT | `/hostels/:id/leaves/:id/approve` | canApproveLeaves | Approve leave |
| PUT | `/hostels/:id/leaves/:id/reject` | canRejectLeaves | Reject leave |
| POST | `/hostels/:id/notifications` | canSendNotifications | Send to residents |
| GET | `/hostels/:id/notifications/:id/analytics` | canViewNotificationAnalytics | View + poll stats |
| GET | `/hostels/:id/complaints` | canViewComplaints | All complaints |
| PUT | `/hostels/:id/complaints/:id/status` | canUpdateComplaintStatus | Update status |
| POST | `/hostels/:id/complaints/:id/message` | canViewComplaints | Add message |
| POST | `/hostels/:id/food-schedule` | canManageFoodSchedule | Create weekly menu |
| GET | `/hostels/:id/food-schedule` | Any | Current week's menu |
| GET | `/hostels/:id/food-schedule/all` | Any | All past menus |

---

### Resident Self-Service — `/v1/residents` (Residents only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/residents/profile` | Your profile |
| POST | `/residents/kyc-upload` | Upload ID documents |
| POST | `/residents/payments/initialize` | Start Razorpay payment |
| POST | `/residents/payments/verify` | Confirm payment + signature |
| GET | `/residents/payments/history` | Your payment records |
| GET | `/residents/payments/upcoming` | Next due date + amount |
| POST | `/residents/attendance/submit` | Mark attendance (GPS required) |
| GET | `/residents/attendance/history` | Your attendance + stats |
| POST | `/residents/leaves` | Apply for leave |
| GET | `/residents/leaves` | Your leave history |
| GET | `/residents/notifications` | Your notification feed |
| PUT | `/residents/notifications/:id/read` | Mark as read |
| POST | `/residents/notifications/:id/poll-response` | Vote in a poll |
| POST | `/residents/complaints` | Raise a complaint |
| GET | `/residents/complaints` | Your complaints |
| POST | `/residents/complaints/:id/message` | Add message to thread |
| GET | `/residents/food-schedule` | This week's menu |
| GET | `/residents/food-schedule/all` | Past menus |
| POST | `/residents/food-schedule/feedback` | Rate a meal |

---

### Standard Response Format

Every response follows this structure:

**Success (HTTP 200/201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "email must be a valid email" }
    ]
  }
}
```

**Common error codes:**

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `MISSING_TOKEN` | 401 | No Authorization header |
| `TOKEN_EXPIRED` | 401 | JWT expired — call `/refresh-token` |
| `INVALID_TOKEN` | 401 | Malformed or wrong secret |
| `FORBIDDEN` | 403 | You don't have permission |
| `VALIDATION_ERROR` | 400 | Request body failed validation |
| `RATE_LIMITED` | 429 | Too many requests (15 min window) |

---

## How Authentication Works

### Owner Registration (3 steps)

```
Step 1: POST /auth/owner/signup
        Body: { hostelName, ownerName, email, whatsappNumber, password }
        -> OTP sent to your email

Step 2: POST /auth/owner/verify-email
        Body: { email, otp }
        -> OTP sent to your WhatsApp

Step 3: POST /auth/owner/verify-whatsapp
        Body: { whatsappNumber, otp }
        -> Response: { accessToken, refreshToken }
```

### Login (Owner or Employee)

```
POST /auth/login
Body: { email, password }
-> Response: { accessToken, refreshToken }

If 2FA is enabled:
-> Response: { requiresTwoFactor: true, tempToken: "..." }

Then: POST /auth/login
Body: { email, password, totpToken: "123456" }
-> Response: { accessToken, refreshToken }
```

### Resident Login

Residents use a **hostel code** (given by the owner when they're added):
```
POST /auth/resident/login
Body: { hostelCode: "SR_001_XX", email: "...", password: "TempPass@1234" }
-> Response: { accessToken, refreshToken }
```

### Using Access Tokens

```bash
# Add to every protected request:
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     http://localhost:5000/v1/residents/profile
```

When the access token expires (default: 7 days):
```
POST /auth/refresh-token
Body: { refreshToken: "eyJhbGci..." }
-> Response: { accessToken, refreshToken }  (new pair issued)
```

---

## How Payments Work

### Online Payment via Razorpay

```
1. Resident calls:
   POST /residents/payments/initialize
   -> Gets: { orderId, amount, keyId }

2. Your frontend opens Razorpay checkout:
   new Razorpay({ key: keyId, order_id: orderId, ... }).open()

3. Resident completes payment on Razorpay UI
   -> Razorpay returns: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

4. Resident calls:
   POST /residents/payments/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   -> Server verifies HMAC-SHA256 signature (cryptographic proof)
   -> Marks payment Success
   -> Advances resident's nextDueDate
   -> Sends receipt email
```

### Manual Payment (Cash/Cheque)

```
Staff calls:
POST /hostels/:id/payments/manual
Body: { residentId, amount, mode: "Cash", referenceNumber: null }
-> Records payment instantly, advances nextDueDate
```

---

## How Attendance Works

```
1. Owner configures geofence once:
   POST /hostels/:id/attendance/config
   Body: {
     location: { latitude: 12.9716, longitude: 77.5946 },
     geofenceRadius: 500,      <- metres
     attendanceTime: "20:00"
   }

2. Staff triggers daily attendance:
   POST /hostels/:id/attendance/request
   -> Creates a "NotResponded" record for every active resident
   -> Residents on approved leave are automatically marked "OnLeave"

3. Resident marks attendance from their phone:
   POST /residents/attendance/submit
   Body: { status: "Present", latitude: 12.9718, longitude: 77.5948, accuracy: 10 }
   -> Server calculates distance using Haversine formula
   -> If distance > 500m: marked Absent (even if you sent "Present")
   -> Response: { withinGeofence: true, distanceFromHostel: "42m" }

4. Cron job (runs every hour):
   -> Any "NotResponded" record older than 2 hours -> automatically "Absent"
```

---

## Deployment to Vercel

### Option 1 — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2 — GitHub Integration

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Under **Environment Variables**, add every key from your `.env`
4. Click **Deploy**

Your API will be live at: `https://your-project.vercel.app/v1`

The `vercel.json` file is already configured:
```json
{
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "index.js" }]
}
```

> **Important:** Never put your real `.env` on GitHub. Always add secrets through Vercel's dashboard.

---

## Common Errors and Fixes

### `MongoServerError: bad auth`
Your MongoDB username or password is wrong in `MONGODB_URI`. Double-check it in Atlas.

### `⚠️ ENCRYPTION_SECRET not set`
Add `ENCRYPTION_SECRET` to `.env`. It must be exactly 32 characters.

### `key_id or oauthToken is mandatory`
Razorpay keys are missing. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to use payments.

### `ECONNREFUSED 127.0.0.1:587`
SMTP config is wrong. For Gmail: make sure you're using an **App Password** (not your regular password) and have 2FA enabled on your Google account.

### `JsonWebTokenError: invalid signature`
`JWT_SECRET` in `.env` doesn't match the one used when the token was signed. Happens if you change the secret after creating tokens.

### `429 Too Many Requests`
You've hit the rate limit (200 req/15min globally, 20 for auth routes). Wait 15 minutes. For development you can increase limits in `src/app.js`.

### `Error: EADDRINUSE — port 5000`
Something else is using port 5000. Change `PORT` in `.env`, or kill the conflicting process:
```bash
lsof -ti:5000 | xargs kill -9
```

---

## Background Jobs

The app runs 4 scheduled tasks automatically:

| Job | Schedule | What it does |
|-----|----------|-------------|
| Auto-close attendance | Every hour | Marks `NotResponded` records as `Absent` after 2 hours |
| Payment reminders | 9AM IST daily | Finds residents due in 1-3 days |
| Password expiry check | Midnight IST daily | Flags employees with passwords older than 90 days |
| Expire stale payments | 1AM UTC daily | Marks 24h+ old pending Razorpay orders as `Failed` |

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| `express` | HTTP framework |
| `mongoose` | MongoDB ORM |
| `jsonwebtoken` | JWT access + refresh tokens |
| `bcryptjs` | Password hashing |
| `joi` | Request validation |
| `razorpay` | Payment gateway |
| `cloudinary` | Image/file storage |
| `multer-storage-cloudinary` | File upload middleware |
| `speakeasy` | TOTP 2FA (Google Authenticator) |
| `qrcode` | 2FA QR code generation |
| `node-cron` | Scheduled background jobs |
| `nodemailer` | Email delivery |
| `axios` | WhatsApp Cloud API calls |
| `crypto-js` | AES-256 field encryption |
| `express-rate-limit` | Rate limiting |
| `helmet` | Security HTTP headers |
| `express-mongo-sanitize` | NoSQL injection prevention |
| `morgan` | HTTP request logging |
| `dotenv` | Environment variable loading |
| `nodemon` | Dev auto-restart |

---

## Security Notes

- **Never commit `.env`** — it's in `.gitignore` by default
- **Bank account numbers** are AES-256 encrypted before saving to the database
- **Passwords** are bcrypt hashed (12 rounds) — never stored in plain text
- **Refresh tokens** are bcrypt hashed in the database and rotated on every use
- **OTPs** expire in 10 minutes and are deleted after use
- **Audit logs** record every mutating action and auto-delete after 2 years (GDPR)
- **Rate limiting** prevents brute force attacks on auth endpoints

---

*Built with love by the nestRoom team*
