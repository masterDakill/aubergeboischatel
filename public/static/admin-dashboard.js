/**
 * Admin Dashboard JavaScript
 * L'Auberge Boischatel - Panneau d'Administration
 */

class AdminDashboard {
  constructor() {
    this.user = null
    this.users = []
    this.residents = []
    this.logs = []
    this.documents = []
    this.stats = {}
    this.currentSection = 'overview'
    this.init()
  }

  async init() {
    console.log('🛡️ Initializing Admin Dashboard')

    if (!window.firebaseAppInitialized) {
      this.renderInitError(window.firebaseInitError || 'Initialisation Firebase requise.')
      return
    }

    const isAuthenticated = await this.checkAuth()
    if (!isAuthenticated) {
      window.location.href = '/'
      return
    }

    await this.loadUserData()

    // Verify admin role
    if (this.user.role !== 'ADMIN') {
      window.location.href = '/staff/dashboard'
      return
    }

    await this.loadAllData()
    this.render()
    this.hideLoading()
  }

  hideLoading() {
    const loading = document.getElementById('loading')
    if (loading) loading.style.display = 'none'
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
      console.log('✅ Admin user loaded:', this.user.email)
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      throw error
    }
  }

  async loadAllData() {
    try {
      const idToken = await this.getAuthToken()
      const headers = { 'Authorization': `Bearer ${idToken}` }

      // Load all data in parallel
      const [usersRes, residentsRes, logsRes, documentsRes, statsRes] = await Promise.all([
        axios.get('/api/users', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/residents', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/logs?limit=50', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/documents', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/users/stats/summary', { headers }).catch(() => ({ data: {} }))
      ])

      this.users = usersRes.data || []
      this.residents = residentsRes.data || []
      this.logs = logsRes.data || []
      this.documents = documentsRes.data || []
      this.stats = statsRes.data || {}

      console.log(`✅ Loaded: ${this.users.length} users, ${this.residents.length} residents, ${this.logs.length} logs`)
    } catch (error) {
      console.error('❌ Error loading data:', error)
    }
  }

  renderInitError(message) {
    this.hideLoading()
    const container = document.getElementById('dashboard-content')
    if (!container) return

    container.innerHTML = `
      <div class="max-w-3xl mx-auto mt-16 bg-white border border-red-100 text-red-700 rounded-2xl shadow-sm p-8 text-center">
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto mb-4">
          <i class="fas fa-triangle-exclamation"></i>
        </div>
        <h2 class="text-xl font-semibold mb-2">Erreur d'initialisation</h2>
        <p class="text-sm text-red-600">${message}</p>
      </div>
    `
  }

  render() {
    const container = document.getElementById('dashboard-content')
    if (!container) return

    container.innerHTML = `
      <!-- Sidebar + Main Layout -->
      <div class="flex min-h-screen">

        <!-- Sidebar -->
        <aside class="w-64 bg-gray-900 text-white fixed h-full overflow-y-auto">
          <div class="p-6 border-b border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt"></i>
              </div>
              <div>
                <h1 class="font-bold text-lg">Admin Panel</h1>
                <p class="text-xs text-gray-400">L'Auberge Boischatel</p>
              </div>
            </div>
          </div>

          <nav class="p-4 space-y-2">
            <button onclick="adminDashboard.showSection('overview')"
                    class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition ${this.currentSection === 'overview' ? 'bg-red-600' : ''}">
              <i class="fas fa-chart-pie w-5"></i>
              <span>Vue d'ensemble</span>
            </button>
            <button onclick="adminDashboard.showSection('users')"
                    class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition ${this.currentSection === 'users' ? 'bg-red-600' : ''}">
              <i class="fas fa-users-cog w-5"></i>
              <span>Utilisateurs</span>
              <span class="ml-auto bg-gray-700 text-xs px-2 py-1 rounded-full">${this.users.length}</span>
            </button>
            <button onclick="adminDashboard.showSection('residents')"
                    class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition ${this.currentSection === 'residents' ? 'bg-red-600' : ''}">
              <i class="fas fa-home w-5"></i>
              <span>Résidents</span>
              <span class="ml-auto bg-gray-700 text-xs px-2 py-1 rounded-full">${this.residents.length}</span>
            </button>
            <button onclick="adminDashboard.showSection('links')"
                    class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition ${this.currentSection === 'links' ? 'bg-red-600' : ''}">
              <i class="fas fa-link w-5"></i>
              <span>Liens Famille</span>
            </button>
            <button onclick="adminDashboard.showSection('documents')"
                    class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition ${this.currentSection === 'documents' ? 'bg-red-600' : ''}">
              <i class="fas fa-folder w-5"></i>
              <span>Documents</span>
              <span class="ml-auto bg-gray-700 text-xs px-2 py-1 rounded-full">${this.documents.length}</span>
            </button>
            <button onclick="adminDashboard.showSection('logs')"
                    class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition ${this.currentSection === 'logs' ? 'bg-red-600' : ''}">
              <i class="fas fa-history w-5"></i>
              <span>Journaux</span>
            </button>
          </nav>

          <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                ${(this.user.first_name || 'A')[0].toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">${this.user.first_name || 'Admin'}</p>
                <p class="text-xs text-gray-400 truncate">${this.user.email}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <a href="/staff/dashboard" class="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-center text-sm hover:bg-gray-600 transition">
                <i class="fas fa-arrow-left mr-1"></i> Staff
              </a>
              <button onclick="firebase.auth().signOut().then(() => window.location.href = '/')"
                      class="flex-1 px-3 py-2 bg-red-600 rounded-lg text-center text-sm hover:bg-red-700 transition">
                <i class="fas fa-sign-out-alt mr-1"></i> Sortir
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 ml-64 bg-gray-100 min-h-screen">
          <div id="section-content" class="p-8">
            ${this.renderSection()}
          </div>
        </main>
      </div>

      <!-- Modal Container -->
      <div id="modalContainer"></div>
    `
  }

  renderSection() {
    switch(this.currentSection) {
      case 'overview': return this.renderOverview()
      case 'users': return this.renderUsers()
      case 'residents': return this.renderResidents()
      case 'links': return this.renderLinks()
      case 'documents': return this.renderDocuments()
      case 'logs': return this.renderLogs()
      default: return this.renderOverview()
    }
  }

  showSection(section) {
    this.currentSection = section
    const content = document.getElementById('section-content')
    if (content) {
      content.innerHTML = this.renderSection()
    }
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('bg-red-600'))
    event.currentTarget.classList.add('bg-red-600')
  }

  // ==================== OVERVIEW ====================
  renderOverview() {
    const clientsCount = this.users.filter(u => u.role === 'CLIENT').length
    const employeesCount = this.users.filter(u => u.role === 'EMPLOYEE').length
    const adminsCount = this.users.filter(u => u.role === 'ADMIN').length
    const activeResidents = this.residents.filter(r => r.active !== false).length

    return `
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Vue d'ensemble</h1>
        <p class="text-gray-600 mt-1">Panneau de contrôle administratif</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Total Utilisateurs</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">${this.users.length}</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-users text-purple-600 text-xl"></i>
            </div>
          </div>
          <div class="mt-4 flex gap-4 text-xs">
            <span class="text-blue-600"><i class="fas fa-user mr-1"></i>${clientsCount} Clients</span>
            <span class="text-green-600"><i class="fas fa-user-tie mr-1"></i>${employeesCount} Staff</span>
            <span class="text-red-600"><i class="fas fa-shield-alt mr-1"></i>${adminsCount} Admin</span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Résidents Actifs</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">${activeResidents}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-home text-blue-600 text-xl"></i>
            </div>
          </div>
          <p class="mt-4 text-xs text-gray-500">
            <i class="fas fa-bed mr-1"></i> ${this.residents.length} chambres occupées
          </p>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Documents</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">${this.documents.length}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-file-alt text-green-600 text-xl"></i>
            </div>
          </div>
          <p class="mt-4 text-xs text-gray-500">
            <i class="fas fa-eye mr-1"></i> ${this.documents.filter(d => d.visible_to_client).length} visibles aux familles
          </p>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Activités (24h)</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">${this.logs.length}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-history text-yellow-600 text-xl"></i>
            </div>
          </div>
          <p class="mt-4 text-xs text-gray-500">
            <i class="fas fa-clock mr-1"></i> Dernières 50 actions
          </p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i class="fas fa-bolt text-yellow-500"></i> Actions Rapides
          </h3>
          <div class="space-y-3">
            <button onclick="adminDashboard.showAddUserModal()"
                    class="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
              <i class="fas fa-user-plus w-5"></i>
              <span>Nouvel Utilisateur</span>
            </button>
            <button onclick="adminDashboard.showAddResidentModal()"
                    class="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
              <i class="fas fa-plus-circle w-5"></i>
              <span>Nouveau Résident</span>
            </button>
            <button onclick="adminDashboard.showLinkModal()"
                    class="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
              <i class="fas fa-link w-5"></i>
              <span>Créer Lien Famille</span>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6 col-span-2">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i class="fas fa-history text-blue-500"></i> Activité Récente
          </h3>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            ${this.logs.slice(0, 8).map(log => `
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div class="w-8 h-8 ${this.getLogColor(log.action)} rounded-full flex items-center justify-center text-white text-xs">
                  <i class="fas ${this.getLogIcon(log.action)}"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">${log.action}</p>
                  <p class="text-xs text-gray-500 truncate">${log.details || 'Aucun détail'}</p>
                </div>
                <span class="text-xs text-gray-400">${this.formatTimeAgo(log.created_at)}</span>
              </div>
            `).join('') || '<p class="text-gray-500 text-center py-4">Aucune activité récente</p>'}
          </div>
        </div>
      </div>

      <!-- Users by Role Chart -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="font-bold text-gray-800 mb-4">Répartition des Utilisateurs</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">Clients (Familles)</span>
                <span class="font-medium">${clientsCount}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-blue-500 h-3 rounded-full" style="width: ${(clientsCount / Math.max(this.users.length, 1)) * 100}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">Employés</span>
                <span class="font-medium">${employeesCount}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-green-500 h-3 rounded-full" style="width: ${(employeesCount / Math.max(this.users.length, 1)) * 100}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">Administrateurs</span>
                <span class="font-medium">${adminsCount}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div class="bg-red-500 h-3 rounded-full" style="width: ${(adminsCount / Math.max(this.users.length, 1)) * 100}%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="font-bold text-gray-800 mb-4">Derniers Utilisateurs</h3>
          <div class="space-y-3">
            ${this.users.slice(0, 5).map(user => `
              <div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <div class="w-10 h-10 ${this.getRoleBgColor(user.role)} rounded-full flex items-center justify-center text-white font-bold">
                  ${(user.first_name || user.email)[0].toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-800 truncate">${user.first_name || ''} ${user.last_name || ''}</p>
                  <p class="text-xs text-gray-500 truncate">${user.email}</p>
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${this.getRoleBadgeColor(user.role)}">${user.role}</span>
              </div>
            `).join('') || '<p class="text-gray-500 text-center py-4">Aucun utilisateur</p>'}
          </div>
        </div>
      </div>
    `
  }

  // ==================== USERS ====================
  renderUsers() {
    return `
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
          <p class="text-gray-600 mt-1">${this.users.length} utilisateurs enregistrés</p>
        </div>
        <button onclick="adminDashboard.showAddUserModal()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
          <i class="fas fa-user-plus"></i>
          Nouvel Utilisateur
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <input type="text" id="userSearch" placeholder="Rechercher par nom ou email..."
                   onkeyup="adminDashboard.filterUsers()"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
          </div>
          <select id="roleFilter" onchange="adminDashboard.filterUsers()"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
            <option value="">Tous les rôles</option>
            <option value="CLIENT">Clients</option>
            <option value="EMPLOYEE">Employés</option>
            <option value="ADMIN">Administrateurs</option>
          </select>
          <select id="statusFilter" onchange="adminDashboard.filterUsers()"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
            <option value="">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière Connexion</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Résidents Liés</th>
                <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTableBody" class="bg-white divide-y divide-gray-200">
              ${this.renderUsersRows(this.users)}
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  renderUsersRows(users) {
    if (users.length === 0) {
      return `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Aucun utilisateur trouvé</td></tr>`
    }

    return users.map(user => `
      <tr class="hover:bg-gray-50 transition user-row"
          data-name="${(user.first_name || '').toLowerCase()} ${(user.last_name || '').toLowerCase()}"
          data-email="${(user.email || '').toLowerCase()}"
          data-role="${user.role}"
          data-active="${user.active}">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="w-10 h-10 ${this.getRoleBgColor(user.role)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              ${(user.first_name || user.email)[0].toUpperCase()}
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${user.first_name || ''} ${user.last_name || ''}</div>
              <div class="text-sm text-gray-500">${user.email}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${this.getRoleBadgeColor(user.role)}">
            ${user.role}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-3 py-1 text-xs font-semibold rounded-full ${user.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
            ${user.active !== false ? 'Actif' : 'Inactif'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${user.last_login ? this.formatDate(user.last_login) : 'Jamais'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${user.linked_residents_count || 0} résident(s)
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex items-center justify-end gap-2">
            <button onclick="adminDashboard.viewUser('${user.id}')"
                    class="text-blue-600 hover:text-blue-800 p-2" title="Voir">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="adminDashboard.editUser('${user.id}')"
                    class="text-yellow-600 hover:text-yellow-800 p-2" title="Modifier">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="adminDashboard.toggleUserStatus('${user.id}', ${user.active !== false})"
                    class="text-${user.active !== false ? 'red' : 'green'}-600 hover:text-${user.active !== false ? 'red' : 'green'}-800 p-2"
                    title="${user.active !== false ? 'Désactiver' : 'Activer'}">
              <i class="fas fa-${user.active !== false ? 'ban' : 'check-circle'}"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('')
  }

  filterUsers() {
    const search = document.getElementById('userSearch')?.value.toLowerCase() || ''
    const role = document.getElementById('roleFilter')?.value || ''
    const status = document.getElementById('statusFilter')?.value || ''

    const rows = document.querySelectorAll('.user-row')
    rows.forEach(row => {
      const name = row.dataset.name || ''
      const email = row.dataset.email || ''
      const rowRole = row.dataset.role || ''
      const rowActive = row.dataset.active || ''

      const matchSearch = name.includes(search) || email.includes(search)
      const matchRole = !role || rowRole === role
      const matchStatus = !status || rowActive === status

      row.style.display = (matchSearch && matchRole && matchStatus) ? '' : 'none'
    })
  }

  // ==================== RESIDENTS ====================
  renderResidents() {
    return `
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Gestion des Résidents</h1>
          <p class="text-gray-600 mt-1">${this.residents.length} résidents enregistrés</p>
        </div>
        <button onclick="adminDashboard.showAddResidentModal()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <i class="fas fa-plus-circle"></i>
          Nouveau Résident
        </button>
      </div>

      <!-- Residents Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${this.residents.map(resident => `
          <div class="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i class="fas fa-user text-white text-xl"></i>
                </div>
                <div class="text-white">
                  <h3 class="font-bold text-lg">${resident.full_name}</h3>
                  <p class="text-blue-100 text-sm">Chambre ${resident.room_number || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div class="p-6">
              <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2 text-gray-600">
                  <i class="fas fa-calendar w-5 text-blue-500"></i>
                  <span>Admission: ${resident.admission_date ? this.formatDate(resident.admission_date) : 'N/A'}</span>
                </div>
                <div class="flex items-center gap-2 text-gray-600">
                  <i class="fas fa-phone w-5 text-green-500"></i>
                  <span>${resident.emergency_contact_name || 'Pas de contact'}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-circle w-5 ${resident.active !== false ? 'text-green-500' : 'text-red-500'}"></i>
                  <span class="${resident.active !== false ? 'text-green-600' : 'text-red-600'}">
                    ${resident.active !== false ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div class="flex gap-2 mt-4 pt-4 border-t">
                <button onclick="adminDashboard.viewResident('${resident.id}')"
                        class="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm">
                  <i class="fas fa-eye mr-1"></i> Voir
                </button>
                <button onclick="adminDashboard.editResident('${resident.id}')"
                        class="flex-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition text-sm">
                  <i class="fas fa-edit mr-1"></i> Modifier
                </button>
              </div>
            </div>
          </div>
        `).join('') || `
          <div class="col-span-full text-center py-12 bg-white rounded-xl">
            <i class="fas fa-home text-gray-300 text-5xl mb-4"></i>
            <p class="text-gray-500">Aucun résident enregistré</p>
          </div>
        `}
      </div>
    `
  }

  // ==================== LINKS ====================
  renderLinks() {
    const usersWithLinks = this.users.filter(u => u.role === 'CLIENT')

    return `
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Liens Famille-Résident</h1>
          <p class="text-gray-600 mt-1">Associer les comptes familles aux résidents</p>
        </div>
        <button onclick="adminDashboard.showLinkModal()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
          <i class="fas fa-link"></i>
          Créer un Lien
        </button>
      </div>

      <!-- Info Box -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="fas fa-info-circle text-blue-600"></i>
          </div>
          <div>
            <h3 class="font-semibold text-blue-800">Comment fonctionnent les liens ?</h3>
            <p class="text-blue-700 text-sm mt-1">
              Un lien permet à un utilisateur CLIENT (membre de la famille) de voir les informations
              et documents d'un résident sur son dashboard. Vous pouvez créer plusieurs liens par résident.
            </p>
          </div>
        </div>
      </div>

      <!-- Link Creation Form -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 class="font-bold text-gray-800 mb-6 flex items-center gap-2">
          <i class="fas fa-plus-circle text-green-500"></i>
          Créer un nouveau lien
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Utilisateur (Famille)</label>
            <select id="linkUserId" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="">Sélectionner...</option>
              ${usersWithLinks.map(u => `<option value="${u.id}">${u.first_name || ''} ${u.last_name || ''} (${u.email})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Résident</label>
            <select id="linkResidentId" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="">Sélectionner...</option>
              ${this.residents.map(r => `<option value="${r.id}">${r.full_name} (Ch. ${r.room_number || 'N/A'})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Relation</label>
            <select id="linkRelation" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option value="Fils">Fils</option>
              <option value="Fille">Fille</option>
              <option value="Conjoint(e)">Conjoint(e)</option>
              <option value="Frère">Frère</option>
              <option value="Soeur">Soeur</option>
              <option value="Petit-fils">Petit-fils</option>
              <option value="Petite-fille">Petite-fille</option>
              <option value="Ami(e)">Ami(e)</option>
              <option value="Tuteur">Tuteur</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div class="flex items-end">
            <button onclick="adminDashboard.createLink()"
                    class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-link mr-2"></i>
              Créer le lien
            </button>
          </div>
        </div>
      </div>

      <!-- Existing Links by Resident -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b bg-gray-50">
          <h3 class="font-bold text-gray-800">Liens existants par résident</h3>
        </div>
        <div class="divide-y">
          ${this.residents.map(resident => `
            <div class="p-4 hover:bg-gray-50">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-blue-600"></i>
                  </div>
                  <div>
                    <p class="font-medium text-gray-800">${resident.full_name}</p>
                    <p class="text-sm text-gray-500">Chambre ${resident.room_number || 'N/A'}</p>
                  </div>
                </div>
                <button onclick="adminDashboard.viewResidentLinks('${resident.id}')"
                        class="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                  <i class="fas fa-users mr-1"></i>
                  Voir les liens
                </button>
              </div>
            </div>
          `).join('') || '<div class="p-8 text-center text-gray-500">Aucun résident</div>'}
        </div>
      </div>
    `
  }

  // ==================== DOCUMENTS ====================
  renderDocuments() {
    return `
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Gestion des Documents</h1>
          <p class="text-gray-600 mt-1">${this.documents.length} documents enregistrés</p>
        </div>
        <button onclick="adminDashboard.showAddDocumentModal()"
                class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center gap-2">
          <i class="fas fa-upload"></i>
          Nouveau Document
        </button>
      </div>

      <!-- Documents Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Résident</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Visibilité</th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${this.documents.map(doc => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <i class="fas ${this.getFileIcon(doc.file_type)} text-2xl"></i>
                      <div>
                        <p class="font-medium text-gray-800">${doc.title}</p>
                        <p class="text-xs text-gray-500">${doc.file_type || 'N/A'} • ${doc.file_size_kb ? doc.file_size_kb + ' KB' : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">${doc.resident_name || 'N/A'}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">${doc.document_type || 'Document'}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs rounded-full ${doc.visible_to_client ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                      ${doc.visible_to_client ? 'Visible' : 'Privé'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">${this.formatDate(doc.created_at)}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      ${doc.file_url ? `
                        <a href="${doc.file_url}" target="_blank" class="text-blue-600 hover:text-blue-800 p-2">
                          <i class="fas fa-download"></i>
                        </a>
                      ` : ''}
                      <button onclick="adminDashboard.deleteDocument('${doc.id}')" class="text-red-600 hover:text-red-800 p-2">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('') || `
                <tr>
                  <td colspan="6" class="px-6 py-8 text-center text-gray-500">Aucun document</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  // ==================== LOGS ====================
  renderLogs() {
    return `
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Journaux Système</h1>
          <p class="text-gray-600 mt-1">Historique des actions et événements</p>
        </div>
        <button onclick="adminDashboard.refreshLogs()"
                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
          <i class="fas fa-sync-alt"></i>
          Actualiser
        </button>
      </div>

      <!-- Logs Timeline -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="space-y-4">
          ${this.logs.map(log => `
            <div class="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div class="w-10 h-10 ${this.getLogColor(log.action)} rounded-full flex items-center justify-center text-white flex-shrink-0">
                <i class="fas ${this.getLogIcon(log.action)}"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-gray-800">${log.action}</p>
                  <span class="text-xs text-gray-400">${this.formatDateTime(log.created_at)}</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">${log.details || 'Aucun détail'}</p>
                <div class="flex gap-4 mt-2 text-xs text-gray-400">
                  ${log.user_name ? `<span><i class="fas fa-user mr-1"></i>${log.user_name}</span>` : ''}
                  ${log.resident_name ? `<span><i class="fas fa-home mr-1"></i>${log.resident_name}</span>` : ''}
                  ${log.ip_address ? `<span><i class="fas fa-globe mr-1"></i>${log.ip_address}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('') || `
            <div class="text-center py-12 text-gray-500">
              <i class="fas fa-history text-5xl mb-4 text-gray-300"></i>
              <p>Aucun journal disponible</p>
            </div>
          `}
        </div>
      </div>
    `
  }

  // ==================== MODALS ====================
  showAddUserModal() {
    const modal = `
      <div id="addUserModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-user-plus text-purple-600 mr-2"></i>
              Nouvel Utilisateur
            </h3>
            <button onclick="adminDashboard.closeModal('addUserModal')" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <p class="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
              <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
              Les utilisateurs doivent créer leur compte via le site. Vous pouvez ensuite modifier leur rôle ici.
            </p>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Rechercher un utilisateur existant</label>
              <input type="text" placeholder="Email de l'utilisateur..." class="w-full px-4 py-2 border rounded-lg">
            </div>
          </div>
          <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button onclick="adminDashboard.closeModal('addUserModal')"
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              Fermer
            </button>
          </div>
        </div>
      </div>
    `
    document.getElementById('modalContainer').innerHTML = modal
  }

  showAddResidentModal() {
    const modal = `
      <div id="addResidentModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-plus-circle text-blue-600 mr-2"></i>
              Nouveau Résident
            </h3>
            <button onclick="adminDashboard.closeModal('addResidentModal')" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form onsubmit="adminDashboard.createResident(event)" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
              <input type="text" id="residentName" required
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Numéro de chambre</label>
                <input type="text" id="residentRoom"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                <input type="date" id="residentBirth"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Date d'admission</label>
              <input type="date" id="residentAdmission"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Contact d'urgence (nom)</label>
              <input type="text" id="residentEmergencyName"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Contact d'urgence (téléphone)</label>
              <input type="tel" id="residentEmergencyPhone"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Notes médicales</label>
              <textarea id="residentNotes" rows="3"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" onclick="adminDashboard.closeModal('addResidentModal')"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Annuler
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <i class="fas fa-save mr-2"></i>
                Créer le résident
              </button>
            </div>
          </form>
        </div>
      </div>
    `
    document.getElementById('modalContainer').innerHTML = modal
  }

  showLinkModal() {
    this.showSection('links')
  }

  async viewUser(userId) {
    try {
      const idToken = await this.getAuthToken()
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })
      const user = response.data

      const modal = `
        <div id="viewUserModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h3 class="text-xl font-bold text-gray-800">
                <i class="fas fa-user text-purple-600 mr-2"></i>
                Détails Utilisateur
              </h3>
              <button onclick="adminDashboard.closeModal('viewUserModal')" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
            <div class="p-6">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 ${this.getRoleBgColor(user.role)} rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  ${(user.first_name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <h4 class="text-xl font-bold text-gray-800">${user.first_name || ''} ${user.last_name || ''}</h4>
                  <p class="text-gray-500">${user.email}</p>
                  <span class="inline-block mt-1 px-3 py-1 text-xs rounded-full ${this.getRoleBadgeColor(user.role)}">${user.role}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500">Téléphone</p>
                  <p class="font-medium text-gray-800">${user.phone || 'Non renseigné'}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500">Statut</p>
                  <p class="font-medium ${user.active !== false ? 'text-green-600' : 'text-red-600'}">
                    ${user.active !== false ? 'Actif' : 'Inactif'}
                  </p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500">Inscrit le</p>
                  <p class="font-medium text-gray-800">${this.formatDate(user.created_at)}</p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500">Dernière connexion</p>
                  <p class="font-medium text-gray-800">${user.last_login ? this.formatDateTime(user.last_login) : 'Jamais'}</p>
                </div>
              </div>

              ${user.linked_residents && user.linked_residents.length > 0 ? `
                <div class="border-t pt-4">
                  <h5 class="font-semibold text-gray-800 mb-3">Résidents Liés</h5>
                  <div class="space-y-2">
                    ${user.linked_residents.map(r => `
                      <div class="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                        <div class="flex items-center gap-3">
                          <i class="fas fa-user text-blue-600"></i>
                          <div>
                            <p class="font-medium text-gray-800">${r.resident_name}</p>
                            <p class="text-xs text-gray-500">Chambre ${r.room_number || 'N/A'} • ${r.relation}</p>
                          </div>
                        </div>
                        ${r.is_primary ? '<span class="text-xs bg-blue-600 text-white px-2 py-1 rounded">Contact Principal</span>' : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
            <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button onclick="adminDashboard.editUser('${user.id}')"
                      class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                <i class="fas fa-edit mr-2"></i>
                Modifier
              </button>
              <button onclick="adminDashboard.closeModal('viewUserModal')"
                      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                Fermer
              </button>
            </div>
          </div>
        </div>
      `
      document.getElementById('modalContainer').innerHTML = modal
    } catch (error) {
      this.showToast('Erreur lors du chargement', 'error')
    }
  }

  async editUser(userId) {
    const user = this.users.find(u => u.id === userId)
    if (!user) return

    const modal = `
      <div id="editUserModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-edit text-yellow-600 mr-2"></i>
              Modifier Utilisateur
            </h3>
            <button onclick="adminDashboard.closeModal('editUserModal')" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <form onsubmit="adminDashboard.updateUser(event, '${userId}')" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input type="text" id="editFirstName" value="${user.first_name || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input type="text" id="editLastName" value="${user.last_name || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
              <input type="tel" id="editPhone" value="${user.phone || ''}"
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
              <select id="editRole" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500">
                <option value="CLIENT" ${user.role === 'CLIENT' ? 'selected' : ''}>Client (Famille)</option>
                <option value="EMPLOYEE" ${user.role === 'EMPLOYEE' ? 'selected' : ''}>Employé</option>
                <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Administrateur</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="editActive" ${user.active !== false ? 'checked' : ''} class="w-4 h-4">
              <label class="text-sm text-gray-700">Compte actif</label>
            </div>
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" onclick="adminDashboard.closeModal('editUserModal')"
                      class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                Annuler
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition">
                <i class="fas fa-save mr-2"></i>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    `
    document.getElementById('modalContainer').innerHTML = modal
  }

  // ==================== API ACTIONS ====================
  async createResident(event) {
    event.preventDefault()

    const data = {
      full_name: document.getElementById('residentName').value,
      room_number: document.getElementById('residentRoom').value,
      date_of_birth: document.getElementById('residentBirth').value || null,
      admission_date: document.getElementById('residentAdmission').value || null,
      emergency_contact_name: document.getElementById('residentEmergencyName').value,
      emergency_contact_phone: document.getElementById('residentEmergencyPhone').value,
      medical_notes: document.getElementById('residentNotes').value
    }

    try {
      const idToken = await this.getAuthToken()
      await axios.post('/api/residents', data, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.showToast('Résident créé avec succès', 'success')
      this.closeModal('addResidentModal')
      await this.loadAllData()
      this.showSection('residents')
    } catch (error) {
      this.showToast('Erreur lors de la création', 'error')
    }
  }

  async updateUser(event, userId) {
    event.preventDefault()

    const data = {
      first_name: document.getElementById('editFirstName').value,
      last_name: document.getElementById('editLastName').value,
      phone: document.getElementById('editPhone').value,
      role: document.getElementById('editRole').value,
      active: document.getElementById('editActive').checked
    }

    try {
      const idToken = await this.getAuthToken()
      await axios.put(`/api/users/${userId}`, data, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.showToast('Utilisateur modifié avec succès', 'success')
      this.closeModal('editUserModal')
      await this.loadAllData()
      this.showSection('users')
    } catch (error) {
      this.showToast('Erreur lors de la modification', 'error')
    }
  }

  async toggleUserStatus(userId, currentlyActive) {
    if (!confirm(`${currentlyActive ? 'Désactiver' : 'Activer'} cet utilisateur ?`)) return

    try {
      const idToken = await this.getAuthToken()
      await axios.put(`/api/users/${userId}`, { active: !currentlyActive }, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.showToast(`Utilisateur ${currentlyActive ? 'désactivé' : 'activé'}`, 'success')
      await this.loadAllData()
      this.showSection('users')
    } catch (error) {
      this.showToast('Erreur lors de la modification', 'error')
    }
  }

  async createLink() {
    const userId = document.getElementById('linkUserId').value
    const residentId = document.getElementById('linkResidentId').value
    const relation = document.getElementById('linkRelation').value

    if (!userId || !residentId) {
      this.showToast('Veuillez sélectionner un utilisateur et un résident', 'error')
      return
    }

    try {
      const idToken = await this.getAuthToken()
      await axios.post(`/api/users/${userId}/link-resident`, {
        resident_id: residentId,
        relation: relation,
        is_primary_contact: false
      }, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.showToast('Lien créé avec succès', 'success')
      await this.loadAllData()
      this.showSection('links')
    } catch (error) {
      this.showToast('Erreur lors de la création du lien', 'error')
    }
  }

  async deleteDocument(docId) {
    if (!confirm('Supprimer ce document ?')) return

    try {
      const idToken = await this.getAuthToken()
      await axios.delete(`/api/documents/${docId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      this.showToast('Document supprimé', 'success')
      await this.loadAllData()
      this.showSection('documents')
    } catch (error) {
      this.showToast('Erreur lors de la suppression', 'error')
    }
  }

  async refreshLogs() {
    try {
      const idToken = await this.getAuthToken()
      const response = await axios.get('/api/logs?limit=50', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })
      this.logs = response.data || []
      this.showSection('logs')
      this.showToast('Journaux actualisés', 'success')
    } catch (error) {
      this.showToast('Erreur lors de l\'actualisation', 'error')
    }
  }

  async viewResidentLinks(residentId) {
    const resident = this.residents.find(r => r.id === residentId)
    if (!resident) return

    // TODO: Fetch links for this resident
    this.showToast('Fonctionnalité en développement', 'info')
  }

  viewResident(residentId) {
    // TODO: Implement view resident modal
    this.showToast('Fonctionnalité en développement', 'info')
  }

  editResident(residentId) {
    // TODO: Implement edit resident modal
    this.showToast('Fonctionnalité en développement', 'info')
  }

  showAddDocumentModal() {
    // TODO: Implement add document modal
    this.showToast('Fonctionnalité en développement', 'info')
  }

  // ==================== HELPERS ====================
  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) modal.remove()
  }

  getRoleBgColor(role) {
    const colors = {
      'CLIENT': 'bg-blue-500',
      'EMPLOYEE': 'bg-green-500',
      'ADMIN': 'bg-red-500'
    }
    return colors[role] || 'bg-gray-500'
  }

  getRoleBadgeColor(role) {
    const colors = {
      'CLIENT': 'bg-blue-100 text-blue-700',
      'EMPLOYEE': 'bg-green-100 text-green-700',
      'ADMIN': 'bg-red-100 text-red-700'
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  getLogColor(action) {
    if (action?.includes('create') || action?.includes('add')) return 'bg-green-500'
    if (action?.includes('delete') || action?.includes('remove')) return 'bg-red-500'
    if (action?.includes('update') || action?.includes('edit')) return 'bg-yellow-500'
    if (action?.includes('login') || action?.includes('auth')) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  getLogIcon(action) {
    if (action?.includes('create') || action?.includes('add')) return 'fa-plus'
    if (action?.includes('delete') || action?.includes('remove')) return 'fa-trash'
    if (action?.includes('update') || action?.includes('edit')) return 'fa-edit'
    if (action?.includes('login') || action?.includes('auth')) return 'fa-sign-in-alt'
    if (action?.includes('resident')) return 'fa-home'
    if (action?.includes('user')) return 'fa-user'
    if (action?.includes('document')) return 'fa-file'
    return 'fa-circle'
  }

  getFileIcon(fileType) {
    const icons = {
      'pdf': 'fa-file-pdf text-red-500',
      'doc': 'fa-file-word text-blue-500',
      'docx': 'fa-file-word text-blue-500',
      'xls': 'fa-file-excel text-green-500',
      'xlsx': 'fa-file-excel text-green-500',
      'jpg': 'fa-file-image text-purple-500',
      'jpeg': 'fa-file-image text-purple-500',
      'png': 'fa-file-image text-purple-500'
    }
    return icons[fileType?.toLowerCase()] || 'fa-file text-gray-400'
  }

  formatDate(dateStr) {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('fr-CA')
  }

  formatDateTime(dateStr) {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  formatTimeAgo(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'À l\'instant'
    if (diff < 3600) return `${Math.floor(diff / 60)}min`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}j`
  }

  showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }

    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-[100] flex items-center gap-2`
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `

    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }
}

// Initialize dashboard when DOM is ready
let adminDashboard
document.addEventListener('DOMContentLoaded', () => {
  adminDashboard = new AdminDashboard()
})
