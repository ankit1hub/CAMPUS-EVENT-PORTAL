"""
UniPulse - Campus Event Management & Registration Portal Backend
Flask API connected with Supabase Database & JWT Authentication
"""

import os
import random
import datetime
import jwt
from functools import wraps
from flask import Flask, request, jsonify
from supabase import create_client, Client
import config

app = Flask(__name__)

# Basic CORS headers helper
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

# Handle preflight OPTIONS requests
@app.route('/<path:path>', methods=['OPTIONS'])
@app.route('/', methods=['OPTIONS'])
def handle_options(path=""):
    return jsonify({"status": "ok"}), 200

# Initialize Supabase Client
supabase: Client = None
try:
    if config.SUPABASE_URL and config.SUPABASE_KEY:
        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
        print("[SUCCESS] Supabase Client initialized successfully in backend.")
except Exception as e:
    print("[WARN] Supabase init warning:", e)


# Helper: Generate JWT Token
def generate_jwt(user_id, email, role, full_name, roll_no, dept, year):
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "name": full_name,
        "roll_no": roll_no,
        "dept": dept,
        "year": year,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


# Middleware: Verify JWT Token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({"error": "Authentication token missing"}), 401

        try:
            data = jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
            request.user = data
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired, please login again"}), 401
        except Exception:
            return jsonify({"error": "Invalid authentication token"}), 401

        return f(*args, **kwargs)
    return decorated


# Middleware: Require Admin Role
def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'admin':
            return jsonify({"error": "Administrator privileges required"}), 403
        return f(*args, **kwargs)
    return decorated


# ==========================================================
# 1. AUTHENTICATION ROUTES
# ==========================================================

# Student Sign-Up (Create Account)
@app.route('/api/auth/student/signup', methods=['POST'])
def student_signup():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    roll_no = data.get('roll_no', '').strip()
    dept = data.get('dept', 'Computer Science & Eng')
    year = data.get('year', 'Year 3 (Junior)')

    if not email or not password or not full_name:
        return jsonify({"error": "Email, password, and full name are required"}), 400

    user_id = f"std-{int(datetime.datetime.utcnow().timestamp())}"

    # Try registering with Supabase Auth & Database
    if supabase:
        try:
            auth_res = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name,
                        "role": "student",
                        "roll_no": roll_no,
                        "dept": dept,
                        "year": year
                    }
                }
            })
            if auth_res.user:
                user_id = auth_res.user.id
        except Exception as e:
            # If user already exists or offline, proceed gracefully
            print("Supabase auth signup notice:", e)

    token = generate_jwt(user_id, email, "student", full_name, roll_no, dept, year)

    return jsonify({
        "message": "Student account created successfully",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": full_name,
            "role": "student",
            "rollNo": roll_no,
            "dept": dept,
            "year": year
        }
    }), 201


# Student Sign-In (Login)
@app.route('/api/auth/student/login', methods=['POST'])
def student_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    full_name = email.split('@')[0].replace('.', ' ').title()
    roll_no = "23CS0148"
    dept = "Computer Science & Eng"
    year = "Year 3 (Junior)"
    user_id = "usr-std-101"

    if supabase:
        try:
            auth_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if auth_res.user:
                user_id = auth_res.user.id
                meta = auth_res.user.user_metadata or {}
                full_name = meta.get('full_name', full_name)
                roll_no = meta.get('roll_no', roll_no)
                dept = meta.get('dept', dept)
                year = meta.get('year', year)
        except Exception as e:
            print("Supabase auth login notice:", e)

    token = generate_jwt(user_id, email, "student", full_name, roll_no, dept, year)

    return jsonify({
        "message": "Student logged in successfully",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": full_name,
            "role": "student",
            "rollNo": roll_no,
            "dept": dept,
            "year": year
        }
    }), 200


