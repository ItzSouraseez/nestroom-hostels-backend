# 📘 nestRoom Hostels — API Documentation

> **Base URL (local):** `http://localhost:5000`  
> **Base URL (production):** `https://nestroom-hostels-backend.vercel.app`  
> **API Version Prefix:** `/v1`  
> **Full base for all API calls:** `http://localhost:5000/v1`

---

## 📋 Table of Contents

1. [Postman Setup Guide](#1-postman-setup-guide)
2. [General Rules](#2-general-rules)
3. [Response Format](#3-response-format)
4. [System / Health](#4-system--health)
5. [Auth APIs](#5-auth-apis)
6. [Hostel Management APIs](#6-hostel-management-apis)
7. [Resident Self-Service APIs](#7-resident-self-service-apis)
8. [Error Codes Reference](#8-error-codes-reference)
9. [Rate Limits](#9-rate-limits)

---

## 1. Postman Setup Guide

### Step 1 — Create a Collection

1. Open Postman → click **"New"** → **"Collection"**
2. Name it: `nestRoom Hostels API`

---

### Step 2 — Set Up Environment Variables

1. Click the **"Environments"** tab (left sidebar, globe icon)
2. Click **"+"** to create a new environment → name it `nestRoom Local`
3. Add these variables:

| Variable | Initial Value | Description |
|----------|--------------|-------------|
| `BASE_URL` | `http://localhost:5000/v1` | API base URL |
| `ACCESS_TOKEN` | *(leave blank)* | Filled automatically after login |
| `REFRESH_TOKEN` | *(leave blank)* | Filled automatically after login |
| `HOSTEL_ID` | *(leave blank)* | Filled after creating a hostel |

4. Click **"Save"**
5. Select `nestRoom Local` in the top-right environment dropdown

Now you can use `{{BASE_URL}}`, `{{ACCESS_TOKEN}}` etc. in your requests.

---

### Step 3 — Set Up Auto-Token Capture (Login)

In the **Login** request (or any request that returns tokens), go to the **Tests** tab and paste:

```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("ACCESS_TOKEN", res.data.accessToken);
  pm.environment.set("REFRESH_TOKEN", res.data.refreshToken);
  console.log("✅ Tokens saved to environment");
}
```

This auto-saves your tokens after every login so you don't have to copy-paste them.

---

### Step 4 — Set Authorization on the Collection

1. Click the `nestRoom Hostels API` collection → **Edit**
2. Go to the **Authorization** tab
3. Set Type to: `Bearer Token`
4. Set Token to: `{{ACCESS_TOKEN}}`

All requests inside the collection will now automatically send the Bearer token — no need to set auth on each request individually.

---

### Step 5 — Default Headers

In the collection **Edit** → **Pre-request Script** tab, or set on each request:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer {{ACCESS_TOKEN}}` *(auto from collection)* |

---

## 2. General Rules

| Rule | Detail |
|------|--------|
| **Auth header** | `Authorization: Bearer <accessToken>` |
| **Content type** | `Content-Type: application/json` for all JSON bodies |
| **File uploads** | Use `multipart/form-data` (KYC upload, complaint attachments) |
| **Phone numbers** | Must be E.164 format: `+919876543210` |
| **Dates** | ISO 8601: `2024-06-15` or `2024-06-15T10:00:00Z` |
| **IDs** | MongoDB ObjectIds — 24-char hex strings |
| **Password rules** | Min 8 chars, must have: uppercase, lowercase, number, special char |

---

## 3. Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable message"
}
```

### Error Response
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

---

## 4. System / Health

### `GET /` — Service Info
```
GET http://localhost:5000/
```
No auth required. Returns service name, version, and status.

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "service": "nestRoom Hostels API",
    "version": "v1",
    "status": "running",
    "timestamp": "2024-06-15T10:00:00.000Z"
  }
}
```

---

### `GET /health` — Health Check
```
GET http://localhost:5000/health
```
Use this to check if the server is up.

---

### `GET /v1/auth/ping` — Auth Module Ping
```
GET {{BASE_URL}}/auth/ping
```

### `GET /v1/hostels/ping` — Hostels Module Ping
```
GET {{BASE_URL}}/hostels/ping
```

### `GET /v1/residents/ping` — Residents Module Ping
```
GET {{BASE_URL}}/residents/ping
```

---

## 5. Auth APIs

> **Rate limit:** 20 requests per 15 minutes per IP (stricter than normal)

---

### 5.1 Owner Registration — Step 1: Signup

```
POST {{BASE_URL}}/auth/owner/signup
```

**Body (JSON):**
```json
{
  "hostelName": "Sunrise PG",
  "ownerName": "Raj Kumar",
  "numberOfHostels": 1,
  "whatsappNumber": "+919876543210",
  "email": "raj@example.com",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `hostelName` | string | ✅ | 2–100 chars |
| `ownerName` | string | ✅ | 2–100 chars |
| `numberOfHostels` | integer | ❌ | Default: 1, max: 100 |
| `whatsappNumber` | string | ✅ | E.164 format |
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | 8+ chars, uppercase+lowercase+number+special |
| `confirmPassword` | string | ✅ | Must match `password` |

**What happens:** OTP sent to the provided email.

---

### 5.2 Owner Registration — Step 2: Verify Email OTP

```
POST {{BASE_URL}}/auth/owner/verify-email
```

**Body (JSON):**
```json
{
  "email": "raj@example.com",
  "otp": "482910"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | Same email used in signup |
| `otp` | string | ✅ | Exactly 6 numeric digits |

**What happens:** Email verified → OTP sent to WhatsApp.

---

### 5.3 Owner Registration — Step 3: Verify WhatsApp OTP

```
POST {{BASE_URL}}/auth/owner/verify-whatsapp
```

**Body (JSON):**
```json
{
  "whatsappNumber": "+919876543210",
  "otp": "738201"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `whatsappNumber` | string | ✅ | Same number used in signup |
| `otp` | string | ✅ | Exactly 6 numeric digits |

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

**Postman Tests tab** — paste to auto-save tokens:
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("ACCESS_TOKEN", res.data.accessToken);
  pm.environment.set("REFRESH_TOKEN", res.data.refreshToken);
}
```

---

### 5.4 Owner / Employee Login

```
POST {{BASE_URL}}/auth/login
```

**Body (JSON) — Standard:**
```json
{
  "email": "raj@example.com",
  "password": "SecurePass@123"
}
```

**Body (JSON) — With 2FA:**
```json
{
  "email": "raj@example.com",
  "password": "SecurePass@123",
  "totpToken": "123456"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | |
| `password` | string | ✅ | |
| `totpToken` | string | ❌ | 6-digit TOTP (only if 2FA is enabled) |

**If 2FA is enabled but no TOTP provided:**
```json
{
  "success": true,
  "data": {
    "requiresTwoFactor": true,
    "tempToken": "..."
  }
}
```

Add the TOTP token to body and resend the same request.

---

### 5.5 Resident Login

```
POST {{BASE_URL}}/auth/resident/login
```

**Body (JSON):**
```json
{
  "hostelCode": "SUNRISE_001",
  "email": "resident@example.com",
  "password": "TempPass@1234"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `hostelCode` | string | ✅ | Given by hostel owner |
| `email` | string | ✅ | |
| `password` | string | ✅ | |

---

### 5.6 Logout

```
POST {{BASE_URL}}/auth/logout
```

🔐 **Requires Auth**

No body. Invalidates the current access token.

---

### 5.7 Refresh Token

```
POST {{BASE_URL}}/auth/refresh-token
```

**Body (JSON):**
```json
{
  "refreshToken": "{{REFRESH_TOKEN}}"
}
```

Returns a new `accessToken` and `refreshToken` pair.

**Postman Tests tab:**
```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("ACCESS_TOKEN", res.data.accessToken);
  pm.environment.set("REFRESH_TOKEN", res.data.refreshToken);
}
```

---

### 5.8 Setup 2FA (Get QR Code)

```
POST {{BASE_URL}}/auth/setup-2fa
```

🔐 **Requires Auth**

No body. Returns a `qrCodeUrl` and `secret`. Scan the QR in Google Authenticator.

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP"
  }
}
```

---

### 5.9 Verify and Enable 2FA

```
POST {{BASE_URL}}/auth/verify-2fa
```

🔐 **Requires Auth**

**Body (JSON):**
```json
{
  "token": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `token` | string | ✅ | 6-digit TOTP from authenticator app |
| `secret` | string | ✅ | Secret returned from `setup-2fa` |

---

### 5.10 Forgot Password

```
POST {{BASE_URL}}/auth/forgot-password
```

**Body (JSON):**
```json
{
  "email": "raj@example.com"
}
```

Sends a reset OTP to the email.

---

### 5.11 Reset Password

```
POST {{BASE_URL}}/auth/reset-password
```

**Body (JSON):**
```json
{
  "email": "raj@example.com",
  "otp": "491827",
  "newPassword": "NewSecure@456",
  "confirmPassword": "NewSecure@456"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `otp` | string | ✅ |
| `newPassword` | string | ✅ |
| `confirmPassword` | string | ✅ |

---

## 6. Hostel Management APIs

> 🔐 **All routes require auth**  
> Replace `{{HOSTEL_ID}}` with the hostel's MongoDB ObjectId  
> Most routes are **Owner** or **Employee with specific permission**

---

### 6.1 Get All Hostels (Owner only)

```
GET {{BASE_URL}}/hostels
```

Returns all hostels owned by the authenticated owner.

---

### 6.2 Get Hostel Profile

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}
```

---

### 6.3 Update Hostel Profile (Owner only)

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}
```

**Body (JSON) — all fields optional:**
```json
{
  "hostelName": "Sunrise Premium PG",
  "description": "Premium student accommodation near tech campus",
  "hostelType": "Premium",
  "contactPhone": "+919876543210",
  "contactEmail": "contact@sunrise.com",
  "checkInTime": "10:00",
  "checkOutTime": "11:00",
  "visitorPolicy": "Allowed till 9PM",
  "address": "123, MG Road",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "geofenceRadius": 500
}
```

> `hostelType` — `"Budget"` | `"Standard"` | `"Premium"`

---

### 6.4 Update Bank Details (Owner only)

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}/bank-details
```

**Body (JSON):**
```json
{
  "accountHolderName": "Raj Kumar",
  "accountNumber": "1234567890",
  "ifscCode": "HDFC0001234",
  "bankName": "HDFC Bank",
  "accountType": "Savings",
  "branchCode": "001234"
}
```

> ⚠️ Account number is **AES-256 encrypted** before saving.

---

### 6.5 Get Profile Completion

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/profile-completion
```

Returns a percentage showing how complete the hostel profile is.

---

### 6.6 Add Employee (Owner only)

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/employees
```

**Body (JSON):**
```json
{
  "fullName": "Priya Singh",
  "email": "priya@sunrise.com",
  "whatsappNumber": "+918765432109",
  "position": "Manager",
  "department": "Administration",
  "hireDate": "2024-01-15",
  "employmentType": "Full-Time",
  "permissions": {
    "canAddResidents": true,
    "canEditResidents": true,
    "canViewPayments": true,
    "canMarkPaymentManual": true,
    "canViewAttendance": true,
    "canInitiateAttendance": true,
    "canApproveLeaves": true,
    "canRejectLeaves": true,
    "canViewComplaints": true,
    "canUpdateComplaintStatus": true,
    "canSendNotifications": true,
    "canManageFoodSchedule": true
  }
}
```

> `position` — `"Manager"` | `"Warden"` | `"Receptionist"` | `"Housekeeping"` | `"Kitchen"` | `"Security"` | `"Other"`  
> `employmentType` — `"Full-Time"` | `"Part-Time"` | `"Contract"`

**All available permissions (all default `false`):**

| Permission | Description |
|-----------|-------------|
| `canAddResidents` | Add new residents |
| `canEditResidents` | Edit resident profiles |
| `canDeleteResidents` | Remove residents |
| `canViewResidentKYC` | View KYC documents |
| `canApproveKYC` | Approve/reject KYC |
| `canManageRooms` | Create/edit rooms |
| `canEditRoomStatus` | Change room status |
| `canAllocateRooms` | Assign beds |
| `canViewPayments` | See payment records |
| `canInitiatePayments` | Initiate payments |
| `canMarkPaymentManual` | Record cash payments |
| `canViewRevenue` | Revenue dashboard |
| `canExportPaymentReport` | Export reports |
| `canViewAttendance` | View attendance |
| `canInitiateAttendance` | Trigger daily attendance |
| `canOverrideAttendance` | Override status |
| `canApproveLeaves` | Approve leave requests |
| `canRejectLeaves` | Reject leave requests |
| `canViewLeaveAnalytics` | Leave statistics |
| `canViewComplaints` | See all complaints |
| `canAssignComplaints` | Assign to staff |
| `canUpdateComplaintStatus` | Resolve/close |
| `canDeleteComplaints` | Delete complaints |
| `canSendNotifications` | Send announcements |
| `canViewNotificationAnalytics` | View read/poll stats |
| `canViewPollResults` | See poll results |
| `canManageFoodSchedule` | Create meal plans |
| `canViewFoodFeedback` | See meal ratings |

---

### 6.7 Get Employees

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/employees
```

> Requires permission: `canManageEmployees` (or Owner)

---

### 6.8 Get Buildings

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/buildings
```

---

### 6.9 Create Building (Owner only)

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/buildings
```

**Body (JSON):**
```json
{
  "buildingName": "Block A",
  "buildingNumber": "A",
  "floorCount": 4,
  "address": "Same as hostel",
  "amenities": ["Lift", "CCTV", "Fire Exit"],
  "buildingManager": "Ramesh",
  "managerPhone": "+919876543210"
}
```

---

### 6.10 Get Rooms

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/rooms
```

Returns rooms grouped by building and floor.

---

### 6.11 Create Room

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/rooms
```

> Requires: Owner or `canManageRooms`

**Body (JSON):**
```json
{
  "buildingId": "64a1b2c3d4e5f6a7b8c9d0e1",
  "floorNumber": 2,
  "roomNumber": "204",
  "roomType": "Double",
  "bedCount": 2,
  "monthlyFee": 8000,
  "quarterlyFee": 22000,
  "yearlyFee": 85000,
  "amenities": ["AC", "Geyser", "WiFi"],
  "hasAttachedBathroom": true,
  "hasWindowView": false,
  "hasBalcony": false,
  "genderRestriction": "Female",
  "smokingAllowed": false
}
```

> `roomType` — `"Single"` | `"Double"` | `"Triple"` | `"Dorm"`  
> `genderRestriction` — `"Male"` | `"Female"` | `null`

**Note:** Beds are automatically created based on `bedCount`.

---

### 6.12 Update Room

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}/rooms/{{ROOM_ID}}
```

> Requires: Owner or `canManageRooms`

**Body (JSON) — all optional:**
```json
{
  "monthlyFee": 9000,
  "roomStatus": "Maintenance",
  "maintenanceReason": "Plumbing repair",
  "amenities": ["AC", "Geyser", "WiFi", "TV"]
}
```

> `roomStatus` — `"Vacant"` | `"Occupied"` | `"Maintenance"` | `"Blocked"`

---

### 6.13 Delete (Archive) Room (Owner only)

```
DELETE {{BASE_URL}}/hostels/{{HOSTEL_ID}}/rooms/{{ROOM_ID}}
```

---

### 6.14 Add Resident

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/residents
```

> Requires: Owner or `canAddResidents`

**Body (JSON):**
```json
{
  "fullName": "Anjali Sharma",
  "email": "anjali@example.com",
  "whatsappNumber": "+917654321098",
  "dateOfBirth": "2002-05-20",
  "gender": "Female",
  "college": "IIT Bangalore",
  "enrollmentNumber": "22CS100",
  "courseYear": "2nd Year",
  "major": "Computer Science",
  "idCardType": "Aadhaar",
  "idCardNumber": "XXXX-XXXX-1234",
  "feeAmount": 8000,
  "feeFrequency": "Monthly",
  "foodEnabled": true,
  "securityDeposit": 5000,
  "securityDepositPaid": true,
  "roomId": "64a1b2c3d4e5f6a7b8c9d0e2",
  "bedId": "64a1b2c3d4e5f6a7b8c9d0e3",
  "emergencyContactName": "Suresh Sharma",
  "emergencyContactPhone": "+919876543210",
  "emergencyContactRelation": "Father",
  "checkInDate": "2024-07-01"
}
```

> `feeFrequency` — `"Monthly"` | `"Quarterly"` | `"Yearly"`  
> `idCardType` — `"Aadhaar"` | `"PAN"` | `"DL"` | `"Passport"` | `"Other"`

**What happens:** Resident account created, credentials emailed automatically.

---

### 6.15 Get All Residents

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/residents
```

> Requires: `canViewPayments` or Owner

---

### 6.16 Get Resident by ID

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/residents/{{RESIDENT_ID}}
```

> Requires: `canEditResidents` or Owner

---

### 6.17 Update Resident

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}/residents/{{RESIDENT_ID}}
```

> Requires: `canEditResidents` or Owner

**Body (JSON) — all optional:**
```json
{
  "fullName": "Anjali R. Sharma",
  "feeAmount": 8500,
  "feeFrequency": "Monthly",
  "foodEnabled": false,
  "residentStatus": "Active",
  "internalNotes": "Good student, no issues"
}
```

> `residentStatus` — `"Active"` | `"Inactive"` | `"OnLeave"` | `"TerminatedWithNotice"` | `"TerminatedImmediate"`

---

### 6.18 Process KYC (Approve / Reject)

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}/residents/{{RESIDENT_ID}}/kyc
```

> Requires: `canApproveKYC` or Owner

**Body — Approve:**
```json
{
  "action": "approve"
}
```

**Body — Reject:**
```json
{
  "action": "reject",
  "rejectionReason": "Aadhaar image is blurry and unreadable"
}
```

---

### 6.19 Revenue Dashboard

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/revenue
```

> Requires: `canViewRevenue` or Owner

---

### 6.20 Get Payment History

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/payments
```

> Requires: `canViewPayments` or Owner

---

### 6.21 Record Manual Payment (Cash/Cheque)

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/payments/manual
```

> Requires: `canMarkPaymentManual` or Owner

**Body (JSON):**
```json
{
  "residentId": "64a1b2c3d4e5f6a7b8c9d0e4",
  "amount": 8000,
  "mode": "Cash",
  "referenceNumber": null,
  "remarks": "July rent collected in person"
}
```

> `mode` — `"Cash"` | `"Check"` | `"BankTransfer"`

---

### 6.22 Configure Attendance Geofence (Owner only)

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/attendance/config
```

**Body (JSON):**
```json
{
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "geofenceRadius": 500,
  "attendanceTime": "20:00",
  "attendanceFrequency": "Daily",
  "surpriseCheckEnabled": false
}
```

> `geofenceRadius` — in metres, min: 50, max: 10000  
> `attendanceTime` — HH:MM format (24h)  
> `attendanceFrequency` — `"Daily"` | `"Weekly"` | `"Custom"`

---

### 6.23 Trigger Attendance Request

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/attendance/request
```

> Requires: `canInitiateAttendance` or Owner

No body needed. Creates `NotResponded` records for all active residents. Residents on approved leave are auto-marked `OnLeave`.

---

### 6.24 Get Attendance History

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/attendance
```

> Requires: `canViewAttendance` or Owner

---

### 6.25 Get All Leave Applications

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/leaves
```

> Requires: `canApproveLeaves` or Owner

---

### 6.26 Approve Leave

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}/leaves/{{LEAVE_ID}}/approve
```

> Requires: `canApproveLeaves` or Owner

**Body (JSON):**
```json
{
  "remarks": "Approved. Get well soon."
}
```

---

### 6.27 Reject Leave

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}/leaves/{{LEAVE_ID}}/reject
```

> Requires: `canRejectLeaves` or Owner

**Body (JSON):**
```json
{
  "rejectionReason": "Insufficient leave balance for this period"
}
```

---

### 6.28 Send Notification / Announcement

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/notifications
```

> Requires: `canSendNotifications` or Owner

**Body (JSON) — Simple Announcement:**
```json
{
  "title": "Water Supply Disruption",
  "message": "Water will be unavailable on Sunday 6-8AM for tank cleaning.",
  "type": "Announcement",
  "recipientType": "AllResidents"
}
```

**Body (JSON) — With Poll:**
```json
{
  "title": "Food Feedback Survey",
  "message": "How is the food quality this month?",
  "type": "Survey",
  "recipientType": "AllResidents",
  "poll": {
    "isPoll": true,
    "pollType": "MultiChoice",
    "pollQuestion": "Rate this month's food",
    "pollOptions": ["Excellent", "Good", "Average", "Poor"],
    "pollDeadline": "2024-07-15"
  }
}
```

**Body (JSON) — To Specific Residents:**
```json
{
  "title": "Rent Due Reminder",
  "message": "Your July rent is due in 3 days.",
  "type": "Payment",
  "recipientType": "SelectedResidents",
  "recipientIds": ["64a1...", "64b2..."]
}
```

> `type` — `"Announcement"` | `"Attendance"` | `"Payment"` | `"Leave"` | `"Food"` | `"Emergency"` | `"Survey"`  
> `recipientType` — `"AllResidents"` | `"SelectedResidents"` | `"ByRoom"` | `"ByFloor"` | `"ByBuilding"`  
> `pollType` — `"MultiChoice"` | `"YesNo"` | `"Rating"` | `"OpenEnded"`

---

### 6.29 Get Notification Analytics

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/notifications/{{NOTIFICATION_ID}}/analytics
```

> Requires: `canViewNotificationAnalytics` or Owner

Returns read rates, poll responses, and engagement stats.

---

### 6.30 Get All Complaints

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/complaints
```

> Requires: `canViewComplaints` or Owner

---

### 6.31 Update Complaint Status

```
PUT {{BASE_URL}}/hostels/{{HOSTEL_ID}}/complaints/{{COMPLAINT_ID}}/status
```

> Requires: `canUpdateComplaintStatus` or Owner

**Body (JSON):**
```json
{
  "status": "InProgress",
  "remarks": "Plumber has been called, will visit tomorrow"
}
```

> `status` — `"Open"` | `"InProgress"` | `"OnHold"` | `"Resolved"` | `"Closed"` | `"Rejected"`

---

### 6.32 Add Message to Complaint Thread (Staff)

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/complaints/{{COMPLAINT_ID}}/message
```

> Requires: `canViewComplaints` or Owner

**Body (JSON):**
```json
{
  "message": "We have assigned Rakesh (plumber) to fix the issue by tomorrow."
}
```

---

### 6.33 Create Food Schedule

```
POST {{BASE_URL}}/hostels/{{HOSTEL_ID}}/food-schedule
```

> Requires: `canManageFoodSchedule` or Owner

**Body (JSON):**
```json
{
  "weekNumber": 28,
  "weekStartDate": "2024-07-08",
  "weekEndDate": "2024-07-14",
  "isVegetarian": true,
  "isNonVegetarian": false,
  "hasVeganOptions": false,
  "schedule": [
    {
      "dayOfWeek": "Monday",
      "date": "2024-07-08",
      "meals": [
        {
          "mealType": "Breakfast",
          "time": "08:00",
          "menu": "Idli, Sambar, Chutney",
          "calories": 350,
          "dietaryTags": ["Vegetarian", "Gluten-Free"]
        },
        {
          "mealType": "Lunch",
          "time": "13:00",
          "menu": "Rice, Dal, Sabzi, Roti, Salad"
        },
        {
          "mealType": "Dinner",
          "time": "20:00",
          "menu": "Chapati, Paneer, Dal Fry"
        }
      ]
    }
  ]
}
```

> `mealType` — `"Breakfast"` | `"Lunch"` | `"Dinner"` | `"Snacks"`

---

### 6.34 Get Current Week's Food Schedule

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/food-schedule
```

---

### 6.35 Get All Food Schedules

```
GET {{BASE_URL}}/hostels/{{HOSTEL_ID}}/food-schedule/all
```

---

## 7. Resident Self-Service APIs

> 🔐 All routes require auth with **Resident role**

---

### 7.1 Get My Profile

```
GET {{BASE_URL}}/residents/profile
```

---

### 7.2 Upload KYC Documents

```
POST {{BASE_URL}}/residents/kyc-upload
Content-Type: multipart/form-data
```

**In Postman:**
1. Set the method to `POST`
2. Go to **Body** tab → select **form-data**
3. Add a key `documents` → change type from `Text` to `File`
4. Upload your ID document image(s)

> Accepts image files (JPEG/PNG). Files are uploaded directly to Cloudinary.

---

### 7.3 Initialize Razorpay Payment

```
POST {{BASE_URL}}/residents/payments/initialize
```

No body required. Uses the resident's `feeAmount` from their profile.

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_OADnxxxxxx",
    "amount": 800000,
    "currency": "INR",
    "keyId": "rzp_test_xxxx"
  }
}
```

> Amount is in **paise** (₹8000 = 800000 paise)

---

### 7.4 Verify Payment After Razorpay Checkout

```
POST {{BASE_URL}}/residents/payments/verify
```

**Body (JSON):**
```json
{
  "razorpay_order_id": "order_OADnxxxxxx",
  "razorpay_payment_id": "pay_OADnxxxxxx",
  "razorpay_signature": "abc123def456..."
}
```

> These values come back from the Razorpay checkout callback in the frontend.

---

### 7.5 Get Payment History

```
GET {{BASE_URL}}/residents/payments/history
```

---

### 7.6 Get Upcoming Payment Info

```
GET {{BASE_URL}}/residents/payments/upcoming
```

Returns next due date and amount.

---

### 7.7 Submit Attendance (GPS required)

```
POST {{BASE_URL}}/residents/attendance/submit
```

**Body (JSON):**
```json
{
  "status": "Present",
  "latitude": 12.9718,
  "longitude": 77.5948,
  "accuracy": 10
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `status` | string | ✅ | `"Present"` or `"Absent"` |
| `latitude` | number | ✅ | -90 to 90 |
| `longitude` | number | ✅ | -180 to 180 |
| `accuracy` | number | ✅ | GPS accuracy in metres |

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "withinGeofence": true,
    "distanceFromHostel": "42m",
    "status": "Present"
  }
}
```

> Even if you send `"Present"`, if you are >500m from the hostel, the server marks you **Absent**.

---

### 7.8 Get My Attendance History

```
GET {{BASE_URL}}/residents/attendance/history
```

---

### 7.9 Apply for Leave

```
POST {{BASE_URL}}/residents/leaves
```

**Body (JSON):**
```json
{
  "leaveType": "Sick",
  "fromDate": "2024-07-10",
  "toDate": "2024-07-12",
  "reason": "Suffering from fever and need to rest at home for recovery",
  "attachmentUrl": null
}
```

> `leaveType` — `"Sick"` | `"Personal"` | `"Medical"` | `"Emergency"` | `"Maternity"` | `"Paternity"` | `"Other"`  
> `reason` — minimum 10 characters

---

### 7.10 Get My Leave History

```
GET {{BASE_URL}}/residents/leaves
```

---

### 7.11 Get My Notifications

```
GET {{BASE_URL}}/residents/notifications
```

---

### 7.12 Mark Notification as Read

```
PUT {{BASE_URL}}/residents/notifications/{{NOTIFICATION_ID}}/read
```

No body required.

---

### 7.13 Submit Poll Response

```
POST {{BASE_URL}}/residents/notifications/{{NOTIFICATION_ID}}/poll-response
```

**Body (JSON):**
```json
{
  "selectedOption": "Good"
}
```

---

### 7.14 Raise a Complaint

```
POST {{BASE_URL}}/residents/complaints
Content-Type: multipart/form-data
```

**In Postman — form-data fields:**

| Key | Type | Value |
|-----|------|-------|
| `title` | Text | `Bathroom tap is leaking` |
| `description` | Text | `The tap in the attached bathroom has been leaking for 3 days and wasting water` |
| `category` | Text | `Maintenance` |
| `priority` | Text | `High` |
| `location` | Text | `Room 204, Block A` |
| `attachments` | File | *(upload photo)* |

> `category` — `"Maintenance"` | `"Cleanliness"` | `"Staff"` | `"Food"` | `"Safety"` | `"Other"`  
> `priority` — `"Low"` | `"Medium"` | `"High"` | `"Critical"`

---

### 7.15 Get My Complaints

```
GET {{BASE_URL}}/residents/complaints
```

---

### 7.16 Add Message to Complaint Thread (Resident)

```
POST {{BASE_URL}}/residents/complaints/{{COMPLAINT_ID}}/message
```

**Body (JSON):**
```json
{
  "message": "The tap is still leaking. Please send someone urgently."
}
```

---

### 7.17 Get This Week's Food Schedule

```
GET {{BASE_URL}}/residents/food-schedule
```

---

### 7.18 Get All Past Food Schedules

```
GET {{BASE_URL}}/residents/food-schedule/all
```

---

### 7.19 Submit Meal Feedback

```
POST {{BASE_URL}}/residents/food-schedule/feedback
```

**Body (JSON):**
```json
{
  "mealType": "Lunch",
  "rating": 4,
  "comment": "Dal was very tasty today!"
}
```

> `mealType` — `"Breakfast"` | `"Lunch"` | `"Dinner"` | `"Snacks"`  
> `rating` — integer 1–5

---

## 8. Error Codes Reference

| HTTP Status | Code | Meaning | What to do |
|-------------|------|---------|------------|
| 400 | `VALIDATION_ERROR` | Request body failed Joi validation | Check `details` array for specific field errors |
| 401 | `MISSING_TOKEN` | No `Authorization` header | Add `Bearer <token>` header |
| 401 | `TOKEN_EXPIRED` | JWT expired | Call `POST /auth/refresh-token` |
| 401 | `INVALID_TOKEN` | Malformed JWT | Re-login |
| 403 | `FORBIDDEN` | You don't have the required role/permission | Use an account with the right permission |
| 404 | `NOT_FOUND` | Resource or route doesn't exist | Check the URL and IDs |
| 409 | `CONFLICT` | Duplicate (e.g. email already exists) | Use a different value |
| 429 | `RATE_LIMITED` | Too many requests | Wait 15 minutes |
| 500 | `INTERNAL_ERROR` | Server error | Check server logs |

---

## 9. Rate Limits

| Route Group | Limit | Window |
|------------|-------|--------|
| `/v1/auth/*` | 20 requests | Per 15 minutes per IP |
| All other `/v1/*` | 200 requests | Per 15 minutes per IP |

When rate limited, response is:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

---

## 10. Complete Postman Testing Flow

Here's the recommended order to test the full user journey:

### 🟦 Owner Journey

```
1.  POST /auth/owner/signup           → Register owner
2.  POST /auth/owner/verify-email     → Enter email OTP
3.  POST /auth/owner/verify-whatsapp  → Enter WhatsApp OTP → get tokens
4.  GET  /hostels                     → See your hostel (auto-created)
5.  PUT  /hostels/:id                 → Fill hostel profile
6.  POST /hostels/:id/buildings       → Add a building (Block A)
7.  POST /hostels/:id/rooms           → Add rooms (note the roomId + bedIds)
8.  POST /hostels/:id/employees       → Add a staff member
9.  POST /hostels/:id/residents       → Add a resident (uses roomId + bedId)
10. POST /hostels/:id/attendance/config → Set GPS geofence
11. POST /hostels/:id/attendance/request → Trigger attendance
12. GET  /hostels/:id/attendance      → See attendance records
13. POST /hostels/:id/food-schedule   → Set weekly meal plan
14. POST /hostels/:id/notifications   → Send announcement
15. GET  /hostels/:id/leaves          → See leave requests
16. GET  /hostels/:id/complaints      → See complaints
17. GET  /hostels/:id/revenue         → Revenue dashboard
```

### 🟩 Resident Journey

```
1.  POST /auth/resident/login              → Login with hostelCode + email + password
2.  GET  /residents/profile                → See my profile
3.  POST /residents/kyc-upload             → Upload ID document (form-data)
4.  POST /residents/payments/initialize    → Start monthly payment
5.  POST /residents/payments/verify        → Confirm payment
6.  GET  /residents/payments/history       → See payment records
7.  POST /residents/attendance/submit      → Mark attendance with GPS
8.  GET  /residents/attendance/history     → See attendance
9.  POST /residents/leaves                 → Apply for leave
10. GET  /residents/notifications          → See announcements
11. PUT  /residents/notifications/:id/read → Mark as read
12. POST /residents/complaints             → Raise an issue (form-data)
13. GET  /residents/food-schedule          → See this week's meals
14. POST /residents/food-schedule/feedback → Rate a meal
```

---

*Generated from source code — last updated April 2026*
