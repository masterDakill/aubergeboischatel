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

    if (!window.firebaseAppInitialized) {
      this.renderInitError(window.firebaseInitError || 'Initialisation Firebase requise pour charger votre espace client.')
      return
    }

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
    this.hideLoading()
  }

  hideLoading() {
    const loading = document.getElementById('loading')
    if (loading) loading.style.display = 'none'
  }

  async checkAuth() {
    try {
      // Wait for Firebase to restore auth state
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
      const idToken = await this.getAuthToken()
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

  renderInitError(message) {
    this.hideLoading()
    const container = document.getElementById('dashboard-content')
    if (!container) return

    container.innerHTML = `
      <div class="max-w-3xl mx-auto mt-16 bg-white border border-red-100 text-red-700 rounded-2xl shadow-sm p-8 text-center">
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mx-auto mb-4">
          <i class="fas fa-triangle-exclamation"></i>
        </div>
        <h2 class="text-xl font-semibold mb-2">Impossible de démarrer l'espace client</h2>
        <p class="text-sm text-red-600">${message}</p>
      </div>
    `
  }

  render() {
    const container = document.getElementById('dashboard-content')
    if (!container) return

    container.innerHTML = `
      <!-- Header -->
      <div class="bg-white shadow-sm mb-6">
        <div class="max-w-7xl mx-auto px-4 py-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-blue-100 rounded-full p-4 mr-4">
                <i class="fas fa-users text-blue-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Proches suivis</p>
                <p class="text-3xl font-bold text-gray-800">${this.residents.length}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-green-100 rounded-full p-4 mr-4">
                <i class="fas fa-file-alt text-green-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Documents</p>
                <p class="text-3xl font-bold text-gray-800">${this.documents.length}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="bg-purple-100 rounded-full p-4 mr-4">
                <i class="fas fa-shield-alt text-purple-600 text-2xl"></i>
              </div>
              <div>
                <p class="text-gray-600 text-sm">Statut</p>
                <p class="text-xl font-bold text-green-600">Connecté</p>
              </div>
            </div>
          </div>
        </div>

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
              <a href="mailto:contact@aubergeboischatel.com" class="inline-block mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
                <i class="fas fa-envelope mr-2"></i>Contacter l'administration
              </a>
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
              <p class="text-gray-600">Aucun document disponible pour le moment</p>
              <p class="text-gray-500 text-sm mt-2">Les documents partagés par l'équipe apparaîtront ici</p>
            </div>
          ` : `
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Résident</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    ${this.documents.map(doc => this.renderDocumentRow(doc)).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `}
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <a href="/" class="bg-blue-500 text-white rounded-lg p-6 text-center hover:bg-blue-600 transition block">
            <i class="fas fa-home text-4xl mb-3"></i>
            <h3 class="text-lg font-semibold">Retour Accueil</h3>
            <p class="text-blue-100 text-sm mt-1">Voir le site principal</p>
          </a>
          <a href="/#visite-3d" class="bg-purple-500 text-white rounded-lg p-6 text-center hover:bg-purple-600 transition block">
            <i class="fas fa-cube text-4xl mb-3"></i>
            <h3 class="text-lg font-semibold">Visite 3D</h3>
            <p class="text-purple-100 text-sm mt-1">Explorer l'Auberge</p>
          </a>
          <a href="/#contact" class="bg-green-500 text-white rounded-lg p-6 text-center hover:bg-green-600 transition block">
            <i class="fas fa-envelope text-4xl mb-3"></i>
            <h3 class="text-lg font-semibold">Contact</h3>
            <p class="text-green-100 text-sm mt-1">Nous écrire</p>
          </a>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div class="flex items-start">
            <div class="bg-blue-100 rounded-full p-3 mr-4">
              <i class="fas fa-info-circle text-blue-600 text-xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-blue-800">Besoin d'aide?</h3>
              <p class="text-blue-700 text-sm mt-1">
                Si vous avez des questions concernant votre proche ou les services de L'Auberge Boischatel,
                n'hésitez pas à nous contacter au <strong>418-822-0347</strong> ou par courriel à
                <a href="mailto:contact@aubergeboischatel.com" class="underline">contact@aubergeboischatel.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Container -->
      <div id="modalContainer"></div>
    `
  }

  renderResidentCard(resident) {
    const admissionDate = resident.admission_date ?
      new Date(resident.admission_date).toLocaleDateString('fr-CA') : null

    return `
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div class="flex items-center">
            <div class="bg-white/20 rounded-full p-3 mr-4">
              <i class="fas fa-user text-white text-2xl"></i>
            </div>
            <div class="text-white">
              <h3 class="text-xl font-bold">${resident.resident_name || resident.full_name}</h3>
              <p class="text-blue-100 text-sm">Chambre ${resident.room_number || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-3">
          ${resident.relation ? `
            <div class="flex items-center text-gray-700">
              <i class="fas fa-heart text-red-400 w-6"></i>
              <span class="text-sm"><strong>Relation:</strong> ${resident.relation}</span>
            </div>
          ` : ''}

          ${admissionDate ? `
            <div class="flex items-center text-gray-700">
              <i class="fas fa-calendar text-blue-400 w-6"></i>
              <span class="text-sm"><strong>Admission:</strong> ${admissionDate}</span>
            </div>
          ` : ''}

          ${resident.emergency_contact_name ? `
            <div class="flex items-center text-gray-700">
              <i class="fas fa-phone text-green-400 w-6"></i>
              <span class="text-sm"><strong>Contact:</strong> ${resident.emergency_contact_name}</span>
            </div>
          ` : ''}
        </div>

        <div class="px-6 pb-6">
          <button onclick="clientDashboard.viewResidentDetails('${resident.resident_id || resident.id}')"
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
    const typeLabels = {
      'medical': 'Médical',
      'administrative': 'Administratif',
      'financial': 'Financier',
      'other': 'Autre'
    }

    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <i class="fas ${fileIcon} text-gray-400 mr-3 text-lg"></i>
            <span class="text-sm font-medium text-gray-900">${doc.title}</span>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          ${doc.resident_name || 'N/A'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            ${typeLabels[doc.document_type] || doc.document_type || 'Document'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          ${date}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          ${doc.file_url ? `
            <a href="${doc.file_url}" target="_blank"
               class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              <i class="fas fa-download mr-1"></i>
              Télécharger
            </a>
          ` : `
            <span class="text-gray-400">Non disponible</span>
          `}
        </td>
      </tr>
    `
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
      'png': 'fa-file-image text-purple-500',
      'zip': 'fa-file-archive text-yellow-500'
    }
    return icons[fileType?.toLowerCase()] || 'fa-file text-gray-400'
  }

  async viewResidentDetails(residentId) {
    const resident = this.residents.find(r => (r.resident_id || r.id) === residentId)
    if (!resident) return

    const admissionDate = resident.admission_date ?
      new Date(resident.admission_date).toLocaleDateString('fr-CA') : 'N/A'
    const birthDate = resident.date_of_birth ?
      new Date(resident.date_of_birth).toLocaleDateString('fr-CA') : 'N/A'

    const modal = `
      <div id="residentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center sticky top-0">
            <h3 class="text-xl font-bold text-white">
              <i class="fas fa-user mr-2"></i>
              ${resident.resident_name || resident.full_name}
            </h3>
            <button onclick="clientDashboard.closeModal('residentModal')" class="text-white/80 hover:text-white">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Info Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-blue-50 rounded-lg p-4 text-center">
                <i class="fas fa-door-open text-blue-600 text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Chambre</p>
                <p class="font-bold text-gray-800">${resident.room_number || 'N/A'}</p>
              </div>
              <div class="bg-purple-50 rounded-lg p-4 text-center">
                <i class="fas fa-calendar-alt text-purple-600 text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Admission</p>
                <p class="font-bold text-gray-800">${admissionDate}</p>
              </div>
              <div class="bg-green-50 rounded-lg p-4 text-center">
                <i class="fas fa-birthday-cake text-green-600 text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Naissance</p>
                <p class="font-bold text-gray-800">${birthDate}</p>
              </div>
              <div class="bg-red-50 rounded-lg p-4 text-center">
                <i class="fas fa-heart text-red-600 text-2xl mb-2"></i>
                <p class="text-xs text-gray-500">Relation</p>
                <p class="font-bold text-gray-800">${resident.relation || 'N/A'}</p>
              </div>
            </div>

            <!-- Contact d'urgence -->
            ${resident.emergency_contact_name ? `
              <div class="bg-orange-50 rounded-lg p-4">
                <h4 class="font-medium text-orange-800 mb-2">
                  <i class="fas fa-phone-alt mr-2"></i>Contact d'urgence
                </h4>
                <p class="text-gray-800">${resident.emergency_contact_name}</p>
                ${resident.emergency_contact_phone ? `
                  <a href="tel:${resident.emergency_contact_phone}" class="text-blue-600 hover:underline">
                    ${resident.emergency_contact_phone}
                  </a>
                ` : ''}
              </div>
            ` : ''}

            <!-- Documents du résident -->
            <div class="border-t pt-4">
              <h4 class="font-medium text-gray-800 mb-3">
                <i class="fas fa-file-alt text-green-600 mr-2"></i>
                Documents
              </h4>
              ${this.getResidentDocuments(residentId).length > 0 ? `
                <ul class="space-y-2">
                  ${this.getResidentDocuments(residentId).map(doc => `
                    <li class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div class="flex items-center">
                        <i class="fas ${this.getFileIcon(doc.file_type)} mr-3"></i>
                        <span class="text-sm">${doc.title}</span>
                      </div>
                      ${doc.file_url ? `
                        <a href="${doc.file_url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-sm">
                          <i class="fas fa-download"></i>
                        </a>
                      ` : ''}
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p class="text-gray-500 text-sm">Aucun document disponible</p>
              `}
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-3 pt-4 border-t">
              <a href="tel:418-822-0347"
                 class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center">
                <i class="fas fa-phone mr-2"></i>Appeler l'Auberge
              </a>
              <a href="mailto:contact@aubergeboischatel.com?subject=Question concernant ${encodeURIComponent(resident.resident_name || resident.full_name)}"
                 class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center">
                <i class="fas fa-envelope mr-2"></i>Envoyer un courriel
              </a>
            </div>
          </div>
        </div>
      </div>
    `

    document.getElementById('modalContainer').innerHTML = modal
  }

  getResidentDocuments(residentId) {
    return this.documents.filter(doc => doc.resident_id === residentId)
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) modal.remove()
  }

  showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    }

    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 3000)
  }
}

// Initialize dashboard when DOM is ready
let clientDashboard
document.addEventListener('DOMContentLoaded', () => {
  clientDashboard = new ClientDashboard()
})
