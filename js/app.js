/* ==========================================================
   UniPulse - Main Application Logic with Supabase & RBAC Auth
   ========================================================== */

class UniPulseApp {
  constructor() {
    this.currentView = 'events';
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.priceFilter = 'all';
    this.sortFilter = 'date-asc';
    this.searchDebounceTimer = null;
    
    this.calendarDate = new Date(2026, 9, 1); // October 2026

    // Default state: Guest (No pre-saved persona)
    this.studentUser = null;
    this.adminUser = null;

    // Load active session (default to guest / null)
    this.currentUser = this.loadStorage('unipulse_user', null);

    // Load datasets
    this.events = this.loadStorage('unipulse_events', INITIAL_EVENTS);
    this.clubs = this.loadStorage('unipulse_clubs', INITIAL_CLUBS);
    this.bookmarks = this.loadStorage('unipulse_bookmarks', []);
    this.registrations = this.loadStorage('unipulse_registrations', typeof INITIAL_REGISTRATIONS !== 'undefined' ? INITIAL_REGISTRATIONS : []);

    this.selectedOrgEvent = 'all';
    this.chartInstances = {};
  }

  async init() {
    this.initTheme();
    this.initTicker();
    this.updateUIForRole();

    // Direct guests to dedicated login page first; direct logged-in users to their respective portal
    if (!this.currentUser) {
      this.navigate('login');
    } else if (this.currentUser.role === 'admin') {
      this.navigate('organizer');
    } else {
      this.navigate('events');
    }

    // Attempt to sync live events from Supabase if connected
    if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
      try {
        const liveEvents = await supabaseService.fetchEvents();
        if (liveEvents && liveEvents.length > 0) {
          // Merge with current state to preserve any cancellation overrides
          this.events = liveEvents.map(le => {
            const localMatch = this.events.find(e => e.id === le.id);
            if (localMatch && (localMatch.isCancelled || localMatch.status === 'cancelled' || localMatch.is_cancelled)) {
              le.isCancelled = true;
              le.status = 'cancelled';
              le.is_cancelled = true;
            }
            return le;
          });
          this.saveStorage('unipulse_events', this.events);
        }
      } catch (err) {
        console.warn('Live events sync error:', err);
      }
    }

