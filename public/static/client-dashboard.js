/**
 * Client Dashboard JavaScript
 * L'Auberge Boischatel - Espace Famille
 */

class ClientDashboard {
  constructor() {
    this.user = null
    this.residents = []
    this.documents = []
    this.notifications = []
    this.init()
  }

  async init() {
    console.log('🏠 Initializing Client Dashboard')
    
    // Check authentication
    const isAuthenticated = await this.checkAuth()
    if (!isAuthenticated) {
      window.location.href = '/'
      return
    }

    await this.loadUserData()
    await this.loadResidents()
    await this.loadDocuments()
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
      console.log('✅ User data loaded:', this.user.email)
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      throw error
    }
  }

  async loadResidents() {
    try {
      // Residents are included in /api/auth/me response
      this.residents = this.user.residents || []
      console.log(`✅ Loaded ${this.residents.length} linked residents`)
    } catch (error) {
      console.error('❌ Error loading residents:', error)
    }
  }

  async loadDocuments() {
    try {
      const idToken = await firebase.auth().currentUser.getIdToken()
      const response = await axios.get('/api/documents', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })
      
      this.documents = response.data
      console.log(`✅ Loaded ${this.documents.length} documents`)
    } catch (error) {
      console.error('❌ Error loading documents:', error)
      this.documents = []
    }
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
                <i class="fas fa-home text-blue-600 mr-2"></i>
                Bonjour, ${this.user.first_name || 'Client'}
              </h1>
              <p class="text-gray-600 mt-1">L'Auberge Boischatel - Espace Famille</p>
            </div>
            <button onclick="firebase.auth().signOut().then(() => window.location.href = '/')" 
                    class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
              <i class="fas fa-sign-out-alt mr-2"></i>
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4">
        
        <!-- Residents Section -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-users text-blue-600 mr-2"></i>
              Mes Proches
            </h2>
          </div>
          
          ${this.residents.length === 0 ? `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <i class="fas fa-info-circle text-yellow-600 text-3xl mb-3"></i>
              <p class="text-yellow-800 font-medium">Aucun résident lié à votre compte</p>
              <p class="text-yellow-700 text-sm mt-2">
                Contactez l'administration pour lier votre compte à un résident
              </p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${this.residents.map(resident => this.renderResidentCard(resident)).join('')}
            </div>
          `}
        </div>

        <!-- Documents Section -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-file-alt text-green-600 mr-2"></i>
              Documents Partagés
            </h2>
          </div>
          
          ${this.documents.length === 0 ? `
            <div class="bg-gray-50 rounded-lg p-6 text-center">
              <i class="fas fa-folder-open text-gray-400 text-3xl mb-3"></i>
              <p class="text-gray-600">Aucun document disponible</p>
            </div>
          ` : `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résident</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  ${this.documents.map(doc => this.renderDocumentRow(doc)).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a href="/" class="bg-blue-500 text-white rounded-lg p-6 text-center hover:bg-blue-600 transition">
            <i class="fas fa-home text-4xl mb-3"></i>
            <h3 class="text-lg font-semibold">Retour Accueil</h3>
          </a>
          <button onclick="alert('Fonctionnalité à venir')" class="bg-purple-500 text-white rounded-lg p-6 text-center hover:bg-purple-600 transition">
            <i class="fas fa-calendar text-4xl mb-3"></i>
            <h3 class="text-lg font-semibold">Activités</h3>
          </button>
          <a href="mailto:admin@aubergeboischatel.com" class="bg-green-500 text-white rounded-lg p-6 text-center hover:bg-green-600 transition">
            <i class="fas fa-envelope text-4xl mb-3"></i>
            <h3 class="text-lg font-semibold">Contact</h3>
          </a>
        </div>
      </div>
    `
  }

  renderResidentCard(resident) {
    return `
      <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        <div class="flex items-center mb-4">
          <div class="bg-blue-100 rounded-full p-3 mr-4">
            <i class="fas fa-user text-blue-600 text-2xl"></i>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-800">${resident.resident_name}</h3>
            <p class="text-sm text-gray-600">Chambre ${resident.room_number || 'N/A'}</p>
          </div>
        </div>
        
        <div class="space-y-2 text-sm">
          <div class="flex items-center text-gray-700">
            <i class="fas fa-link text-gray-400 w-5 mr-2"></i>
            <span><strong>Relation:</strong> ${resident.relation || 'N/A'}</span>
          </div>
          ${resident.admission_date ? `
            <div class="flex items-center text-gray-700">
              <i class="fas fa-calendar text-gray-400 w-5 mr-2"></i>
              <span><strong>Admission:</strong> ${new Date(resident.admission_date).toLocaleDateString('fr-CA')}</span>
            </div>
          ` : ''}
          ${resident.emergency_contact_name ? `
            <div class="flex items-center text-gray-700">
              <i class="fas fa-phone text-gray-400 w-5 mr-2"></i>
              <span><strong>Contact:</strong> ${resident.emergency_contact_name}</span>
            </div>
          ` : ''}
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <button onclick="clientDashboard.viewResidentDetails('${resident.resident_id}')" 
                  class="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
            <i class="fas fa-eye mr-2"></i>
            Voir détails
          </button>
        </div>
      </div>
    `
  }

  renderDocumentRow(doc) {
    const date = new Date(doc.created_at).toLocaleDateString('fr-CA')
    const fileIcon = this.getFileIcon(doc.file_type)
    
    return `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <i class="fas ${fileIcon} text-gray-400 mr-3"></i>
            <span class="text-sm font-medium text-gray-900">${doc.title}</span>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          ${doc.resident_name || 'N/A'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          ${date}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <a href="${doc.file_url}" target="_blank" 
             class="text-blue-600 hover:text-blue-800 font-medium">
            <i class="fas fa-download mr-1"></i>
            Télécharger
          </a>
        </td>
      </tr>
    `
  }

  getFileIcon(fileType) {
    const icons = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'zip': 'fa-file-archive'
    }
    return icons[fileType?.toLowerCase()] || 'fa-file'
  }

  async viewResidentDetails(residentId) {
    alert(`Détails du résident (ID: ${residentId})\n\nFonctionnalité en développement...`)
  }
}

// Initialize dashboard when DOM is ready
let clientDashboard
document.addEventListener('DOMContentLoaded', () => {
  clientDashboard = new ClientDashboard()
})
