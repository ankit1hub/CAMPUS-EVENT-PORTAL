# 🎓 UniPulse — Campus Event Management & Registration Portal

**UniPulse** is a modern, responsive, full-featured web application tailored for universities and colleges to streamline campus event discovery, attendee registrations, digital E-Pass generation, club management, calendar scheduling, and real-time organizer analytics.

---

## 🌟 Key Features

### 1. 🔍 Event Discovery & Multi-Filter Engine
- **Category Filter Pills**: Hackathons & Coding, Cultural & Arts, Workshops & AI, Sports & Tournaments, Gaming & Esports, Tech & Career.
- **Search & Sort**: Instant real-time search by keyword, club name, or tech tags. Sort by upcoming date, popularity, or alphabetical order.
- **Dynamic Capacity Tracking**: Live progress bar showing seats remaining, filling fast status, and sold-out notifications.

### 2. 🎟️ 1-Click Registration & Interactive E-Pass Generation
- **Custom Registration Form**: Roll / Student ID, University Email, Department, Year, Team details (for group events), and dietary/swag preferences.
- **Dynamic Boarding-Pass E-Ticket**: Generates an authentic digital ticket with unique Ticket ID (`UP-2026-XXXX`), attendance credentials, and a **dynamic 2D QR Code** rendered directly on HTML5 canvas.
- **Download & Print**: Built-in print styles and image download options.
- **Celebration Effects**: Confetti animation upon successful registration.

### 3. 📅 Interactive Campus Calendar View
- Month-by-month interactive grid mapping campus events.
- Direct click on dates or event pills to inspect agendas and schedules.

### 4. 👥 Campus Clubs & Student Societies Directory
- Explore student chapters (GDSC, ACM, Music Society, Robotics Club, E-Cell, Esports Union).
- Interactive "Join Club" membership workflow and direct filtering by club events.

### 5. 🏆 My Hub (Attendee Dashboard)
- **Registered Passes Tab**: View, print, and download active E-Passes.
- **Saved / Bookmarked Events**: Quick access to saved events with instant registration.
- **Verifiable E-Certificates**: Official participation certificates with university seal, recipient name, dean signatures, and print/PDF support.

### 6. 📊 Organizer & Admin Studio
- **Real-Time Analytics**: Built-in Chart.js visualizer showing registration growth velocity and departmental demographics.
- **Live Check-in Scanner Simulator**: Enter or scan a Ticket ID to verify validity and mark attendance in real-time.
- **CSV Roster Export**: Download full attendee lists with 1 click for attendance reporting.
- **"Host an Event" Wizard**: Create and publish new club events straight to the live portal.

### 7. 🌗 Modern Aesthetics & Dark / Light Mode
- Responsive glassmorphic navigation, modern typography (Plus Jakarta Sans & Outfit), dynamic toast notifications, live announcement ticker, and dark/light theme toggle.
- Switch between **Student**, **Club Lead**, and **Faculty Dean** personas to test different perspectives.

---

## 🚀 How to Run

1. Simply open `index.html` in any web browser (Chrome, Firefox, Edge, Safari).
2. Or use a local development server (e.g. VS Code Live Server or python):
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

---

## 📁 Project Architecture

```
e:/CA2 HTML/
├── index.html          # Main HTML structure with modular views and modals
├── css/
│   └── styles.css      # Comprehensive CSS (Dark/Light themes, tickets, responsive cards)
├── js/
│   ├── data.js         # Rich mock dataset (events, clubs, schedule, initial tickets)
│   └── app.js          # Core app controller, QR engine, filter pipeline, chart visualizer
└── README.md           # Documentation and features guide
```
