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

// Main page - Part 1: HTML Structure and Head
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="L'Auberge Boischatel - Résidence pour aînés à Boischatel. Charme patrimonial victorien, soins attentionnés et communauté chaleureuse.">
    <meta name="keywords" content="résidence aînés, Boischatel, RPA, maison de retraite, soins, Québec">
    <meta name="author" content="L'Auberge Boischatel">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://aubergeboischatel.com/">
    <meta property="og:title" content="L'Auberge Boischatel - Résidence pour Aînés">
    <meta property="og:description" content="Où patrimoine victorien rencontre innovation bienveillante">
    <meta property="og:image" content="https://www.genspark.ai/api/files/s/Gev30WTB">
    
    <title>L'Auberge Boischatel - Résidence pour Aînés</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-navy: #2B4A6B;
            --accent-blue: #1C3654;
            --cream: #F5F1E8;
            --warm-beige: #D4C4A8;
            --gold: #C9A472;
            --white: #FFFFFF;
            --text-dark: #2C3E50;
            --text-muted: #6B7280;
            --font-serif: 'Playfair Display', Georgia, serif;
            --font-sans: 'Inter', -apple-system, sans-serif;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--cream);
            color: var(--text-dark);
            overflow-x: hidden;
            line-height: 1.6;
        }

        nav {
            position: fixed;
            top: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(12px);
            padding: 1.2rem 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 2px 15px rgba(0,0,0,0.08);
            border-bottom: 1px solid rgba(43, 74, 107, 0.1);
        }

        .logo-container {
            display: flex;
            align-items: center;
            gap: 0.8rem;
        }

        .logo-icon {
            width: 45px;
            height: 45px;
            background: url('https://www.genspark.ai/api/files/s/ti1oxt8g') no-repeat center;
            background-size: contain;
        }

        .logo-text {
            font-family: var(--font-serif);
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--primary-navy);
            letter-spacing: 0.5px;
        }

        .nav-links {
            display: flex;
            gap: 2.5rem;
            list-style: none;
        }

        .nav-links a {
            color: var(--text-dark);
            text-decoration: none;
            font-weight: 500;
            font-size: 0.95rem;
            transition: color 0.3s;
            position: relative;
        }

        .nav-links a:hover {
            color: var(--primary-navy);
        }

        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--gold);
            transition: width 0.3s;
        }

        .nav-links a:hover::after {
            width: 100%;
        }

        .hero {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-top: 75px;
        }

        .hero-left {
            background: linear-gradient(135deg, var(--cream) 0%, #EAE4D9 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 4rem 8%;
        }

        .hero-logo {
            width: 120px;
            margin-bottom: 2rem;
            opacity: 0;
            animation: fadeInUp 0.8s ease-out 0.2s forwards;
        }

        .hero-title {
            font-family: var(--font-serif);
            font-size: clamp(2.5rem, 5vw, 4rem);
            color: var(--primary-navy);
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            opacity: 0;
            animation: fadeInUp 0.8s ease-out 0.4s forwards;
        }

        .hero-subtitle {
            font-size: clamp(1.1rem, 2vw, 1.4rem);
            color: var(--text-muted);
            margin-bottom: 0.8rem;
            font-weight: 400;
            opacity: 0;
            animation: fadeInUp 0.8s ease-out 0.6s forwards;
        }

        .hero-tagline {
            font-family: var(--font-serif);
            font-size: clamp(1rem, 1.8vw, 1.3rem);
            color: var(--accent-blue);
            font-style: italic;
            margin-bottom: 2.5rem;
            opacity: 0;
            animation: fadeInUp 0.8s ease-out 0.8s forwards;
        }

        .hero-cta {
            display: inline-flex;
            align-items: center;
            gap: 0.8rem;
            padding: 1.1rem 2.5rem;
            background: linear-gradient(135deg, var(--primary-navy), var(--accent-blue));
            color: white;
            text-decoration: none;
            font-weight: 600;
            font-size: 1.05rem;
            border-radius: 50px;
            transition: all 0.4s ease;
            box-shadow: 0 5px 25px rgba(43, 74, 107, 0.3);
            width: fit-content;
            opacity: 0;
            animation: fadeInUp 0.8s ease-out 1s forwards;
        }

        .hero-cta:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 35px rgba(43, 74, 107, 0.4);
        }

        .hero-right {
            background: url('https://www.genspark.ai/api/files/s/DNsRiVAG') center/cover;
            position: relative;
        }

        .hero-right::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(43, 74, 107, 0.15), rgba(201, 164, 114, 0.1));
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        section {
            padding: 6rem 5%;
        }

        .section-title {
            text-align: center;
            font-family: var(--font-serif);
            font-size: clamp(2rem, 4vw, 3rem);
            color: var(--primary-navy);
            margin-bottom: 1rem;
        }

        .section-subtitle {
            text-align: center;
            font-size: 1.1rem;
            color: var(--text-muted);
            margin-bottom: 4rem;
            max-width: 700px;
            margin-left: auto;
            margin-right: auto;
        }

        .about-section {
            background: var(--white);
        }

        .about-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
        }

        .about-image {
            width: 100%;
            border-radius: 15px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.15);
        }

        .about-content h3 {
            font-family: var(--font-serif);
            font-size: 2rem;
            color: var(--primary-navy);
            margin-bottom: 1.5rem;
        }

        .about-content p {
            font-size: 1.05rem;
            color: var(--text-muted);
            line-height: 1.8;
            margin-bottom: 1.5rem;
        }

        .about-highlight {
            background: linear-gradient(135deg, var(--cream), #EAE4D9);
            padding: 2rem;
            border-radius: 12px;
            border-left: 4px solid var(--gold);
            margin-top: 2rem;
        }

        .about-highlight strong {
            color: var(--primary-navy);
            font-size: 1.1rem;
        }

        .values-section {
            background: linear-gradient(135deg, var(--cream) 0%, #EAE4D9 100%);
        }

        .values-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2.5rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .value-card {
            background: var(--white);
            border-radius: 15px;
            padding: 2.5rem 2rem;
            text-align: center;
            transition: all 0.4s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            border: 1px solid rgba(43, 74, 107, 0.1);
        }

        .value-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 40px rgba(43, 74, 107, 0.2);
        }

        .value-icon {
            width: 70px;
            height: 70px;
            margin: 0 auto 1.5rem;
            background: linear-gradient(135deg, var(--primary-navy), var(--accent-blue));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
        }

        .value-card h3 {
            font-family: var(--font-serif);
            font-size: 1.5rem;
            color: var(--primary-navy);
            margin-bottom: 1rem;
        }

        .value-card p {
            color: var(--text-muted);
            line-height: 1.7;
        }

        .gallery-section {
            background: var(--white);
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            max-width: 1600px;
            margin: 0 auto;
        }

        .gallery-item {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
            transition: all 0.4s ease;
            height: 350px;
        }

        .gallery-item:hover {
            transform: scale(1.03);
            box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .gallery-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            transition: transform 0.4s ease;
        }

        .gallery-item:hover img {
            transform: scale(1.1);
        }

        .gallery-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(43, 74, 107, 0.95), transparent);
            padding: 2rem;
            transform: translateY(100%);
            transition: transform 0.4s ease;
        }

        .gallery-item:hover .gallery-overlay {
            transform: translateY(0);
        }

        .gallery-overlay h4 {
            color: white;
            font-family: var(--font-serif);
            font-size: 1.4rem;
            margin-bottom: 0.5rem;
        }

        .gallery-overlay p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.95rem;
        }

        .category-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(201, 164, 114, 0.95);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            z-index: 10;
        }

        .contact-section {
            background: linear-gradient(135deg, var(--primary-navy) 0%, var(--accent-blue) 100%);
            color: white;
        }

        .contact-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4rem;
        }

        .contact-info h3 {
            font-family: var(--font-serif);
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
        }

        .contact-info p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.95;
        }

        .contact-details {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .contact-item i {
            font-size: 1.5rem;
            color: var(--gold);
        }

        .contact-form {
            background: white;
            padding: 2.5rem;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            color: var(--text-dark);
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 0.9rem;
            border: 2px solid #E5E7EB;
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: 1rem;
            transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-navy);
        }

        .form-group textarea {
            resize: vertical;
            min-height: 120px;
        }

        .btn-submit {
            width: 100%;
            padding: 1.1rem;
            background: linear-gradient(135deg, var(--primary-navy), var(--accent-blue));
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.05rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(43, 74, 107, 0.4);
        }

        .form-message {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            display: none;
        }

        .form-message.success {
            background: #D1FAE5;
            color: #065F46;
            display: block;
        }

        .form-message.error {
            background: #FEE2E2;
            color: #991B1B;
            display: block;
        }

        footer {
            background: #1C3654;
            color: white;
            padding: 3rem 5%;
            text-align: center;
        }

        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
        }

        .footer-logo {
            width: 80px;
            margin: 0 auto 1.5rem;
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2.5rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }

        .footer-links a {
            color: var(--gold);
            text-decoration: none;
            transition: color 0.3s;
        }

        .footer-links a:hover {
            color: white;
        }

        .footer-bottom {
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
            opacity: 0.8;
        }

        @media (max-width: 1024px) {
            .hero {
                grid-template-columns: 1fr;
            }
            
            .hero-right {
                min-height: 60vh;
            }
            
            .about-grid,
            .contact-container {
                grid-template-columns: 1fr;
            }
            
            .nav-links {
                gap: 1.5rem;
            }
        }

        @media (max-width: 768px) {
            nav {
                padding: 1rem 4%;
            }
            
            .logo-text {
                font-size: 1.2rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .hero-left {
                padding: 3rem 5%;
            }
            
            section {
                padding: 4rem 5%;
            }
            
            .gallery-item {
                height: 280px;
            }
        }
    </style>
</head>
<body>
    <nav>
        <div class="logo-container">
            <div class="logo-icon"></div>
            <div class="logo-text">L'Auberge Boischatel</div>
        </div>
        <ul class="nav-links">
            <li><a href="#accueil">Accueil</a></li>
            <li><a href="#apropos">À Propos</a></li>
            <li><a href="#valeurs">Nos Valeurs</a></li>
            <li><a href="#galerie">Galerie</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>

    <section class="hero" id="accueil">
        <div class="hero-left">
            <img src="https://www.genspark.ai/api/files/s/ti1oxt8g" alt="Logo" class="hero-logo">
            <h1 class="hero-title">Bienvenue chez nous</h1>
            <p class="hero-subtitle">Soins attentionnés • Communauté chaleureuse</p>
            <p class="hero-tagline">Où patrimoine victorien rencontre innovation bienveillante</p>
            <a href="#contact" class="hero-cta">
                <i class="fas fa-calendar-check"></i>
                Réserver une Visite
            </a>
        </div>
        <div class="hero-right"></div>
    </section>

    <section class="about-section" id="apropos">
        <h2 class="section-title">Notre Histoire</h2>
        <p class="section-subtitle">Une résidence patrimoniale au cœur de Boischatel</p>
        
        <div class="about-grid">
            <div>
                <img src="https://www.genspark.ai/api/files/s/Gev30WTB" alt="Façade" class="about-image">
            </div>
            <div class="about-content">
                <h3>5424 Avenue Royale, Boischatel</h3>
                <p>
                    Nichée au cœur de Boischatel, L'Auberge Boischatel est une résidence pour aînés d'exception 
                    qui conjugue le charme authentique d'une demeure victorienne avec les standards modernes.
                </p>
                <p>
                    Dirigée par une équipe jeune et dynamique, notre résidence offre un milieu de vie chaleureux 
                    où chaque résident bénéficie de soins attentionnés.
                </p>
                <div class="about-highlight">
                    <strong>Noémie Gamache, Directrice</strong><br>
                    "Notre mission : offrir bien plus qu'un hébergement, mais un véritable chez-soi."
                </div>
            </div>
        </div>
    </section>

    <section class="values-section" id="valeurs">
        <h2 class="section-title">Nos Valeurs Fondamentales</h2>
        <p class="section-subtitle">Ce qui fait la différence</p>
        
        <div class="values-grid">
            <div class="value-card">
                <div class="value-icon">💡</div>
                <h3>Innovation Bienveillante</h3>
                <p>Technologies modernes au service du confort : domotique, sécurité avancée.</p>
            </div>
            
            <div class="value-card">
                <div class="value-icon">❤️</div>
                <h3>Cœur Humain</h3>
                <p>Accueil chaleureux, respect et bienveillance au cœur de chaque interaction.</p>
            </div>
            
            <div class="value-card">
                <div class="value-icon">🛡️</div>
                <h3>Sécurité & Conformité</h3>
                <p>Tranquillité d'esprit garantie par des normes rigoureuses.</p>
            </div>
            
            <div class="value-card">
                <div class="value-icon">🌱</div>
                <h3>Fraîcheur & Dynamisme</h3>
                <p>Jeunes propriétaires apportant un souffle de renouveau.</p>
            </div>
            
            <div class="value-card">
                <div class="value-icon">🏛️</div>
                <h3>Patrimoine Modernisé</h3>
                <p>Élégance victorienne préservée, rehaussée par des aménagements contemporains.</p>
            </div>
            
            <div class="value-card">
                <div class="value-icon">🚀</div>
                <h3>Vision d'Avenir</h3>
                <p>Amélioration continue et anticipation des besoins.</p>
            </div>
        </div>
    </section>

    <section class="gallery-section" id="galerie">
        <h2 class="section-title">Découvrez Nos Espaces</h2>
        <p class="section-subtitle">Une visite virtuelle</p>
        
        <div class="gallery-grid">
            <div class="gallery-item">
                <span class="category-badge">Extérieur</span>
                <img src="https://www.genspark.ai/api/files/s/Gev30WTB" alt="Façade">
                <div class="gallery-overlay">
                    <h4>Façade Victorienne</h4>
                    <p>Charme patrimonial avec tour emblématique</p>
                </div>
            </div>
            
            <div class="gallery-item">
                <span class="category-badge">Espaces Communs</span>
                <img src="https://www.genspark.ai/api/files/s/UsHFL4i3" alt="Salle à manger">
                <div class="gallery-overlay">
                    <h4>Salle à Manger</h4>
                    <p>Espaces lumineux et conviviaux</p>
                </div>
            </div>
            
            <div class="gallery-item">
                <span class="category-badge">Chambres</span>
                <img src="https://www.genspark.ai/api/files/s/IwS9ONoI" alt="Chambre">
                <div class="gallery-overlay">
                    <h4>Chambres Privées</h4>
                    <p>Confort et intimité</p>
                </div>
            </div>
            
            <div class="gallery-item">
                <span class="category-badge">Extérieur</span>
                <img src="https://www.genspark.ai/api/files/s/YUt0HZP8" alt="Jardin">
                <div class="gallery-overlay">
                    <h4>Jardins Paysagers</h4>
                    <p>Espaces verts soigneusement entretenus</p>
                </div>
            </div>
            
            <div class="gallery-item">
                <span class="category-badge">Extérieur</span>
                <img src="https://www.genspark.ai/api/files/s/bDYyIG8o" alt="Galerie">
                <div class="gallery-overlay">
                    <h4>Galerie Couverte</h4>
                    <p>Espace détente protégé</p>
                </div>
            </div>
            
            <div class="gallery-item">
                <span class="category-badge">Extérieur</span>
                <img src="https://www.genspark.ai/api/files/s/HU4QQIqY" alt="Vue nocturne">
                <div class="gallery-overlay">
                    <h4>Ambiance Chaleureuse</h4>
                    <p>Accueillante jour et nuit</p>
                </div>
            </div>
        </div>
    </section>

    <section class="contact-section" id="contact">
        <div class="contact-container">
            <div class="contact-info">
                <h3>Prêt à nous visiter ?</h3>
                <p>Planifiez une visite guidée.</p>
                
                <div class="contact-details">
                    <div class="contact-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <div>
                            <strong>5424 Avenue Royale</strong><br>
                            Boischatel, QC G0A 1H0
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <div>
                            <strong>admin@aubergeboischatel.com</strong>
                        </div>
                    </div>
                    
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <div>
                            <strong>418-XXX-XXXX</strong>
                        </div>
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
                        <label for="visitDate">Date souhaitée</label>
                        <input type="date" id="visitDate" name="visitDate">
                    </div>
                    
                    <div class="form-group">
                        <label for="message">Message *</label>
                        <textarea id="message" name="message" required></textarea>
                    </div>
                    
                    <button type="submit" class="btn-submit">Envoyer</button>
                    
                    <div id="formMessage" class="form-message"></div>
                </form>
            </div>
        </div>
    </section>

    <footer>
        <div class="footer-content">
            <img src="https://www.genspark.ai/api/files/s/ti1oxt8g" alt="Logo" class="footer-logo">
            
            <div class="footer-links">
                <a href="#accueil">Accueil</a>
                <a href="#apropos">À Propos</a>
                <a href="#valeurs">Nos Valeurs</a>
                <a href="#galerie">Galerie</a>
                <a href="#contact">Contact</a>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2025 L'Auberge Boischatel</p>
                <p style="margin-top: 0.5rem; opacity: 0.8;">
                    Innovation Bienveillante • Patrimoine Modernisé
                </p>
            </div>
        </div>
    </footer>

    <script>
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const navHeight = document.querySelector('nav').offsetHeight;
                    window.scrollTo({
                        top: target.offsetTop - navHeight,
                        behavior: 'smooth'
                    });
                }
            });
        });

        document.getElementById('contactForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formMessage = document.getElementById('formMessage');
            const submitBtn = this.querySelector('.btn-submit');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Envoi...';
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                visitDate: document.getElementById('visitDate').value,
                message: document.getElementById('message').value
            };
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    formMessage.className = 'form-message success';
                    formMessage.textContent = result.message;
                    this.reset();
                } else {
                    formMessage.className = 'form-message error';
                    formMessage.textContent = result.error;
                }
            } catch (error) {
                formMessage.className = 'form-message error';
                formMessage.textContent = 'Erreur de connexion';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Envoyer';
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {threshold: 0.1, rootMargin: '0px 0px -50px 0px'});

        document.querySelectorAll('.value-card, .gallery-item').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    </script>
</body>
</html>`)
})

export default app