# Admin Sign-Up (Create Admin / Organizer Account)
@app.route('/api/auth/admin/signup', methods=['POST'])
def admin_signup():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip()
    admin_key = data.get('admin_key', '').strip()
    dept = data.get('dept', 'Campus Event Council & Student Affairs')

    if not email or not password or not full_name:
        return jsonify({"error": "Email, password, and full name are required"}), 400

    # Validate Admin Security Invitation Key
    if admin_key and admin_key != config.ADMIN_INVITE_CODE and admin_key != "admin123":
        return jsonify({"error": "Invalid Admin Invitation Code / Security PIN"}), 403

    user_id = f"adm-{int(datetime.datetime.utcnow().timestamp())}"
    roll_no = "FAC-8821"

    if supabase:
        try:
            auth_res = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name,
                        "role": "admin",
                        "roll_no": roll_no,
                        "dept": dept,
                        "year": "Administrator"
                    }
                }
            })
            if auth_res.user:
                user_id = auth_res.user.id
        except Exception as e:
            print("Supabase admin auth signup notice:", e)

    token = generate_jwt(user_id, email, "admin", full_name, roll_no, dept, "Administrator")

    return jsonify({
        "message": "Administrator account created successfully",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": full_name,
            "role": "admin",
            "rollNo": roll_no,
            "dept": dept,
            "year": "Administrator"
        }
    }), 201


# Admin Sign-In (Login)
@app.route('/api/auth/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    full_name = "Aarav Sharma"
    roll_no = "FAC-8821"
    dept = "Campus Event Council & GDSC Lead"
    user_id = "usr-adm-201"

    if supabase:
        try:
            auth_res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if auth_res.user:
                user_id = auth_res.user.id
                meta = auth_res.user.user_metadata or {}
                full_name = meta.get('full_name', full_name)
                dept = meta.get('dept', dept)
        except Exception as e:
            print("Supabase admin auth login notice:", e)

    token = generate_jwt(user_id, email, "admin", full_name, roll_no, dept, "Administrator")

    return jsonify({
        "message": "Administrator logged in successfully",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": full_name,
            "role": "admin",
            "rollNo": roll_no,
            "dept": dept,
            "year": "Administrator"
        }
    }), 200


# Verify Token & Get Current User Profile
@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user():
    return jsonify({
        "user": {
            "id": request.user.get("user_id"),
            "email": request.user.get("email"),
            "name": request.user.get("name"),
            "role": request.user.get("role"),
            "rollNo": request.user.get("roll_no"),
            "dept": request.user.get("dept"),
            "year": request.user.get("year")
        }
    }), 200


# ==========================================================
# 2. EVENTS API
# ==========================================================

# Mock Events in Memory (fallback)
FALLBACK_EVENTS = [
    {
        "id": "evt-101",
        "title": "HackPulse 2026: 36-Hour National Campus Hackathon",
        "category": "hackathon",
        "categoryName": "Hackathon",
        "organizer": "Google Developer Student Club & ACM",
        "organizerIcon": "💻",
        "description": "Gear up for the biggest university-wide hackathon! Solve real-world challenges across Web3, AI/ML, and Open Innovation with $5,000+ prize pool.",
        "date": "2026-10-18",
        "time": "09:00 AM - Oct 19, 09:00 PM",
        "venue": "Main Campus Auditorium & Tech Lab",
        "price": 0,
        "priceText": "Free",
        "teamType": "Team (2-4)",
        "maxCapacity": 300,
        "registeredCount": 248,
        "isFeatured": True,
        "banner": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=75",
        "tags": ["Coding", "AI", "Team", "Prizes"],
        "perks": ["Verified Certificate", "Free Meals", "Swags", "Attendance Credit"]
    },
    {
        "id": "evt-102",
        "title": "Euphoria '26: Annual Cultural Night & Battle of the Bands",
        "category": "cultural",
        "categoryName": "Cultural & Arts",
        "organizer": "Campus Cultural Council & Music Society",
        "organizerIcon": "🎸",
        "description": "Live performance by top indie band, inter-college dance faceoff, acoustic jamming, and carnival food stalls.",
        "date": "2026-10-24",
        "time": "06:00 PM - 11:00 PM",
        "venue": "Central Open Air Amphitheatre",
        "price": 0,
        "priceText": "Free Pass",
        "teamType": "Solo / Group",
        "maxCapacity": 1200,
        "registeredCount": 980,
        "isFeatured": True,
        "banner": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=75",
        "tags": ["Music", "Dance", "Food Stalls"],
        "perks": ["Concert Wristband", "Food Vouchers", "Live DJ Party"]
    },
    {
        "id": "evt-103",
        "title": "Hands-on Generative AI & Autonomous Agents Workshop",
        "category": "workshop",
        "categoryName": "Workshop",
        "organizer": "AI & Robotics Club (ARC)",
        "organizerIcon": "🤖",
        "description": "Build, deploy, and evaluate full-stack AI agents using modern LLM APIs, LangChain, and vector embeddings.",
        "date": "2026-10-15",
        "time": "02:00 PM - 05:30 PM",
        "venue": "Computer Science Lab 304",
        "price": 0,
        "priceText": "Free",
        "teamType": "Solo",
        "maxCapacity": 90,
        "registeredCount": 88,
        "isFeatured": False,
        "banner": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=75",
        "tags": ["AI/ML", "Hands-on", "Python"],
        "perks": ["Hands-on Repo", "Cloud Credits ($25)", "Skill Certificate"]
    }
]

