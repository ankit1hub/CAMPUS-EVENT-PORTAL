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
    this.registrations = this.loadStorage('unipulse_registrations', []);

    this.chartInstances = {};
  }

  async init() {
    this.initTheme();
    this.initTicker();
    this.updateUIForRole();

    // Attempt to sync live events from Supabase if connected
    if (typeof supabaseService !== 'undefined' && supabaseService.isConnected) {
      const liveEvents = await supabaseService.fetchEvents();
      if (liveEvents && liveEvents.length > 0) {
        this.events = liveEvents;
        this.saveStorage('unipulse_events', this.events);
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

    const tabDashboard = document.getElementById('navTabDashboard');
    const tabOrganizer = document.getElementById('navTabOrganizer');
    const hostBtn = document.getElementById('navHostEventBtn');
    const navName = document.getElementById('navUserName');
    const navRole = document.getElementById('navUserRole');
    const navAvatar = document.getElementById('navAvatar');

    const navUserPill = document.getElementById('navUserPill');
    const navAuthBtns = document.getElementById('navAuthBtns');

    if (tabDashboard) tabDashboard.style.display = isStudent ? 'inline-flex' : 'none';
    if (tabOrganizer) tabOrganizer.style.display = isAdmin ? 'inline-flex' : 'none';
    if (hostBtn) hostBtn.style.display = isAdmin ? 'inline-flex' : 'none';

    if (this.currentUser) {
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
          ? 'linear-gradient(135deg, #059669, #10b981)' 
          : 'linear-gradient(135deg, #6366f1, #ec4899)';
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
      // Guest state: Show Login/Sign-In buttons, hide user pill
      if (navUserPill) navUserPill.style.display = 'none';
      if (navAuthBtns) navAuthBtns.style.display = 'flex';
    }

    if (isStudent && this.currentView === 'organizer') {
      this.navigate('events');
    } else if (isAdmin && this.currentView === 'dashboard') {
      this.navigate('organizer');
    } else if (!this.currentUser && (this.currentView === 'organizer' || this.currentView === 'dashboard')) {
      this.navigate('events');
    }
  }

  /* ---------------- Authentication Handlers ---------------- */
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
    }
    this.openModal('modalUserDropdown');
  }

  async logout() {
    await supabaseService.signOut();
    this.currentUser = null;
    localStorage.removeItem('unipulse_user');
    this.closeModal('modalUserDropdown');
    this.updateUIForRole();
    this.navigate('events');
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

    if (viewName === 'dashboard') {
      this.renderDashboard();
    } else if (viewName === 'organizer') {
      this.renderOrganizerTable();
      setTimeout(() => this.initCharts(), 50);
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
      const isRegistered = this.registrations.some(r => r.eventId === e.id);
      const fillPercentage = Math.min(100, Math.round((e.registeredCount / e.maxCapacity) * 100));
      const seatsLeft = Math.max(0, e.maxCapacity - e.registeredCount);

      return `
        <div class="event-card">
          <div class="event-card-media">
            <img src="${e.banner}" class="event-card-img" alt="${e.title}" loading="lazy" decoding="async" width="400" height="180">
            <span class="event-card-category category-${e.category}">${e.categoryName}</span>
            <button class="event-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                    title="${isBookmarked ? 'Remove Bookmark' : 'Save Event'}" 
                    onclick="app.toggleBookmark('${e.id}', event)">
              <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
            </button>
            <span class="event-card-price">${e.priceText || (e.price === 0 ? 'Free' : '₹' + e.price)}</span>
          </div>

          <div class="event-card-body">
            <div class="event-organizer-row">
              <span class="organizer-icon">${e.organizerIcon}</span>
              <span class="organizer-name">${e.organizer}</span>
            </div>

            <h3 class="event-card-title">${e.title}</h3>

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
                <span><i class="fa-solid fa-fire" style="color: var(--accent-amber); margin-right: 4px;"></i> ${fillPercentage}% Full</span>
                <span>${seatsLeft > 0 ? `${seatsLeft} seats left` : '<strong style="color: var(--accent-rose)">SOLD OUT</strong>'}</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill ${fillPercentage > 80 ? 'warning' : ''}" style="width: ${fillPercentage}%"></div>
              </div>
            </div>

            <div class="event-card-footer">
              <button class="btn btn-secondary btn-sm" onclick="app.openEventDetails('${e.id}')">
                <i class="fa-regular fa-eye"></i> Details
              </button>
              ${isAdmin ? `
                <button class="btn btn-secondary btn-sm" style="color: var(--primary); border-color: var(--primary);" onclick="app.manageEventAsAdmin('${e.id}')">
                  <i class="fa-solid fa-sliders"></i> Manage
                </button>
              ` : isRegistered ? `
                <button class="btn btn-secondary btn-sm" style="color: var(--accent-emerald); border-color: var(--accent-emerald);" onclick="app.viewTicketForEvent('${e.id}')">
                  <i class="fa-solid fa-qrcode"></i> View Pass
                </button>
              ` : `
                <button class="btn btn-primary btn-sm" onclick="app.openRegistrationModal('${e.id}')" ${seatsLeft <= 0 ? 'disabled' : ''}>
                  <i class="fa-solid fa-ticket"></i> Register
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  manageEventAsAdmin(eventId) {
    this.navigate('organizer');
    this.showToast(`Managing event ${eventId} in Admin Studio`, 'info');
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

    const isRegistered = this.registrations.some(r => r.eventId === evt.id);

    bodyEl.innerHTML = `
      <div style="border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.25rem; max-height: 240px; background: #1e293b;">
        <img src="${evt.banner}" style="width: 100%; height: 240px; object-fit: cover;" alt="${evt.title}" loading="lazy" decoding="async">
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

    if (regBtn) {
      if (isRegistered) {
        regBtn.innerHTML = '<i class="fa-solid fa-qrcode"></i> View My E-Pass';
        regBtn.onclick = () => {
          this.closeModal('modalEventDetails');
          this.viewTicketForEvent(evt.id);
        };
      } else {
        regBtn.innerHTML = '<i class="fa-solid fa-ticket"></i> Register Now';
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

  /* ---------------- Registration Flow ---------------- */
  openRegistrationModal(eventId) {
    const evt = this.events.find(e => e.id === eventId);
    if (!evt) return;

    const existing = this.registrations.find(r => r.eventId === eventId);
    if (existing) {
      this.showToast('You are already registered for this event!', 'info');
      this.viewTicket(existing.ticketId);
      return;
    }

    const subEl = document.getElementById('regModalEventSub');
    const idIn = document.getElementById('regEventId');
    const nameIn = document.getElementById('regFullName');
    const rollIn = document.getElementById('regRollNo');
    const emailIn = document.getElementById('regEmail');
    const teamWrap = document.getElementById('teamFieldsWrap');

    if (subEl) subEl.textContent = `For: ${evt.title} (${evt.priceText || 'Free'})`;
    if (idIn) idIn.value = evt.id;
    if (nameIn) nameIn.value = this.currentUser ? this.currentUser.name : "";
    if (rollIn) rollIn.value = this.currentUser ? (this.currentUser.rollNo || "") : "";
    if (emailIn) emailIn.value = this.currentUser ? (this.currentUser.email || "") : "";

    if (teamWrap) {
      if (evt.teamType && evt.teamType.toLowerCase().includes('team')) {
        teamWrap.style.display = 'block';
      } else {
        teamWrap.style.display = 'none';
      }
    }

    this.openModal('modalRegistrationForm');
  }

  async handleRegistrationSubmit(e) {
    e.preventDefault();
    const eventId = document.getElementById('regEventId').value;
    const evt = this.events.find(ev => ev.id === eventId);
    if (!evt) return;

    const attendeeName = document.getElementById('regFullName').value.trim();
    const rollNo = document.getElementById('regRollNo').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const dept = document.getElementById('regDept').value;
    const year = document.getElementById('regYear').value;
    const teamName = document.getElementById('regTeamName') ? document.getElementById('regTeamName').value.trim() : '';

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
      isCheckedIn: false
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

    this.closeModal('modalRegistrationForm');

    this.triggerConfetti();

    this.showToast('🎉 Registration Successful! E-Pass generated.', 'success');
    this.updateRegistrationBadge();
    this.renderEvents();
    this.updateCategoryCounters();
    this.renderOrganizerTable();

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
    if (catPill) catPill.textContent = `${(evt.categoryName || 'CAMPUS PASS').toUpperCase()}`;

    this.drawQRCodeCanvas('ticketQrCanvas', `${reg.ticketId}:${reg.rollNo}`);

    this.openModal('modalTicketPass');
  }

  viewTicketForEvent(eventId) {
    const reg = this.registrations.find(r => r.eventId === eventId);
    if (reg) {
      this.viewTicket(reg.ticketId);
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
    const tCount = document.getElementById('dashTicketsCount');
    const bCount = document.getElementById('dashBookmarksCount');
    const cCount = document.getElementById('dashCertificatesCount');

    if (tCount) tCount.textContent = this.registrations.length;
    if (bCount) bCount.textContent = this.bookmarks.length;
    if (cCount) cCount.textContent = this.registrations.filter(r => r.isCheckedIn).length || 1;

    const ticketsGrid = document.getElementById('myTicketsGrid');
    const emptyTickets = document.getElementById('emptyTicketsState');

    if (this.registrations.length === 0) {
      if (ticketsGrid) ticketsGrid.innerHTML = '';
      if (emptyTickets) emptyTickets.style.display = 'block';
    } else {
      if (emptyTickets) emptyTickets.style.display = 'none';
      if (ticketsGrid) {
        ticketsGrid.innerHTML = this.registrations.map(reg => {
          const evt = this.events.find(e => e.id === reg.eventId) || {
            title: "Campus Event",
            banner: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=75",
            category: "tech",
            categoryName: "Event",
            venue: "Main Campus",
            date: "2026-10-18"
          };

          return `
            <div class="event-card">
              <div class="event-card-media" style="height: 150px;">
                <img src="${evt.banner}" class="event-card-img" alt="${evt.title}" loading="lazy" decoding="async">
                <span class="event-card-category category-${evt.category}">${evt.categoryName}</span>
                <span class="event-card-price" style="color: #fff; background: var(--primary);">
                  ${reg.ticketId}
                </span>
              </div>
              <div class="event-card-body">
                <div style="font-size: 0.72rem; color: var(--accent-emerald); font-weight: 700; margin-bottom: 0.2rem;">
                  ${reg.isCheckedIn ? '✅ ATTENDANCE LOGGED' : '🎟️ ENTRY CONFIRMED'}
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
                  ${reg.isCheckedIn ? `
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
      const isToday = (day === 2 && month === 9 && year === 2026);

      cellsHtml += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''}" onclick="app.handleCalendarDayClick('${dateString}')">
          <span class="calendar-day-num">${day}</span>
          ${dayEvents.map(ev => `
            <div class="calendar-event-pill" title="${ev.title}" onclick="event.stopPropagation(); app.openEventDetails('${ev.id}')">
              ${ev.title}
            </div>
          `).join('')}
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
  initCharts() {
    const regCanvas = document.getElementById('registrationChart');
    const deptCanvas = document.getElementById('departmentChart');

    if (!regCanvas || !deptCanvas) return;

    if (this.chartInstances.regChart) this.chartInstances.regChart.destroy();
    if (this.chartInstances.deptChart) this.chartInstances.deptChart.destroy();

    this.chartInstances.regChart = new Chart(regCanvas, {
      type: 'line',
      data: {
        labels: ['Oct 01', 'Oct 05', 'Oct 10', 'Oct 15', 'Oct 20', 'Oct 25', 'Oct 30'],
        datasets: [{
          label: 'Total Signups',
          data: [420, 890, 1450, 2100, 2890, 3240, 3450],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          tension: 0.3,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 300 },
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(148, 163, 184, 0.12)' } },
          x: { grid: { display: false } }
        }
      }
    });

    this.chartInstances.deptChart = new Chart(deptCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Computer Science', 'Info Tech', 'Electronics', 'Mech & Civil', 'Business/Design'],
        datasets: [{
          data: [45, 25, 15, 10, 5],
          backgroundColor: ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981']
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 300 },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } }
        }
      }
    });
  }

  renderOrganizerTable() {
    const tbody = document.getElementById('organizerAttendeesTableBody');
    if (!tbody) return;

    const totalEventsEl = document.getElementById('orgStatTotalEvents');
    const totalRegsEl = document.getElementById('orgStatTotalRegistrations');
    const totalCheckedEl = document.getElementById('orgStatCheckedIn');

    if (totalEventsEl) totalEventsEl.textContent = this.events.length;
    
    const countChecked = this.registrations.filter(r => r.isCheckedIn).length;
    if (totalCheckedEl) totalCheckedEl.textContent = (1240 + countChecked).toLocaleString();

    tbody.innerHTML = this.registrations.map(r => {
      const evt = this.events.find(e => e.id === r.eventId) || { title: "Campus Event" };
      return `
        <tr>
          <td><strong style="font-family: monospace;">${r.ticketId}</strong></td>
          <td><strong>${r.attendeeName}</strong><br><span style="font-size: 0.72rem; color: var(--text-muted);">${r.email}</span></td>
          <td>${r.rollNo}</td>
          <td>${evt.title}</td>
          <td>${r.dept}</td>
          <td>
            ${r.isCheckedIn 
              ? '<span style="color: var(--accent-emerald); font-weight: 700;">✅ Checked-in</span>' 
              : '<span style="color: var(--accent-amber); font-weight: 700;">⏳ Pending</span>'}
          </td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-secondary btn-sm" onclick="app.toggleCheckInStatus('${r.ticketId}')" title="Toggle Check-in">
                <i class="fa-solid fa-user-check"></i> ${r.isCheckedIn ? 'Undo' : 'Verify'}
              </button>
              <button class="btn btn-secondary btn-sm" onclick="app.viewTicket('${r.ticketId}')" title="View Pass">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
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

      this.renderOrganizerTable();
      this.showToast(`Ticket ${ticketId}: ${reg.isCheckedIn ? 'Checked-in' : 'Pending'}`, 'success');
    }
  }

  exportAttendeesCSV() {
    let csv = "TicketID,AttendeeName,RollNo,Email,Department,Year,EventName,CheckInStatus\n";
    this.registrations.forEach(r => {
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

  updateRegistrationBadge() {
    const badge = document.getElementById('myRegistrationsBadge');
    if (badge) {
      if (this.registrations.length > 0) {
        badge.textContent = this.registrations.length;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
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
