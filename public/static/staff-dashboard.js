/**
 * Staff Dashboard JavaScript
 * L'Auberge Boischatel - Espace Employés
 */

class StaffDashboard {
  constructor() {
    this.user = null
    this.residents = []
    this.recentLogs = []
    this.stats = {
      totalResidents: 0,
      activeResidents: 0,
      todayObservations: 0
    }
    this.init()
  }

  async init() {
    console.log('👔 Initializing Staff Dashboard')
    
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

    await this.loadResidents()
    await this.loadRecentLogs()
    await this.calculateStats()
    this.render()
  }

  async checkAuth() {
    try {
      if (!firebase.auth().currentUser) {
        return false
      }
      return true
    } catch (error) {
      console.error('Auth check error:', error)
      return false
    }
  }

  async loadUserData() {
    try {
      const idToken = await firebase.auth().currentUser.getIdToken()
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
      const idToken = await firebase.auth().currentUser.getIdToken()
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
      const idToken = await firebase.auth().currentUser.getIdToken()
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

  calculateStats() {
    this.stats.totalResidents = this.residents.length
    this.stats.activeResidents = this.residents.filter(r => r.active).length
    this.stats.todayObservations = this.recentLogs.filter(log => {
      const logDate = new Date(log.created_at).toDateString()
      const today = new Date().toDateString()
      return logDate === today
    }).length
  }

  render() {
    const container = document.getElementById('dashboard-content')
    if (!container) return

    container.innerHTML = `
      <!-- Header -->
      <div class="bg-white shadow-sm mb-6">
        <div class="max-w-7xl mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-briefcase text-purple-600 mr-2"></i>
                Espace Employé
              </h1>
              <p class="text-gray-600 mt-1">
                Bonjour, ${this.user.first_name || 'Employé'} 
                ${this.user.role === 'ADMIN' ? '<span class="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">ADMIN</span>' : ''}
              </p>
            </div>
            <div class="flex space-x-3">
              ${this.user.role === 'ADMIN' ? `
                <a href="/admin/dashboard" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                  <i class="fas fa-shield-alt mr-2"></i>
                  Admin
                </a>
              ` : ''}
              <button onclick="firebase.auth().signOut().then(() => window.location.href = '/')" 
                      class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
                <i class="fas fa-sign-out-alt mr-2"></i>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4">
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-purple-100 rounded-full p-4 mr-4">
                <i class="fas fa-users text-purple-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Résidents Actifs</p>
                <p class="text-3xl font-bold text-gray-800">${this.stats.activeResidents}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-blue-100 rounded-full p-4 mr-4">
                <i class="fas fa-clipboard-list text-blue-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Observations Aujourd'hui</p>
                <p class="text-3xl font-bold text-gray-800">${this.stats.todayObservations}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-green-100 rounded-full p-4 mr-4">
                <i class="fas fa-heartbeat text-green-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Total Résidents</p>
                <p class="text-3xl font-bold text-gray-800">${this.stats.totalResidents}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button onclick="window.location.href='/staff/residents'" 
                  class="bg-purple-500 text-white rounded-lg p-4 text-center hover:bg-purple-600 transition">
            <i class="fas fa-users text-3xl mb-2"></i>
            <h3 class="font-semibold">Gérer Résidents</h3>
          </button>
          <button onclick="staffDashboard.showAddResidentModal()" 
                  class="bg-blue-500 text-white rounded-lg p-4 text-center hover:bg-blue-600 transition">
            <i class="fas fa-user-plus text-3xl mb-2"></i>
            <h3 class="font-semibold">Nouveau Résident</h3>
          </button>
          <button onclick="alert('Fonctionnalité à venir')" 
                  class="bg-green-500 text-white rounded-lg p-4 text-center hover:bg-green-600 transition">
            <i class="fas fa-file-medical text-3xl mb-2"></i>
            <h3 class="font-semibold">Observations</h3>
          </button>
          <a href="/" 
             class="bg-gray-500 text-white rounded-lg p-4 text-center hover:bg-gray-600 transition">
            <i class="fas fa-home text-3xl mb-2"></i>
            <h3 class="font-semibold">Accueil</h3>
          </a>
        </div>

        <!-- Residents Table -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">
              <i class="fas fa-users text-purple-600 mr-2"></i>
              Liste des Résidents
            </h2>
          </div>
          
          ${this.residents.length === 0 ? `
            <div class="p-6 text-center text-gray-600">
              <i class="fas fa-inbox text-gray-400 text-4xl mb-3"></i>
              <p>Aucun résident enregistré</p>
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chambre</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${this.residents.slice(0, 10).map(resident => this.renderResidentRow(resident)).join('')}
                </tbody>
              </table>
            </div>
            ${this.residents.length > 10 ? `
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
                <a href="/staff/residents" class="text-purple-600 hover:text-purple-800 font-medium">
                  Voir tous les résidents (${this.residents.length}) →
                </a>
              </div>
            ` : ''}
          `}
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">
              <i class="fas fa-history text-blue-600 mr-2"></i>
              Activité Récente
            </h2>
          </div>
          
          ${this.recentLogs.length === 0 ? `
            <div class="p-6 text-center text-gray-600">
              <i class="fas fa-clock text-gray-400 text-4xl mb-3"></i>
              <p>Aucune activité récente</p>
            </div>
          ` : `
            <div class="divide-y divide-gray-200">
              ${this.recentLogs.map(log => this.renderLogItem(log)).join('')}
            </div>
          `}
        </div>
      </div>
    `
  }

  renderResidentRow(resident) {
    const admissionDate = resident.admission_date ? 
      new Date(resident.admission_date).toLocaleDateString('fr-CA') : 
      'N/A'
    
    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="bg-purple-100 rounded-full p-2 mr-3">
              <i class="fas fa-user text-purple-600"></i>
            </div>
            <span class="text-sm font-medium text-gray-900">${resident.full_name}</span>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          ${resident.room_number || 'N/A'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          ${admissionDate}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          ${resident.emergency_contact_name || 'N/A'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <button onclick="staffDashboard.viewResident('${resident.id}')" 
                  class="text-blue-600 hover:text-blue-800 font-medium mr-3">
            <i class="fas fa-eye mr-1"></i>
            Voir
          </button>
          <button onclick="staffDashboard.editResident('${resident.id}')" 
                  class="text-purple-600 hover:text-purple-800 font-medium">
            <i class="fas fa-edit mr-1"></i>
            Modifier
          </button>
        </td>
      </tr>
    `
  }

  renderLogItem(log) {
    const time = new Date(log.created_at).toLocaleString('fr-CA')
    const actionIcons = {
      'created_resident': 'fa-user-plus text-green-600',
      'updated_resident': 'fa-edit text-blue-600',
      'uploaded_document': 'fa-file-upload text-purple-600',
      'login': 'fa-sign-in-alt text-gray-600',
      'default': 'fa-circle text-gray-400'
    }
    const icon = actionIcons[log.action] || actionIcons['default']

    return `
      <div class="px-6 py-4 flex items-start">
        <div class="mr-4 mt-1">
          <i class="fas ${icon}"></i>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-900">${log.details || log.action}</p>
          <p class="text-xs text-gray-500 mt-1">
            ${log.user_name || 'Système'} - ${time}
          </p>
        </div>
      </div>
    `
  }

  async viewResident(residentId) {
    alert(`Détails du résident (ID: ${residentId})\n\nFonctionnalité en développement...`)
  }

  async editResident(residentId) {
    alert(`Modifier résident (ID: ${residentId})\n\nFonctionnalité en développement...`)
  }

  showAddResidentModal() {
    alert('Formulaire d\'ajout de résident\n\nFonctionnalité en développement...')
  }
}

// Initialize dashboard when DOM is ready
let staffDashboard
document.addEventListener('DOMContentLoaded', () => {
  staffDashboard = new StaffDashboard()
})