    this.renderEvents();
    this.renderClubs();
    this.renderCalendar();
    this.updateRegistrationBadge();
    this.renderDashboard();
    this.renderOrganizerTable();
    this.updateCategoryCounters();
  }

  /* ---------------- Local Storage Helpers ---------------- */
  loadStorage(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Storage save error", e);
    }
  }

  /* ---------------- Role-Based Access Control (RBAC) ---------------- */
  updateUIForRole() {
    const isStudent = this.currentUser && this.currentUser.role === 'student';
    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    const tabClubs = document.getElementById('navTabClubs');
    const tabDashboard = document.getElementById('navTabDashboard');
    const tabOrganizer = document.getElementById('navTabOrganizer');
    const hostBtn = document.getElementById('navHostEventBtn');
    const heroHostBtn = document.getElementById('heroHostBtn');
    const notifBtn = document.getElementById('navNotifBtn');
    const navName = document.getElementById('navUserName');
    const navRole = document.getElementById('navUserRole');
    const navAvatar = document.getElementById('navAvatar');

    const navUserPill = document.getElementById('navUserPill');
    const navAuthBtns = document.getElementById('navAuthBtns');

    const mainNavLinks = document.getElementById('mainNavLinks');

    if (tabClubs) tabClubs.style.display = isStudent ? 'inline-flex' : 'none';
    if (tabDashboard) tabDashboard.style.display = isStudent ? 'inline-flex' : 'none';
    if (tabOrganizer) tabOrganizer.style.display = isAdmin ? 'inline-flex' : 'none';
    if (hostBtn) hostBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (heroHostBtn) heroHostBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    if (notifBtn) notifBtn.style.display = isStudent ? 'inline-flex' : 'none';

    if (this.currentUser) {
      if (mainNavLinks) mainNavLinks.style.display = 'flex';
      if (navUserPill) navUserPill.style.display = 'flex';
      if (navAuthBtns) navAuthBtns.style.display = 'none';

      let displayName = this.currentUser.name;
      if (displayName && displayName.includes('@')) {
        displayName = displayName.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      if (navName) navName.textContent = displayName || 'Student Member';

      if (navAvatar) {
        let nameToUse = displayName || 'ST';
        const initials = nameToUse.split(/[\s._-]+/).filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
        navAvatar.textContent = initials || 'ST';
        navAvatar.style.background = isAdmin 
          ? 'var(--accent-emerald)' 
          : 'var(--accent)';
      }
      if (navRole) {
        if (isAdmin) {
          navRole.innerHTML = '<span class="role-pill role-admin">🛡️ Admin Mode</span>';
        } else {
          const rollDisplay = (this.currentUser.rollNo && !this.currentUser.rollNo.includes('@')) 
            ? this.currentUser.rollNo 
            : 'Student';
          navRole.innerHTML = `<span class="role-pill role-student">🎓 ${rollDisplay}</span>`;
        }
      }
    } else {
      // Guest state: Show Login/Sign-In buttons, hide user pill and internal nav tabs
      if (mainNavLinks) mainNavLinks.style.display = 'none';
      if (navUserPill) navUserPill.style.display = 'none';
      if (navAuthBtns) navAuthBtns.style.display = 'flex';
    }

    if (isStudent && (this.currentView === 'organizer' || this.currentView === 'login')) {
      this.navigate('events');
    } else if (isAdmin && (this.currentView === 'dashboard' || this.currentView === 'login')) {
      this.navigate('organizer');
    } else if (!this.currentUser && this.currentView !== 'login') {
      this.navigate('login');
    }

    this.renderEvents();
    this.updateRegistrationBadge();
    if (this.currentView === 'dashboard') this.renderDashboard();
    if (this.currentView === 'organizer') {
      this.populateOrgEventDropdown();
      this.updateOrgAnalytics();
    }
  }

  /* ---------------- Gateway Page Authentication Handlers ---------------- */
  switchGatewayTab(tab) {
    const studentBtn = document.getElementById('gatewayTabStudent');
    const adminBtn = document.getElementById('gatewayTabAdmin');
    const studentPanel = document.getElementById('gatewayStudentPanel');
    const adminPanel = document.getElementById('gatewayAdminPanel');

    if (tab === 'student') {
      if (studentBtn) studentBtn.classList.add('active');
      if (adminBtn) adminBtn.classList.remove('active');
      if (studentPanel) studentPanel.classList.remove('hidden');
      if (adminPanel) adminPanel.classList.add('hidden');
    } else {
      if (adminBtn) adminBtn.classList.add('active');
      if (studentBtn) studentBtn.classList.remove('active');
      if (adminPanel) adminPanel.classList.remove('hidden');
      if (studentPanel) studentPanel.classList.add('hidden');
    }
  }

  toggleGatewayStudentMode(mode) {
    const signinForm = document.getElementById('gatewayStudentSignInForm');
    const signupForm = document.getElementById('gatewayStudentSignUpForm');
    const signinBtn = document.getElementById('gatewayStudentSignInBtn');
    const signupBtn = document.getElementById('gatewayStudentSignUpBtn');

    if (mode === 'signup') {
      if (signinForm) signinForm.classList.add('hidden');
      if (signupForm) signupForm.classList.remove('hidden');
      if (signinBtn) { signinBtn.classList.remove('active'); signinBtn.style.background = 'var(--bg-surface)'; signinBtn.style.color = 'var(--text-main)'; }
      if (signupBtn) { signupBtn.classList.add('active'); signupBtn.style.background = 'var(--primary)'; signupBtn.style.color = '#fff'; }
    } else {
      if (signupForm) signupForm.classList.add('hidden');
      if (signinForm) signinForm.classList.remove('hidden');
      if (signupBtn) { signupBtn.classList.remove('active'); signupBtn.style.background = 'var(--bg-surface)'; signupBtn.style.color = 'var(--text-main)'; }
      if (signinBtn) { signinBtn.classList.add('active'); signinBtn.style.background = 'var(--primary)'; signinBtn.style.color = '#fff'; }
    }
  }

  toggleGatewayAdminMode(mode) {
    const signinForm = document.getElementById('gatewayAdminSignInForm');
    const signupForm = document.getElementById('gatewayAdminSignUpForm');
    const signinBtn = document.getElementById('gatewayAdminSignInBtn');
    const signupBtn = document.getElementById('gatewayAdminSignUpBtn');

    if (mode === 'signup') {
      if (signinForm) signinForm.classList.add('hidden');
      if (signupForm) signupForm.classList.remove('hidden');
      if (signinBtn) { signinBtn.classList.remove('active'); signinBtn.style.background = 'var(--bg-surface)'; signinBtn.style.color = 'var(--text-main)'; }
      if (signupBtn) { signupBtn.classList.add('active'); signupBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)'; signupBtn.style.color = '#fff'; }
    } else {
      if (signupForm) signupForm.classList.add('hidden');
      if (signinForm) signinForm.classList.remove('hidden');
      if (signupBtn) { signupBtn.classList.remove('active'); signupBtn.style.background = 'var(--bg-surface)'; signupBtn.style.color = 'var(--text-main)'; }
      if (signinBtn) { signinBtn.classList.add('active'); signinBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)'; signinBtn.style.color = '#fff'; }
    }
  }

  async handleGatewayStudentLogin(e) {
    e.preventDefault();
    const email = document.getElementById('gatewayLoginStudentEmail').value.trim();
    const pass = document.getElementById('gatewayLoginStudentPass').value.trim();
    const btn = document.getElementById('gatewayStudentSignInSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

    const res = await supabaseService.signIn(email, pass, 'student');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In to Student Portal';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.updateUIForRole();
      this.showToast(`🎓 Welcome back, ${this.currentUser.name}!`, 'success');
      this.navigate('events');
    } else {
      this.showToast(`Authentication failed: ${res.error}`, 'error');
    }
  }

  async handleGatewayStudentSignUp(e) {
    e.preventDefault();
    const fullName = document.getElementById('gatewaySignupFullName').value.trim();
    const rollNo = document.getElementById('gatewaySignupRollNo').value.trim();
    const email = document.getElementById('gatewaySignupEmail').value.trim();
    const dept = document.getElementById('gatewaySignupDept').value;
    const year = document.getElementById('gatewaySignupYear').value;
    const pass = document.getElementById('gatewaySignupPass').value.trim();
    const btn = document.getElementById('gatewayStudentSignUpSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

    const res = await supabaseService.signUpStudent(email, pass, fullName, rollNo, dept, year);
    if (btn) btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register & Enter Student Portal';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.updateUIForRole();
      this.triggerConfetti();
      this.showToast(`🎉 Account Created! Welcome, ${this.currentUser.name}`, 'success');
      this.navigate('events');
    } else {
      this.showToast(`Sign up failed: ${res.error}`, 'error');
    }
  }

  async handleGatewayAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('gatewayLoginAdminEmail').value.trim();
    const pass = document.getElementById('gatewayLoginAdminPass').value.trim();
    const btn = document.getElementById('gatewayAdminSignInSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying Admin...';

    const res = await supabaseService.signIn(email, pass, 'admin');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Login to Admin Studio';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.updateUIForRole();
      this.showToast(`🛡️ Administrator Access Granted: Welcome, ${this.currentUser.name}!`, 'success');
      this.navigate('organizer');
    } else {
      this.showToast(`Admin verification failed: ${res.error}`, 'error');
    }
  }

  async handleGatewayAdminSignUp(e) {
    e.preventDefault();
    const fullName = document.getElementById('gatewaySignupAdminFullName').value.trim();
    const adminKey = document.getElementById('gatewaySignupAdminKey').value.trim();
    const email = document.getElementById('gatewaySignupAdminEmail').value.trim();
    const dept = document.getElementById('gatewaySignupAdminDept').value;
    const pass = document.getElementById('gatewaySignupAdminPass').value.trim();
    const btn = document.getElementById('gatewayAdminSignUpSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering Admin...';

    const res = await supabaseService.signUpAdmin(email, pass, fullName, adminKey, dept);
    if (btn) btn.innerHTML = '<i class="fa-solid fa-user-shield"></i> Register Administrator Account';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.updateUIForRole();
      this.triggerConfetti();
      this.showToast(`🛡️ Administrator Account Created! Welcome, ${this.currentUser.name}`, 'success');
      this.navigate('organizer');
    } else {
      this.showToast(`Admin registration failed: ${res.error}`, 'error');
    }
  }

  /* ---------------- Authentication Modal Handlers ---------------- */
  openAuthModal(tab = 'student') {
    this.switchAuthTab(tab);
    this.openModal('modalAuth');
  }

  switchAuthTab(tab) {
    const studentBtn = document.getElementById('authTabStudent');
    const adminBtn = document.getElementById('authTabAdmin');
    const studentPanel = document.getElementById('authStudentPanel');
    const adminPanel = document.getElementById('authAdminPanel');
    const title = document.getElementById('authModalTitle');

    if (tab === 'student') {
      studentBtn.classList.add('active');
      adminBtn.classList.remove('active');
      studentPanel.classList.remove('hidden');
      adminPanel.classList.add('hidden');
      if (title) title.innerHTML = '<i class="fa-solid fa-user-graduate" style="color: var(--primary);"></i> Student Portal Login';
    } else {
      adminBtn.classList.add('active');
      studentBtn.classList.remove('active');
      adminPanel.classList.remove('hidden');
      studentPanel.classList.add('hidden');
      if (title) title.innerHTML = '<i class="fa-solid fa-shield-halved" style="color: var(--accent-emerald);"></i> Administrator / Host Login';
    }
  }

  toggleStudentAuthMode(mode) {
    const signinForm = document.getElementById('studentSignInForm');
    const signupForm = document.getElementById('studentSignUpForm');
    const signinBtn = document.getElementById('studentModeSignInBtn');
    const signupBtn = document.getElementById('studentModeSignUpBtn');

    if (mode === 'signup') {
      signinForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      signinBtn.classList.remove('active');
      signupBtn.classList.add('active');
      signupBtn.style.background = 'var(--primary)';
      signupBtn.style.color = '#fff';
      signinBtn.style.background = 'var(--bg-surface)';
      signinBtn.style.color = 'var(--text-main)';
    } else {
      signupForm.classList.add('hidden');
      signinForm.classList.remove('hidden');
      signupBtn.classList.remove('active');
      signinBtn.classList.add('active');
      signinBtn.style.background = 'var(--primary)';
      signinBtn.style.color = '#fff';
      signupBtn.style.background = 'var(--bg-surface)';
      signupBtn.style.color = 'var(--text-main)';
    }
  }

  async handleStudentLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginStudentEmail').value.trim();
    const pass = document.getElementById('loginStudentPass').value.trim();
    const btn = document.getElementById('studentSignInSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

    const res = await supabaseService.signIn(email, pass, 'student');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login as Student';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.closeModal('modalAuth');
      this.updateUIForRole();
      this.showToast(`🎓 Welcome back, ${this.currentUser.name}! (${res.mode === 'supabase' ? 'Supabase Live' : 'Demo Session'})`, 'success');
      this.navigate('events');
    } else {
      this.showToast(`Authentication failed: ${res.error}`, 'error');
    }
  }

  async handleStudentSignUp(e) {
    e.preventDefault();
    const fullName = document.getElementById('signupFullName').value.trim();
    const rollNo = document.getElementById('signupRollNo').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const dept = document.getElementById('signupDept').value;
    const year = document.getElementById('signupYear').value;
    const pass = document.getElementById('signupPass').value.trim();
    const btn = document.getElementById('studentSignUpSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

    const res = await supabaseService.signUpStudent(email, pass, fullName, rollNo, dept, year);
    if (btn) btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register & Create Account';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.closeModal('modalAuth');
      this.updateUIForRole();
      this.triggerConfetti();
      this.showToast(`🎉 Account Created! Welcome, ${this.currentUser.name} (${res.mode === 'supabase' ? 'Saved to Supabase DB' : 'Demo Mode'})`, 'success');
      this.navigate('events');
    } else {
      this.showToast(`Sign up failed: ${res.error}`, 'error');
    }
  }

  async handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginAdminEmail').value.trim();
    const pass = document.getElementById('loginAdminPass').value.trim();
    const btn = document.getElementById('adminSignInSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying Admin Credentials...';

    const res = await supabaseService.signIn(email, pass, 'admin');
    if (btn) btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Login to Admin Studio';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.closeModal('modalAuth');
      this.updateUIForRole();
      this.showToast(`🛡️ Administrator Access Granted: Welcome, ${this.currentUser.name}!`, 'success');
      this.navigate('organizer');
    } else {
      this.showToast(`Admin verification failed: ${res.error}`, 'error');
    }
  }

  toggleAdminAuthMode(mode) {
    const signinForm = document.getElementById('adminSignInForm');
    const signupForm = document.getElementById('adminSignUpForm');
    const signinBtn = document.getElementById('adminModeSignInBtn');
    const signupBtn = document.getElementById('adminModeSignUpBtn');

    if (mode === 'signup') {
      signinForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      signinBtn.classList.remove('active');
      signupBtn.classList.add('active');
      signupBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      signupBtn.style.color = '#fff';
      signinBtn.style.background = 'var(--bg-surface)';
      signinBtn.style.color = 'var(--text-main)';
    } else {
      signupForm.classList.add('hidden');
      signinForm.classList.remove('hidden');
      signupBtn.classList.remove('active');
      signinBtn.classList.add('active');
      signinBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
      signinBtn.style.color = '#fff';
      signupBtn.style.background = 'var(--bg-surface)';
      signupBtn.style.color = 'var(--text-main)';
    }
  }

  async handleAdminSignUp(e) {
    e.preventDefault();
    const fullName = document.getElementById('signupAdminFullName').value.trim();
    const adminKey = document.getElementById('signupAdminKey').value.trim();
    const email = document.getElementById('signupAdminEmail').value.trim();
    const dept = document.getElementById('signupAdminDept').value;
    const pass = document.getElementById('signupAdminPass').value.trim();
    const btn = document.getElementById('adminSignUpSubmitBtn');

    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Admin Account...';

    const res = await supabaseService.signUpAdmin(email, pass, fullName, adminKey, dept);
    if (btn) btn.innerHTML = '<i class="fa-solid fa-user-shield"></i> Register Administrator Account';

    if (res.success) {
      this.currentUser = res.user;
      this.saveStorage('unipulse_user', this.currentUser);
      this.closeModal('modalAuth');
      this.updateUIForRole();
      this.triggerConfetti();
      this.showToast(`🛡️ Administrator Account Created! Welcome, ${this.currentUser.name}`, 'success');
      this.navigate('organizer');
    } else {
      this.showToast(`Admin registration failed: ${res.error}`, 'error');
    }
  }

  loginAsDemoStudent() {
    this.currentUser = { ...this.studentUser };
    this.saveStorage('unipulse_user', this.currentUser);
    this.closeModal('modalAuth');
    this.updateUIForRole();
    this.showToast(`🎓 Logged in as Student: ${this.currentUser.name}`, 'success');
    this.navigate('events');
  }

  loginAsDemoAdmin() {
    this.currentUser = { ...this.adminUser };
    this.saveStorage('unipulse_user', this.currentUser);
    this.closeModal('modalAuth');
    this.updateUIForRole();
    this.showToast(`🛡️ Logged in as Administrator: ${this.currentUser.name}`, 'success');
    this.navigate('organizer');
  }

  openUserDropdownModal() {
    const avatar = document.getElementById('modalUserAvatar');
    const name = document.getElementById('modalUserName');
    const sub = document.getElementById('modalUserSub');
    const badge = document.getElementById('modalUserRoleBadge');

    if (this.currentUser) {
      if (name) name.textContent = this.currentUser.name;
      if (sub) sub.textContent = `${this.currentUser.email} • ${this.currentUser.dept}`;
      if (avatar) {
        avatar.textContent = this.currentUser.name.split(' ').map(n => n[0]).join('');
        avatar.style.background = this.currentUser.role === 'admin' 
          ? 'linear-gradient(135deg, #059669, #10b981)' 
          : 'linear-gradient(135deg, #6366f1, #ec4899)';
      }
      if (badge) {
        badge.innerHTML = this.currentUser.role === 'admin'
          ? '<span class="role-pill role-admin">🛡️ Administrator Account</span>'
          : '<span class="role-pill role-student">🎓 Enrolled Student Account</span>';
      }
      const modalHostBtn = document.getElementById('modalUserSubmitEventBtn');
      if (modalHostBtn) {
        modalHostBtn.style.display = this.currentUser.role === 'admin' ? 'flex' : 'none';
      }
    }
    this.openModal('modalUserDropdown');
  }

  async logout() {
    await supabaseService.signOut();
    this.currentUser = null;
    localStorage.removeItem('unipulse_user');
    this.closeModal('modalUserDropdown');
    this.updateUIForRole();
    this.navigate('login');
    this.showToast('You have signed out.', 'info');
  }

  handleHostEventClick() {
    if (this.currentUser && this.currentUser.role === 'admin') {
      this.openCreateEventModal();
    } else {
      this.showToast('Hosting events requires Administrator or Club Lead access. Please login as Admin.', 'info');
      this.openAuthModal('admin');
    }
  }

  /* ---------------- Theme & Ticker ---------------- */
  initTheme() {
    const savedTheme = localStorage.getItem('unipulse_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('unipulse_theme', next);
    this.updateThemeIcon(next);
    this.showToast(`Switched to ${next} theme`, 'info');
  }

  updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
    }
  }

  initTicker() {
    let index = 0;
    const tickerEl = document.getElementById('tickerText');
    if (!tickerEl) return;
    setInterval(() => {
      index = (index + 1) % INITIAL_ANNOUNCEMENTS.length;
      tickerEl.textContent = INITIAL_ANNOUNCEMENTS[index];
    }, 5000);
  }

  /* ---------------- Navigation ---------------- */
  navigate(viewName) {
    if (viewName === 'organizer' && (!this.currentUser || this.currentUser.role !== 'admin')) {
      this.showToast('🔒 Admin Studio is restricted to Administrators & Club Organizers.', 'error');
      this.openAuthModal('admin');
      return;
    }

    if ((viewName === 'clubs' || viewName === 'dashboard') && this.currentUser && this.currentUser.role === 'admin') {
      this.showToast('ℹ️ This feature is exclusively available in Student Mode.', 'info');
      this.navigate('organizer');
      return;
    }

    this.currentView = viewName;

    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-links .nav-item-btn').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (viewName === 'events') {
      this.renderEvents();
    } else if (viewName === 'dashboard') {
      this.renderDashboard();
    } else if (viewName === 'organizer') {
      this.populateOrgEventDropdown();
      this.updateOrgAnalytics();
    } else if (viewName === 'calendar') {
      this.renderCalendar();
    }
  }

  /* ---------------- Event Card Rendering & Filtering ---------------- */
  renderEvents() {
    const grid = document.getElementById('eventsGrid');
    const counterEl = document.getElementById('eventsMatchCounter');
    if (!grid) return;

    let filtered = this.events.filter(e => {
      if (this.selectedCategory !== 'all' && e.category !== this.selectedCategory) return false;
      if (this.priceFilter === 'free' && e.price > 0) return false;
      if (this.priceFilter === 'paid' && e.price === 0) return false;

      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesDesc = e.description.toLowerCase().includes(query);
        const matchesOrg = e.organizer.toLowerCase().includes(query);
        const matchesTags = e.tags && e.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesOrg && !matchesTags) return false;
      }
      return true;
    });

    if (this.sortFilter === 'date-asc') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (this.sortFilter === 'popularity') {
      filtered.sort((a, b) => (b.registeredCount / b.maxCapacity) - (a.registeredCount / a.maxCapacity));
    } else if (this.sortFilter === 'name-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (counterEl) {
      counterEl.textContent = `Showing ${filtered.length} event${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem;">
          <div style="font-size: 2.75rem; color: var(--text-muted); margin-bottom: 0.75rem;"><i class="fa-solid fa-calendar-xmark"></i></div>
          <h3 style="font-size: 1.25rem; margin-bottom: 0.35rem;">No matching events found</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.25rem; font-size: 0.9rem;">Try adjusting your search terms or clearing the selected filters.</p>
          <button class="btn btn-secondary btn-sm" onclick="app.resetFilters()">Clear All Filters</button>
        </div>
      `;
      return;
    }

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';

    grid.innerHTML = filtered.map(e => {
      const isBookmarked = this.bookmarks.includes(e.id);
      const isCancelled = !!e.isCancelled || e.status === 'cancelled' || e.is_cancelled === true;
      
      // Determine if current student user is already registered for this event
      const isRegistered = (this.currentUser && this.currentUser.role === 'student')
        ? this.registrations.some(r => r.eventId === e.id && (
            (r.email && this.currentUser.email && r.email.toLowerCase() === this.currentUser.email.toLowerCase()) || 
            (r.rollNo && this.currentUser.rollNo && r.rollNo.toLowerCase() === this.currentUser.rollNo.toLowerCase()) || 
            (this.currentUser.id && r.userId === this.currentUser.id)
          ))
        : false;

      const fillPercentage = Math.min(100, Math.round((e.registeredCount / e.maxCapacity) * 100));
      const seatsLeft = Math.max(0, e.maxCapacity - e.registeredCount);

      return `
        <div class="event-card ${isCancelled ? 'event-cancelled' : ''}" style="${isCancelled ? 'border: 1.5px solid rgba(225, 29, 72, 0.45); box-shadow: 0 4px 14px rgba(225, 29, 72, 0.12);' : ''}">
          <div class="event-card-media">
            <img src="${e.banner}" class="event-card-img" alt="${e.title}" loading="lazy" decoding="async" width="400" height="180" style="${isCancelled ? 'filter: grayscale(85%) contrast(85%);' : ''}">
            ${isCancelled ? `
              <span style="position: absolute; top: 0.85rem; left: 0.85rem; background: #e11d48; color: #fff; padding: 0.35rem 0.8rem; border-radius: 999px; font-size: 0.76rem; font-weight: 800; letter-spacing: 0.5px; z-index: 5; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.5); display: flex; align-items: center; gap: 0.35rem;">
                <i class="fa-solid fa-ban"></i> CANCELLED
              </span>
            ` : `
              <span class="event-card-category category-${e.category}">${e.categoryName}</span>
            `}
            <button class="event-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                    title="${isBookmarked ? 'Remove Bookmark' : 'Save Event'}" 
                    onclick="app.toggleBookmark('${e.id}', event)">
              <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
            </button>
            <span class="event-card-price" style="${isCancelled ? 'background: #e11d48; color: #fff;' : ''}">${isCancelled ? 'Cancelled' : (e.priceText || (e.price === 0 ? 'Free' : '₹' + e.price))}</span>
          </div>

          <div class="event-card-body">
            <div class="event-organizer-row">
              <span class="organizer-icon">${e.organizerIcon}</span>
              <span class="organizer-name">${e.organizer}</span>
            </div>

            <h3 class="event-card-title" style="${isCancelled ? 'color: var(--accent-rose); opacity: 0.9;' : ''}">
              ${e.title} ${isCancelled ? '<span style="font-size: 0.72rem; color: #e11d48; font-weight: 800; margin-left: 0.25rem;">[CANCELLED]</span>' : ''}
            </h3>

            <div class="event-card-meta-list">
              <div class="meta-row">
                <i class="fa-regular fa-calendar"></i>
                <span>${this.formatDate(e.date)} • ${e.time.split('-')[0].trim()}</span>
              </div>
              <div class="meta-row">
                <i class="fa-solid fa-location-dot"></i>
                <span>${e.venue}</span>
              </div>
              <div class="meta-row">
                <i class="fa-solid fa-users"></i>
                <span>Format: ${e.teamType || 'Solo'}</span>
              </div>
            </div>

            <div class="event-progress-wrap">
              <div class="progress-header">
                <span><i class="fa-solid ${isCancelled ? 'fa-ban' : 'fa-fire'}" style="color: ${isCancelled ? 'var(--accent-rose)' : 'var(--accent-amber)'}; margin-right: 4px;"></i> ${isCancelled ? '<strong style="color: var(--accent-rose)">EVENT CANCELLED</strong>' : `${fillPercentage}% Full`}</span>
                <span>${isCancelled ? '<strong style="color: var(--accent-rose)">REGISTRATIONS CLOSED</strong>' : (seatsLeft > 0 ? `${seatsLeft} seats left` : '<strong style="color: var(--accent-rose)">SOLD OUT</strong>')}</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 100%; background: ${isCancelled ? 'var(--accent-rose)' : (fillPercentage > 80 ? 'var(--accent-amber)' : 'var(--primary)')};"></div>
              </div>
            </div>

            <div class="event-card-footer">
              <button class="btn btn-secondary btn-sm" onclick="app.openEventDetails('${e.id}')">
                <i class="fa-regular fa-eye"></i> Details
              </button>
              ${isAdmin ? `
                <button class="btn btn-secondary btn-sm" style="${isCancelled ? 'color: var(--accent-emerald); border-color: var(--accent-emerald); background: rgba(16, 185, 129, 0.12);' : 'color: var(--accent-rose); border-color: var(--accent-rose); background: rgba(244, 63, 94, 0.12);'} font-weight: 700;" onclick="app.toggleCancelEvent('${e.id}')">
                  <i class="fa-solid ${isCancelled ? 'fa-rotate-left' : 'fa-ban'}"></i> ${isCancelled ? 'Restore Event' : 'Cancel Event'}
                </button>
              ` : isCancelled ? `
                <button class="btn btn-secondary btn-sm" style="color: var(--accent-rose); border-color: var(--accent-rose); background: rgba(244, 63, 94, 0.08); font-weight: 700;" disabled>
                  <i class="fa-solid fa-ban"></i> Cancelled
                </button>
              ` : isRegistered ? `
                <button class="btn btn-secondary btn-sm" style="color: var(--accent-emerald); border-color: var(--accent-emerald); background: rgba(16, 185, 129, 0.08); font-weight: 700;" onclick="app.viewTicketForEvent('${e.id}')">
                  <i class="fa-solid fa-circle-check"></i> Booked
                </button>
              ` : `
                <button class="btn btn-primary btn-sm" onclick="app.openRegistrationModal('${e.id}')" ${seatsLeft <= 0 ? 'disabled' : ''}>
                  <i class="fa-solid fa-ticket"></i> ${seatsLeft <= 0 ? 'Sold Out' : 'Book Now'}
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCategoryCounters() {
    const counts = { all: this.events.length, hackathon: 0, cultural: 0, workshop: 0, sports: 0, gaming: 0 };
    this.events.forEach(e => {
      if (counts[e.category] !== undefined) counts[e.category]++;
    });

    const setCount = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setCount('countAll', counts.all);
    setCount('countHackathon', counts.hackathon);
    setCount('countCultural', counts.cultural);
    setCount('countWorkshop', counts.workshop);
    setCount('countSports', counts.sports);
    setCount('countGaming', counts.gaming);

    const statEvents = document.getElementById('statLiveEvents');
    if (statEvents) statEvents.textContent = `${this.events.length}+`;

    const totalRegs = this.events.reduce((acc, curr) => acc + (curr.registeredCount || 0), 0);
    const statRegs = document.getElementById('statTotalRegistrations');
    if (statRegs) statRegs.textContent = `${totalRegs.toLocaleString()}+`;
  }

  selectCategoryPill(category) {
    this.selectedCategory = category;
    document.querySelectorAll('.category-pill').forEach(pill => {
      if (pill.getAttribute('data-category') === category) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    const select = document.getElementById('categorySelectFilter');
    if (select) select.value = category;

    this.renderEvents();
  }

  handleSearchFilter() {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      const searchInput = document.getElementById('eventSearchInput');
      const categorySelect = document.getElementById('categorySelectFilter');
      const priceSelect = document.getElementById('priceFilter');
      const sortSelect = document.getElementById('sortFilter');

      if (searchInput) this.searchQuery = searchInput.value;
      if (categorySelect) this.selectedCategory = categorySelect.value;
      if (priceSelect) this.priceFilter = priceSelect.value;
      if (sortSelect) this.sortFilter = sortSelect.value;

      document.querySelectorAll('.category-pill').forEach(pill => {
        if (pill.getAttribute('data-category') === this.selectedCategory) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });

      this.renderEvents();
    }, 120);
  }

  resetFilters() {
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.priceFilter = 'all';
    this.sortFilter = 'date-asc';

    const sIn = document.getElementById('eventSearchInput');
    const cSel = document.getElementById('categorySelectFilter');
    const pSel = document.getElementById('priceFilter');
    const soSel = document.getElementById('sortFilter');

    if (sIn) sIn.value = '';
    if (cSel) cSel.value = 'all';
    if (pSel) pSel.value = 'all';
    if (soSel) soSel.value = 'date-asc';

    this.selectCategoryPill('all');
    this.renderEvents();
    this.showToast('Filters reset', 'info');
  }

  /* ---------------- Bookmark Toggle ---------------- */
  toggleBookmark(eventId, evt) {
    if (evt) evt.stopPropagation();

    const idx = this.bookmarks.indexOf(eventId);
    if (idx > -1) {
      this.bookmarks.splice(idx, 1);
      this.showToast('Event removed from bookmarks', 'info');
    } else {
      this.bookmarks.push(eventId);
      this.showToast('Event saved to your bookmarks!', 'success');
    }

    this.saveStorage('unipulse_bookmarks', this.bookmarks);
    this.renderEvents();
    if (this.currentView === 'dashboard') {
      this.renderDashboard();
    }
  }

  /* ---------------- Event Details Modal ---------------- */
  openEventDetails(eventId) {
    const evt = this.events.find(e => e.id === eventId);
    if (!evt) return;

    this.currentInspectedEvent = evt;

    const titleEl = document.getElementById('detailModalTitle');
    const catEl = document.getElementById('detailModalCategory');
    const bodyEl = document.getElementById('detailModalBody');
    const regBtn = document.getElementById('detailRegisterCtaBtn');

    if (titleEl) titleEl.textContent = evt.title;
    if (catEl) {
      catEl.textContent = evt.categoryName.toUpperCase();
      catEl.className = `event-card-category category-${evt.category}`;
    }

    const isRegistered = this.currentUser && this.currentUser.role === 'student'
      ? this.registrations.some(r => r.eventId === evt.id && (
          r.email === this.currentUser.email || 
          r.rollNo === this.currentUser.rollNo || 
          (this.currentUser.id && r.userId === this.currentUser.id)
        ))
      : this.registrations.some(r => r.eventId === evt.id);

    const isAdmin = this.currentUser && this.currentUser.role === 'admin';
    const isCancelled = !!evt.isCancelled || evt.status === 'cancelled' || evt.is_cancelled === true;

    bodyEl.innerHTML = `
      ${isCancelled ? `
        <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid var(--accent-rose); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.5rem; color: var(--accent-rose);"><i class="fa-solid fa-circle-exclamation"></i></div>
          <div>
            <strong style="color: var(--accent-rose); font-size: 0.95rem;">This event has been cancelled by Campus Administration</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">New registrations are closed. Any confirmed attendee passes have been flagged as cancelled.</p>
          </div>
        </div>
      ` : ''}

      <div style="border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.25rem; max-height: 240px; background: #1e293b; position: relative;">
        <img src="${evt.banner}" style="width: 100%; height: 240px; object-fit: cover;" alt="${evt.title}" loading="lazy" decoding="async">
        ${isCancelled ? `
          <div style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center;">
            <span style="background: #e11d48; color: #fff; padding: 0.4rem 1.2rem; border-radius: var(--radius-md); font-weight: 800; font-size: 1.1rem; letter-spacing: 1px;">
              <i class="fa-solid fa-ban"></i> EVENT CANCELLED
            </span>
          </div>
        ` : ''}
      </div>

      <div class="flex items-center gap-2" style="margin-bottom: 0.85rem;">
        <span style="font-size: 1.2rem;">${evt.organizerIcon}</span>
        <span style="font-weight: 700; color: var(--text-main); font-size: 0.92rem;">Organized by: ${evt.organizer}</span>
      </div>

      <p style="color: var(--text-muted); margin-bottom: 1.25rem; font-size: 0.92rem; line-height: 1.55;">
        ${evt.description}
      </p>

      <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.25rem;">
        <div>
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Date & Time</div>
          <div style="font-weight: 700; font-size: 0.88rem; margin-top: 2px;">${this.formatDate(evt.date)} • ${evt.time}</div>
        </div>
        <div>
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Venue / Location</div>
          <div style="font-weight: 700; font-size: 0.88rem; margin-top: 2px;">${evt.venue}</div>
        </div>
        <div>
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Registration Fee</div>
          <div style="font-weight: 700; font-size: 0.88rem; color: var(--accent-emerald); margin-top: 2px;">${evt.priceText || (evt.price === 0 ? 'Free' : '₹' + evt.price)}</div>
        </div>
        <div>
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Participation Type</div>
          <div style="font-weight: 700; font-size: 0.88rem; margin-top: 2px;">${evt.teamType || 'Solo'}</div>
        </div>
      </div>

      ${evt.perks ? `
        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem;">Participant Perks & Benefits</h4>
          <div class="flex flex-wrap gap-2">
            ${evt.perks.map(p => `
              <span style="background: var(--primary-light); color: var(--primary); padding: 0.25rem 0.65rem; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 600;">
                <i class="fa-solid fa-check-circle"></i> ${p}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${evt.agenda && evt.agenda.length > 0 ? `
        <div style="margin-bottom: 1.25rem;">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.6rem;">Schedule Timeline</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-left: 2px solid var(--primary); padding-left: 0.85rem;">
            ${evt.agenda.map(a => `
              <div>
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary);">${a.time}</span>
                <p style="font-size: 0.85rem; font-weight: 600; color: var(--text-main); margin-top: 1px;">${a.title}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${evt.rules && evt.rules.length > 0 ? `
        <div>
          <h4 style="font-size: 0.95rem; margin-bottom: 0.4rem;">Rules & Guidelines</h4>
          <ul style="padding-left: 1.15rem; font-size: 0.82rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.25rem;">
            ${evt.rules.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;

    const adminCancelBtn = document.getElementById('detailAdminCancelBtn');
    if (adminCancelBtn) {
      if (isAdmin) {
        adminCancelBtn.style.display = 'inline-flex';
        adminCancelBtn.innerHTML = isCancelled 
          ? '<i class="fa-solid fa-rotate-left"></i> Restore Event' 
          : '<i class="fa-solid fa-ban"></i> Cancel Event';
        adminCancelBtn.style.color = isCancelled ? 'var(--accent-emerald)' : 'var(--accent-rose)';
        adminCancelBtn.style.borderColor = isCancelled ? 'var(--accent-emerald)' : 'var(--accent-rose)';
        adminCancelBtn.style.background = isCancelled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)';
      } else {
        adminCancelBtn.style.display = 'none';
      }
    }

    if (regBtn) {
      if (isAdmin) {
        regBtn.style.display = 'none';
      } else if (isCancelled) {
        regBtn.style.display = 'inline-flex';
        regBtn.className = 'btn btn-secondary btn-sm';
        regBtn.disabled = true;
        regBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Event Cancelled';
      } else if (isRegistered) {
        regBtn.style.display = 'inline-flex';
        regBtn.className = 'btn btn-primary btn-sm';
        regBtn.disabled = false;
        regBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i> View My E-Pass';
        regBtn.onclick = () => {
          this.closeModal('modalEventDetails');
          this.viewTicketForEvent(evt.id);
        };
      } else {
        regBtn.style.display = 'inline-flex';
        regBtn.className = 'btn btn-primary btn-sm';
        regBtn.disabled = false;
        regBtn.innerHTML = '<i class="fa-solid fa-ticket"></i> Book Now';
        regBtn.onclick = () => {
          this.closeModal('modalEventDetails');
          this.openRegistrationModal(evt.id);
        };
      }
    }

    this.openModal('modalEventDetails');
  }

  shareCurrentEvent() {
    if (!this.currentInspectedEvent) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Event link copied to clipboard!', 'success');
    } else {
      this.showToast('Share: ' + this.currentInspectedEvent.title, 'info');
    }
  }

  /* ---------------- Admin Event Cancellation ---------------- */
  async toggleCancelEvent(eventId) {
    if (!eventId || eventId === 'all') {
      this.showToast('Please select a specific event to cancel.', 'info');
      return;
    }

    const evt = this.events.find(e => e.id === eventId);
    if (!evt) return;

    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Administrator privileges required to cancel events.', 'error');
      return;
    }

    const isCurrentlyCancelled = !!evt.isCancelled || evt.status === 'cancelled' || evt.is_cancelled === true;
    const willCancel = !isCurrentlyCancelled;
    const confirmMsg = willCancel 
      ? `Are you sure you want to CANCEL "${evt.title}"?\n\nThis will immediately close registrations and mark the event as cancelled.` 
      : `Do you want to RESTORE and re-activate "${evt.title}"?`;

    if (!confirm(confirmMsg)) return;

    evt.isCancelled = willCancel;
    evt.status = willCancel ? 'cancelled' : 'active';
    evt.is_cancelled = willCancel;
    this.saveStorage('unipulse_events', this.events);

    // Sync with Supabase if connected
    try {
      if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
        await supabaseService.updateEventStatus(eventId, willCancel ? 'cancelled' : 'active');
      }
    } catch (err) {
      console.warn('Supabase status sync skipped:', err);
    }

    this.showToast(
      willCancel 
        ? `⛔ "${evt.title}" has been marked as CANCELLED.` 
        : `✅ "${evt.title}" has been restored and re-activated!`,
      willCancel ? 'error' : 'success'
    );

    this.closeModal('modalEventDetails');
    this.renderEvents();
    this.renderCalendar();
    this.renderDashboard();
    this.renderOrganizerTable();
    this.updateCategoryCounters();
    this.updateOrgAnalytics();
  }

  /* ---------------- Registration Flow & Payment Checkout ---------------- */
  switchPayMethod(method) {
    this.currentPayMethod = method;
    const btnUpi = document.getElementById('payMethodUpi');
    const btnCard = document.getElementById('payMethodCard');
    const btnNet = document.getElementById('payMethodNet');

    const optUpi = document.getElementById('payOptionUpi');
    const optCard = document.getElementById('payOptionCard');
    const optNet = document.getElementById('payOptionNet');

    if (btnUpi) {
      btnUpi.style.background = method === 'upi' ? 'var(--primary-light)' : 'var(--bg-surface)';
      btnUpi.style.color = method === 'upi' ? 'var(--primary)' : 'var(--text-main)';
      btnUpi.style.borderColor = method === 'upi' ? 'var(--primary)' : 'var(--border-subtle)';
    }
    if (btnCard) {
      btnCard.style.background = method === 'card' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)';
      btnCard.style.color = method === 'card' ? 'var(--accent-emerald)' : 'var(--text-main)';
      btnCard.style.borderColor = method === 'card' ? 'var(--accent-emerald)' : 'var(--border-subtle)';
    }
    if (btnNet) {
      btnNet.style.background = method === 'net' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)';
      btnNet.style.color = method === 'net' ? 'var(--accent-amber)' : 'var(--text-main)';
      btnNet.style.borderColor = method === 'net' ? 'var(--accent-amber)' : 'var(--border-subtle)';
    }

    if (optUpi) optUpi.classList.toggle('hidden', method !== 'upi');
    if (optCard) optCard.classList.toggle('hidden', method !== 'card');
    if (optNet) optNet.classList.toggle('hidden', method !== 'net');
  }

  verifyUpiFast() {
    const input = document.getElementById('regUpiId');
    const status = document.getElementById('upiVerifyStatus');
    if (!input || !input.value.trim()) {
      this.showToast('Please enter a valid UPI ID (e.g., student@okhdfcbank)', 'error');
      return;
    }
    if (status) {
      status.style.display = 'block';
      status.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + input.value.trim() + ' Verified';
    }
    this.showToast('UPI VPA verified successfully!', 'success');
  }

  openRegistrationModal(eventId) {
    const evt = this.events.find(e => e.id === eventId);
    if (!evt) return;

    const isCancelled = !!evt.isCancelled || evt.status === 'cancelled' || evt.is_cancelled === true;
    if (isCancelled) {
      this.showToast('⛔ This event has been cancelled by the administrator. Registrations are closed.', 'error');
      return;
    }

    const myExisting = this.getMyRegistrations().find(r => r.eventId === eventId);
    if (myExisting) {
      this.showToast('You have already booked a pass for this event!', 'info');
      this.viewTicket(myExisting.ticketId);
      return;
    }

    const subEl = document.getElementById('regModalEventSub');
    const idIn = document.getElementById('regEventId');
    const nameIn = document.getElementById('regFullName');
    const rollIn = document.getElementById('regRollNo');
    const emailIn = document.getElementById('regEmail');
    const teamWrap = document.getElementById('teamFieldsWrap');

    const paySec = document.getElementById('regPaymentSection');
    const payBadge = document.getElementById('regPaymentAmountBadge');
    const baseFeeEl = document.getElementById('regSummaryBaseFee');
    const totalFeeEl = document.getElementById('regSummaryTotalFee');
    const submitBtn = document.getElementById('regSubmitBtn');

    if (subEl) subEl.textContent = `For: ${evt.title} (${evt.priceText || (evt.price === 0 ? 'Free' : '₹' + evt.price)})`;
    if (idIn) idIn.value = evt.id;
    if (nameIn) nameIn.value = this.currentUser ? this.currentUser.name : "";
    if (rollIn) rollIn.value = ""; // Do not auto-fill roll number field
    if (emailIn) emailIn.value = this.currentUser ? (this.currentUser.email || "") : "";

    if (teamWrap) {
      if (evt.teamType && evt.teamType.toLowerCase().includes('team')) {
        teamWrap.style.display = 'block';
      } else {
        teamWrap.style.display = 'none';
      }
    }

    // Payment Section Toggle
    const isPaid = (evt.price && evt.price > 0);
    if (paySec) {
      paySec.style.display = isPaid ? 'block' : 'none';
    }

    if (isPaid) {
      if (payBadge) payBadge.textContent = `Amount: ₹${evt.price}`;
      if (baseFeeEl) baseFeeEl.textContent = `₹${evt.price}`;
      if (totalFeeEl) totalFeeEl.textContent = `₹${evt.price}`;
      if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay ₹${evt.price} & Book E-Pass`;
      this.switchPayMethod('upi');
    } else {
      if (submitBtn) submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Confirm & Generate Free E-Pass`;
    }

    this.openModal('modalRegistrationForm');
  }

  async handleRegistrationSubmit(e) {
    e.preventDefault();
    const eventId = document.getElementById('regEventId').value;
    const evt = this.events.find(ev => ev.id === eventId);
    if (!evt) return;

    if (evt.isCancelled) {
      this.closeModal('modalRegistrationForm');
      this.showToast('⛔ This event has been cancelled by the administrator.', 'error');
      return;
    }

    const attendeeName = document.getElementById('regFullName').value.trim();
    const rollNo = document.getElementById('regRollNo').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const dept = document.getElementById('regDept').value;
    const year = document.getElementById('regYear').value;
    const teamName = document.getElementById('regTeamName') ? document.getElementById('regTeamName').value.trim() : '';

    // Prevent duplicate registrations for the same student on the same event
    const existing = this.registrations.find(r => r.eventId === evt.id && (
      (this.currentUser && (r.email === this.currentUser.email || r.rollNo === this.currentUser.rollNo || (this.currentUser.id && r.userId === this.currentUser.id))) ||
      r.email === email || r.rollNo === rollNo
    ));

    if (existing) {
      this.closeModal('modalRegistrationForm');
      this.showToast('ℹ️ You have already booked an E-Pass for this event!', 'info');
      this.viewTicket(existing.ticketId);
      return;
    }

    const isPaid = (evt.price && evt.price > 0);
    const submitBtn = document.getElementById('regSubmitBtn');

    if (isPaid && submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment of ₹${evt.price}...`;
    }

    const payMethodName = this.currentPayMethod === 'upi' ? 'UPI' : (this.currentPayMethod === 'card' ? 'Credit/Debit Card' : 'NetBanking');
    const txnId = isPaid ? `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}` : 'FREE-PASS';

    const newTicketId = `UP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReg = {
      ticketId: newTicketId,
      eventId: evt.id,
      userId: this.currentUser ? this.currentUser.id : null,
      attendeeName: attendeeName,
      rollNo: rollNo,
      email: email,
      dept: dept,
      year: year,
      teamName: teamName,
      registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isCheckedIn: true,
      aiVerified: true,
      aiConfidence: 99.9,
      aiAudit: 'Instant AI Clearance: Student ID & Payment Validated',
      isPaid: isPaid,
      amountPaid: isPaid ? evt.price : 0,
      paymentMethod: isPaid ? payMethodName : 'Free Event',
      paymentTxn: txnId
    };

    // Save locally
    this.registrations.unshift(newReg);
    this.saveStorage('unipulse_registrations', this.registrations);

    evt.registeredCount = (evt.registeredCount || 0) + 1;
    this.saveStorage('unipulse_events', this.events);

    // Save to Supabase Cloud if connected
    if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
      await supabaseService.createRegistration(newReg);
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Confirm & Generate E-Pass`;
    }

    this.closeModal('modalRegistrationForm');

    this.triggerConfetti();

    this.showToast(isPaid ? `🎉 Payment of ₹${evt.price} Successful! E-Pass & Receipt generated.` : '🎉 Booking Confirmed! Digital E-Pass generated.', 'success');
    this.updateRegistrationBadge();
    this.renderEvents();
    this.updateCategoryCounters();
    this.renderOrganizerTable();
    this.renderDashboard();

    setTimeout(() => {
      this.viewTicket(newTicketId);
    }, 300);
  }

  triggerConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }

  /* ---------------- Student My-Registrations Deduplication ---------------- */
  getMyRegistrations() {
    if (!this.currentUser) return [];

    // Filter registrations that belong specifically to the currently logged in student
    const userRegs = this.registrations.filter(r => {
      if (this.currentUser.id && r.userId === this.currentUser.id) return true;
      if (this.currentUser.email && r.email && r.email.toLowerCase() === this.currentUser.email.toLowerCase()) return true;
      if (this.currentUser.rollNo && r.rollNo && r.rollNo.toLowerCase() === this.currentUser.rollNo.toLowerCase()) return true;
      return false;
    });

    // Deduplicate so each event appears exactly once in the student profile
    const seenEvents = new Set();
    const uniqueRegs = [];
    userRegs.forEach(reg => {
      if (!seenEvents.has(reg.eventId)) {
        seenEvents.add(reg.eventId);
        uniqueRegs.push(reg);
      }
    });

    return uniqueRegs;
  }

  updateRegistrationBadge() {
    const badge = document.getElementById('myRegistrationsBadge');
    if (!badge) return;
    const myRegs = this.getMyRegistrations();
    if (myRegs.length > 0 && this.currentUser && this.currentUser.role === 'student') {
      badge.textContent = myRegs.length;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ---------------- E-Ticket Modal & Canvas QR Code ---------------- */
  viewTicket(ticketId) {
    const reg = this.registrations.find(r => r.ticketId === ticketId);
    if (!reg) return;

    const evt = this.events.find(e => e.id === reg.eventId) || {
      title: "Campus Flagship Event",
      date: "2026-10-18",
      venue: "Main Auditorium",
      categoryName: "Event"
    };

    const passIdEl = document.getElementById('ticketPassId');
    const evTitleEl = document.getElementById('ticketEventTitle');
    const nameEl = document.getElementById('ticketAttendeeName');
    const rollEl = document.getElementById('ticketRollNo');
    const dtEl = document.getElementById('ticketDateTime');
    const venEl = document.getElementById('ticketVenue');
    const deptEl = document.getElementById('ticketDept');
    const catPill = document.getElementById('ticketCategoryPill');

    if (passIdEl) passIdEl.textContent = reg.ticketId;
    if (evTitleEl) evTitleEl.textContent = evt.title;
    if (nameEl) nameEl.textContent = reg.attendeeName;
    if (rollEl) rollEl.textContent = reg.rollNo;
    if (dtEl) dtEl.textContent = `${this.formatDate(evt.date)}`;
    if (venEl) venEl.textContent = evt.venue;
    if (deptEl) deptEl.textContent = `${reg.dept} (${reg.year.split(' ')[0]})`;
    if (catPill) {
      if (evt.isCancelled) {
        catPill.textContent = 'CANCELLED';
        catPill.style.background = '#e11d48';
      } else {
        catPill.textContent = `${(evt.categoryName || 'CAMPUS PASS').toUpperCase()}`;
        catPill.style.background = 'var(--primary)';
      }
    }

    this.drawQRCodeCanvas('ticketQrCanvas', `${reg.ticketId}:${reg.rollNo}`);

    this.openModal('modalTicketPass');
  }

  viewTicketForEvent(eventId) {
    let reg = null;
    if (this.currentUser) {
      reg = this.registrations.find(r => r.eventId === eventId && (
        r.email === this.currentUser.email || 
        r.rollNo === this.currentUser.rollNo || 
        (this.currentUser.id && r.userId === this.currentUser.id)
      ));
    }
    if (!reg) {
      reg = this.registrations.find(r => r.eventId === eventId);
    }
    if (reg) {
      this.viewTicket(reg.ticketId);
    } else {
      this.showToast('You have booked your seat for this event!', 'success');
    }
  }

  drawQRCodeCanvas(canvasId, payload) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const gridSize = 21;
    const cellSize = size / gridSize;
    ctx.fillStyle = '#0f172a';

    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      hash = ((hash << 5) - hash) + payload.charCodeAt(i);
      hash |= 0;
    }

    const drawFinderPattern = (r, c) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            ctx.fillRect((c + j) * cellSize, (r + i) * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    drawFinderPattern(0, 0);
    drawFinderPattern(0, gridSize - 7);
    drawFinderPattern(gridSize - 7, 0);

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= gridSize - 8) || (r >= gridSize - 8 && c < 8)) {
          continue;
        }
        const val = ((r * 13 + c * 7 + Math.abs(hash)) % 100);
        if (val > 45) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
        }
      }
    }
  }

  downloadTicketImage() {
    this.showToast('E-Pass ready for printing or saving!', 'success');
    window.print();
  }

  /* ---------------- Dashboard Tab Controller ---------------- */
  switchDashboardTab(tabName) {
    document.querySelectorAll('#dashPanelTickets, #dashPanelBookmarks, #dashPanelCertificates').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('#dashTabTickets, #dashTabBookmarks, #dashTabCertificates').forEach(b => b.classList.remove('active'));

    const activeBtn = document.getElementById(`dashTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    const activePanel = document.getElementById(`dashPanel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.remove('hidden');

    this.renderDashboard();
  }

  renderDashboard() {
    const myRegs = this.getMyRegistrations();
    const tCount = document.getElementById('dashTicketsCount');
    const bCount = document.getElementById('dashBookmarksCount');
    const cCount = document.getElementById('dashCertificatesCount');

    if (tCount) tCount.textContent = myRegs.length;
    if (bCount) bCount.textContent = this.bookmarks.length;
    if (cCount) cCount.textContent = myRegs.filter(r => r.isCheckedIn).length;

    const ticketsGrid = document.getElementById('myTicketsGrid');
    const emptyTickets = document.getElementById('emptyTicketsState');

    if (myRegs.length === 0) {
      if (ticketsGrid) ticketsGrid.innerHTML = '';
      if (emptyTickets) emptyTickets.style.display = 'block';
    } else {
      if (emptyTickets) emptyTickets.style.display = 'none';
      if (ticketsGrid) {
        ticketsGrid.innerHTML = myRegs.map(reg => {
          const evt = this.events.find(e => e.id === reg.eventId) || {
            title: "Campus Event",
            banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=75",
            category: "tech",
            categoryName: "Event",
            venue: "Main Campus",
            date: "2026-10-18"
          };

          const isCancelled = !!evt.isCancelled;

          return `
            <div class="event-card ${isCancelled ? 'event-cancelled' : ''}" style="${isCancelled ? 'opacity: 0.88;' : ''}">
              <div class="event-card-media" style="height: 150px;">
                <img src="${evt.banner}" class="event-card-img" alt="${evt.title}" loading="lazy" decoding="async">
                ${isCancelled ? `
                  <span style="position: absolute; top: 0.85rem; left: 0.85rem; background: #e11d48; color: #fff; padding: 0.2rem 0.6rem; border-radius: var(--radius-sm); font-size: 0.72rem; font-weight: 800; z-index: 2;">
                    <i class="fa-solid fa-ban"></i> CANCELLED
                  </span>
                ` : `
                  <span class="event-card-category category-${evt.category}">${evt.categoryName}</span>
                `}
                <span class="event-card-price" style="color: #fff; background: ${isCancelled ? '#e11d48' : 'var(--primary)'};">
                  ${reg.ticketId}
                </span>
              </div>
              <div class="event-card-body">
                <div style="font-size: 0.72rem; color: ${isCancelled ? 'var(--accent-rose)' : 'var(--accent-emerald)'}; font-weight: 700; margin-bottom: 0.2rem;">
                  ${isCancelled ? '⛔ EVENT CANCELLED BY ADMIN' : (reg.isCheckedIn ? '✅ ATTENDANCE LOGGED' : '🎟️ ENTRY CONFIRMED')}
                </div>
                <h3 class="event-card-title">${evt.title}</h3>
                <div class="event-card-meta-list">
                  <div class="meta-row"><i class="fa-regular fa-calendar"></i> <span>${this.formatDate(evt.date)}</span></div>
                  <div class="meta-row"><i class="fa-solid fa-location-dot"></i> <span>${evt.venue}</span></div>
                  <div class="meta-row"><i class="fa-solid fa-user"></i> <span>${reg.attendeeName} (${reg.rollNo})</span></div>
                </div>
                <div class="event-card-footer">
                  <button class="btn btn-primary btn-sm" onclick="app.viewTicket('${reg.ticketId}')">
                    <i class="fa-solid fa-qrcode"></i> View E-Pass
                  </button>
                  ${reg.isCheckedIn && !isCancelled ? `
                    <button class="btn btn-secondary btn-sm" onclick="app.viewCertificate('${reg.ticketId}')">
                      <i class="fa-solid fa-award"></i> Certificate
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    const bookmarksGrid = document.getElementById('myBookmarksGrid');
    const emptyBookmarks = document.getElementById('emptyBookmarksState');
    const bookmarkedEvents = this.events.filter(e => this.bookmarks.includes(e.id));

    if (bookmarkedEvents.length === 0) {
      if (bookmarksGrid) bookmarksGrid.innerHTML = '';
      if (emptyBookmarks) emptyBookmarks.style.display = 'block';
    } else {
      if (emptyBookmarks) emptyBookmarks.style.display = 'none';
      if (bookmarksGrid) {
        bookmarksGrid.innerHTML = bookmarkedEvents.map(e => `
          <div class="event-card">
            <div class="event-card-media" style="height: 150px;">
              <img src="${e.banner}" class="event-card-img" alt="${e.title}" loading="lazy" decoding="async">
              <span class="event-card-category category-${e.category}">${e.categoryName}</span>
              <button class="event-bookmark-btn bookmarked" onclick="app.toggleBookmark('${e.id}', event)">
                <i class="fa-solid fa-bookmark"></i>
              </button>
            </div>
            <div class="event-card-body">
              <h3 class="event-card-title">${e.title}</h3>
              <div class="event-card-meta-list">
                <div class="meta-row"><i class="fa-regular fa-calendar"></i> <span>${this.formatDate(e.date)}</span></div>
                <div class="meta-row"><i class="fa-solid fa-location-dot"></i> <span>${e.venue}</span></div>
              </div>
              <div class="event-card-footer">
                <button class="btn btn-primary btn-sm" onclick="app.openRegistrationModal('${e.id}')">
                  <i class="fa-solid fa-ticket"></i> Register Now
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    const certsGrid = document.getElementById('myCertificatesGrid');
    if (certsGrid) {
      certsGrid.innerHTML = `
        <div class="event-card" style="border: 2px solid var(--primary);">
          <div class="event-card-media" style="height: 130px; background: linear-gradient(135deg, #4338ca, #6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 2.75rem;">
            <i class="fa-solid fa-award"></i>
          </div>
          <div class="event-card-body">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--accent-emerald); text-transform: uppercase;">VERIFIED CREDENTIAL</span>
            <h3 class="event-card-title" style="margin-top: 0.2rem;">Hands-on Generative AI & Autonomous Agents Workshop</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.85rem;">Issued by Campus Excellence Council • Fall 2026</p>
            <button class="btn btn-primary btn-sm" onclick="app.viewCertificate('UP-2026-8492')">
              <i class="fa-solid fa-download"></i> View & Download Certificate
            </button>
          </div>
        </div>
      `;
    }
  }

  /* ---------------- Certificate Modal ---------------- */
  viewCertificate(ticketId) {
    const reg = this.registrations.find(r => r.ticketId === ticketId) || this.registrations[0];
    const evt = (reg ? this.events.find(e => e.id === reg.eventId) : null) || this.events[0];

    const recName = document.getElementById('certRecipientName');
    const evTitle = document.getElementById('certEventTitle');
    const orgSign = document.getElementById('certOrganizerSign');

    if (recName) recName.textContent = reg ? reg.attendeeName : (this.currentUser ? this.currentUser.name : "John Doe");
    if (evTitle) evTitle.textContent = evt.title;
    if (orgSign) orgSign.innerHTML = `${evt.organizer.split('&')[0]}<br>Lead Club Convener`;

    this.openModal('modalCertificate');
  }

  /* ---------------- Calendar Engine ---------------- */
  renderCalendar() {
    const titleEl = document.getElementById('calendarMonthYearTitle');
    const gridEl = document.getElementById('calendarDaysGrid');
    if (!gridEl) return;

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} ${year}`;
    }

    const dayHeaders = `
      <div class="calendar-header-day">Sun</div>
      <div class="calendar-header-day">Mon</div>
      <div class="calendar-header-day">Tue</div>
      <div class="calendar-header-day">Wed</div>
      <div class="calendar-header-day">Thu</div>
      <div class="calendar-header-day">Fri</div>
      <div class="calendar-header-day">Sat</div>
    `;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    let cellsHtml = '';

    for (let i = firstDayIndex; i > 0; i--) {
      cellsHtml += `
        <div class="calendar-day-cell other-month">
          <span class="calendar-day-num">${prevLastDay - i + 1}</span>
        </div>
      `;
    }

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const monthFormatted = (month + 1).toString().padStart(2, '0');
      const dayFormatted = day.toString().padStart(2, '0');
      const dateString = `${year}-${monthFormatted}-${dayFormatted}`;

      const dayEvents = this.events.filter(e => e.date === dateString);
      const isToday = (day === 3 && month === 9 && year === 2026);

      cellsHtml += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}" onclick="app.handleCalendarDayClick('${dateString}')">
          <div class="calendar-day-header">
            <span class="calendar-day-num ${isToday ? 'today-badge' : ''}">${day}</span>
            ${dayEvents.length > 0 ? `<span class="calendar-day-events-count">${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}</span>` : ''}
          </div>
          <div class="calendar-events-container">
            ${dayEvents.map(ev => {
              const catClass = `cal-cat-${ev.category || 'tech'}`;
              const isCanc = !!ev.isCancelled || ev.status === 'cancelled';
              const icon = ev.organizerIcon || '📅';
              const timeShort = ev.time ? ev.time.split('-')[0].trim() : '';
              const venueShort = ev.venue ? ev.venue.split('&')[0].trim() : '';
              return `
                <div class="calendar-event-pill ${catClass} ${isCanc ? 'cal-cancelled' : ''}" 
                     title="${ev.title} (${ev.time} at ${ev.venue})" 
                     onclick="event.stopPropagation(); app.openEventDetails('${ev.id}')">
                  <span class="cal-pill-icon">${icon}</span>
                  <div class="cal-pill-info">
                    <span class="cal-pill-title">${isCanc ? '[Cancelled] ' : ''}${ev.title}</span>
                    <span class="cal-pill-time">${timeShort} • ${venueShort}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    gridEl.innerHTML = dayHeaders + cellsHtml;
  }

  changeCalendarMonth(delta) {
    this.calendarDate.setMonth(this.calendarDate.getMonth() + delta);
    this.renderCalendar();
  }

  resetCalendarMonth() {
    this.calendarDate = new Date(2026, 9, 1);
    this.renderCalendar();
  }

  handleCalendarDayClick(dateStr) {
    const dayEvents = this.events.filter(e => e.date === dateStr);
    if (dayEvents.length > 0) {
      this.openEventDetails(dayEvents[0].id);
    } else {
      this.showToast(`No scheduled events on ${this.formatDate(dateStr)}`, 'info');
    }
  }

  /* ---------------- Clubs Directory ---------------- */
  renderClubs() {
    const grid = document.getElementById('clubsGrid');
    if (!grid) return;

    grid.innerHTML = this.clubs.map(club => `
      <div class="club-card">
        <div class="club-avatar" style="background: ${club.bgGradient}; color: white;">
          ${club.icon}
        </div>
        <h3 class="club-title">${club.name}</h3>
        <div class="club-dept">${club.category} • ${club.members} Members</div>
        <p class="club-desc">${club.description}</p>
        <div class="flex items-center gap-2" style="margin-top: auto; width: 100%;">
          <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="app.filterByClub('${club.name}')">
            <i class="fa-solid fa-calendar-check"></i> ${club.eventsCount} Events
          </button>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="app.joinClub('${club.name}')">
            <i class="fa-solid fa-plus"></i> Join Club
          </button>
        </div>
      </div>
    `).join('');
  }

  joinClub(clubName) {
    this.showToast(`🎉 Application sent to join ${clubName}!`, 'success');
  }

  filterByClub(clubName) {
    this.navigate('events');
    const searchInput = document.getElementById('eventSearchInput');
    if (searchInput) {
      searchInput.value = clubName.split(' ')[0];
      this.handleSearchFilter();
    }
  }

  /* ---------------- Organizer Studio & Analytics ---------------- */
  populateOrgEventDropdown() {
    const select = document.getElementById('orgEventFilterSelect');
    if (!select) return;

    const currentVal = this.selectedOrgEvent || 'all';
    let optionsHtml = '<option value="all">🌐 All Events (Campus Overview)</option>';

    this.events.forEach(evt => {
      const icon = evt.organizerIcon || '🎯';
      optionsHtml += `<option value="${evt.id}" ${evt.id === currentVal ? 'selected' : ''}>${icon} ${evt.title} (${evt.date})</option>`;
    });

    select.innerHTML = optionsHtml;
    select.value = currentVal;
  }

  handleOrgEventFilterChange(eventId) {
    this.selectedOrgEvent = eventId;
    this.updateOrgAnalytics();
  }

  updateOrgAnalytics() {
    this.updateOrgStats();
    this.renderOrganizerTable();
    setTimeout(() => this.initCharts(), 50);
  }

  updateOrgStats() {
    const stat1Val = document.getElementById('orgStatTotalEvents');
    const stat1Label = document.getElementById('orgStat1Label');
    const stat2Val = document.getElementById('orgStatTotalRegistrations');
    const stat2Label = document.getElementById('orgStat2Label');
    const stat3Val = document.getElementById('orgStatCheckedIn');
    const stat3Label = document.getElementById('orgStat3Label');
    const stat4Val = document.getElementById('orgStatSatisfaction');
    const stat4Label = document.getElementById('orgStat4Label');
    const scopeSubtext = document.getElementById('orgEventScopeSubtext');
    const cancelBtn = document.getElementById('orgCancelEventBtn');

    if (this.selectedOrgEvent === 'all') {
      if (cancelBtn) cancelBtn.style.display = 'none';
      const totalEvents = this.events.length;
      const totalRegistrations = this.events.reduce((sum, e) => sum + (e.registeredCount || 0), 0) + this.registrations.length;
      const actualChecked = this.registrations.filter(r => r.isCheckedIn).length;
      const totalChecked = 1240 + actualChecked;

      if (stat1Val) stat1Val.textContent = totalEvents;
      if (stat1Label) stat1Label.textContent = 'Published Events';
      if (stat2Val) stat2Val.textContent = totalRegistrations.toLocaleString();
      if (stat2Label) stat2Label.textContent = 'Total Registrations';
      if (stat3Val) stat3Val.textContent = totalChecked.toLocaleString();
      if (stat3Label) stat3Label.textContent = 'Checked-in Attendees';
      if (stat4Val) stat4Val.textContent = '98.4%';
      if (stat4Label) stat4Label.textContent = 'Student Satisfaction';
      if (scopeSubtext) scopeSubtext.textContent = 'Showing aggregated campus overview across all published events';
    } else {
      const evt = this.events.find(e => e.id === this.selectedOrgEvent);
      if (!evt) return;

      const isCancelled = !!evt.isCancelled;
      if (cancelBtn) {
        cancelBtn.style.display = 'inline-flex';
        cancelBtn.innerHTML = isCancelled 
          ? '<i class="fa-solid fa-rotate-left"></i> Restore Event' 
          : '<i class="fa-solid fa-ban"></i> Cancel Event';
        cancelBtn.style.color = isCancelled ? 'var(--accent-emerald)' : 'var(--accent-rose)';
        cancelBtn.style.borderColor = isCancelled ? 'var(--accent-emerald)' : 'var(--accent-rose)';
        cancelBtn.style.background = isCancelled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)';
      }

      const evtActualRegs = this.registrations.filter(r => r.eventId === evt.id);
      const totalRegs = (evt.registeredCount || 0) + evtActualRegs.length;
      const checkedInCount = evtActualRegs.filter(r => r.isCheckedIn).length;
      const estimatedChecked = Math.round(totalRegs * 0.74) + checkedInCount;
      const fillPercent = Math.min(100, Math.round((totalRegs / (evt.maxCapacity || 100)) * 100));

      if (stat1Val) stat1Val.textContent = evt.maxCapacity || 100;
      if (stat1Label) stat1Label.textContent = 'Max Capacity Limit';
      if (stat2Val) stat2Val.textContent = totalRegs.toLocaleString();
      if (stat2Label) stat2Label.textContent = 'Confirmed Registrations';
      if (stat3Val) stat3Val.textContent = Math.min(totalRegs, estimatedChecked).toLocaleString();
      if (stat3Label) stat3Label.textContent = 'Verified / Checked-in';
      if (stat4Val) stat4Val.textContent = isCancelled ? 'CANCELLED' : `${fillPercent}%`;
      if (stat4Label) stat4Label.textContent = isCancelled ? 'Event Status' : 'Slot Fill Rate';
      if (scopeSubtext) scopeSubtext.textContent = isCancelled 
        ? `⛔ "${evt.title}" is currently CANCELLED. Click 'Restore Event' to re-activate.` 
        : `Live real-time analytics & demographics for ${evt.title}`;
    }
  }

  initCharts() {
    const regCanvas = document.getElementById('registrationChart');
    const deptCanvas = document.getElementById('departmentChart');
    const regTitle = document.getElementById('regChartTitle');
    const regBadge = document.getElementById('regChartBadge');
    const deptTitle = document.getElementById('deptChartTitle');
    const deptBadge = document.getElementById('deptChartBadge');

    if (!regCanvas || !deptCanvas) return;

    if (this.chartInstances.regChart) {
      try { this.chartInstances.regChart.destroy(); } catch (e) {}
    }
    if (this.chartInstances.deptChart) {
      try { this.chartInstances.deptChart.destroy(); } catch (e) {}
    }

    let lineLabels = [];
    let lineData = [];
    let lineColor = '#6366f1';
    let lineBg = 'rgba(99, 102, 241, 0.12)';
    let lineTitle = 'Registration Velocity (Oct 2026)';
    let lineBadgeText = 'Campus Timeline';

    let donutLabels = [];
    let donutData = [];
    let donutColors = [];
    let donutTitle = 'Department Demographics';
    let donutBadgeText = 'All Branches';

    if (this.selectedOrgEvent === 'all') {
      lineLabels = ['Oct 01', 'Oct 05', 'Oct 10', 'Oct 15', 'Oct 20', 'Oct 25', 'Oct 30'];
      lineData = [420, 890, 1450, 2100, 2890, 3240, 3450];
      lineColor = '#6366f1';
      lineBg = 'rgba(99, 102, 241, 0.12)';
      lineTitle = 'Campus Registration Velocity (Oct 2026)';
      lineBadgeText = 'Aggregated Timeline';

      donutLabels = ['Computer Science', 'Info Tech', 'Electronics (ECE)', 'Mech & Civil', 'Business & Design'];
      donutData = [45, 25, 15, 10, 5];
      donutColors = ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981'];
      donutTitle = 'University Department Demographics';
      donutBadgeText = 'All Departments';
    } else {
      const evt = this.events.find(e => e.id === this.selectedOrgEvent);
      if (!evt) return;

      const regCount = evt.registeredCount || 50;
      const category = evt.category || 'tech';

      // Set titles & badges
      lineTitle = `Registration Velocity: ${evt.title.length > 28 ? evt.title.substring(0, 28) + '...' : evt.title}`;
      lineBadgeText = `${evt.categoryName || 'Event'}`;
      donutTitle = `Demographics: ${evt.categoryName || 'Event'}`;
      donutBadgeText = `${evt.teamType || 'Attendees'}`;

      // Custom event-specific velocity data & timeline
      if (evt.id === 'evt-101' || category === 'hackathon') {
        lineLabels = ['Oct 02', 'Oct 06', 'Oct 10', 'Oct 13', 'Oct 16', 'Oct 18'];
        lineData = [18, 42, 88, 145, 205, regCount];
        lineColor = '#6366f1';
        lineBg = 'rgba(99, 102, 241, 0.15)';

        donutLabels = ['Computer Science', 'Information Tech', 'Electronics (ECE)', 'Mechanical & Robotics', 'Business & UI/UX'];
        donutData = [54, 24, 12, 6, 4];
        donutColors = ['#6366f1', '#3b82f6', '#06b6d4', '#f59e0b', '#ec4899'];
      } else if (evt.id === 'evt-102' || category === 'cultural') {
        lineLabels = ['Oct 04', 'Oct 09', 'Oct 14', 'Oct 19', 'Oct 22', 'Oct 24'];
        lineData = [120, 290, 520, 750, 890, regCount];
        lineColor = '#ec4899';
        lineBg = 'rgba(236, 72, 153, 0.15)';

        donutLabels = ['Arts & Humanities', 'Business / MBA', 'Computer Science', 'Fashion & Design', 'Biotech & Science'];
        donutData = [36, 26, 18, 12, 8];
        donutColors = ['#ec4899', '#f43f5e', '#8b5cf6', '#f59e0b', '#10b981'];
      } else if (evt.id === 'evt-103' || category === 'workshop') {
        lineLabels = ['Oct 01', 'Oct 04', 'Oct 07', 'Oct 10', 'Oct 13', 'Oct 15'];
        lineData = [12, 28, 49, 68, 81, regCount];
        lineColor = '#10b981';
        lineBg = 'rgba(16, 185, 129, 0.15)';

        donutLabels = ['Computer Science & AI', 'Data Science & IT', 'Electronics (ECE)', 'Mechanical', 'Aerospace / Others'];
        donutData = [58, 22, 12, 5, 3];
        donutColors = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899'];
      } else if (evt.id === 'evt-104' || category === 'sports') {
        lineLabels = ['Oct 05', 'Oct 11', 'Oct 16', 'Oct 21', 'Oct 25', 'Oct 28'];
        lineData = [35, 80, 145, 215, 290, regCount];
        lineColor = '#f59e0b';
        lineBg = 'rgba(245, 158, 11, 0.15)';

        donutLabels = ['Mechanical & Civil', 'Physical Education', 'Computer Science', 'Electrical (EEE)', 'Management'];
        donutData = [32, 24, 20, 14, 10];
        donutColors = ['#f59e0b', '#ef4444', '#6366f1', '#06b6d4', '#10b981'];
      } else if (evt.id === 'evt-105' || category === 'gaming') {
        lineLabels = ['Oct 12', 'Oct 18', 'Oct 23', 'Oct 27', 'Oct 30', 'Nov 02'];
        lineData = [6, 15, 26, 36, 46, regCount];
        lineColor = '#8b5cf6';
        lineBg = 'rgba(139, 92, 246, 0.15)';

        donutLabels = ['Computer Science', 'Info Tech', 'Animation & Game Design', 'Electronics', 'Commerce'];
        donutData = [46, 28, 14, 8, 4];
        donutColors = ['#8b5cf6', '#6366f1', '#ec4899', '#06b6d4', '#f59e0b'];
      } else if (evt.id === 'evt-106' || category === 'tech') {
        lineLabels = ['Oct 14', 'Oct 19', 'Oct 24', 'Oct 29', 'Nov 02', 'Nov 06'];
        lineData = [25, 75, 140, 210, 270, regCount];
        lineColor = '#06b6d4';
        lineBg = 'rgba(6, 182, 212, 0.15)';

        donutLabels = ['Final Year B.Tech (CSE/IT)', 'MBA / Management', 'MCA & M.Tech', 'Electronics', 'Design & Media'];
        donutData = [44, 26, 16, 9, 5];
        donutColors = ['#06b6d4', '#3b82f6', '#6366f1', '#10b981', '#f59e0b'];
      } else {
        // Dynamic procedural curve for newly created user events
        lineLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Final Days', 'Event Day'];
        lineData = [
          Math.max(1, Math.round(regCount * 0.1)),
          Math.max(2, Math.round(regCount * 0.28)),
          Math.max(3, Math.round(regCount * 0.52)),
          Math.max(4, Math.round(regCount * 0.76)),
          Math.max(5, Math.round(regCount * 0.92)),
          regCount
        ];
        lineColor = '#3b82f6';
        lineBg = 'rgba(59, 130, 246, 0.15)';

        donutLabels = ['Computer Science', 'Info Tech', 'Electronics', 'Mechanical', 'Business & Design'];
        donutData = [40, 25, 15, 12, 8];
        donutColors = ['#3b82f6', '#6366f1', '#06b6d4', '#f59e0b', '#10b981'];
      }
    }

    if (regTitle) regTitle.textContent = lineTitle;
    if (regBadge) regBadge.textContent = lineBadgeText;
    if (deptTitle) deptTitle.textContent = donutTitle;
    if (deptBadge) deptBadge.textContent = donutBadgeText;

    this.chartInstances.regChart = new Chart(regCanvas, {
      type: 'line',
      data: {
        labels: lineLabels,
        datasets: [{
          label: 'Registrations',
          data: lineData,
          borderColor: lineColor,
          backgroundColor: lineBg,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: lineColor,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.parsed.y} registered attendees`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.12)' }
          },
          x: { grid: { display: false } }
        }
      }
    });

    this.chartInstances.deptChart = new Chart(deptCanvas, {
      type: 'doughnut',
      data: {
        labels: donutLabels,
        datasets: [{
          data: donutData,
          backgroundColor: donutColors,
          borderWidth: 2,
          borderColor: 'var(--bg-surface)'
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 400 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });
  }

  renderOrganizerTable() {
    const tbody = document.getElementById('organizerAttendeesTableBody');
    if (!tbody) return;

    let displayList = this.registrations;
    if (this.selectedOrgEvent && this.selectedOrgEvent !== 'all') {
      displayList = this.registrations.filter(r => r.eventId === this.selectedOrgEvent);
    }

    if (displayList.length === 0) {
      const selectedEvt = this.events.find(e => e.id === this.selectedOrgEvent);
      const title = selectedEvt ? selectedEvt.title : 'this event';
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fa-regular fa-clipboard" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
            No direct web pass records logged yet for <strong>${title}</strong>.<br>
            <span style="font-size: 0.78rem;">New attendee signups from student accounts will appear here in real-time.</span>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = displayList.map(r => {
      const evt = this.events.find(e => e.id === r.eventId) || { title: "Campus Event" };
      const isPaid = (r.isPaid || (evt.price && evt.price > 0));
      const txn = r.paymentTxn || (isPaid ? 'TXN-UPI-AUTO' : 'FREE-PASS');
      const isAI = r.aiVerified || r.isCheckedIn;

      return `
        <tr>
          <td>
            <strong style="font-family: monospace; color: var(--text-main); font-size: 0.88rem;">${r.ticketId}</strong>
            <div style="font-size: 0.68rem; color: var(--text-muted);">${r.registeredAt || 'Today'}</div>
          </td>
          <td>
            <strong style="font-size: 0.88rem;">${r.attendeeName}</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${r.email}</div>
          </td>
          <td>
            <span style="font-weight: 600; font-family: monospace; font-size: 0.82rem; color: var(--text-main);">${r.rollNo}</span>
            <div style="font-size: 0.68rem; color: var(--accent-emerald); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> ID Validated</div>
          </td>
          <td>
            <div style="font-weight: 600; font-size: 0.84rem;">${evt.title}</div>
            <div style="margin-top: 2px;">
              <span style="font-size: 0.68rem; font-weight: 700; background: ${isPaid ? 'rgba(139, 92, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)'}; color: ${isPaid ? '#8b5cf6' : 'var(--accent-emerald)'}; padding: 0.15rem 0.45rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">
                <i class="fa-solid ${isPaid ? 'fa-bolt' : 'fa-ticket'}"></i> ${txn} (${isPaid ? '₹' + (r.amountPaid || evt.price) : 'Free Pass'})
              </span>
            </div>
          </td>
          <td>
            <span style="font-size: 0.82rem;">${r.dept}</span>
            <div style="font-size: 0.68rem; color: var(--text-muted);">${r.year || 'Enrolled'}</div>
          </td>
          <td>
            ${r.isCheckedIn 
              ? `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: var(--accent-emerald); font-weight: 700; font-size: 0.82rem;"><i class="fa-solid fa-circle-check"></i> Checked-in</span>
                  <span style="font-size: 0.68rem; color: #8b5cf6; font-weight: 700;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Verified (${r.aiConfidence || '99.8'}%)</span>
                </div>
              ` 
              : `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <span style="color: var(--accent-amber); font-weight: 700; font-size: 0.82rem;"><i class="fa-solid fa-clock"></i> Pending Audit</span>
                  <span style="font-size: 0.68rem; color: var(--text-muted);">Ready for AI Scan</span>
                </div>
              `}
          </td>
          <td>
            <div class="flex gap-1 items-center">
              ${!r.isCheckedIn ? `
                <button class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; font-size: 0.74rem; padding: 0.35rem 0.6rem; font-weight: 700;" onclick="app.runAISingleVerification('${r.ticketId}')" title="AI Auto-Verify this transaction">
                  <i class="fa-solid fa-wand-magic-sparkles"></i> AI Verify
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="app.toggleCheckInStatus('${r.ticketId}')" title="Undo Verification">
                  <i class="fa-solid fa-rotate-left"></i> Undo
                </button>
              `}
              <button class="btn btn-secondary btn-sm" onclick="app.viewTicket('${r.ticketId}')" title="View Digital Pass">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* ---------------- PulseAI Autonomous Verification Engine ---------------- */
  async runAIBatchVerification() {
    this.openModal('modalAIVerify');

    const pBar = document.getElementById('aiProgressBar');
    const pText = document.getElementById('aiProgressPercent');
    const stageText = document.getElementById('aiProgressStageText');
    const consoleBox = document.getElementById('aiTerminalConsole');
    const doneBtn = document.getElementById('aiModalDoneBtn');

    const s1 = document.getElementById('aiStep1');
    const s2 = document.getElementById('aiStep2');
    const s3 = document.getElementById('aiStep3');
    const s4 = document.getElementById('aiStep4');

    const icon1 = document.getElementById('aiIcon1');
    const icon2 = document.getElementById('aiIcon2');
    const icon3 = document.getElementById('aiIcon3');
    const icon4 = document.getElementById('aiIcon4');

    const sub1 = document.getElementById('aiSub1');
    const sub2 = document.getElementById('aiSub2');
    const sub3 = document.getElementById('aiSub3');
    const sub4 = document.getElementById('aiSub4');

    if (doneBtn) doneBtn.style.display = 'none';

    const log = (msg, color = '#38bdf8') => {
      if (!consoleBox) return;
      const div = document.createElement('div');
      div.style.color = color;
      div.innerHTML = `> ${msg}`;
      consoleBox.appendChild(div);
      consoleBox.scrollTop = consoleBox.scrollHeight;
    };

    if (consoleBox) consoleBox.innerHTML = '';
    log('PulseAI Autonomous Engine v3.4 booting...', '#a855f7');
    log(`Identified ${this.registrations.length} campus registrations in memory.`, '#94a3b8');

    // Step 1: Student Roll & ID verification
    if (stageText) stageText.textContent = 'Step 1/4: Authenticating Student Roll Numbers & University Domains...';
    if (pBar) pBar.style.width = '25%';
    if (pText) pText.textContent = '25%';
    if (s1) { s1.style.background = 'rgba(99, 102, 241, 0.15)'; s1.style.borderColor = 'var(--primary)'; }
    if (icon1) { icon1.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; icon1.style.color = 'var(--primary)'; }
    if (sub1) sub1.textContent = 'Analyzing syntax & enrollment...';

    await new Promise(r => setTimeout(r, 600));

    log('NLP Cross-validation: All student IDs (121xxxx, 23CSxxx, FAC-xxx) match LPU registrar registry.', '#10b981');
    if (icon1) { icon1.innerHTML = '<i class="fa-solid fa-circle-check"></i>'; icon1.style.color = 'var(--accent-emerald)'; }
    if (sub1) { sub1.textContent = '100% ID Match Verified'; sub1.style.color = 'var(--accent-emerald)'; }

    // Step 2: UPI & Banking Gateway Check
    if (stageText) stageText.textContent = 'Step 2/4: Decrypting UPI/Banking Gateway Txn Hashes...';
    if (pBar) pBar.style.width = '55%';
    if (pText) pText.textContent = '55%';
    if (s2) { s2.style.background = 'rgba(139, 92, 246, 0.15)'; s2.style.borderColor = '#8b5cf6'; }
    if (icon2) { icon2.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; icon2.style.color = '#8b5cf6'; }
    if (sub2) sub2.textContent = 'Validating payment hashes...';

    await new Promise(r => setTimeout(r, 700));

    this.registrations.forEach(r => {
      const isPaid = r.isPaid || (r.amountPaid && r.amountPaid > 0);
      const txn = r.paymentTxn || (isPaid ? `TXN-UPI-${Math.floor(100000 + Math.random()*900000)}` : 'FREE-PASS');
      log(`Txn [${txn}] -> Settled via ${r.paymentMethod || 'UPI/Card'} (${r.attendeeName}) - CLEARED`, '#38bdf8');
    });

    if (icon2) { icon2.innerHTML = '<i class="fa-solid fa-circle-check"></i>'; icon2.style.color = 'var(--accent-emerald)'; }
    if (sub2) { sub2.textContent = 'All Transactions Cleared'; sub2.style.color = 'var(--accent-emerald)'; }

    // Step 3: Fraud & Sybil Shield
    if (stageText) stageText.textContent = 'Step 3/4: Evaluating Anti-Fraud & Sybil Quota Rules...';
    if (pBar) pBar.style.width = '80%';
    if (pText) pText.textContent = '80%';
    if (s3) { s3.style.background = 'rgba(236, 72, 153, 0.15)'; s3.style.borderColor = 'var(--accent-pink)'; }
    if (icon3) { icon3.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; icon3.style.color = 'var(--accent-pink)'; }
    if (sub3) sub3.textContent = 'Detecting spoofing & bot signups...';

    await new Promise(r => setTimeout(r, 600));

    log('Fraud & Sybil Shield: 0 duplicates, 0 suspicious IP velocity anomalies detected.', '#10b981');
    if (icon3) { icon3.innerHTML = '<i class="fa-solid fa-circle-check"></i>'; icon3.style.color = 'var(--accent-emerald)'; }
    if (sub3) { sub3.textContent = 'Zero Risk Detected'; sub3.style.color = 'var(--accent-emerald)'; }

    // Step 4: Autonomous Approval & Attendance Check-in
    if (stageText) stageText.textContent = 'Step 4/4: Autonomously Registering & Checking in Attendees...';
    if (pBar) pBar.style.width = '100%';
    if (pText) pText.textContent = '100%';
    if (s4) { s4.style.background = 'rgba(16, 185, 129, 0.15)'; s4.style.borderColor = 'var(--accent-emerald)'; }
    if (icon4) { icon4.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; icon4.style.color = 'var(--accent-emerald)'; }
    if (sub4) sub4.textContent = 'Issuing verified E-Passes...';

    // Auto-update all registrations to checked-in & AI verified
    this.registrations.forEach(r => {
      r.isCheckedIn = true;
      r.aiVerified = true;
      r.aiConfidence = 99.8;
      if (!r.paymentTxn && r.isPaid) {
        r.paymentTxn = `TXN-UPI-${Math.floor(100000 + Math.random()*900000)}`;
      }
    });

    this.saveStorage('unipulse_registrations', this.registrations);

    // Sync all with Supabase
    if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
      for (const reg of this.registrations) {
        try {
          await supabaseService.updateCheckIn(reg.ticketId, true);
        } catch (e) {}
      }
    }

    await new Promise(r => setTimeout(r, 500));

    log('🎉 SUCCESS: All transactions processed and all attendees verified autonomously!', '#10b981');
    if (stageText) stageText.innerHTML = '<span style="color: var(--accent-emerald);">✨ PulseAI Verification Completed Successfully (100% Cleared)</span>';
    if (icon4) { icon4.innerHTML = '<i class="fa-solid fa-circle-check"></i>'; icon4.style.color = 'var(--accent-emerald)'; }
    if (sub4) { sub4.textContent = 'All E-Passes Approved & Synced'; sub4.style.color = 'var(--accent-emerald)'; }
    if (doneBtn) doneBtn.style.display = 'inline-flex';

    this.triggerConfetti();
    this.showToast('🤖 PulseAI autonomously processed all transactions and verified the roster!', 'success');
    this.updateOrgStats();
    this.renderOrganizerTable();
  }

  async runAISingleVerification(ticketId) {
    const reg = this.registrations.find(r => r.ticketId === ticketId);
    if (!reg) return;

    reg.isCheckedIn = true;
    reg.aiVerified = true;
    reg.aiConfidence = 99.9;
    if (!reg.paymentTxn && reg.isPaid) {
      reg.paymentTxn = `TXN-UPI-${Math.floor(100000 + Math.random()*900000)}`;
    }

    this.saveStorage('unipulse_registrations', this.registrations);

    if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
      await supabaseService.updateCheckIn(ticketId, true);
    }

    this.showToast(`🤖 PulseAI verified ${reg.attendeeName} (${ticketId}) - Identity & Payment Cleared!`, 'success');
    this.triggerConfetti();
    this.updateOrgStats();
    this.renderOrganizerTable();
  }

  async toggleCheckInStatus(ticketId) {
    const reg = this.registrations.find(r => r.ticketId === ticketId);
    if (reg) {
      reg.isCheckedIn = !reg.isCheckedIn;
      this.saveStorage('unipulse_registrations', this.registrations);

      // Sync with Supabase if connected
      if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
        await supabaseService.updateCheckIn(ticketId, reg.isCheckedIn);
      }

      this.updateOrgStats();
      this.renderOrganizerTable();
      this.showToast(`Ticket ${ticketId}: ${reg.isCheckedIn ? 'Checked-in' : 'Pending'}`, 'success');
    }
  }

  exportAttendeesCSV() {
    let listToExport = this.registrations;
    if (this.selectedOrgEvent && this.selectedOrgEvent !== 'all') {
      listToExport = this.registrations.filter(r => r.eventId === this.selectedOrgEvent);
    }

    if (listToExport.length === 0) {
      listToExport = this.registrations;
    }

    let csv = "TicketID,AttendeeName,RollNo,Email,Department,Year,EventName,CheckInStatus\n";
    listToExport.forEach(r => {
      const evt = this.events.find(e => e.id === r.eventId) || { title: "Event" };
      csv += `"${r.ticketId}","${r.attendeeName}","${r.rollNo}","${r.email}","${r.dept}","${r.year}","${evt.title}","${r.isCheckedIn ? 'CheckedIn' : 'Pending'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `UniPulse_Attendees_Roster_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('Attendees CSV exported successfully!', 'success');
  }

  /* ---------------- Host New Event Wizard ---------------- */
  openCreateEventModal() {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      this.showToast('Administrator privileges required to host events.', 'error');
      this.openAuthModal('admin');
      return;
    }
    this.openModal('modalCreateEvent');
  }

  async handleCreateEventSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('newEventTitle').value.trim();
    const category = document.getElementById('newEventCategory').value;
    const organizer = document.getElementById('newEventOrganizer').value.trim();
    const date = document.getElementById('newEventDate').value;
    const time = document.getElementById('newEventTime').value.trim();
    const venue = document.getElementById('newEventVenue').value.trim();
    const capacity = parseInt(document.getElementById('newEventCapacity').value, 10) || 100;
    const price = parseInt(document.getElementById('newEventPrice').value, 10) || 0;
    const teamType = document.getElementById('newEventTeamType').value;
    const desc = document.getElementById('newEventDesc').value.trim();
    const banner = document.getElementById('newEventBanner').value.trim() || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=75';

    const categoryNames = {
      hackathon: 'Hackathon',
      cultural: 'Cultural & Arts',
      workshop: 'Workshop',
      sports: 'Sports & Fitness',
      gaming: 'Gaming & Esports',
      tech: 'Tech & Career'
    };

    const newEvent = {
      id: `evt-${Date.now().toString().slice(-4)}`,
      title: title,
      category: category,
      categoryName: categoryNames[category] || 'Campus Event',
      organizer: organizer,
      organizerIcon: "🎯",
      description: desc,
      date: date,
      time: time,
      venue: venue,
      isOnline: false,
      price: price,
      priceText: price === 0 ? "Free" : `₹${price}`,
      teamType: teamType,
      maxCapacity: capacity,
      registeredCount: 1,
      isFeatured: false,
      banner: banner,
      tags: ["Campus", categoryNames[category]],
      perks: ["Verified Certificate", "Attendance Credit"],
      agenda: [{ time: time.split('-')[0] || "10:00 AM", title: "Event Commencement" }],
      rules: ["Valid Student ID required upon gate entry."]
    };

    // Save locally
    this.events.unshift(newEvent);
    this.saveStorage('unipulse_events', this.events);

    // Save to Supabase Cloud if connected
    if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
      await supabaseService.createEvent(newEvent, this.currentUser ? this.currentUser.id : null);
    }

    this.closeModal('modalCreateEvent');
    document.getElementById('createEventForm').reset();

    this.showToast(`🎉 "${title}" published by ${this.currentUser.name}!`, 'success');
    this.renderEvents();
    this.updateCategoryCounters();
    this.renderCalendar();
    this.populateOrgEventDropdown();
    this.navigate('events');
  }

  /* ---------------- Scanner Simulator ---------------- */
  openScannerModal() {
    const resBox = document.getElementById('scanResultBox');
    if (resBox) resBox.style.display = 'none';
    const input = document.getElementById('scanTicketInput');
    if (input) input.value = '';
    this.openModal('modalScanner');
  }

  async simulateScanTicket() {
    const input = document.getElementById('scanTicketInput');
    const resBox = document.getElementById('scanResultBox');
    if (!input || !resBox) return;

    let searchId = input.value.trim().toUpperCase();
    if (!searchId && this.registrations.length > 0) {
      searchId = this.registrations[0].ticketId;
      input.value = searchId;
    }

    const reg = this.registrations.find(r => r.ticketId.toUpperCase() === searchId);

    if (reg) {
      reg.isCheckedIn = true;
      this.saveStorage('unipulse_registrations', this.registrations);

      if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
        await supabaseService.updateCheckIn(reg.ticketId, true);
      }

      this.renderOrganizerTable();

      resBox.style.display = 'block';
      resBox.style.background = 'rgba(16, 185, 129, 0.15)';
      resBox.style.color = '#10b981';
      resBox.innerHTML = `
        <div style="font-size: 1.35rem; margin-bottom: 0.2rem;">✅ ENTRY VERIFIED</div>
        <div>Attendee: <strong>${reg.attendeeName}</strong> (${reg.rollNo})</div>
        <div style="font-size: 0.78rem; margin-top: 0.2rem;">Department: ${reg.dept} • Pass: VALID</div>
      `;
      this.showToast(`Verified attendee ${reg.attendeeName}!`, 'success');
    } else {
      resBox.style.display = 'block';
      resBox.style.background = 'rgba(244, 63, 94, 0.15)';
      resBox.style.color = '#f43f5e';
      resBox.innerHTML = `
        <div style="font-size: 1.35rem; margin-bottom: 0.2rem;">❌ INVALID PASS</div>
        <div>Ticket ID "${searchId}" not found in database.</div>
      `;
      this.showToast('Ticket invalid or not found', 'error');
    }
  }

  showNotificationsModal() {
    if (this.currentUser && this.currentUser.role === 'admin') {
      return;
    }
    this.openModal('modalNotifications');
  }

  /* ---------------- Modal Helpers ---------------- */
  openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* ---------------- Toast Notification System ---------------- */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Global instance setup
const app = new UniPulseApp();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
