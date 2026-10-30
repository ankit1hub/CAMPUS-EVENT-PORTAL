# UNIBuzz Campus Event Portal - Backend API

A production-ready Flask REST API backend integrated with **Supabase Database (PostgreSQL)** and **JWT Authentication** for Student & Admin authentication, event publishing, and gate check-in registration workflows.

---

## 🌟 Features

- **Authentication & RBAC**:
  - **Student Portal**: Sign In & Create Account (Sign-Up) with department, year, and student roll number.
  - **Admin / Organizer Studio**: Sign In & Create Account with admin security invitation code (`CAMPUS_ADMIN_2026`).
  - **JWT Tokens**: Secure 7-day signed JWT tokens with user metadata and role permissions.
- **Supabase PostgreSQL Database**:
  - `profiles` table with automatic `on_auth_user_created` trigger.
  - `events` table with Row-Level Security (RLS) for public reading and admin-only authoring.
  - `registrations` table with unique ticket barcode IDs and attendance tracking.
- **RESTful Endpoints**:
  - Event discovery, search, and category filtering.
  - Event creation with custom capacities, tags, and perks.
  - Gate QR pass check-in simulator and attendance verification.

---

## 🚀 Getting Started

### 1. Requirements & Dependencies
Ensure Python 3.9+ is installed, then install the dependencies:
```bash
pip install flask supabase PyJWT cryptography requests
```

### 2. Configuration (`backend/config.py`)
The configuration is automatically linked with the Supabase project:
- **`SUPABASE_URL`**: `https://wcmsewntdgudoxsmsqvk.supabase.co`
- **`SUPABASE_KEY`**: `sb_publishable_oSffy1-6UN1VM2fa71P1VQ_x783I3hD`
- **`PORT`**: `5000`
- **`ADMIN_INVITE_CODE`**: `CAMPUS_ADMIN_2026`

### 3. Run the Backend Server
```bash
python backend/app.py
```
Server runs on: `http://127.0.0.1:5000`

---

## 📡 API Endpoints Reference

### Authentication
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `POST` | `/api/auth/student/signup` | Create new Student account | Public |
| `POST` | `/api/auth/student/login` | Student Sign In & JWT generation | Public |
| `POST` | `/api/auth/admin/signup` | Register new Admin account (with security key) | Public (Key required) |
| `POST` | `/api/auth/admin/login` | Admin Sign In & JWT generation | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer Token |

### Events
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `GET` | `/api/events` | Fetch all events (supports `?category=` & `?search=`) | Public |
| `POST` | `/api/events` | Publish a new campus event | Admin Token |

### Registrations & Attendance
| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `POST` | `/api/registrations` | Register student for event & generate E-Pass | Public / Student |
| `POST` | `/api/registrations/checkin` | Gate QR scanner ticket verification | Admin Token |
| `GET` | `/api/health` | Backend status & Supabase health check | Public |

---

## 🗄️ Database Setup (Supabase)
To instantiate the tables in Supabase:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor**.
3. Paste the contents of [`schema.sql`](../schema.sql) and click **Run**.
