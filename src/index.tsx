import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.get('/api/contact', (c) => {
  return c.json({ 
    email: 'admin@aubergeboischatel.com',
    phone: '418-XXX-XXXX',
    address: '5424 Avenue Royale, Boischatel, QC G0A 1H0'
  })
})

app.post('/api/contact', async (c) => {
  try {
    const body = await c.req.json()
    const { name, email, phone, message, visitDate } = body
    
    // Basic validation
    if (!name || !email || !message) {
      return c.json({ success: false, error: 'Champs requis manquants' }, 400)
    }
    
    // TODO: Integrate email service (SendGrid, Mailgun, etc.)
    console.log('Contact reçu:', { name, email, phone, message, visitDate })
    
    return c.json({ 
      success: true, 
      message: 'Merci ! Nous vous contacterons sous peu.' 
    })
  } catch (error) {
    return c.json({ success: false, error: 'Erreur serveur' }, 500)
  }
})

// Main page
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="L'Auberge Boischatel - Résidence pour aînés à Boischatel. Innovation bienveillante au service de la vie quotidienne. 38 unités, milieu chaleureux et sécuritaire.">
    <meta name="keywords" content="résidence aînés, Boischatel, RPA, innovation, sécurité, conformité, Québec">
    <meta name="author" content="L'Auberge Boischatel">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://aubergeboischatel.com/">
    <meta property="og:title" content="L'Auberge Boischatel - Innovation Bienveillante">
    <meta property="og:description" content="Innovation bienveillante au service de la vie quotidienne">
    <meta property="og:image" content="/static/images/facade.jpg">
    
    <title>L'Auberge Boischatel - Résidence pour Aînés</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/enhanced-styles.css" rel="stylesheet">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --blue-grey: #5A7D8C;
            --sage-green: #A9C7B5;
            --cream: #F5F4F2;
            --anthracite: #1F1F1F;
            --copper: #C9A472;
            --white: #FFFFFF;
            --text-dark: #2C2C2C;
            --text-muted: #6B7280;
            --font-serif: 'Lora', Georgia, serif;
            --font-sans: 'Inter', -apple-system, sans-serif;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--cream);
            color: var(--text-dark);
            overflow-x: hidden;
            line-height: 1.7;
        }

        /* Navigation */
        nav {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.97);
            backdrop-filter: blur(10px);
            z-index: 1000;
            box-shadow: 0 2px 20px rgba(90, 125, 140, 0.08);
            transition: all 0.3s ease;
        }

        .nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: var(--anthracite);
        }

        .logo-icon {
            width: 50px;
            height: 50px;
            background: url('/static/images/logo.png') no-repeat center;
            background-size: contain;
        }

        .logo-text {
            font-family: var(--font-serif);
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--blue-grey);
        }

        .nav-links {
            display: flex;
            gap: 2.5rem;
            list-style: none;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--text-dark);
            font-weight: 500;
            font-size: 0.95rem;
            transition: color 0.3s;
            position: relative;
        }

        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--copper);
            transition: width 0.3s;
        }

        .nav-links a:hover {
            color: var(--blue-grey);
        }

        .nav-links a:hover::after {
            width: 100%;
        }

        /* Hero Section - Modern & Airy */
        .hero {
            margin-top: 80px;
            min-height: 90vh;
            display: grid;
            grid-template-columns: 1fr 1fr;
            background: linear-gradient(135deg, var(--cream) 0%, #FFFFFF 100%);
        }

        .hero-left {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 4rem;
            max-width: 650px;
        }

        .hero-badge {
            display: inline-block;
            padding: 0.5rem 1.25rem;
            background: linear-gradient(135deg, var(--sage-green) 0%, var(--blue-grey) 100%);
            color: white;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 2rem;
            width: fit-content;
        }

        .hero-title {
            font-family: var(--font-serif);
            font-size: 3.5rem;
            font-weight: 600;
            color: var(--anthracite);
            line-height: 1.2;
            margin-bottom: 1.5rem;
        }

        .hero-subtitle {
            font-size: 1.3rem;
            color: var(--blue-grey);
            font-weight: 500;
            margin-bottom: 1rem;
        }

        .hero-tagline {
            font-size: 1.1rem;
            color: var(--text-muted);
            margin-bottom: 2.5rem;
            line-height: 1.8;
        }

        .hero-cta-group {
            display: flex;
            gap: 1rem;
        }

        .hero-cta {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            background: var(--blue-grey);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(90, 125, 140, 0.2);
        }

        .hero-cta:hover {
            background: var(--anthracite);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(90, 125, 140, 0.3);
        }

        .hero-cta-secondary {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            background: transparent;
            color: var(--blue-grey);
            text-decoration: none;
            border-radius: 8px;
            border: 2px solid var(--blue-grey);
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s;
        }

        .hero-cta-secondary:hover {
            background: var(--blue-grey);
            color: white;
        }

        .hero-right {
            background: url('/static/images/facade.jpg') center/cover;
            position: relative;
            border-radius: 0 0 0 100px;
        }

        .hero-right::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(90, 125, 140, 0.1) 0%, rgba(169, 199, 181, 0.15) 100%);
            border-radius: 0 0 0 100px;
        }

        /* Section Styling */
        section {
            padding: 5rem 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }

        .section-badge {
            display: inline-block;
            padding: 0.4rem 1rem;
            background: var(--sage-green);
            color: white;
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
        }

        .section-title {
            font-family: var(--font-serif);
            font-size: 2.8rem;
            color: var(--anthracite);
            font-weight: 600;
            margin-bottom: 1rem;
        }

        .section-subtitle {
            font-size: 1.2rem;
            color: var(--text-muted);
            max-width: 700px;
            margin: 0 auto;
        }

        /* Mission & Values Section */
        .mission-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
            margin-bottom: 5rem;
        }

        .mission-text h3 {
            font-family: var(--font-serif);
            font-size: 2rem;
            color: var(--blue-grey);
            margin-bottom: 1.5rem;
        }

        .mission-text p {
            font-size: 1.1rem;
            line-height: 1.9;
            color: var(--text-dark);
            margin-bottom: 1rem;
        }

        .mission-image {
            width: 100%;
            height: 500px;
            border-radius: 20px;
            object-fit: cover;
            box-shadow: 0 20px 60px rgba(90, 125, 140, 0.15);
        }

        .values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }

        .value-card {
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.08);
            transition: all 0.3s;
            border: 1px solid rgba(169, 199, 181, 0.2);
        }

        .value-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 40px rgba(90, 125, 140, 0.15);
        }

        .value-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, var(--sage-green) 0%, var(--blue-grey) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            color: white;
        }

        .value-card h4 {
            font-family: var(--font-serif);
            font-size: 1.4rem;
            color: var(--anthracite);
            margin-bottom: 1rem;
        }

        .value-card p {
            color: var(--text-muted);
            line-height: 1.7;
        }

        /* About Section - Young Owners */
        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
        }

        .about-content h3 {
            font-family: var(--font-serif);
            font-size: 2.2rem;
            color: var(--blue-grey);
            margin-bottom: 1.5rem;
        }

        .about-content p {
            font-size: 1.05rem;
            line-height: 1.9;
            color: var(--text-dark);
            margin-bottom: 1.5rem;
        }

        .about-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-top: 2rem;
        }

        .stat-item {
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, var(--sage-green) 0%, var(--blue-grey) 100%);
            border-radius: 12px;
            color: white;
        }

        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            display: block;
        }

        .stat-label {
            font-size: 0.9rem;
            opacity: 0.95;
        }

        /* Security & Compliance Section */
        .security-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem;
            margin-top: 3rem;
        }

        .security-card {
            background: white;
            padding: 3rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.08);
            border-left: 4px solid var(--copper);
        }

        .security-card h4 {
            font-family: var(--font-serif);
            font-size: 1.6rem;
            color: var(--anthracite);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .security-card h4 i {
            color: var(--copper);
            font-size: 1.8rem;
        }

        .security-list {
            list-style: none;
            padding: 0;
        }

        .security-list li {
            padding: 0.75rem 0;
            color: var(--text-dark);
            display: flex;
            align-items: start;
            gap: 0.75rem;
        }

        .security-list li i {
            color: var(--sage-green);
            margin-top: 0.25rem;
        }

        /* Rooms & Services */
        .rooms-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2.5rem;
            margin-top: 3rem;
        }

        .room-card {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.08);
            transition: all 0.3s;
        }

        .room-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 40px rgba(90, 125, 140, 0.15);
        }

        .room-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
        }

        .room-content {
            padding: 2rem;
        }

        .room-content h4 {
            font-family: var(--font-serif);
            font-size: 1.5rem;
            color: var(--anthracite);
            margin-bottom: 1rem;
        }

        .room-features {
            list-style: none;
            padding: 0;
            margin: 1.5rem 0;
        }

        .room-features li {
            padding: 0.5rem 0;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .room-features li i {
            color: var(--sage-green);
        }

        /* Activities Section */
        .activities-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-top: 3rem;
        }

        .activity-card {
            background: white;
            padding: 2.5rem;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.08);
            transition: all 0.3s;
        }

        .activity-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(90, 125, 140, 0.12);
        }

        .activity-icon {
            font-size: 3rem;
            color: var(--copper);
            margin-bottom: 1.5rem;
        }

        .activity-card h4 {
            font-family: var(--font-serif);
            font-size: 1.3rem;
            color: var(--anthracite);
            margin-bottom: 1rem;
        }

        .activity-card p {
            color: var(--text-muted);
            line-height: 1.7;
        }

        /* Meals Section */
        .meals-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
        }

        .meals-image {
            width: 100%;
            height: 500px;
            border-radius: 20px;
            object-fit: cover;
            box-shadow: 0 20px 60px rgba(90, 125, 140, 0.15);
        }

        .meals-text h3 {
            font-family: var(--font-serif);
            font-size: 2rem;
            color: var(--blue-grey);
            margin-bottom: 1.5rem;
        }

        .meals-text p {
            font-size: 1.05rem;
            line-height: 1.9;
            color: var(--text-dark);
            margin-bottom: 1.5rem;
        }

        .meals-features {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .meal-feature {
            display: flex;
            align-items: start;
            gap: 1rem;
        }

        .meal-feature i {
            color: var(--copper);
            font-size: 1.5rem;
            margin-top: 0.25rem;
        }

        .meal-feature div h5 {
            font-size: 1.1rem;
            color: var(--anthracite);
            margin-bottom: 0.5rem;
        }

        .meal-feature div p {
            font-size: 0.95rem;
            color: var(--text-muted);
            margin: 0;
        }

        /* Gallery */
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 3rem;
        }

        .gallery-item {
            position: relative;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.1);
            transition: all 0.3s;
        }

        .gallery-item:hover {
            transform: scale(1.03);
            box-shadow: 0 8px 30px rgba(90, 125, 140, 0.2);
        }

        .gallery-item img {
            width: 100%;
            height: 300px;
            object-fit: cover;
            display: block;
        }

        .gallery-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(31, 31, 31, 0.9), transparent);
            color: white;
            padding: 2rem 1.5rem 1.5rem;
            transform: translateY(100%);
            transition: transform 0.3s;
        }

        .gallery-item:hover .gallery-overlay {
            transform: translateY(0);
        }

        .gallery-overlay h4 {
            font-family: var(--font-serif);
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
        }

        .gallery-overlay p {
            font-size: 0.9rem;
            opacity: 0.9;
        }

        /* Contact Section */
        .contact-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            margin-top: 3rem;
        }

        .contact-info {
            background: white;
            padding: 3rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.08);
        }

        .contact-info h3 {
            font-family: var(--font-serif);
            font-size: 1.8rem;
            color: var(--anthracite);
            margin-bottom: 2rem;
        }

        .contact-item {
            display: flex;
            align-items: start;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .contact-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--sage-green) 0%, var(--blue-grey) 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.3rem;
        }

        .contact-item-content h4 {
            font-size: 1.1rem;
            color: var(--anthracite);
            margin-bottom: 0.5rem;
        }

        .contact-item-content p {
            color: var(--text-muted);
        }

        .contact-form {
            background: white;
            padding: 3rem;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.08);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            font-weight: 600;
            color: var(--anthracite);
            margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 1rem;
            border: 2px solid rgba(169, 199, 181, 0.3);
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: 1rem;
            transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--blue-grey);
        }

        .form-group textarea {
            resize: vertical;
            min-height: 150px;
        }

        .submit-btn {
            width: 100%;
            padding: 1.25rem;
            background: var(--blue-grey);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s;
        }

        .submit-btn:hover {
            background: var(--anthracite);
        }

        .map-container {
            margin-top: 4rem;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(90, 125, 140, 0.1);
        }

        .map-container iframe {
            width: 100%;
            height: 450px;
            border: none;
        }

        /* Footer */
        footer {
            background: var(--anthracite);
            color: white;
            padding: 4rem 2rem 2rem;
        }

        .footer-content {
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 4rem;
            padding-bottom: 3rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-brand img {
            width: 60px;
            margin-bottom: 1.5rem;
        }

        .footer-brand h3 {
            font-family: var(--font-serif);
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }

        .footer-brand p {
            color: rgba(255, 255, 255, 0.7);
            line-height: 1.8;
        }

        .footer-section h4 {
            font-size: 1.1rem;
            margin-bottom: 1.5rem;
            color: var(--copper);
        }

        .footer-links {
            list-style: none;
            padding: 0;
        }

        .footer-links li {
            margin-bottom: 0.75rem;
        }

        .footer-links a {
            color: rgba(255, 255, 255, 0.7);
            text-decoration: none;
            transition: color 0.3s;
        }

        .footer-links a:hover {
            color: white;
        }

        .footer-bottom {
            max-width: 1400px;
            margin: 0 auto;
            padding-top: 2rem;
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .hero {
                grid-template-columns: 1fr;
            }
            
            .hero-right {
                min-height: 500px;
                border-radius: 0 0 50px 50px;
            }

            .mission-content,
            .about-grid,
            .meals-content,
            .contact-container {
                grid-template-columns: 1fr;
            }

            .security-grid {
                grid-template-columns: 1fr;
            }

            .activities-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .footer-content {
                grid-template-columns: 1fr 1fr;
            }
        }

        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }

            .hero-title {
                font-size: 2.5rem;
            }

            .section-title {
                font-size: 2rem;
            }

            .values-grid,
            .activities-grid,
            .rooms-grid {
                grid-template-columns: 1fr;
            }

            .about-stats {
                grid-template-columns: 1fr;
            }

            .meals-features {
                grid-template-columns: 1fr;
            }

            .footer-content {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <nav>
        <div class="nav-container">
            <a href="#accueil" class="logo">
                <div class="logo-icon"></div>
                <span class="logo-text">L'Auberge Boischatel</span>
            </a>
            <ul class="nav-links">
                <li><a href="#accueil">Accueil</a></li>
                <li><a href="#mission">Mission & Valeurs</a></li>
                <li><a href="#apropos">À Propos</a></li>
                <li><a href="#chambres">Chambres</a></li>
                <li><a href="#securite">Sécurité</a></li>
                <li><a href="#activites">Activités</a></li>
                <li><a href="#repas">Repas</a></li>
                <li><a href="#galerie">Galerie</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section class="hero" id="accueil">
        <div class="hero-left">
            <span class="hero-badge">Résidence Certifiée RPA</span>
            <h1 class="hero-title">Bienvenue chez vous</h1>
            <p class="hero-subtitle">Innovation bienveillante au service de la vie quotidienne</p>
            <p class="hero-tagline">Une résidence à taille humaine (38 unités), dirigée par une jeune équipe dynamique, où modernité et chaleur s'harmonisent pour créer un milieu de vie sécuritaire et épanouissant.</p>
            <div class="hero-cta-group">
                <a href="#contact" class="hero-cta">
                    <i class="fas fa-calendar-check"></i>
                    Planifier une visite
                </a>
                <a href="#chambres" class="hero-cta-secondary">
                    <i class="fas fa-door-open"></i>
                    Voir les chambres
                </a>
            </div>
        </div>
        <div class="hero-right"></div>
    </section>

    <section id="mission">
        <div class="section-header">
            <span class="section-badge">Notre Mission</span>
            <h2 class="section-title">Innovation Bienveillante</h2>
            <p class="section-subtitle">Au cœur de notre engagement : allier technologies de pointe et humanité pour créer un environnement où chaque résident se sent chez lui, en sécurité et respecté.</p>
        </div>

        <div class="mission-content">
            <div class="mission-text">
                <h3>Une vision moderne du bien-vieillir</h3>
                <p>L'Auberge Boischatel incarne une nouvelle génération de résidence pour aînés, où l'innovation technologique se met au service du confort quotidien et de la sécurité de nos résidents.</p>
                <p>Dirigée par de jeunes propriétaires passionnés, notre résidence conjugue le charme patrimonial d'une architecture victorienne avec les standards les plus élevés en matière de sécurité et de bien-être.</p>
                <p>Notre approche ? Rester à l'écoute, anticiper les besoins, et améliorer constamment notre milieu de vie pour offrir à nos 38 résidents un environnement chaleureux, stimulant et rassurant.</p>
            </div>
            <img src="/static/images/facade.jpg" alt="L'Auberge Boischatel" class="mission-image">
        </div>

        <div class="values-grid">
            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-heart"></i>
                </div>
                <h4>Bienveillance</h4>
                <p>Une équipe attentive, à l'écoute, qui traite chaque résident avec respect, dignité et empathie au quotidien.</p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <h4>Innovation</h4>
                <p>Des technologies modernes intégrées naturellement pour améliorer le confort, la sécurité et l'autonomie de nos résidents.</p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h4>Sécurité</h4>
                <p>Conformité RPA exemplaire, systèmes incendie de pointe, et environnement sécuritaire pensé pour la tranquillité d'esprit.</p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-seedling"></i>
                </div>
                <h4>Fraîcheur</h4>
                <p>Une jeune équipe dynamique qui apporte un vent de renouveau et d'énergie positive au quotidien.</p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <h4>Vision</h4>
                <p>Un engagement constant vers l'amélioration continue et l'excellence dans tous les aspects de notre service.</p>
            </div>
        </div>
    </section>

    <section id="apropos" style="background: white;">
        <div class="section-header">
            <span class="section-badge">À Propos</span>
            <h2 class="section-title">Une nouvelle génération de propriétaires</h2>
            <p class="section-subtitle">L'Auberge Boischatel est dirigée par une jeune équipe passionnée, déterminée à redéfinir l'expérience de vie en résidence pour aînés.</p>
        </div>

        <div class="about-grid">
            <img src="/static/images/vue-nocturne.jpg" alt="Équipe" class="mission-image">
            <div class="about-content">
                <h3>Un engagement humain et moderne</h3>
                <p>Acquise récemment par de jeunes entrepreneurs visionnaires, L'Auberge Boischatel bénéficie d'une gestion dynamique, attentive aux besoins actuels et futurs de nos aînés.</p>
                <p>Nous avons investi dans la modernisation de nos installations, tout en préservant le charme patrimonial qui fait l'identité de notre résidence victorienne située au cœur de Boischatel.</p>
                <p>Notre objectif : créer un milieu de vie où technologie et humanité se côtoient harmonieusement, où sécurité rime avec confort, et où chaque jour est une occasion de se sentir chez soi.</p>

                <div class="about-stats">
                    <div class="stat-item">
                        <span class="stat-number">38</span>
                        <span class="stat-label">Unités</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">24/7</span>
                        <span class="stat-label">Assistance</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">100%</span>
                        <span class="stat-label">Conforme RPA</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="securite">
        <div class="section-header">
            <span class="section-badge">Sécurité & Conformité</span>
            <h2 class="section-title">Votre tranquillité d'esprit, notre priorité</h2>
            <p class="section-subtitle">Conformité RPA Québec exemplaire et systèmes de sécurité incendie de dernière génération pour assurer la protection de tous nos résidents.</p>
        </div>

        <div class="security-grid">
            <div class="security-card">
                <h4>
                    <i class="fas fa-fire-extinguisher"></i>
                    Sécurité Incendie Exemplaire
                </h4>
                <ul class="security-list">
                    <li><i class="fas fa-check-circle"></i>Système de gicleurs automatiques complet</li>
                    <li><i class="fas fa-check-circle"></i>Détecteurs de fumée interconnectés dans chaque unité</li>
                    <li><i class="fas fa-check-circle"></i>Alarmes sonores et visuelles centralisées</li>
                    <li><i class="fas fa-check-circle"></i>Portes coupe-feu et issues de secours éclairées</li>
                    <li><i class="fas fa-check-circle"></i>Exercices d'évacuation réguliers et formation du personnel</li>
                    <li><i class="fas fa-check-circle"></i>Inspections et entretien préventif rigoureux</li>
                </ul>
            </div>

            <div class="security-card">
                <h4>
                    <i class="fas fa-certificate"></i>
                    Conformité RPA Québec
                </h4>
                <ul class="security-list">
                    <li><i class="fas fa-check-circle"></i>Certification RPA à jour et affichée</li>
                    <li><i class="fas fa-check-circle"></i>Respect intégral de la Loi sur les services de santé</li>
                    <li><i class="fas fa-check-circle"></i>Personnel formé selon les normes provinciales</li>
                    <li><i class="fas fa-check-circle"></i>Plans d'intervention d'urgence approuvés</li>
                    <li><i class="fas fa-check-circle"></i>Registres et documentation à jour</li>
                    <li><i class="fas fa-check-circle"></i>Audits et inspections régulières réussies</li>
                </ul>
            </div>

            <div class="security-card">
                <h4>
                    <i class="fas fa-user-shield"></i>
                    Sécurité Quotidienne
                </h4>
                <ul class="security-list">
                    <li><i class="fas fa-check-circle"></i>Surveillance 24/7 par personnel qualifié</li>
                    <li><i class="fas fa-check-circle"></i>Système d'appel d'urgence dans chaque chambre</li>
                    <li><i class="fas fa-check-circle"></i>Accès contrôlé aux entrées principales</li>
                    <li><i class="fas fa-check-circle"></i>Éclairage extérieur automatique et sécurisé</li>
                    <li><i class="fas fa-check-circle"></i>Protocoles d'urgence médicale établis</li>
                    <li><i class="fas fa-check-circle"></i>Partenariats avec services d'urgence locaux</li>
                </ul>
            </div>

            <div class="security-card">
                <h4>
                    <i class="fas fa-laptop-medical"></i>
                    Technologies Innovantes
                </h4>
                <ul class="security-list">
                    <li><i class="fas fa-check-circle"></i>Systèmes de surveillance modernes et discrets</li>
                    <li><i class="fas fa-check-circle"></i>Contrôles d'accès électroniques sécurisés</li>
                    <li><i class="fas fa-check-circle"></i>Thermostats intelligents pour le confort</li>
                    <li><i class="fas fa-check-circle"></i>Éclairage automatique dans les corridors</li>
                    <li><i class="fas fa-check-circle"></i>Dossiers résidents numériques sécurisés</li>
                    <li><i class="fas fa-check-circle"></i>Communication instantanée avec les familles</li>
                </ul>
            </div>
        </div>
    </section>

    <section id="chambres" style="background: white;">
        <div class="section-header">
            <span class="section-badge">Chambres & Services</span>
            <h2 class="section-title">Votre chez-vous, conçu pour vous</h2>
            <p class="section-subtitle">Des espaces lumineux, confortables et entièrement adaptés, pensés pour favoriser l'autonomie et le bien-être.</p>
        </div>

        <div class="rooms-grid">
            <div class="room-card">
                <img src="/static/images/chambre.png" alt="Chambre Standard" class="room-image">
                <div class="room-content">
                    <h4>Chambre Standard</h4>
                    <p>Espace confortable et lumineux, idéal pour une vie autonome et sereine.</p>
                    <ul class="room-features">
                        <li><i class="fas fa-bed"></i>Lit médicalisé ajustable</li>
                        <li><i class="fas fa-couch"></i>Coin salon avec fauteuil</li>
                        <li><i class="fas fa-bathroom"></i>Salle de bain privée adaptée</li>
                        <li><i class="fas fa-phone-alt"></i>Système d'appel d'urgence</li>
                        <li><i class="fas fa-wifi"></i>Internet haute vitesse</li>
                        <li><i class="fas fa-tv"></i>Câblodistribution incluse</li>
                    </ul>
                    <a href="#contact" class="hero-cta" style="width: 100%; justify-content: center;">Informations et tarifs</a>
                </div>
            </div>

            <div class="room-card">
                <img src="/static/images/salle-manger.png" alt="Services inclus" class="room-image">
                <div class="room-content">
                    <h4>Services Inclus</h4>
                    <p>Un ensemble complet de services pour votre confort quotidien.</p>
                    <ul class="room-features">
                        <li><i class="fas fa-utensils"></i>3 repas équilibrés par jour</li>
                        <li><i class="fas fa-broom"></i>Entretien ménager quotidien</li>
                        <li><i class="fas fa-tshirt"></i>Buanderie et entretien du linge</li>
                        <li><i class="fas fa-pills"></i>Assistance médicaments</li>
                        <li><i class="fas fa-users"></i>Activités sociales variées</li>
                        <li><i class="fas fa-bell"></i>Surveillance 24/7</li>
                    </ul>
                    <a href="#contact" class="hero-cta" style="width: 100%; justify-content: center;">Contactez-nous</a>
                </div>
            </div>

            <div class="room-card">
                <img src="/static/images/jardin.jpg" alt="Espaces Communs" class="room-image">
                <div class="room-content">
                    <h4>Espaces Communs</h4>
                    <p>Des lieux conviviaux pour se rassembler, socialiser et profiter.</p>
                    <ul class="room-features">
                        <li><i class="fas fa-home"></i>Salons chaleureux et lumineux</li>
                        <li><i class="fas fa-tree"></i>Jardins paysagers accessibles</li>
                        <li><i class="fas fa-chair"></i>Terrasses aménagées</li>
                        <li><i class="fas fa-book"></i>Bibliothèque et coin lecture</li>
                        <li><i class="fas fa-puzzle-piece"></i>Salle de jeux et activités</li>
                        <li><i class="fas fa-mug-hot"></i>Cafétéria accueillante</li>
                    </ul>
                    <a href="#galerie" class="hero-cta-secondary" style="width: 100%; justify-content: center;">Voir la galerie</a>
                </div>
            </div>
        </div>
    </section>

    <section id="activites">
        <div class="section-header">
            <span class="section-badge">Activités & Milieu de Vie</span>
            <h2 class="section-title">Une vie sociale riche et stimulante</h2>
            <p class="section-subtitle">Parce que vieillir ne signifie pas s'isoler, nous proposons quotidiennement des activités variées, adaptées et conviviales.</p>
        </div>

        <div class="activities-grid">
            <div class="activity-card">
                <div class="activity-icon"><i class="fas fa-music"></i></div>
                <h4>Musique & Spectacles</h4>
                <p>Concerts, musiciens invités, chants de groupe et soirées thématiques pour cultiver la joie et le partage.</p>
            </div>

            <div class="activity-card">
                <div class="activity-icon"><i class="fas fa-palette"></i></div>
                <h4>Arts & Créativité</h4>
                <p>Ateliers d'arts plastiques, peinture, bricolage et artisanat pour stimuler la créativité et l'expression personnelle.</p>
            </div>

            <div class="activity-card">
                <div class="activity-icon"><i class="fas fa-dumbbell"></i></div>
                <h4>Activités Physiques</h4>
                <p>Yoga doux, marche en groupe, exercices adaptés pour maintenir la mobilité et le bien-être physique.</p>
            </div>

            <div class="activity-card">
                <div class="activity-icon"><i class="fas fa-gamepad"></i></div>
                <h4>Jeux & Loisirs</h4>
                <p>Bingo, cartes, jeux de société, tournois amicaux pour favoriser les liens sociaux et la stimulation cognitive.</p>
            </div>

            <div class="activity-card">
                <div class="activity-icon"><i class="fas fa-calendar-alt"></i></div>
                <h4>Événements Spéciaux</h4>
                <p>Fêtes thématiques, anniversaires, sorties culturelles et célébrations pour créer des moments mémorables.</p>
            </div>

            <div class="activity-card">
                <div class="activity-icon"><i class="fas fa-leaf"></i></div>
                <h4>Nature & Jardinage</h4>
                <p>Jardins thérapeutiques, terrasses fleuries, activités de jardinage pour se ressourcer au contact de la nature.</p>
            </div>
        </div>
    </section>

    <section id="repas" style="background: white;">
        <div class="section-header">
            <span class="section-badge">Repas & Menus</span>
            <h2 class="section-title">Une cuisine savoureuse et équilibrée</h2>
            <p class="section-subtitle">Des repas frais, préparés sur place, qui conjuguent plaisir gustatif, nutrition et respect des besoins individuels.</p>
        </div>

        <div class="meals-content">
            <img src="/static/images/salle-manger.png" alt="Salle à manger" class="meals-image">
            <div class="meals-text">
                <h3>Le plaisir de bien manger, chaque jour</h3>
                <p>Notre cuisine met l'accent sur la fraîcheur, la variété et le goût. Nous proposons trois repas complets par jour, élaborés par notre équipe culinaire en tenant compte des préférences, allergies et régimes spéciaux de chacun.</p>
                <p>Les repas sont servis dans notre salle à manger lumineuse et conviviale, favorisant les échanges et le sentiment de communauté. Chaque repas est une occasion de se retrouver, de partager et de savourer.</p>

                <div class="meals-features">
                    <div class="meal-feature">
                        <i class="fas fa-utensils"></i>
                        <div>
                            <h5>Repas équilibrés</h5>
                            <p>Menus variés respectant les recommandations nutritionnelles pour aînés</p>
                        </div>
                    </div>

                    <div class="meal-feature">
                        <i class="fas fa-carrot"></i>
                        <div>
                            <h5>Ingrédients frais</h5>
                            <p>Produits locaux et de saison privilégiés pour une qualité optimale</p>
                        </div>
                    </div>

                    <div class="meal-feature">
                        <i class="fas fa-allergies"></i>
                        <div>
                            <h5>Besoins spéciaux</h5>
                            <p>Adaptation aux régimes diabétiques, sans sel, sans gluten, etc.</p>
                        </div>
                    </div>

                    <div class="meal-feature">
                        <i class="fas fa-birthday-cake"></i>
                        <div>
                            <h5>Occasions spéciales</h5>
                            <p>Repas thématiques, menus festifs et célébrations gourmandes</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="galerie">
        <div class="section-header">
            <span class="section-badge">Galerie</span>
            <h2 class="section-title">Découvrez notre milieu de vie</h2>
            <p class="section-subtitle">Une visite virtuelle en images de L'Auberge Boischatel</p>
        </div>

        <div class="gallery-grid">
            <div class="gallery-item">
                <img src="/static/images/facade.jpg" alt="Façade">
                <div class="gallery-overlay">
                    <h4>Façade Victorienne</h4>
                    <p>Charme patrimonial et architecture distinctive</p>
                </div>
            </div>

            <div class="gallery-item">
                <img src="/static/images/salle-manger.png" alt="Salle à manger">
                <div class="gallery-overlay">
                    <h4>Salle à Manger</h4>
                    <p>Espace lumineux et convivial pour les repas</p>
                </div>
            </div>

            <div class="gallery-item">
                <img src="/static/images/chambre.png" alt="Chambre">
                <div class="gallery-overlay">
                    <h4>Chambres Privées</h4>
                    <p>Confort, intimité et adaptation</p>
                </div>
            </div>

            <div class="gallery-item">
                <img src="/static/images/jardin.jpg" alt="Jardin">
                <div class="gallery-overlay">
                    <h4>Jardins Paysagers</h4>
                    <p>Espaces verts soigneusement entretenus</p>
                </div>
            </div>

            <div class="gallery-item">
                <img src="/static/images/galerie.jpg" alt="Galerie">
                <div class="gallery-overlay">
                    <h4>Terrasse Couverte</h4>
                    <p>Espace détente protégé avec vue</p>
                </div>
            </div>

            <div class="gallery-item">
                <img src="/static/images/vue-nocturne.jpg" alt="Vue nocturne">
                <div class="gallery-overlay">
                    <h4>Ambiance Chaleureuse</h4>
                    <p>Accueillante jour et nuit</p>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" style="background: white;">
        <div class="section-header">
            <span class="section-badge">Contact</span>
            <h2 class="section-title">Planifiez votre visite</h2>
            <p class="section-subtitle">Nous serions ravis de vous accueillir et de vous faire découvrir notre résidence. Contactez-nous dès aujourd'hui.</p>
        </div>

        <div class="contact-container">
            <div class="contact-info">
                <h3>Informations pour les familles</h3>
                
                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="contact-item-content">
                        <h4>Adresse</h4>
                        <p>5424 Avenue Royale<br>Boischatel, QC G0A 1H0</p>
                    </div>
                </div>

                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-phone"></i>
                    </div>
                    <div class="contact-item-content">
                        <h4>Téléphone</h4>
                        <p>418-XXX-XXXX<br>Disponible 7 jours / 7</p>
                    </div>
                </div>

                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-envelope"></i>
                    </div>
                    <div class="contact-item-content">
                        <h4>Courriel</h4>
                        <p>admin@aubergeboischatel.com<br>Réponse sous 24h</p>
                    </div>
                </div>

                <div class="contact-item">
                    <div class="contact-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="contact-item-content">
                        <h4>Heures de visite</h4>
                        <p>Lundi au vendredi: 9h - 17h<br>Sur rendez-vous le weekend</p>
                    </div>
                </div>
            </div>

            <div class="contact-form">
                <form id="contactForm">
                    <div class="form-group">
                        <label for="name">Nom complet *</label>
                        <input type="text" id="name" name="name" required>
                    </div>

                    <div class="form-group">
                        <label for="email">Courriel *</label>
                        <input type="email" id="email" name="email" required>
                    </div>

                    <div class="form-group">
                        <label for="phone">Téléphone</label>
                        <input type="tel" id="phone" name="phone">
                    </div>

                    <div class="form-group">
                        <label for="visitDate">Date de visite souhaitée</label>
                        <input type="date" id="visitDate" name="visitDate">
                    </div>

                    <div class="form-group">
                        <label for="message">Message *</label>
                        <textarea id="message" name="message" required></textarea>
                    </div>

                    <button type="submit" class="submit-btn">Envoyer ma demande</button>
                </form>
            </div>
        </div>

        <div class="map-container">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2726.4536937853567!2d-71.15844492345898!3d46.90666997101488!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cb8bcbc9c7e9e8f%3A0x7c9c9c9c9c9c9c9c!2s5424%20Avenue%20Royale%2C%20Boischatel%2C%20QC%20G0A%201H0!5e0!3m2!1sen!2sca!4v1234567890" allowfullscreen="" loading="lazy"></iframe>
        </div>
    </section>

    <footer>
        <div class="footer-content">
            <div class="footer-brand">
                <img src="/static/images/logo.png" alt="Logo" class="footer-logo">
                <h3>L'Auberge Boischatel</h3>
                <p>Innovation bienveillante au service de la vie quotidienne. Une résidence certifiée RPA où modernité et chaleur humaine créent un milieu de vie exceptionnel.</p>
            </div>

            <div class="footer-section">
                <h4>Navigation</h4>
                <ul class="footer-links">
                    <li><a href="#accueil">Accueil</a></li>
                    <li><a href="#mission">Mission & Valeurs</a></li>
                    <li><a href="#apropos">À Propos</a></li>
                    <li><a href="#chambres">Chambres</a></li>
                    <li><a href="#securite">Sécurité</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h4>Services</h4>
                <ul class="footer-links">
                    <li><a href="#activites">Activités</a></li>
                    <li><a href="#repas">Repas & Menus</a></li>
                    <li><a href="#galerie">Galerie</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h4>Contact</h4>
                <ul class="footer-links">
                    <li>5424 Avenue Royale</li>
                    <li>Boischatel, QC G0A 1H0</li>
                    <li>418-XXX-XXXX</li>
                    <li>admin@aubergeboischatel.com</li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; 2025 L'Auberge Boischatel. Tous droits réservés. Résidence certifiée RPA Québec.</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Contact form handling
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Envoi en cours...';
            submitBtn.disabled = true;
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                visitDate: document.getElementById('visitDate').value,
                message: document.getElementById('message').value
            };
            
            try {
                const response = await axios.post('/api/contact', formData);
                
                if (response.data.success) {
                    alert('Merci ! Votre demande a été envoyée. Nous vous contacterons sous peu.');
                    e.target.reset();
                } else {
                    alert('Une erreur est survenue. Veuillez réessayer.');
                }
            } catch (error) {
                alert('Erreur de connexion. Veuillez réessayer plus tard.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });

        // Navbar scroll effect
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const nav = document.querySelector('nav');
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                nav.style.boxShadow = '0 2px 30px rgba(90, 125, 140, 0.15)';
            } else {
                nav.style.boxShadow = '0 2px 20px rgba(90, 125, 140, 0.08)';
            }
            
            lastScroll = currentScroll;
        });
    </script>
</body>
</html>`)
})

export default app