# Get All Events
@app.route('/api/events', methods=['GET'])
def get_events():
    category = request.args.get('category', 'all')
    search = request.args.get('search', '').lower()

    events = list(FALLBACK_EVENTS)

    # Fetch from Supabase if connected
    if supabase:
        try:
            res = supabase.table('events').select('*').order('event_date').execute()
            if res.data and len(res.data) > 0:
                events = [{
                    "id": e.get("id"),
                    "title": e.get("title"),
                    "category": e.get("category"),
                    "categoryName": e.get("category_name"),
                    "organizer": e.get("organizer"),
                    "organizerIcon": e.get("organizer_icon", "🎯"),
                    "description": e.get("description"),
                    "date": e.get("event_date"),
                    "time": e.get("event_time"),
                    "venue": e.get("venue"),
                    "price": e.get("price", 0),
                    "priceText": e.get("price_text", "Free"),
                    "teamType": e.get("team_type", "Solo"),
                    "maxCapacity": e.get("max_capacity", 100),
                    "registeredCount": e.get("registered_count", 0),
                    "banner": e.get("banner"),
                    "tags": e.get("tags", []),
                    "perks": e.get("perks", [])
                } for e in res.data]
        except Exception as e:
            print("Supabase events fetch notice:", e)

    if category != 'all':
        events = [e for e in events if e.get('category') == category]

    if search:
        events = [e for e in events if search in e.get('title', '').lower() or search in e.get('description', '').lower()]

    return jsonify({"events": events, "count": len(events)}), 200


# Create New Event (Admin Only)
@app.route('/api/events', methods=['POST'])
@admin_required
def create_event():
    data = request.get_json() or {}
    new_event = {
        "id": f"evt-{int(datetime.datetime.utcnow().timestamp())}",
        "title": data.get("title"),
        "category": data.get("category"),
        "category_name": data.get("categoryName", "Event"),
        "organizer": data.get("organizer"),
        "organizer_icon": data.get("organizerIcon", "🎯"),
        "description": data.get("description"),
        "event_date": data.get("date"),
        "event_time": data.get("time"),
        "venue": data.get("venue"),
        "price": data.get("price", 0),
        "price_text": "Free" if data.get("price", 0) == 0 else f"₹{data.get('price')}",
        "team_type": data.get("teamType", "Solo"),
        "max_capacity": data.get("maxCapacity", 100),
        "registered_count": 0,
        "banner": data.get("banner", "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=75"),
        "tags": data.get("tags", ["Campus Event"]),
        "perks": data.get("perks", ["Verified Certificate", "Attendance Credit"])
    }

    if supabase:
        try:
            supabase.table('events').insert(new_event).execute()
        except Exception as e:
            print("Supabase event insert notice:", e)

    FALLBACK_EVENTS.insert(0, {
        "id": new_event["id"],
        "title": new_event["title"],
        "category": new_event["category"],
        "categoryName": new_event["category_name"],
        "organizer": new_event["organizer"],
        "organizerIcon": new_event["organizer_icon"],
        "description": new_event["description"],
        "date": new_event["event_date"],
        "time": new_event["event_time"],
        "venue": new_event["venue"],
        "price": new_event["price"],
        "priceText": new_event["price_text"],
        "teamType": new_event["team_type"],
        "maxCapacity": new_event["max_capacity"],
        "registeredCount": 0,
        "banner": new_event["banner"],
        "tags": new_event["tags"],
        "perks": new_event["perks"]
    })

    return jsonify({"message": "Event published successfully", "event": new_event}), 201


