/**
 * Staff Dashboard JavaScript - Modern Edition
 * L'Auberge Boischatel - Espace Employés
 * Features: Skeleton loaders, Chart.js, debounced search, keyboard shortcuts, dark mode
 */

class StaffDashboard {
  constructor() {
    this.user = null
    this.residents = []
    this.recentLogs = []
    this.observations = []
    this.currentResident = null
    this.stats = {
      totalResidents: 0,
      activeResidents: 0,
      todayObservations: 0,
      weeklyObservations: []
    }
    this.chart = null
    this.searchTimeout = null
    this.darkMode = localStorage.getItem('darkMode') === 'true'
    this.init()
  }

  async init() {
    console.log('👔 Initializing Staff Dashboard (Modern Edition)')

    // Apply dark mode if saved
    if (this.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    }

    // Show skeleton loading
    this.renderSkeleton()

    if (!window.firebaseAppInitialized) {
      this.renderInitError(window.firebaseInitError || 'Initialisation Firebase requise pour charger le tableau de bord employé.')
      return
    }

    // Check authentication
    const isAuthenticated = await this.checkAuth()
    if (!isAuthenticated) {
      window.location.href = '/'
      return
    }

    await this.loadUserData()

    // Check if user has staff role
    if (this.user.role !== 'EMPLOYEE' && this.user.role !== 'ADMIN') {
      alert('Accès refusé: Rôle employé requis')
      window.location.href = '/'
      return
    }

    // Load data in parallel for performance
    await Promise.all([
      this.loadResidents(),
      this.loadRecentLogs()
    ])

    await this.loadTodayObservationsCount()
    await this.loadWeeklyStats()
    this.calculateStats()
    this.render()
    this.initKeyboardShortcuts()
    this.hideLoading()
  }

