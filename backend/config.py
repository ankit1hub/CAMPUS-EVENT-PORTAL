import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wcmsewntdgudoxsmsqvk.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_oSffy1-6UN1VM2fa71P1VQ_x783I3hD")
JWT_SECRET = os.environ.get("JWT_SECRET", "unipulse_campus_super_secret_jwt_key_2026")
PORT = int(os.environ.get("PORT", 5000))
ADMIN_INVITE_CODE = os.environ.get("ADMIN_INVITE_CODE", "CAMPUS_ADMIN_2026")
