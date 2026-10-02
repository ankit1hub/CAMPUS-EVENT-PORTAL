/* ==========================================================
   UniPulse - Supabase Client & Backend Database Service
   ========================================================== */

// Set your Supabase project credentials here:
const SUPABASE_CONFIG = {
  url: 'https://wcmsewntdgudoxsmsqvk.supabase.co',
  anonKey: 'sb_publishable_oSffy1-6UN1VM2fa71P1VQ_x783I3hD'
};

class SupabaseService {
  constructor() {
    this.supabaseUrl = SUPABASE_CONFIG.url || localStorage.getItem('unipulse_supabase_url') || '';
    this.supabaseAnonKey = SUPABASE_CONFIG.anonKey || localStorage.getItem('unipulse_supabase_key') || '';
    this.client = null;
    this.isConnected = false;

    this.initClient();
  }

  initClient() {
    if (this.supabaseUrl && this.supabaseAnonKey && typeof window !== 'undefined' && window.supabase) {
      try {
        this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseAnonKey);
        this.isConnected = true;
        console.log('✅ Supabase Client Connected');
      } catch (err) {
        console.error('Supabase init error:', err);
        this.client = null;
        this.isConnected = false;
      }
    } else {
      this.client = null;
      this.isConnected = false;
    }
  }

  /* ---------------- AUTHENTICATION METHODS ---------------- */

  // Sign Up a new Student
  async signUpStudent(email, password, fullName, rollNo, dept, year) {
    if (!this.isConnected) {
      // Local fallback simulation
      return {
        success: true,
        user: {
          id: `usr-std-${Date.now().toString().slice(-4)}`,
          email: email,
          name: fullName,
          role: 'student',
          rollNo: rollNo,
          dept: dept,
          year: year
        },
        mode: 'local'
      };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'student',
            roll_no: rollNo,
            dept: dept,
            year: year
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: fullName,
          role: 'student',
          rollNo: rollNo,
          dept: dept,
          year: year
        },
        mode: 'supabase'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Sign In (Handles both Student and Admin)
  async signIn(email, password, requiredRole = null) {
    if (!this.isConnected) {
      // Local fallback mode
      const role = requiredRole || (email.includes('admin') ? 'admin' : 'student');
      const name = email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());

      return {
        success: true,
        user: {
          id: role === 'admin' ? 'usr-adm-201' : 'usr-std-101',
          email: email,
          name: name || (role === 'admin' ? 'Aarav Sharma' : 'John Doe'),
          role: role,
          rollNo: role === 'admin' ? 'FAC-8821' : '23CS0148',
          dept: role === 'admin' ? 'Campus Event Council' : 'Computer Science & Eng',
          year: role === 'admin' ? 'Administrator' : 'Year 3 (Junior)'
        },
        mode: 'local'
      };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      // Fetch user profile to verify role
      const { data: profile } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const userRole = profile?.role || data.user.user_metadata?.role || 'student';

      if (requiredRole && userRole !== requiredRole) {
        throw new Error(`Access Denied: This account is not registered as an ${requiredRole}.`);
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
          role: userRole,
          rollNo: profile?.roll_no || data.user.user_metadata?.roll_no || 'STD-001',
          dept: profile?.dept || data.user.user_metadata?.dept || 'General',
          year: profile?.year || data.user.user_metadata?.year || 'Year 1'
        },
        mode: 'supabase'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Sign Out
  async signOut() {
    if (this.isConnected && this.client) {
      try {
        await this.client.auth.signOut();
      } catch (e) {
        console.error('Supabase signout error', e);
      }
    }
    return { success: true };
  }

  /* ---------------- DATABASE CRUD OPERATIONS ---------------- */

  // Fetch events from Supabase
  async fetchEvents() {
    if (!this.isConnected) return null;
    try {
      const { data, error } = await this.client
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;

      return data.map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        categoryName: e.category_name,
        organizer: e.organizer,
        organizerIcon: e.organizer_icon || '🎯',
        description: e.description,
        date: e.event_date,
        time: e.event_time,
        venue: e.venue,
        isOnline: e.is_online,
        price: e.price,
        priceText: e.price_text,
        teamType: e.team_type,
        maxCapacity: e.max_capacity,
        registeredCount: e.registered_count,
        isFeatured: e.is_featured,
        banner: e.banner,
        tags: e.tags || [],
        perks: e.perks || []
      }));
    } catch (err) {
      console.warn('Supabase fetch failed, using local state:', err);
      return null;
    }
  }

  // Create an event in Supabase
  async createEvent(eventData, userId) {
    if (!this.isConnected) return { success: true, mode: 'local' };
    try {
      const { data, error } = await this.client.from('events').insert([{
        id: eventData.id,
        title: eventData.title,
        category: eventData.category,
        category_name: eventData.categoryName,
        organizer: eventData.organizer,
        organizer_icon: eventData.organizerIcon,
        description: eventData.description,
        event_date: eventData.date,
        event_time: eventData.time,
        venue: eventData.venue,
        is_online: eventData.isOnline || false,
        price: eventData.price,
        price_text: eventData.priceText,
        team_type: eventData.teamType,
        max_capacity: eventData.maxCapacity,
        registered_count: eventData.registeredCount || 0,
        is_featured: eventData.isFeatured || false,
        banner: eventData.banner,
        tags: eventData.tags,
        perks: eventData.perks,
        created_by: userId
      }]).select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Register for an event
  async createRegistration(regData) {
    if (!this.isConnected) return { success: true, mode: 'local' };
    try {
      const { data, error } = await this.client.from('registrations').insert([{
        ticket_id: regData.ticketId,
        event_id: regData.eventId,
        user_id: regData.userId,
        attendee_name: regData.attendeeName,
        roll_no: regData.rollNo,
        email: regData.email,
        dept: regData.dept,
        year: regData.year,
        team_name: regData.teamName || null,
        is_checked_in: false
      }]).select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Update Check-in status (Gate scanner)
  async updateCheckIn(ticketId, isCheckedIn) {
    if (!this.isConnected) return { success: true, mode: 'local' };
    try {
      const { data, error } = await this.client
        .from('registrations')
        .update({ is_checked_in: isCheckedIn })
        .eq('ticket_id', ticketId)
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Global service instance
const supabaseService = new SupabaseService();
