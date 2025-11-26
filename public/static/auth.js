/**
 * Firebase Authentication Manager for L'Auberge Boischatel
 * Handles client-side authentication with Firebase and synchronization with backend
 */

class AuthManager {
  constructor() {
    this.user = null
    this.firebaseUser = null
    this.initFirebase()
  }

  /**
   * Initialize Firebase with configuration from window.ENV
   */
  async initFirebase() {
    const hasEnv = Boolean(window.ENV && window.ENV.FIREBASE_API_KEY)
    if (!hasEnv) {
      console.error('❌ Firebase configuration not found in window.ENV')
      return
    }

    console.log('🔧 Initializing Firebase...')

    try {
      // Initialize Firebase (loaded via CDN) with guard to avoid duplicate apps
      if (window.ensureFirebaseInitialized) {
        const status = window.ensureFirebaseInitialized()
        if (!status.ok) {
          console.error('❌ Firebase initialization guard failed', status)
          return
        }
      } else if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp({
          apiKey: window.ENV.FIREBASE_API_KEY,
          authDomain: window.ENV.FIREBASE_AUTH_DOMAIN,
          projectId: window.ENV.FIREBASE_PROJECT_ID,
          storageBucket: window.ENV.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: window.ENV.FIREBASE_MESSAGING_SENDER_ID,
          appId: window.ENV.FIREBASE_APP_ID
        })
      }

      if (firebase.apps && firebase.apps.length > 0) {
        window.firebaseAppInitialized = true
      }

      this.auth = firebase.auth()

      // Listen for auth state changes
      this.auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          await this.handleAuthStateChanged(firebaseUser)
        } else {
          this.handleLogout()
        }
      })

      console.log('✅ Firebase initialized successfully')
    } catch (error) {
      console.error('❌ Firebase initialization error:', error)
    }
  }

  /**
   * Handle authentication state change
   * @param {firebase.User} firebaseUser Firebase user object
   */
  async handleAuthStateChanged(firebaseUser) {
    try {
      console.log('🔐 User logged in:', firebaseUser.email)

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken()

      // Sync with PostgreSQL via backend
      const response = await axios.post('/api/auth/syncUser', { idToken })

      if (response.data.success) {
        this.user = response.data.user
        this.firebaseUser = firebaseUser
        this.updateUI(true)
        console.log('✅ User synced:', this.user)
      } else {
        console.error('❌ Sync failed:', response.data.error)
        this.handleLogout()
      }
    } catch (error) {
      console.error('❌ Auth state error:', error)
      this.handleLogout()
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async signIn(email, password) {
    try {
      console.log('🔑 Signing in...', email)
      
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password)
      const idToken = await userCredential.user.getIdToken()

      // Sync with backend
      const response = await axios.post('/api/auth/syncUser', { idToken })

      if (response.data.success) {
        this.user = response.data.user
        this.firebaseUser = userCredential.user
        this.updateUI(true)
        this.closeModal()

        // Redirect based on role
        this.redirectByRole()

        return { success: true }
      } else {
        return { success: false, error: response.data.error }
      }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      }
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email User email
   * @param {string} password User password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async signUp(email, password) {
    try {
      console.log('📝 Signing up...', email)
      
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password)
      const idToken = await userCredential.user.getIdToken()

      // Sync with backend (creates user in PostgreSQL with CLIENT role by default)
      const response = await axios.post('/api/auth/syncUser', { idToken })

      if (response.data.success) {
        this.user = response.data.user
        this.firebaseUser = userCredential.user
        this.updateUI(true)
        this.closeModal()

        // Redirect to client dashboard
        window.location.href = '/client/dashboard'

        return { success: true }
      } else {
        return { success: false, error: response.data.error }
      }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      }
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await this.auth.signOut()
      this.handleLogout()
      window.location.href = '/'
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  /**
   * Handle logout (clear state)
   */
  handleLogout() {
    this.user = null
    this.firebaseUser = null
    this.updateUI(false)
    console.log('👋 User logged out')
  }

  /**
   * Update UI based on authentication state
   * @param {boolean} isLoggedIn Whether user is logged in
   */
  updateUI(isLoggedIn) {
    const loginButton = document.querySelector('.login-button')
    const userMenu = document.querySelector('.user-menu')

    if (isLoggedIn && this.user) {
      // Hide login button
      if (loginButton) loginButton.style.display = 'none'

      // Show user menu
      if (userMenu) {
        userMenu.style.display = 'block'
        
        // Update user info
        const avatar = userMenu.querySelector('.user-avatar')
        const nameSpan = userMenu.querySelector('.user-menu-button span')
        
        if (avatar) avatar.textContent = this.user.first_name.charAt(0).toUpperCase()
        if (nameSpan) nameSpan.textContent = this.user.first_name

        // Update dropdown links based on role
        this.updateMenuLinks()
      }
    } else {
      // Show login button
      if (loginButton) loginButton.style.display = 'inline-flex'
      
      // Hide user menu
      if (userMenu) userMenu.style.display = 'none'
    }
  }

  /**
   * Update menu dropdown links based on user role
   */
  updateMenuLinks() {
    const dropdown = document.querySelector('.user-dropdown')
    if (!dropdown) return

    let links = ''

    if (this.user.role === 'CLIENT') {
      links = `
        <a href="/client/dashboard" class="user-dropdown-item">
          <i class="fas fa-home"></i>
          Mon Espace
        </a>
        <a href="#" class="user-dropdown-item" onclick="authManager.signOut(); return false;">
          <i class="fas fa-sign-out-alt"></i>
          Déconnexion
        </a>
      `
    } else if (this.user.role === 'EMPLOYEE') {
      links = `
        <a href="/staff/dashboard" class="user-dropdown-item">
          <i class="fas fa-briefcase"></i>
          Tableau de Bord
        </a>
        <a href="#" class="user-dropdown-item" onclick="authManager.signOut(); return false;">
          <i class="fas fa-sign-out-alt"></i>
          Déconnexion
        </a>
      `
    } else if (this.user.role === 'ADMIN') {
      links = `
        <a href="/staff/dashboard" class="user-dropdown-item">
          <i class="fas fa-tachometer-alt"></i>
          Admin
        </a>
        <a href="#" class="user-dropdown-item" onclick="authManager.signOut(); return false;">
          <i class="fas fa-sign-out-alt"></i>
          Déconnexion
        </a>
      `
    }

    dropdown.innerHTML = links
  }

  /**
   * Redirect user based on role
   */
  redirectByRole() {
    if (!this.user) return

    setTimeout(() => {
      if (this.user.role === 'CLIENT') {
        window.location.href = '/client/dashboard'
      } else if (this.user.role === 'EMPLOYEE' || this.user.role === 'ADMIN') {
        window.location.href = '/staff/dashboard'
      }
    }, 1000)
  }

  /**
   * Open login modal
   */
  openModal() {
    const modal = document.getElementById('loginModal')
    if (modal) {
      modal.style.display = 'flex'
      // Reset to signin tab
      this.showSignInTab()
    }
  }

  /**
   * Close login modal
   */
  closeModal() {
    const modal = document.getElementById('loginModal')
    if (modal) {
      modal.style.display = 'none'
      // Reset forms
      const signinForm = document.getElementById('signinForm')
      const signupForm = document.getElementById('signupForm')
      if (signinForm) signinForm.reset()
      if (signupForm) signupForm.reset()
      // Clear errors
      const errors = document.querySelectorAll('.auth-error')
      errors.forEach(err => err.textContent = '')
    }
  }

  /**
   * Show sign in tab
   */
  showSignInTab() {
    document.getElementById('signinTab')?.classList.add('active')
    document.getElementById('signupTab')?.classList.remove('active')
    document.getElementById('signinForm')?.classList.add('active')
    document.getElementById('signupForm')?.classList.remove('active')
  }

  /**
   * Show sign up tab
   */
  showSignUpTab() {
    document.getElementById('signupTab')?.classList.add('active')
    document.getElementById('signinTab')?.classList.remove('active')
    document.getElementById('signupForm')?.classList.add('active')
    document.getElementById('signinForm')?.classList.remove('active')
  }

  /**
   * Get user-friendly error message
   * @param {string} code Firebase error code
   * @returns {string} User-friendly error message
   */
  getErrorMessage(code) {
    const messages = {
      'auth/invalid-email': 'Adresse email invalide',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/user-not-found': 'Aucun compte avec cet email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
      'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
      'auth/network-request-failed': 'Erreur réseau, vérifiez votre connexion'
    }
    return messages[code] || 'Erreur de connexion'
  }
}

// Initialize auth manager globally
const authManager = new AuthManager()

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Login button click
  const loginButton = document.querySelector('.login-button')
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      authManager.openModal()
    })
  }

  // Close modal on outside click
  const modal = document.getElementById('loginModal')
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        authManager.closeModal()
      }
    })
  }

  // Sign in form submit
  const signinForm = document.getElementById('signinForm')
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const email = document.getElementById('signinEmail').value
      const password = document.getElementById('signinPassword').value
      const submitBtn = document.getElementById('signinSubmit')
      const errorDiv = document.getElementById('signinError')
      
      // Disable button
      submitBtn.disabled = true
      submitBtn.textContent = 'Connexion en cours...'
      errorDiv.textContent = ''
      
      // Attempt sign in
      const result = await authManager.signIn(email, password)
      
      if (!result.success) {
        errorDiv.textContent = result.error
        submitBtn.disabled = false
        submitBtn.textContent = 'Se connecter'
      }
    })
  }

  // Sign up form submit
  const signupForm = document.getElementById('signupForm')
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      
      const email = document.getElementById('signupEmail').value
      const password = document.getElementById('signupPassword').value
      const confirmPassword = document.getElementById('signupConfirmPassword').value
      const submitBtn = document.getElementById('signupSubmit')
      const errorDiv = document.getElementById('signupError')
      
      // Validate passwords match
      if (password !== confirmPassword) {
        errorDiv.textContent = 'Les mots de passe ne correspondent pas'
        return
      }
      
      // Disable button
      submitBtn.disabled = true
      submitBtn.textContent = 'Création en cours...'
      errorDiv.textContent = ''
      
      // Attempt sign up
      const result = await authManager.signUp(email, password)
      
      if (!result.success) {
        errorDiv.textContent = result.error
        submitBtn.disabled = false
        submitBtn.textContent = 'Créer un compte'
      }
    })
  }
})