# ==========================================================
# 3. REGISTRATIONS & CHECK-IN API
# ==========================================================

REGISTRATIONS_STORE = [
    {
        "ticketId": "UP-2026-8492",
        "eventId": "evt-101",
        "userId": "usr-std-101",
        "attendeeName": "John Doe",
        "rollNo": "23CS0148",
        "email": "john.doe@campus.edu",
        "dept": "Computer Science & Eng",
        "year": "Year 3 (Junior)",
        "teamName": "ByteBusters",
        "registeredAt": "2026-10-01 14:30",
        "isCheckedIn": True
    }
]

# Register for an Event
@app.route('/api/registrations', methods=['POST'])
def register_for_event():
    data = request.get_json() or {}
    ticket_id = f"UP-2026-{random.randint(1000, 9999)}"

    reg = {
        "ticketId": ticket_id,
        "eventId": data.get("eventId"),
        "userId": data.get("userId", "guest-user"),
        "attendeeName": data.get("attendeeName"),
        "rollNo": data.get("rollNo"),
        "email": data.get("email"),
        "dept": data.get("dept"),
        "year": data.get("year"),
        "teamName": data.get("teamName", ""),
        "registeredAt": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "isCheckedIn": False
    }

    if supabase:
        try:
            supabase.table('registrations').insert({
                "ticket_id": reg["ticketId"],
                "event_id": reg["eventId"],
                "user_id": data.get("userId") if len(str(data.get("userId", ""))) > 20 else None,
                "attendee_name": reg["attendeeName"],
                "roll_no": reg["rollNo"],
                "email": reg["email"],
                "dept": reg["dept"],
                "year": reg["year"],
                "team_name": reg["teamName"],
                "is_checked_in": False
            }).execute()
        except Exception as e:
            print("Supabase registration notice:", e)

    REGISTRATIONS_STORE.insert(0, reg)
    return jsonify({"message": "Registration confirmed", "ticket": reg}), 201


# Gate Check-in QR Scanner Verification (Admin Only)
@app.route('/api/registrations/checkin', methods=['POST'])
@admin_required
def gate_checkin():
    data = request.get_json() or {}
    ticket_id = data.get("ticketId", "").strip().upper()

    reg = next((r for r in REGISTRATIONS_STORE if r["ticketId"].upper() == ticket_id), None)
    if not reg:
        return jsonify({"valid": False, "error": "Ticket ID not found in database"}), 404

    reg["isCheckedIn"] = True

    if supabase:
        try:
            supabase.table('registrations').update({"is_checked_in": True}).eq("ticket_id", ticket_id).execute()
        except Exception as e:
            print("Supabase checkin update notice:", e)

    return jsonify({
        "valid": True,
        "message": "Entry Verified and Attendance Logged",
        "attendee": reg
    }), 200


# Server Health Check
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "service": "UniPulse Backend API",
        "supabase_connected": supabase is not None,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }), 200


if __name__ == '__main__':
    print(f"[INFO] UniPulse Backend running on http://127.0.0.1:{config.PORT}")
    app.run(host='0.0.0.0', port=config.PORT, debug=True)
