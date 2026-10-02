# 🎓 CAMPUS-EVENT-PORTAL (UniPulse)

A centralized, responsive, full-featured web portal for campus event discovery, student registrations, digital E-Pass generation with QR barcodes, verifiable certificates, club directory, academic calendar, and real-time Organizer Studio with Supabase PostgreSQL database & JWT authentication.

---

## 🌟 Key Features

### 1. 🔍 Event Discovery & Exploration
- **Category Filter Pills**: Hackathons & Coding, Cultural & Arts, Workshops & AI, Sports & Tournaments, Gaming & Esports, Tech & Career.
- **Dynamic Capacity Tracking**: Live progress bar showing seats remaining, filling fast status, and sold-out notifications.

### 2. 🎟️ 1-Click Registration & Interactive E-Pass Generation
- **Custom Registration Form**: Roll / Student ID, University Email, Department, Year, Team details, and dietary preferences.
- **Dynamic Boarding-Pass E-Ticket**: Generates an authentic digital ticket with unique Ticket ID (`UP-2026-XXXX`), attendance credentials, and a **dynamic 2D QR Code** rendered directly on HTML5 canvas.
- **Download & Print**: Built-in print styles and image download options.

### 3. 🔐 Dual Student & Admin Authentication
- **Student Portal**: Sign In & Create Account with department, roll number, and year.
- **Admin Studio**: Protected access for club organizers and faculty administrators with custom security invitation keys.
- **Direct Supabase Integration**: Real-time PostgreSQL database storage and JWT authorization.

### 4. 📅 Interactive Campus Calendar View
- Month-by-month interactive grid mapping campus events.
- Direct click on dates or event pills to inspect agendas and schedules.

### 5. 👥 Campus Clubs & Student Societies Directory
- Explore student chapters (GDSC, ACM, Music Society, Robotics Club, E-Cell, Esports Union).
- Interactive "Join Club" membership workflow and direct filtering by club events.

### 6. 🏆 Student Hub (Attendee Dashboard)
- **Registered Passes Tab**: View, print, and download active E-Passes.
- **Verifiable E-Certificates**: Official participation certificates with university seal, recipient name, dean signatures, and print/PDF support.

### 7. 📊 Organizer & Admin Studio
- **Real-Time Analytics**: Built-in Chart.js visualizer showing registration growth velocity and departmental demographics.
- **Live Check-in Scanner Simulator**: Enter or scan a Ticket ID to verify validity and mark attendance in real-time.
- **CSV Roster Export**: Download full attendee lists with 1 click for attendance reporting.
- **"Host an Event" Wizard**: Create and publish new club events straight to the live portal.

---

## 🚀 How to Run Locally

1. Open `index.html` in any modern web browser.
2. Or use a local development server:
   ```bash
   python -m http.server 3000
   ```
   Then open `http://localhost:3000` in your browser.

---

## 📁 Project Structure

```
CAMPUS-EVENT-PORTAL/
├── index.html          # Main application layout and modal views
├── css/
│   └── styles.css      # Design system, themes, ticket styles, responsive grid
├── js/
│   ├── app.js          # Main client application logic & RBAC
│   ├── data.js         # Initial campus dataset & mock fallbacks
│   └── supabase.js     # Supabase client & database service
├── backend/            # Python Flask REST API & JWT auth
│   ├── app.py
│   ├── config.py
│   └── README.md
└── schema.sql          # PostgreSQL database schema with RLS policies
```
