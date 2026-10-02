-- ==========================================================
-- UniPulse Campus Portal - Supabase SQL Database Schema
-- Run this script in the Supabase SQL Editor (1-Click Setup)
-- ==========================================================

-- 1. PROFILES TABLE (Linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  roll_no TEXT,
  dept TEXT,
  year TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  category_name TEXT NOT NULL,
  organizer TEXT NOT NULL,
  organizer_icon TEXT DEFAULT '💻',
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  price NUMERIC DEFAULT 0,
  price_text TEXT DEFAULT 'Free',
  team_type TEXT DEFAULT 'Solo',
  max_capacity INTEGER DEFAULT 100,
  registered_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  banner TEXT,
  tags TEXT[],
  perks TEXT[],
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events Policies (Anyone can read, only Admins can create/edit)
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. REGISTRATIONS & E-TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT NOT NULL UNIQUE,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  email TEXT NOT NULL,
  dept TEXT NOT NULL,
  year TEXT NOT NULL,
  team_name TEXT,
  is_checked_in BOOLEAN DEFAULT false,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Registration Policies
CREATE POLICY "Students can view their own registrations"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create registrations"
  ON public.registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update check-in status"
  ON public.registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. AUTOMATIC USER PROFILE TRIGGER ON AUTH.SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, roll_no, dept, year)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    COALESCE(new.raw_user_meta_data->>'roll_no', 'STD-' || floor(random() * 9000 + 1000)::text),
    COALESCE(new.raw_user_meta_data->>'dept', 'Computer Science & Eng'),
    COALESCE(new.raw_user_meta_data->>'year', 'Year 3 (Junior)')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. SEED INITIAL EVENTS
INSERT INTO public.events (id, title, category, category_name, organizer, organizer_icon, description, event_date, event_time, venue, price, price_text, team_type, max_capacity, registered_count, is_featured, banner, tags, perks)
VALUES 
(
  'evt-101',
  'HackPulse 2026: 36-Hour National Campus Hackathon',
  'hackathon',
  'Hackathon',
  'GDSC & ACM Student Chapter',
  '💻',
  'Gear up for the biggest university-wide hackathon! Solve real-world challenges across Web3, AI/ML, Climate Tech, and Open Innovation with $5,000+ in prize pool, free food, mentor workshops, and exclusive swags.',
  '2026-10-18',
  '09:00 AM - Oct 19, 09:00 PM',
  'Main Campus Auditorium & Tech Lab',
  0,
  'Free',
  'Team (2-4)',
  300,
  248,
  true,
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=75',
  ARRAY['Coding', 'AI', 'Team', 'Prizes'],
  ARRAY['Verified Certificate', 'Free Meals', 'Swag Kit', 'Official Attendance Credit']
),
(
  'evt-102',
  'Euphoria ''26: Annual Cultural Night & Battle of the Bands',
  'cultural',
  'Cultural & Arts',
  'Campus Cultural Council',
  '🎸',
  'The most electrifying night of the semester! Live performance by top indie band, inter-college dance faceoff, acoustic jamming, and carnival food stalls.',
  '2026-10-24',
  '06:00 PM - 11:00 PM',
  'Central Open Air Amphitheatre',
  0,
  'Free Pass',
  'Solo / Group',
  1200,
  980,
  true,
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=75',
  ARRAY['Music', 'Dance', 'Food Stalls', 'Concert'],
  ARRAY['Concert Entry Wristband', 'Food Stalls Discount Vouchers', 'Live DJ After-Party']
),
(
  'evt-103',
  'Hands-on Generative AI & Autonomous Agents Workshop',
  'workshop',
  'Workshop',
  'AI & Robotics Club (ARC)',
  '🤖',
  'Build, deploy, and evaluate full-stack AI agents using modern LLM APIs, LangChain, and vector embeddings. Bring your laptop and leave with a working deployed project!',
  '2026-10-15',
  '02:00 PM - 05:30 PM',
  'Computer Science Lab 304',
  0,
  'Free',
  'Solo',
  90,
  88,
  false,
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=75',
  ARRAY['AI/ML', 'Python', 'Hands-on', 'Certificate'],
  ARRAY['Hands-on Project Repo', 'Free Cloud Credits', 'Official Skill Certificate', 'Attendance Credit']
)
ON CONFLICT (id) DO NOTHING;