  // ============================================
  // SKELETON LOADER
  // ============================================
  renderSkeleton() {
    const container = document.getElementById('dashboard-content')
    if (!container) return

    container.innerHTML = `
      <div class="skeleton-container">
        <!-- Header Skeleton -->
        <div class="bg-white shadow-sm mb-6">
          <div class="max-w-7xl mx-auto px-4 py-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="space-y-2">
                <div class="skeleton skeleton-title" style="width: 250px;"></div>
                <div class="skeleton skeleton-text-sm" style="width: 180px;"></div>
              </div>
              <div class="flex gap-3">
                <div class="skeleton skeleton-button"></div>
                <div class="skeleton skeleton-button"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="max-w-7xl mx-auto px-4">
          <!-- Stats Skeleton -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${Array(4).fill('<div class="skeleton skeleton-stat"></div>').join('')}
          </div>

          <!-- Quick Actions Skeleton -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            ${Array(4).fill('<div class="skeleton" style="height: 100px; border-radius: 0.75rem;"></div>').join('')}
          </div>

          <!-- Table Skeleton -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div class="px-6 py-4 bg-gray-50 border-b">
              <div class="skeleton skeleton-title" style="width: 200px;"></div>
            </div>
            <div class="p-4 space-y-3">
              ${Array(5).fill('<div class="skeleton skeleton-row"></div>').join('')}
            </div>
          </div>

          <!-- Chart Skeleton -->
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 border-b">
              <div class="skeleton skeleton-title" style="width: 180px;"></div>
            </div>
            <div class="p-6">
              <div class="skeleton" style="height: 200px; border-radius: 0.5rem;"></div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  hideLoading() {
    const loading = document.getElementById('loading')
    if (loading) {
      loading.classList.add('hidden')
      setTimeout(() => loading.style.display = 'none', 300)
    }
  }

  async checkAuth() {
    try {
      const user = await new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          unsubscribe()
          resolve(user)
        })
      })
      return !!user
    } catch (error) {
      console.error('Auth check error:', error)
      return false
    }
  }

  async getAuthToken() {
    return await firebase.auth().currentUser.getIdToken()
  }

  async loadUserData() {
    try {
      const idToken = await this.getAuthToken()
      const response = await axios.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.user = response.data
      console.log('✅ User data loaded:', this.user.email, this.user.role)
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      throw error
    }
  }

  async loadResidents() {
    try {
      const idToken = await this.getAuthToken()
      const response = await axios.get('/api/residents', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.residents = response.data
      console.log(`✅ Loaded ${this.residents.length} residents`)
    } catch (error) {
      console.error('❌ Error loading residents:', error)
      this.residents = []
    }
  }

  async loadRecentLogs() {
    try {
      const idToken = await this.getAuthToken()
      const response = await axios.get('/api/logs?limit=10', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.recentLogs = response.data
      console.log(`✅ Loaded ${this.recentLogs.length} recent logs`)
    } catch (error) {
      console.error('❌ Error loading logs:', error)
      this.recentLogs = []
    }
  }

  async loadTodayObservationsCount() {
    try {
      const idToken = await this.getAuthToken()
      let todayCount = 0
      const today = new Date().toDateString()

      for (const resident of this.residents) {
        try {
          const response = await axios.get(`/api/residents/${resident.id}/observations`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          })

          const observations = response.data || []
          todayCount += observations.filter(obs => {
            const obsDate = new Date(obs.created_at).toDateString()
            return obsDate === today
          }).length
        } catch (err) {
          // Silently ignore errors for individual residents
        }
      }

      this.stats.todayObservations = todayCount
      console.log(`✅ Today's observations count: ${todayCount}`)
    } catch (error) {
      console.error('❌ Error loading today observations:', error)
      this.stats.todayObservations = 0
    }
  }

  async loadWeeklyStats() {
    try {
      const idToken = await this.getAuthToken()
      const weeklyData = [0, 0, 0, 0, 0, 0, 0]
      const today = new Date()

      for (const resident of this.residents) {
        try {
          const response = await axios.get(`/api/residents/${resident.id}/observations`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          })

          const observations = response.data || []
          observations.forEach(obs => {
            const obsDate = new Date(obs.created_at)
            const diffDays = Math.floor((today - obsDate) / (1000 * 60 * 60 * 24))
            if (diffDays >= 0 && diffDays < 7) {
              weeklyData[6 - diffDays]++
            }
          })
        } catch (err) {
          // Silently ignore
        }
      }

      this.stats.weeklyObservations = weeklyData
      console.log('✅ Weekly stats loaded:', weeklyData)
    } catch (error) {
      console.error('❌ Error loading weekly stats:', error)
      this.stats.weeklyObservations = [0, 0, 0, 0, 0, 0, 0]
    }
  }

  calculateStats() {
    this.stats.totalResidents = this.residents.length
    this.stats.activeResidents = this.residents.filter(r => r.active !== false).length
  }

  renderInitError(message) {
    this.hideLoading()
    const container = document.getElementById('dashboard-content')
    if (!container) return

    container.innerHTML = `
      <div class="max-w-3xl mx-auto mt-16 bg-slate-800/80 border border-red-500/40 text-red-100 rounded-2xl shadow-lg p-8 text-center fade-in">
        <div class="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 text-red-200 mx-auto mb-4">
          <i class="fas fa-triangle-exclamation text-2xl"></i>
        </div>
        <h2 class="text-xl font-semibold mb-2 text-white">Impossible de démarrer l'espace employé</h2>
        <p class="text-sm text-red-100/90">${message}</p>
        <button onclick="location.reload()" class="mt-6 btn-modern btn-primary">
          <i class="fas fa-refresh mr-2"></i>Réessayer
        </button>
      </div>
    `
  }

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Ctrl/Cmd + K = Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('searchResident')?.focus()
      }

      // N = New resident
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        this.showAddResidentModal()
      }

      // O = New observation
      if (e.key === 'o' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        this.showObservationsModal()
      }

      // D = Toggle dark mode
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        this.toggleDarkMode()
      }

      // Escape = Close modal
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[id$="Modal"]')
        modals.forEach(modal => {
          if (modal.style.display !== 'none') {
            this.closeModal(modal.id)
          }
        })
      }
    })
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode
    localStorage.setItem('darkMode', this.darkMode)

    if (this.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.body.classList.add('bg-slate-900')
      document.body.classList.remove('bg-gray-50')
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.body.classList.remove('bg-slate-900')
      document.body.classList.add('bg-gray-50')
    }

    this.showToast(this.darkMode ? 'Mode sombre activé' : 'Mode clair activé', 'info')
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  render() {
    const container = document.getElementById('dashboard-content')
    if (!container) return

    const weekDays = this.getWeekDayLabels()

    container.innerHTML = `
      <!-- Top Navigation Bar -->
      <div class="bg-[#1F1F1F] text-white py-2 px-4 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 text-sm hover:text-[#A9C7B5] transition">
          <i class="fas fa-arrow-left"></i>
          <span>Retour au site</span>
        </a>
        <div class="flex items-center gap-4">
          <span class="text-xs text-gray-400">Connecté: ${this.user.email || ''}</span>
          <button onclick="staffDashboard.toggleChatbot()"
                  class="flex items-center gap-2 px-3 py-1 bg-[#5A7D8C] hover:bg-[#4A6D7C] rounded-lg text-sm transition"
                  title="Assistant IA (Ctrl+/)">
            <i class="fas fa-robot"></i>
            <span class="hidden sm:inline">Assistant</span>
          </button>
        </div>
      </div>

      <!-- Header -->
      <div class="bg-white shadow-sm mb-6 slide-up ${this.darkMode ? 'bg-slate-800' : ''}">
        <div class="max-w-7xl mx-auto px-4 py-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-bold ${this.darkMode ? 'text-white' : 'text-gray-800'}">
                <i class="fas fa-briefcase text-[#5A7D8C] mr-2"></i>
                Espace Employé
              </h1>
              <p class="${this.darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1">
                Bonjour, ${this.user.first_name || 'Employé'}
                ${this.user.role === 'ADMIN' ? '<span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">ADMIN</span>' : ''}
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <button onclick="staffDashboard.toggleDarkMode()"
                      class="btn-modern btn-ghost" title="Mode sombre (D)">
                <i class="fas ${this.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
              </button>
              ${this.user.role === 'ADMIN' ? `
                <a href="/admin/dashboard" class="btn-modern bg-red-500 text-white hover:bg-red-600">
                  <i class="fas fa-shield-alt"></i>
                  <span class="hidden sm:inline">Admin</span>
                </a>
              ` : ''}
              <button onclick="firebase.auth().signOut().then(() => window.location.href = '/')"
                      class="btn-modern bg-gray-500 text-white hover:bg-gray-600">
                <i class="fas fa-sign-out-alt"></i>
                <span class="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Chatbot Panel (hidden by default) -->
      <div id="chatbotPanel" class="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 z-50 flex flex-col">
        <div class="bg-gradient-to-r from-[#5A7D8C] to-[#A9C7B5] text-white p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-lg"></i>
            </div>
            <div>
              <h3 class="font-bold">Assistant Auberge</h3>
              <p class="text-xs opacity-80">Prêt à vous aider</p>
            </div>
          </div>
          <button onclick="staffDashboard.toggleChatbot()" class="hover:bg-white/20 p-2 rounded-lg transition">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          <div class="flex gap-3">
            <div class="w-8 h-8 bg-[#5A7D8C] rounded-full flex items-center justify-center flex-shrink-0">
              <i class="fas fa-robot text-white text-xs"></i>
            </div>
            <div class="bg-white rounded-lg p-3 shadow-sm max-w-[80%]">
              <p class="text-sm text-gray-700">Bonjour ! Je suis l'assistant de l'Auberge Boischatel. Je peux vous aider à :</p>
              <ul class="text-sm text-gray-600 mt-2 space-y-1">
                <li>• <strong>Créer une observation</strong> - Ex: "Ajoute une observation pour Jean Tremblay"</li>
                <li>• <strong>Créer une tâche</strong> - Ex: "Créer une tâche d'hygiène pour chambre 101"</li>
                <li>• <strong>Voir les résidents</strong> - Ex: "Liste des résidents"</li>
                <li>• <strong>Signaler un incident</strong> - Ex: "Signaler une chute pour Marie"</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-white">
          <form onsubmit="staffDashboard.sendChatMessage(event)" class="flex gap-2">
            <input type="text" id="chatInput" placeholder="Écrivez votre demande..."
                   class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent text-sm">
            <button type="submit" class="px-4 py-2 bg-[#5A7D8C] text-white rounded-lg hover:bg-[#4A6D7C] transition">
              <i class="fas fa-paper-plane"></i>
            </button>
          </form>
          <p class="text-xs text-gray-400 mt-2 text-center">Appuyez sur Entrée pour envoyer</p>
        </div>
      </div>

      <!-- Chatbot overlay -->
      <div id="chatbotOverlay" onclick="staffDashboard.toggleChatbot()"
           class="fixed inset-0 bg-black/30 z-40 hidden"></div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4">

        <!-- Stats Cards with Animation -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
          <div class="stat-card stat-card-theme">
            <div class="flex items-center">
              <div class="bg-[#A9C7B5]/20 rounded-xl p-4 mr-4">
                <i class="fas fa-users text-[#5A7D8C] text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm font-medium">Résidents Actifs</p>
                <p class="text-3xl font-bold text-gray-800 counter-animate">${this.stats.activeResidents}</p>
              </div>
            </div>
          </div>

          <div class="stat-card stat-card-blue">
            <div class="flex items-center">
              <div class="bg-blue-100 rounded-xl p-4 mr-4">
                <i class="fas fa-clipboard-list text-blue-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm font-medium">Observations Aujourd'hui</p>
                <p class="text-3xl font-bold text-gray-800 counter-animate">${this.stats.todayObservations}</p>
              </div>
            </div>
          </div>

          <div class="stat-card stat-card-green">
            <div class="flex items-center">
              <div class="bg-green-100 rounded-xl p-4 mr-4">
                <i class="fas fa-heartbeat text-green-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm font-medium">Total Résidents</p>
                <p class="text-3xl font-bold text-gray-800 counter-animate">${this.stats.totalResidents}</p>
              </div>
            </div>
          </div>

          <div class="stat-card stat-card-orange">
            <div class="flex items-center">
              <div class="bg-orange-100 rounded-xl p-4 mr-4">
                <i class="fas fa-chart-line text-orange-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-500 text-sm font-medium">Cette Semaine</p>
                <p class="text-3xl font-bold text-gray-800 counter-animate">${this.stats.weeklyObservations.reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-action-grid mb-8 slide-up" style="animation-delay: 100ms;">
          <button onclick="staffDashboard.showAddResidentModal()" class="quick-action-btn">
            <i class="fas fa-user-plus text-blue-500"></i>
            <span>Nouveau Résident</span>
            <kbd class="kbd">N</kbd>
          </button>
          <button onclick="staffDashboard.showObservationsModal()" class="quick-action-btn">
            <i class="fas fa-file-medical text-green-500"></i>
            <span>Observation</span>
            <kbd class="kbd">O</kbd>
          </button>
          <button onclick="staffDashboard.showUploadDocumentModal()" class="quick-action-btn">
            <i class="fas fa-file-upload text-[#5A7D8C]"></i>
            <span>Document</span>
          </button>
          <button onclick="staffDashboard.showImportModal()" class="quick-action-btn">
            <i class="fas fa-file-csv text-[#C9A472]"></i>
            <span>Import CSV</span>
            <kbd class="kbd">I</kbd>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Residents Table (2/3 width) -->
          <div class="lg:col-span-2 card-modern slide-up" style="animation-delay: 150ms;">
            <div class="card-modern-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 class="text-xl font-bold text-gray-800">
                <i class="fas fa-users text-[#5A7D8C] mr-2"></i>
                Liste des Résidents
              </h2>
              <div class="search-modern" style="max-width: 250px;">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="searchResident" placeholder="Rechercher... (Ctrl+K)"
                       oninput="staffDashboard.debouncedSearch()">
                <button class="search-clear" onclick="staffDashboard.clearSearch()">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            ${this.residents.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">
                  <i class="fas fa-inbox"></i>
                </div>
                <h3 class="empty-state-title">Aucun résident</h3>
                <p class="empty-state-description">Commencez par ajouter votre premier résident</p>
                <button onclick="staffDashboard.showAddResidentModal()" class="btn-modern btn-primary">
                  <i class="fas fa-plus mr-2"></i>Ajouter un résident
                </button>
              </div>
            ` : `
              <div class="overflow-x-auto">
                <table class="table-modern">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Chambre</th>
                      <th class="hidden md:table-cell">Admission</th>
                      <th class="hidden lg:table-cell">Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="residentsTableBody">
                    ${this.residents.map(resident => this.renderResidentRow(resident)).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- Chart (1/3 width) -->
          <div class="card-modern slide-up" style="animation-delay: 200ms;">
            <div class="card-modern-header">
              <h2 class="text-lg font-bold text-gray-800">
                <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                Observations (7 jours)
              </h2>
            </div>
            <div class="chart-container">
              <canvas id="observationsChart"></canvas>
            </div>
            <div class="chart-legend px-4 pb-4">
              <div class="chart-legend-item">
                <div class="chart-legend-color" style="background: #5A7D8C;"></div>
                <span>Observations</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card-modern slide-up" style="animation-delay: 250ms;">
          <div class="card-modern-header">
            <h2 class="text-xl font-bold text-gray-800">
              <i class="fas fa-history text-blue-600 mr-2"></i>
              Activité Récente
            </h2>
          </div>

          ${this.recentLogs.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i class="fas fa-clock"></i>
              </div>
              <h3 class="empty-state-title">Aucune activité récente</h3>
              <p class="empty-state-description">Les actions apparaîtront ici</p>
            </div>
          ` : `
            <div class="divide-y divide-gray-100">
              ${this.recentLogs.map(log => this.renderLogItem(log)).join('')}
            </div>
          `}
        </div>

        <!-- Keyboard shortcuts hint -->
        <div class="mt-6 text-center text-sm text-gray-400 slide-up" style="animation-delay: 300ms;">
          <span class="hidden md:inline">
            Raccourcis:
            <kbd class="kbd">N</kbd> Nouveau résident
            <kbd class="kbd">O</kbd> Observation
            <kbd class="kbd">D</kbd> Mode sombre
            <kbd class="kbd">Ctrl</kbd>+<kbd class="kbd">K</kbd> Recherche
          </span>
        </div>
      </div>

      <!-- Modal Container -->
      <div id="modalContainer"></div>

      <!-- Toast Container -->
      <div id="toastContainer" class="toast-container"></div>
    `

    // Initialize Chart.js
    this.initChart()
  }

  getWeekDayLabels() {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    const today = new Date().getDay()
    const labels = []
    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7
      labels.push(days[dayIndex])
    }
    return labels
  }

  initChart() {
    const ctx = document.getElementById('observationsChart')
    if (!ctx) return

    // Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy()
    }

    const labels = this.getWeekDayLabels()

    // Theme colors matching Auberge Boischatel website
    const themeColors = {
      blueGrey: '#5A7D8C',
      sageGreen: '#A9C7B5',
      copper: '#C9A472',
      anthracite: '#1F1F1F',
      cream: '#F5F4F2'
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Observations',
          data: this.stats.weeklyObservations,
          backgroundColor: 'rgba(90, 125, 140, 0.85)', // blueGrey
          borderColor: themeColors.blueGrey,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: themeColors.anthracite,
            titleColor: themeColors.cream,
            bodyColor: themeColors.cream,
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            borderColor: 'rgba(169, 199, 181, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: '#6B7280'
            },
            grid: {
              color: 'rgba(169, 199, 181, 0.15)'
            }
          },
          x: {
            ticks: {
              color: '#6B7280'
            },
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  // ============================================
  // DEBOUNCED SEARCH
  // ============================================
  debouncedSearch() {
    clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => {
      this.filterResidents()
    }, 300)
  }

  filterResidents() {
    const searchInput = document.getElementById('searchResident')
    const search = (searchInput?.value || '').toLowerCase()

    const filtered = this.residents.filter(r =>
      r.full_name.toLowerCase().includes(search) ||
      (r.room_number && r.room_number.toLowerCase().includes(search)) ||
      (r.emergency_contact_name && r.emergency_contact_name.toLowerCase().includes(search))
    )

    const tbody = document.getElementById('residentsTableBody')
    if (tbody) {
      tbody.innerHTML = filtered.length > 0
        ? filtered.map(resident => this.renderResidentRow(resident)).join('')
        : `<tr><td colspan="5" class="text-center py-8 text-gray-500">
            <i class="fas fa-search text-gray-300 text-2xl mb-2"></i>
            <p>Aucun résultat pour "${search}"</p>
           </td></tr>`
    }
  }

  clearSearch() {
    const searchInput = document.getElementById('searchResident')
    if (searchInput) {
      searchInput.value = ''
      this.filterResidents()
    }
  }

  renderResidentRow(resident) {
    const admissionDate = resident.admission_date ?
      new Date(resident.admission_date).toLocaleDateString('fr-CA') :
      'N/A'

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td>
          <div class="flex items-center">
            <div class="bg-gradient-to-br from-[#5A7D8C] to-[#A9C7B5] text-white rounded-xl w-10 h-10 flex items-center justify-center mr-3 font-semibold">
              ${resident.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span class="text-sm font-medium text-gray-900">${resident.full_name}</span>
              ${resident.active === false ? '<span class="badge badge-yellow ml-2">Inactif</span>' : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-blue">${resident.room_number || 'N/A'}</span>
        </td>
        <td class="hidden md:table-cell text-sm text-gray-600">
          ${admissionDate}
        </td>
        <td class="hidden lg:table-cell text-sm text-gray-600">
          ${resident.emergency_contact_name || 'N/A'}
          ${resident.emergency_contact_phone ? `<br><span class="text-xs text-gray-400">${resident.emergency_contact_phone}</span>` : ''}
        </td>
        <td>
          <div class="flex items-center gap-1">
            <button onclick="staffDashboard.viewResident('${resident.id}')"
                    class="btn-icon btn-ghost text-blue-600" title="Voir détails">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="staffDashboard.editResident('${resident.id}')"
                    class="btn-icon btn-ghost text-[#5A7D8C]" title="Modifier">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="staffDashboard.addObservation('${resident.id}')"
                    class="btn-icon btn-ghost text-green-600" title="Ajouter observation">
              <i class="fas fa-plus-circle"></i>
            </button>
            <button onclick="staffDashboard.viewResidentObservations('${resident.id}')"
                    class="btn-icon btn-ghost text-teal-600" title="Voir observations">
              <i class="fas fa-clipboard-list"></i>
            </button>
          </div>
        </td>
      </tr>
    `
  }

  renderLogItem(log) {
    const time = new Date(log.created_at).toLocaleString('fr-CA')
    const actionConfig = {
      'created_resident': { icon: 'fa-user-plus', color: 'text-green-600', bg: 'bg-green-100' },
      'updated_resident': { icon: 'fa-edit', color: 'text-blue-600', bg: 'bg-blue-100' },
      'uploaded_document': { icon: 'fa-file-upload', color: 'text-[#5A7D8C]', bg: 'bg-[#A9C7B5]/20' },
      'created_observation': { icon: 'fa-clipboard-list', color: 'text-teal-600', bg: 'bg-teal-100' },
      'observation': { icon: 'fa-clipboard-list', color: 'text-teal-600', bg: 'bg-teal-100' },
      'login': { icon: 'fa-sign-in-alt', color: 'text-gray-600', bg: 'bg-gray-100' },
      'default': { icon: 'fa-circle', color: 'text-gray-400', bg: 'bg-gray-100' }
    }
    const config = actionConfig[log.action] || actionConfig['default']

    return `
      <div class="px-6 py-4 flex items-start hover:bg-gray-50 transition-colors">
        <div class="mr-4 mt-1 ${config.bg} rounded-lg p-2">
          <i class="fas ${config.icon} ${config.color}"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">${log.details || log.action}</p>
          <p class="text-xs text-gray-500 mt-1">
            ${log.user_name || 'Système'} • ${time}
          </p>
        </div>
      </div>
    `
  }

  // ============================================
  // MODAL: Ajouter un résident
  // ============================================
  showAddResidentModal() {
    this.showResidentForm(null)
  }

  editResident(residentId) {
    const resident = this.residents.find(r => r.id === residentId)
    if (resident) {
      this.showResidentForm(resident)
    }
  }

  showResidentForm(resident) {
    const isEdit = !!resident
    const title = isEdit ? 'Modifier le résident' : 'Nouveau résident'

    const modal = `
      <div id="residentModal" class="modal-backdrop" onclick="if(event.target === this) staffDashboard.closeModal('residentModal')">
        <div class="modal-content scale-in">
          <div class="modal-header">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas ${isEdit ? 'fa-edit' : 'fa-user-plus'} text-[#5A7D8C] mr-2"></i>
              ${title}
            </h3>
            <button onclick="staffDashboard.closeModal('residentModal')" class="btn-icon btn-ghost">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="residentForm" onsubmit="staffDashboard.saveResident(event)" class="modal-body space-y-6">
            <input type="hidden" name="id" value="${resident?.id || ''}">

            <!-- Informations personnelles -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input type="text" name="first_name" value="${resident?.first_name || ''}" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" name="last_name" value="${resident?.last_name || ''}" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                <input type="date" name="date_of_birth" value="${resident?.date_of_birth || ''}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Numéro de chambre</label>
                <input type="text" name="room_number" value="${resident?.room_number || ''}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date d'admission</label>
              <input type="date" name="admission_date" value="${resident?.admission_date?.split('T')[0] || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
            </div>

            <!-- Contact d'urgence -->
            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-800 mb-3"><i class="fas fa-phone-alt mr-2 text-red-500"></i>Contact d'urgence</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nom du contact</label>
                  <input type="text" name="emergency_contact_name" value="${resident?.emergency_contact_name || ''}"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" name="emergency_contact_phone" value="${resident?.emergency_contact_phone || ''}"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
                </div>
              </div>
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                <input type="text" name="emergency_contact_relation" value="${resident?.emergency_contact_relation || ''}"
                       placeholder="Ex: Fils, Fille, Conjoint..."
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
              </div>
            </div>

            <!-- Notes médicales -->
            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-800 mb-3"><i class="fas fa-notes-medical mr-2 text-blue-500"></i>Notes médicales</h4>
              <textarea name="medical_notes" rows="3" placeholder="Allergies, conditions médicales, médicaments..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">${resident?.medical_notes || ''}</textarea>
            </div>

            <!-- Statut -->
            <div class="flex items-center">
              <input type="checkbox" name="active" id="activeCheckbox" ${resident?.active !== false ? 'checked' : ''}
                     class="w-4 h-4 text-[#5A7D8C] border-gray-300 rounded focus:ring-[#5A7D8C]">
              <label for="activeCheckbox" class="ml-2 text-sm text-gray-700">Résident actif</label>
            </div>
          </form>

          <div class="modal-footer">
            <button type="button" onclick="staffDashboard.closeModal('residentModal')"
                    class="btn-modern btn-ghost">
              Annuler
            </button>
            <button type="submit" form="residentForm" class="btn-modern btn-theme">
              <i class="fas fa-save mr-2"></i>
              ${isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    `

    document.getElementById('modalContainer').innerHTML = modal
  }

  async saveResident(event) {
    event.preventDefault()
    const form = event.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    // Convert checkbox
    data.active = form.querySelector('[name="active"]').checked

    const isEdit = !!data.id

    // Show loading state
    const submitBtn = form.closest('.modal-content').querySelector('button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement...'
    submitBtn.disabled = true

    try {
      const idToken = await this.getAuthToken()
      const url = isEdit ? `/api/residents/${data.id}` : '/api/residents'
      const method = isEdit ? 'PUT' : 'POST'

      // Build full_name
      data.full_name = `${data.first_name} ${data.last_name}`.trim()

      await axios({
        method,
        url,
        data,
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.closeModal('residentModal')
      this.showToast(isEdit ? 'Résident mis à jour' : 'Résident créé', 'success')

      // Reload data
      await this.loadResidents()
      await this.loadRecentLogs()
      this.calculateStats()
      this.render()
      this.hideLoading()

    } catch (error) {
      console.error('Error saving resident:', error)
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'enregistrement'
      this.showToast(errorMessage, 'error')
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  }

  // ============================================
  // MODAL: Voir détails résident
  // ============================================
  async viewResident(residentId) {
    const resident = this.residents.find(r => r.id === residentId)
    if (!resident) return

    const admissionDate = resident.admission_date ?
      new Date(resident.admission_date).toLocaleDateString('fr-CA') : 'N/A'
    const birthDate = resident.date_of_birth ?
      new Date(resident.date_of_birth).toLocaleDateString('fr-CA') : 'N/A'

    const modal = `
      <div id="viewResidentModal" class="modal-backdrop" onclick="if(event.target === this) staffDashboard.closeModal('viewResidentModal')">
        <div class="modal-content scale-in">
          <div class="modal-header bg-gradient-to-r from-[#5A7D8C] to-[#A9C7B5] text-white">
            <h3 class="text-xl font-bold">
              <i class="fas fa-user mr-2"></i>
              ${resident.full_name}
            </h3>
            <button onclick="staffDashboard.closeModal('viewResidentModal')" class="btn-icon text-white/80 hover:text-white">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body space-y-6">
            <!-- Info Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-[#A9C7B5]/10 rounded-xl p-4 text-center">
                <i class="fas fa-door-open text-[#5A7D8C] text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Chambre</p>
                <p class="font-bold text-gray-800">${resident.room_number || 'N/A'}</p>
              </div>
              <div class="bg-blue-50 rounded-xl p-4 text-center">
                <i class="fas fa-calendar-alt text-blue-600 text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Admission</p>
                <p class="font-bold text-gray-800">${admissionDate}</p>
              </div>
              <div class="bg-green-50 rounded-xl p-4 text-center">
                <i class="fas fa-birthday-cake text-green-600 text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Naissance</p>
                <p class="font-bold text-gray-800">${birthDate}</p>
              </div>
              <div class="bg-${resident.active !== false ? 'teal' : 'gray'}-50 rounded-xl p-4 text-center">
                <i class="fas fa-${resident.active !== false ? 'check-circle' : 'pause-circle'} text-${resident.active !== false ? 'teal' : 'gray'}-600 text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Statut</p>
                <p class="font-bold text-gray-800">${resident.active !== false ? 'Actif' : 'Inactif'}</p>
              </div>
            </div>

            <!-- Contact d'urgence -->
            ${resident.emergency_contact_name ? `
              <div class="bg-red-50 rounded-xl p-4">
                <h4 class="font-medium text-red-800 mb-2"><i class="fas fa-phone-alt mr-2"></i>Contact d'urgence</h4>
                <p class="text-gray-800 font-medium">${resident.emergency_contact_name}</p>
                ${resident.emergency_contact_phone ? `<p class="text-gray-600">${resident.emergency_contact_phone}</p>` : ''}
                ${resident.emergency_contact_relation ? `<p class="text-sm text-gray-500">${resident.emergency_contact_relation}</p>` : ''}
              </div>
            ` : ''}

            <!-- Notes médicales -->
            ${resident.medical_notes ? `
              <div class="bg-yellow-50 rounded-xl p-4">
                <h4 class="font-medium text-yellow-800 mb-2"><i class="fas fa-notes-medical mr-2"></i>Notes médicales</h4>
                <p class="text-gray-700 whitespace-pre-wrap">${resident.medical_notes}</p>
              </div>
            ` : ''}
          </div>

          <div class="modal-footer">
            <button onclick="staffDashboard.closeModal('viewResidentModal'); staffDashboard.editResident('${resident.id}')"
                    class="btn-modern btn-theme">
              <i class="fas fa-edit mr-2"></i>Modifier
            </button>
            <button onclick="staffDashboard.closeModal('viewResidentModal'); staffDashboard.addObservation('${resident.id}')"
                    class="btn-modern bg-green-600 text-white hover:bg-green-700">
              <i class="fas fa-plus-circle mr-2"></i>Observation
            </button>
          </div>
        </div>
      </div>
    `

    document.getElementById('modalContainer').innerHTML = modal
  }

  // ============================================
  // MODAL: Nouvelle Observation
  // ============================================
  showObservationsModal(preselectedResidentId = '') {
    const modal = `
      <div id="observationsModal" class="modal-backdrop" onclick="if(event.target === this) staffDashboard.closeModal('observationsModal')">
        <div class="modal-content scale-in">
          <div class="modal-header">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-clipboard-list text-green-600 mr-2"></i>
              Nouvelle Observation
            </h3>
            <button onclick="staffDashboard.closeModal('observationsModal')" class="btn-icon btn-ghost">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="observationForm" onsubmit="staffDashboard.saveObservation(event)" class="modal-body space-y-6">
            <!-- Résident -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Résident *</label>
              <select name="resident_id" id="observationResidentId" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                <option value="">Sélectionner un résident...</option>
                ${this.residents.map(r => `<option value="${r.id}" ${r.id === preselectedResidentId ? 'selected' : ''}>${r.full_name} - Chambre ${r.room_number || 'N/A'}</option>`).join('')}
              </select>
            </div>

            <!-- Type d'observation -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type d'observation *</label>
              <select name="observation_type" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
                <option value="general">Général</option>
                <option value="medical">Médical</option>
                <option value="behavior">Comportement</option>
                <option value="nutrition">Alimentation</option>
                <option value="mobility">Mobilité</option>
                <option value="social">Social</option>
                <option value="incident">Incident</option>
              </select>
            </div>

            <!-- Titre -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
              <input type="text" name="title" required placeholder="Ex: Visite médicale, Changement d'humeur..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition">
            </div>

            <!-- Contenu -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description détaillée *</label>
              <textarea name="content" rows="4" required
                        placeholder="Décrivez votre observation en détail..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"></textarea>
            </div>

            <!-- Sévérité -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sévérité</label>
              <div class="flex gap-3">
                <label class="flex-1 cursor-pointer">
                  <input type="radio" name="severity" value="INFO" checked class="sr-only peer">
                  <div class="text-center py-2 px-3 rounded-lg border-2 border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition">
                    <i class="fas fa-info-circle text-blue-500 mb-1"></i>
                    <p class="text-sm font-medium">Info</p>
                  </div>
                </label>
                <label class="flex-1 cursor-pointer">
                  <input type="radio" name="severity" value="WARNING" class="sr-only peer">
                  <div class="text-center py-2 px-3 rounded-lg border-2 border-gray-200 peer-checked:border-yellow-500 peer-checked:bg-yellow-50 transition">
                    <i class="fas fa-exclamation-triangle text-yellow-500 mb-1"></i>
                    <p class="text-sm font-medium">Attention</p>
                  </div>
                </label>
                <label class="flex-1 cursor-pointer">
                  <input type="radio" name="severity" value="URGENT" class="sr-only peer">
                  <div class="text-center py-2 px-3 rounded-lg border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 transition">
                    <i class="fas fa-exclamation-circle text-red-500 mb-1"></i>
                    <p class="text-sm font-medium">Urgent</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Visible à la famille -->
            <div class="flex items-center p-3 bg-blue-50 rounded-lg">
              <input type="checkbox" name="visible_to_family" id="visibleToFamilyCheckbox"
                     class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
              <label for="visibleToFamilyCheckbox" class="ml-3 text-sm text-gray-700">
                <i class="fas fa-users text-blue-500 mr-1"></i>
                Partager avec la famille
              </label>
            </div>
          </form>

          <div class="modal-footer">
            <button type="button" onclick="staffDashboard.closeModal('observationsModal')"
                    class="btn-modern btn-ghost">
              Annuler
            </button>
            <button type="submit" form="observationForm" class="btn-modern bg-green-600 text-white hover:bg-green-700">
              <i class="fas fa-save mr-2"></i>
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    `

    document.getElementById('modalContainer').innerHTML = modal
  }

  addObservation(residentId) {
    this.showObservationsModal(residentId)
  }

  async saveObservation(event) {
    event.preventDefault()
    const form = event.target
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())

    // Convertir la checkbox en booléen
    data.visible_to_family = form.querySelector('[name="visible_to_family"]').checked

    // Validation
    if (!data.resident_id) {
      this.showToast('Veuillez sélectionner un résident', 'error')
      return
    }

    if (!data.title || !data.content) {
      this.showToast('Veuillez remplir le titre et la description', 'error')
      return
    }

    // Show loading state
    const submitBtn = form.closest('.modal-content').querySelector('button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement...'
    submitBtn.disabled = true

    try {
      const idToken = await this.getAuthToken()
      const residentId = data.resident_id

      const response = await axios.post(`/api/residents/${residentId}/observations`, {
        observation_type: data.observation_type,
        title: data.title,
        content: data.content,
        severity: data.severity || 'INFO',
        visible_to_family: data.visible_to_family
      }, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      console.log('✅ Observation saved:', response.data)

      this.closeModal('observationsModal')
      this.showToast('Observation enregistrée avec succès', 'success')

      // Recharger les données
      await this.loadRecentLogs()
      await this.loadTodayObservationsCount()
      await this.loadWeeklyStats()
      this.calculateStats()
      this.render()
      this.hideLoading()

    } catch (error) {
      console.error('❌ Error saving observation:', error)
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'enregistrement de l\'observation'
      this.showToast(errorMessage, 'error')
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  }

  // ============================================
  // MODAL: Voir les observations d'un résident
  // ============================================
  async viewResidentObservations(residentId) {
    const resident = this.residents.find(r => r.id === residentId)
    if (!resident) return

    // Show loading modal
    document.getElementById('modalContainer').innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content scale-in p-8 text-center">
          <div class="loading-dots mx-auto mb-4">
            <span></span><span></span><span></span>
          </div>
          <p class="text-gray-600">Chargement des observations...</p>
        </div>
      </div>
    `

    try {
      const idToken = await this.getAuthToken()
      const response = await axios.get(`/api/residents/${residentId}/observations`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      const observations = response.data || []

      const severityColors = {
        'INFO': 'badge-blue',
        'WARNING': 'badge-yellow',
        'URGENT': 'badge-red'
      }

      const typeLabels = {
        'general': 'Général',
        'medical': 'Médical',
        'behavior': 'Comportement',
        'nutrition': 'Alimentation',
        'mobility': 'Mobilité',
        'social': 'Social',
        'incident': 'Incident'
      }

      const modal = `
        <div id="viewObservationsModal" class="modal-backdrop" onclick="if(event.target === this) staffDashboard.closeModal('viewObservationsModal')">
          <div class="modal-content scale-in" style="max-width: 700px;">
            <div class="modal-header bg-gradient-to-r from-teal-500 to-teal-600 text-white">
              <h3 class="text-xl font-bold">
                <i class="fas fa-clipboard-list mr-2"></i>
                Observations - ${resident.full_name}
              </h3>
              <div class="flex gap-2">
                <button onclick="staffDashboard.closeModal('viewObservationsModal'); staffDashboard.addObservation('${residentId}')"
                        class="btn-modern bg-white/20 text-white hover:bg-white/30 text-sm">
                  <i class="fas fa-plus mr-1"></i>Ajouter
                </button>
                <button onclick="staffDashboard.closeModal('viewObservationsModal')" class="btn-icon text-white/80 hover:text-white">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
              ${observations.length === 0 ? `
                <div class="empty-state">
                  <div class="empty-state-icon">
                    <i class="fas fa-clipboard"></i>
                  </div>
                  <h3 class="empty-state-title">Aucune observation</h3>
                  <p class="empty-state-description">Ajoutez la première observation pour ce résident</p>
                  <button onclick="staffDashboard.closeModal('viewObservationsModal'); staffDashboard.addObservation('${residentId}')"
                          class="btn-modern bg-green-600 text-white hover:bg-green-700">
                    <i class="fas fa-plus mr-2"></i>Ajouter une observation
                  </button>
                </div>
              ` : `
                <div class="space-y-4">
                  ${observations.map(obs => `
                    <div class="border rounded-xl p-4 ${obs.severity === 'URGENT' ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'} transition">
                      <div class="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="badge ${severityColors[obs.severity] || severityColors['INFO']}">
                            ${obs.severity}
                          </span>
                          <span class="badge bg-gray-100 text-gray-700">
                            ${typeLabels[obs.observation_type] || obs.observation_type}
                          </span>
                          ${obs.visible_to_family ? `
                            <span class="badge badge-blue">
                              <i class="fas fa-users mr-1"></i>Famille
                            </span>
                          ` : ''}
                        </div>
                        <span class="text-xs text-gray-500">
                          ${new Date(obs.created_at).toLocaleString('fr-CA')}
                        </span>
                      </div>
                      <h4 class="font-semibold text-gray-800 mb-2">${obs.title}</h4>
                      <p class="text-gray-600 text-sm whitespace-pre-wrap">${obs.content}</p>
                      <p class="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                        <i class="fas fa-user mr-1"></i>${obs.author_name || 'Inconnu'}
                      </p>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
      `

      document.getElementById('modalContainer').innerHTML = modal

    } catch (error) {
      console.error('Error loading observations:', error)
      this.showToast('Erreur lors du chargement des observations', 'error')
      document.getElementById('modalContainer').innerHTML = ''
    }
  }

  // ============================================
  // MODAL: Upload Document
  // ============================================
  showUploadDocumentModal(residentId = '') {
    const modal = `
      <div id="uploadModal" class="modal-backdrop" onclick="if(event.target === this) staffDashboard.closeModal('uploadModal')">
        <div class="modal-content scale-in">
          <div class="modal-header">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-file-upload text-[#5A7D8C] mr-2"></i>
              Téléverser un document
            </h3>
            <button onclick="staffDashboard.closeModal('uploadModal')" class="btn-icon btn-ghost">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="uploadForm" onsubmit="staffDashboard.uploadDocument(event)" class="modal-body space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Résident *</label>
              <select name="resident_id" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
                <option value="">Sélectionner un résident...</option>
                ${this.residents.map(r => `<option value="${r.id}" ${r.id === residentId ? 'selected' : ''}>${r.full_name}</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Titre du document *</label>
              <input type="text" name="title" required
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
              <select name="document_type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A7D8C] focus:border-transparent transition">
                <option value="medical">Médical</option>
                <option value="administrative">Administratif</option>
                <option value="financial">Financier</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fichier *</label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-[#5A7D8C] transition cursor-pointer"
                   onclick="document.getElementById('file-upload').click()">
                <div class="space-y-2 text-center">
                  <div class="w-12 h-12 mx-auto bg-[#A9C7B5]/20 rounded-full flex items-center justify-center">
                    <i class="fas fa-cloud-upload-alt text-[#5A7D8C] text-xl"></i>
                  </div>
                  <div class="text-sm text-gray-600">
                    <label for="file-upload" class="cursor-pointer text-[#5A7D8C] hover:text-[#5A7D8C] font-medium">
                      Choisir un fichier
                    </label>
                    <input id="file-upload" name="file" type="file" class="sr-only" required
                           accept=".pdf,.doc,.docx,.jpg,.jpeg,.png">
                  </div>
                  <p class="text-xs text-gray-500">PDF, DOC, JPG jusqu'à 10MB</p>
                  <p id="fileName" class="text-sm text-[#5A7D8C] font-medium"></p>
                </div>
              </div>
            </div>

            <div class="flex items-center p-3 bg-blue-50 rounded-lg">
              <input type="checkbox" name="share_with_family" id="shareCheckbox"
                     class="w-4 h-4 text-[#5A7D8C] border-gray-300 rounded focus:ring-[#5A7D8C]">
              <label for="shareCheckbox" class="ml-3 text-sm text-gray-700">
                <i class="fas fa-share-alt text-blue-500 mr-1"></i>
                Partager avec la famille
              </label>
            </div>
          </form>

          <div class="modal-footer">
            <button type="button" onclick="staffDashboard.closeModal('uploadModal')"
                    class="btn-modern btn-ghost">
              Annuler
            </button>
            <button type="submit" form="uploadForm" class="btn-modern btn-theme">
              <i class="fas fa-upload mr-2"></i>
              Téléverser
            </button>
          </div>
        </div>
      </div>
    `

    document.getElementById('modalContainer').innerHTML = modal

    // File name display
    document.getElementById('file-upload').addEventListener('change', (e) => {
      const fileName = e.target.files[0]?.name || ''
      document.getElementById('fileName').textContent = fileName
    })
  }

  async uploadDocument(event) {
    event.preventDefault()
    const form = event.target
    const formData = new FormData(form)

    // Show loading state
    const submitBtn = form.closest('.modal-content').querySelector('button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Téléversement...'
    submitBtn.disabled = true

    try {
      const idToken = await this.getAuthToken()

      await axios.post('/api/documents', formData, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      this.closeModal('uploadModal')
      this.showToast('Document téléversé avec succès', 'success')

      // Reload logs
      await this.loadRecentLogs()
      this.render()
      this.hideLoading()

    } catch (error) {
      console.error('Error uploading document:', error)
      const errorMessage = error.response?.data?.error || 'Erreur lors du téléversement'
      this.showToast(errorMessage, 'error')
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  }

  // ============================================
  // Utilitaires
  // ============================================
  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add('fade-out')
      setTimeout(() => modal.remove(), 200)
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || this.createToastContainer()

    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    }

    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.innerHTML = `
      <i class="fas ${icons[type]} text-lg"></i>
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
        <i class="fas fa-times"></i>
      </button>
    `

    container.appendChild(toast)

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('toast-exit')
      setTimeout(() => toast.remove(), 300)
    }, 4000)
  }

  createToastContainer() {
    const container = document.createElement('div')
    container.id = 'toastContainer'
    container.className = 'toast-container'
    document.body.appendChild(container)
    return container
  }

  // ============================================
  // CHATBOT FUNCTIONALITY
  // ============================================
  chatbotOpen = false

  toggleChatbot() {
    this.chatbotOpen = !this.chatbotOpen
    const panel = document.getElementById('chatbotPanel')
    const overlay = document.getElementById('chatbotOverlay')

    if (this.chatbotOpen) {
      panel.classList.remove('translate-x-full')
      overlay.classList.remove('hidden')
      document.getElementById('chatInput')?.focus()
    } else {
      panel.classList.add('translate-x-full')
      overlay.classList.add('hidden')
    }
  }

  async sendChatMessage(event) {
    event.preventDefault()
    const input = document.getElementById('chatInput')
    const message = input.value.trim()
    if (!message) return

    input.value = ''

    // Add user message to chat
    this.addChatMessage(message, 'user')

    // Show typing indicator
    this.addTypingIndicator()

    try {
      // Process the message locally (simple NLP)
      const response = await this.processChatCommand(message)
      this.removeTypingIndicator()
      this.addChatMessage(response.text, 'bot', response.action)
    } catch (error) {
      console.error('Chatbot error:', error)
      this.removeTypingIndicator()
      this.addChatMessage("Désolé, une erreur s'est produite. Veuillez réessayer.", 'bot')
    }
  }

  addChatMessage(text, sender, action = null) {
    const container = document.getElementById('chatMessages')
    const isBot = sender === 'bot'

    const messageHtml = `
      <div class="flex gap-3 ${isBot ? '' : 'flex-row-reverse'}">
        <div class="w-8 h-8 ${isBot ? 'bg-[#5A7D8C]' : 'bg-[#C9A472]'} rounded-full flex items-center justify-center flex-shrink-0">
          <i class="fas ${isBot ? 'fa-robot' : 'fa-user'} text-white text-xs"></i>
        </div>
        <div class="${isBot ? 'bg-white' : 'bg-[#5A7D8C] text-white'} rounded-lg p-3 shadow-sm max-w-[80%]">
          <p class="text-sm ${isBot ? 'text-gray-700' : ''}">${text}</p>
          ${action ? `
            <button onclick="staffDashboard.executeChatAction('${action.type}', ${JSON.stringify(action.data).replace(/"/g, '&quot;')})"
                    class="mt-2 px-3 py-1 bg-[#5A7D8C] text-white text-xs rounded-lg hover:bg-[#4A6D7C] transition">
              <i class="fas fa-check mr-1"></i>${action.label}
            </button>
          ` : ''}
        </div>
      </div>
    `

    container.insertAdjacentHTML('beforeend', messageHtml)
    container.scrollTop = container.scrollHeight
  }

  addTypingIndicator() {
    const container = document.getElementById('chatMessages')
    container.insertAdjacentHTML('beforeend', `
      <div id="typingIndicator" class="flex gap-3">
        <div class="w-8 h-8 bg-[#5A7D8C] rounded-full flex items-center justify-center flex-shrink-0">
          <i class="fas fa-robot text-white text-xs"></i>
        </div>
        <div class="bg-white rounded-lg p-3 shadow-sm">
          <div class="flex gap-1">
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></span>
            <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
          </div>
        </div>
      </div>
    `)
    container.scrollTop = container.scrollHeight
  }

  removeTypingIndicator() {
    document.getElementById('typingIndicator')?.remove()
  }

  async processChatCommand(message) {
    const lowerMsg = message.toLowerCase()

    // Find resident by name
    const findResident = (text) => {
      return this.residents.find(r =>
        r.full_name.toLowerCase().includes(text.toLowerCase())
      )
    }

    // Extract resident name from message
    const extractResidentName = () => {
      for (const resident of this.residents) {
        const nameParts = resident.full_name.toLowerCase().split(' ')
        for (const part of nameParts) {
          if (part.length > 2 && lowerMsg.includes(part)) {
            return resident
          }
        }
      }
      return null
    }

    // =====================================================
    // COMMANDES LOCALES (rapides, sans MCP Hub)
    // =====================================================

    // LISTE DES RÉSIDENTS
    if (lowerMsg.includes('liste') && lowerMsg.includes('résident')) {
      const residentsList = this.residents.map(r =>
        `• ${r.full_name} - Chambre ${r.room_number || 'N/A'}`
      ).join('\\n')
      return {
        text: `Voici la liste des résidents (${this.residents.length}):\\n${residentsList}`
      }
    }

    // CRÉER OBSERVATION
    if (lowerMsg.includes('observation') || lowerMsg.includes('note')) {
      const resident = extractResidentName()
      if (resident) {
        return {
          text: `Je peux créer une observation pour <strong>${resident.full_name}</strong>. Quel type d'observation souhaitez-vous enregistrer ?\\n\\n• Clinique\\n• Comportementale\\n• Sociale\\n• Nutrition\\n• Mobilité\\n• Générale`,
          action: {
            type: 'openObservationModal',
            data: { residentId: resident.id, residentName: resident.full_name },
            label: 'Ouvrir le formulaire'
          }
        }
      }
      return {
        text: "Pour quelle personne souhaitez-vous créer une observation ? Dites par exemple: \"Observation pour [nom du résident]\""
      }
    }

    // CRÉER TÂCHE DE SOIN
    if (lowerMsg.includes('tâche') || lowerMsg.includes('soin') || lowerMsg.includes('hygiène')) {
      const resident = extractResidentName()
      if (resident) {
        return {
          text: `Je peux créer une tâche de soin pour <strong>${resident.full_name}</strong>.\\n\\nTypes disponibles:\\n• Hygiène\\n• Médication\\n• Alimentation\\n• Mobilité\\n• Surveillance\\n• Activité`,
          action: {
            type: 'createCareTask',
            data: { residentId: resident.id, residentName: resident.full_name },
            label: 'Créer la tâche'
          }
        }
      }
      return {
        text: "Pour quel résident souhaitez-vous créer une tâche ? Précisez le nom."
      }
    }

    // SIGNALER INCIDENT
    if (lowerMsg.includes('incident') || lowerMsg.includes('chute') || lowerMsg.includes('urgence') || lowerMsg.includes('signaler')) {
      const resident = extractResidentName()
      if (resident) {
        let incidentType = 'GENERAL'
        if (lowerMsg.includes('chute')) incidentType = 'FALL'
        if (lowerMsg.includes('médic')) incidentType = 'MEDICATION_ERROR'
        if (lowerMsg.includes('comport')) incidentType = 'BEHAVIORAL'

        return {
          text: `⚠️ Signalement d'incident pour <strong>${resident.full_name}</strong>\\n\\nType détecté: ${incidentType}\\n\\nVoulez-vous créer ce rapport d'incident ?`,
          action: {
            type: 'createIncident',
            data: { residentId: resident.id, residentName: resident.full_name, incidentType },
            label: 'Créer le rapport'
          }
        }
      }
      return {
        text: "⚠️ Pour signaler un incident, précisez le nom du résident concerné."
      }
    }

    // STATISTIQUES LOCALES
    if (lowerMsg.includes('stat') || lowerMsg.includes('résumé') || lowerMsg.includes('aujourd')) {
      return {
        text: `📊 <strong>Statistiques du jour:</strong>\\n\\n• Résidents actifs: ${this.stats.activeResidents}\\n• Observations aujourd'hui: ${this.stats.todayObservations}\\n• Total cette semaine: ${this.stats.weeklyObservations.reduce((a, b) => a + b, 0)}`
      }
    }

    // AIDE
    if (lowerMsg.includes('aide') || lowerMsg.includes('help') || lowerMsg.includes('comment')) {
      return {
        text: `Je peux vous aider avec:\\n\\n<strong>📝 Observations</strong>: "Ajouter observation pour [nom]"\\n<strong>📋 Tâches</strong>: "Créer tâche d'hygiène pour [nom]"\\n<strong>⚠️ Incidents</strong>: "Signaler chute pour [nom]"\\n<strong>👥 Résidents</strong>: "Liste des résidents"\\n<strong>📊 Stats</strong>: "Statistiques du jour"\\n\\n<strong>🤖 MCP Hub (IA):</strong>\\n• "emails" - Voir les emails\\n• "calendrier" - Événements à venir\\n• "demande [question]" - Question libre à l'IA`
      }
    }

    // =====================================================
    // COMMANDES MCP HUB (connectées à l'IA)
    // =====================================================

    // EMAILS VIA MCP HUB
    if (lowerMsg.includes('email') || lowerMsg.includes('courriel') || lowerMsg.includes('message')) {
      return await this.mcpGetEmails()
    }

    // CALENDRIER VIA MCP HUB
    if (lowerMsg.includes('calendrier') || lowerMsg.includes('événement') || lowerMsg.includes('rendez-vous') || lowerMsg.includes('agenda')) {
      return await this.mcpGetCalendar()
    }

    // QUESTION LIBRE À L'IA (via MCP Hub)
    if (lowerMsg.startsWith('demande ') || lowerMsg.startsWith('question ') || lowerMsg.startsWith('ia ') || lowerMsg.startsWith('ai ')) {
      const query = message.replace(/^(demande|question|ia|ai)\s+/i, '')
      return await this.mcpSendPrompt(query)
    }

    // Si aucune commande locale reconnue, envoyer au MCP Hub pour une réponse IA
    return await this.mcpSendPrompt(message)
  }

  // =====================================================
  // MCP HUB INTEGRATION METHODS
  // =====================================================

  async mcpSendPrompt(prompt) {
    try {
      const token = await firebase.auth().currentUser?.getIdToken()
      if (!token) {
        return { text: "❌ Erreur d'authentification. Veuillez vous reconnecter." }
      }

      const response = await fetch('/api/mcp/prompt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('MCP Hub error:', error)
        return {
          text: `⚠️ Le service IA n'est pas disponible actuellement.\\n\\nEssayez une commande locale:\\n• "Liste des résidents"\\n• "Observation pour [nom]"\\n• "Statistiques du jour"`
        }
      }

      const data = await response.json()
      return {
        text: `🤖 <strong>Réponse IA:</strong>\\n\\n${data.response || data.message || JSON.stringify(data)}`,
        source: 'mcp_hub'
      }
    } catch (error) {
      console.error('MCP prompt error:', error)
      return { text: "⚠️ Erreur de connexion au service IA. Utilisez les commandes locales." }
    }
  }

  async mcpGetEmails() {
    try {
      const token = await firebase.auth().currentUser?.getIdToken()
      if (!token) {
        return { text: "❌ Erreur d'authentification." }
      }

      const response = await fetch('/api/mcp/emails?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        return { text: "⚠️ Impossible de récupérer les emails pour le moment." }
      }

      const data = await response.json()

      if (!data.emails || data.emails.length === 0) {
        return { text: "📧 Aucun email récent trouvé." }
      }

      const emailsList = data.emails.slice(0, 5).map((e, i) =>
        `${i + 1}. <strong>${e.subject || 'Sans sujet'}</strong>\\n   De: ${e.from || 'Inconnu'}`
      ).join('\\n\\n')

      return {
        text: `📧 <strong>Derniers emails (admin@aubergeboischatel.com):</strong>\\n\\n${emailsList}`
      }
    } catch (error) {
      console.error('MCP emails error:', error)
      return { text: "⚠️ Erreur lors de la récupération des emails." }
    }
  }

  async mcpGetCalendar() {
    try {
      const token = await firebase.auth().currentUser?.getIdToken()
      if (!token) {
        return { text: "❌ Erreur d'authentification." }
      }

      const response = await fetch('/api/mcp/calendar', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        return { text: "⚠️ Impossible de récupérer le calendrier pour le moment." }
      }

      const data = await response.json()

      return {
        text: `📅 <strong>Calendrier Auberge Boischatel:</strong>\\n\\n${data.events || 'Aucun événement à venir.'}`
      }
    } catch (error) {
      console.error('MCP calendar error:', error)
      return { text: "⚠️ Erreur lors de la récupération du calendrier." }
    }
  }

  async executeChatAction(type, data) {
    switch (type) {
      case 'openObservationModal':
        this.toggleChatbot()
        this.showObservationsModal(data.residentId)
        break

      case 'createCareTask':
        this.toggleChatbot()
        // Open care task modal (to be implemented)
        this.showToast(`Création de tâche pour ${data.residentName}`, 'info')
        break

      case 'createIncident':
        this.toggleChatbot()
        // Open incident modal (to be implemented)
        this.showToast(`Rapport d'incident pour ${data.residentName}`, 'warning')
        break

      default:
        console.warn('Unknown chat action:', type)
    }
  }

  // ============================================
  // CSV/EXCEL IMPORT FUNCTIONALITY
  // ============================================
  showImportModal() {
    const modal = `
      <div id="importModal" class="modal-backdrop" onclick="if(event.target === this) staffDashboard.closeModal('importModal')">
        <div class="modal-content scale-in" style="max-width: 700px;">
          <div class="modal-header bg-gradient-to-r from-[#C9A472] to-[#A9C7B5] text-white">
            <h3 class="text-xl font-bold">
              <i class="fas fa-file-csv mr-2"></i>
              Import de données CSV/Excel
            </h3>
            <button onclick="staffDashboard.closeModal('importModal')" class="btn-icon btn-ghost text-white hover:bg-white/20">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body space-y-6">
            <!-- Import Type Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type de données à importer</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button onclick="staffDashboard.selectImportType('residents')"
                        class="import-type-btn p-4 border-2 border-gray-200 rounded-xl hover:border-[#5A7D8C] transition text-center"
                        data-type="residents">
                  <i class="fas fa-users text-2xl text-blue-500 mb-2"></i>
                  <p class="text-sm font-medium">Résidents</p>
                </button>
                <button onclick="staffDashboard.selectImportType('observations')"
                        class="import-type-btn p-4 border-2 border-gray-200 rounded-xl hover:border-[#5A7D8C] transition text-center"
                        data-type="observations">
                  <i class="fas fa-clipboard-list text-2xl text-green-500 mb-2"></i>
                  <p class="text-sm font-medium">Observations</p>
                </button>
                <button onclick="staffDashboard.selectImportType('care_tasks')"
                        class="import-type-btn p-4 border-2 border-gray-200 rounded-xl hover:border-[#5A7D8C] transition text-center"
                        data-type="care_tasks">
                  <i class="fas fa-tasks text-2xl text-purple-500 mb-2"></i>
                  <p class="text-sm font-medium">Tâches</p>
                </button>
              </div>
            </div>

            <!-- File Upload Area -->
            <div id="importFileSection" class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">Fichier CSV ou Excel</label>
              <div class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#5A7D8C] transition cursor-pointer"
                   onclick="document.getElementById('csvFileInput').click()">
                <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                <p class="text-sm text-gray-600">Glissez un fichier ici ou <span class="text-[#5A7D8C] font-medium">parcourir</span></p>
                <p class="text-xs text-gray-400 mt-1">CSV, XLS, XLSX (max 10MB)</p>
                <input type="file" id="csvFileInput" accept=".csv,.xls,.xlsx" class="hidden"
                       onchange="staffDashboard.handleFileSelect(event)">
                <p id="selectedFileName" class="text-sm text-[#5A7D8C] font-medium mt-2 hidden"></p>
              </div>
            </div>

            <!-- Preview Table -->
            <div id="importPreviewSection" class="hidden">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">Aperçu des données</label>
                <span id="importRowCount" class="text-xs text-gray-500"></span>
              </div>
              <div class="border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead id="importPreviewHead" class="bg-gray-100 sticky top-0"></thead>
                  <tbody id="importPreviewBody"></tbody>
                </table>
              </div>
            </div>

            <!-- Column Mapping -->
            <div id="columnMappingSection" class="hidden">
              <label class="block text-sm font-medium text-gray-700 mb-2">Correspondance des colonnes</label>
              <div id="columnMappings" class="space-y-2"></div>
            </div>

            <!-- Template Download -->
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-sm text-gray-600 mb-2">
                <i class="fas fa-info-circle text-[#5A7D8C] mr-1"></i>
                Besoin d'un modèle ? Téléchargez nos templates CSV:
              </p>
              <div class="flex flex-wrap gap-2">
                <button onclick="staffDashboard.downloadTemplate('residents')" class="text-xs px-3 py-1 bg-white border rounded-lg hover:bg-gray-50">
                  <i class="fas fa-download mr-1"></i>Résidents
                </button>
                <button onclick="staffDashboard.downloadTemplate('observations')" class="text-xs px-3 py-1 bg-white border rounded-lg hover:bg-gray-50">
                  <i class="fas fa-download mr-1"></i>Observations
                </button>
                <button onclick="staffDashboard.downloadTemplate('care_tasks')" class="text-xs px-3 py-1 bg-white border rounded-lg hover:bg-gray-50">
                  <i class="fas fa-download mr-1"></i>Tâches
                </button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" onclick="staffDashboard.closeModal('importModal')"
                    class="btn-modern btn-ghost">
              Annuler
            </button>
            <button id="importSubmitBtn" onclick="staffDashboard.executeImport()"
                    class="btn-modern btn-theme" disabled>
              <i class="fas fa-upload mr-2"></i>
              Importer les données
            </button>
          </div>
        </div>
      </div>
    `

    document.getElementById('modalContainer').innerHTML = modal
  }

  selectedImportType = null
  importData = []
  importHeaders = []

  selectImportType(type) {
    this.selectedImportType = type

    // Update UI
    document.querySelectorAll('.import-type-btn').forEach(btn => {
      btn.classList.remove('border-[#5A7D8C]', 'bg-[#A9C7B5]/10')
      if (btn.dataset.type === type) {
        btn.classList.add('border-[#5A7D8C]', 'bg-[#A9C7B5]/10')
      }
    })

    // Show file section
    document.getElementById('importFileSection').classList.remove('hidden')
  }

  handleFileSelect(event) {
    const file = event.target.files[0]
    if (!file) return

    document.getElementById('selectedFileName').textContent = file.name
    document.getElementById('selectedFileName').classList.remove('hidden')

    // Parse the file
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        this.parseCSV(content)
      } catch (error) {
        console.error('Error parsing file:', error)
        this.showToast('Erreur lors de la lecture du fichier', 'error')
      }
    }
    reader.readAsText(file)
  }

  parseCSV(content) {
    const lines = content.split('\\n').filter(line => line.trim())
    if (lines.length < 2) {
      this.showToast('Le fichier doit contenir au moins une ligne d\\'en-tête et une ligne de données', 'error')
      return
    }

    // Parse headers
    this.importHeaders = this.parseCSVLine(lines[0])

    // Parse data rows
    this.importData = []
    for (let i = 1; i < Math.min(lines.length, 101); i++) { // Limit to 100 rows for preview
      const values = this.parseCSVLine(lines[i])
      if (values.length === this.importHeaders.length) {
        const row = {}
        this.importHeaders.forEach((header, index) => {
          row[header] = values[index]
        })
        this.importData.push(row)
      }
    }

    // Show preview
    this.showImportPreview()
  }

  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if ((char === ',' || char === ';') && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  showImportPreview() {
    const previewSection = document.getElementById('importPreviewSection')
    const headEl = document.getElementById('importPreviewHead')
    const bodyEl = document.getElementById('importPreviewBody')
    const rowCount = document.getElementById('importRowCount')

    // Show section
    previewSection.classList.remove('hidden')

    // Render headers
    headEl.innerHTML = `<tr>${this.importHeaders.map(h => `<th class="px-3 py-2 text-left text-xs font-semibold text-gray-600">${h}</th>`).join('')}</tr>`

    // Render preview rows (max 5)
    bodyEl.innerHTML = this.importData.slice(0, 5).map(row =>
      `<tr class="border-t">${this.importHeaders.map(h => `<td class="px-3 py-2 text-xs text-gray-700">${row[h] || '-'}</td>`).join('')}</tr>`
    ).join('')

    rowCount.textContent = `${this.importData.length} ligne(s) détectée(s)`

    // Show column mapping
    this.showColumnMapping()

    // Enable import button
    document.getElementById('importSubmitBtn').disabled = false
  }

  showColumnMapping() {
    const mappingSection = document.getElementById('columnMappingSection')
    const mappingsEl = document.getElementById('columnMappings')

    mappingSection.classList.remove('hidden')

    // Get expected fields based on type
    const expectedFields = this.getExpectedFields(this.selectedImportType)

    mappingsEl.innerHTML = expectedFields.map(field => `
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 w-32">${field.label}</span>
        <i class="fas fa-arrow-right text-gray-400"></i>
        <select data-field="${field.key}" class="flex-1 px-3 py-1 border rounded-lg text-sm">
          <option value="">-- Non mappé --</option>
          ${this.importHeaders.map(h =>
            `<option value="${h}" ${h.toLowerCase().includes(field.key.toLowerCase()) ? 'selected' : ''}>${h}</option>`
          ).join('')}
        </select>
        ${field.required ? '<span class="text-red-500 text-xs">*</span>' : ''}
      </div>
    `).join('')
  }

  getExpectedFields(type) {
    switch (type) {
      case 'residents':
        return [
          { key: 'full_name', label: 'Nom complet', required: true },
          { key: 'room_number', label: 'Chambre', required: false },
          { key: 'date_of_birth', label: 'Date naissance', required: false },
          { key: 'admission_date', label: 'Date admission', required: false },
          { key: 'medical_notes', label: 'Notes médicales', required: false },
          { key: 'allergies', label: 'Allergies', required: false },
        ]
      case 'observations':
        return [
          { key: 'resident_name', label: 'Nom résident', required: true },
          { key: 'observation_type', label: 'Type', required: true },
          { key: 'content', label: 'Contenu', required: true },
          { key: 'severity', label: 'Sévérité', required: false },
        ]
      case 'care_tasks':
        return [
          { key: 'resident_name', label: 'Nom résident', required: true },
          { key: 'task_type', label: 'Type tâche', required: true },
          { key: 'description', label: 'Description', required: true },
          { key: 'scheduled_date', label: 'Date prévue', required: false },
        ]
      default:
        return []
    }
  }

  async executeImport() {
    const submitBtn = document.getElementById('importSubmitBtn')
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Import en cours...'

    try {
      const idToken = await this.getAuthToken()
      const mappings = {}

      document.querySelectorAll('#columnMappings select').forEach(select => {
        if (select.value) {
          mappings[select.dataset.field] = select.value
        }
      })

      // Transform data according to mappings
      const transformedData = this.importData.map(row => {
        const transformed = {}
        for (const [targetField, sourceField] of Object.entries(mappings)) {
          transformed[targetField] = row[sourceField]
        }
        return transformed
      })

      // Send to API
      const response = await axios.post(`/api/import/${this.selectedImportType}`, {
        data: transformedData
      }, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.closeModal('importModal')
      this.showToast(`${response.data.imported || transformedData.length} éléments importés avec succès`, 'success')

      // Reload data
      if (this.selectedImportType === 'residents') {
        await this.loadResidents()
        this.render()
        this.hideLoading()
      }

    } catch (error) {
      console.error('Import error:', error)
      this.showToast(error.response?.data?.error || 'Erreur lors de l\\'import', 'error')
      submitBtn.disabled = false
      submitBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Importer les données'
    }
  }

  downloadTemplate(type) {
    const templates = {
      residents: 'full_name,room_number,date_of_birth,admission_date,medical_notes,allergies\\nJean Tremblay,101,1945-03-15,2024-01-10,Diabète type 2,Pénicilline\\nMarie Gagnon,102,1938-07-22,2024-02-15,Hypertension,Aucune',
      observations: 'resident_name,observation_type,content,severity\\nJean Tremblay,CLINICAL,Tension artérielle stable,INFO\\nMarie Gagnon,BEHAVIORAL,Bonne humeur ce matin,INFO',
      care_tasks: 'resident_name,task_type,description,scheduled_date\\nJean Tremblay,HYGIENE,Aide au bain,2024-12-01\\nMarie Gagnon,MEDICATION,Administration médicaments matin,2024-12-01'
    }

    const content = templates[type]
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_${type}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
}

// Initialize dashboard when DOM is ready
let staffDashboard
document.addEventListener('DOMContentLoaded', () => {
  staffDashboard = new StaffDashboard()

  // Keyboard shortcut for chatbot (Ctrl+/)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault()
      staffDashboard.toggleChatbot()
    }
  })
})
