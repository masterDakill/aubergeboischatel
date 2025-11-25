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
    phone: '418-822-0347',
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
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: 3rem;
        }

        .logo {
            display: flex;
            align-items: center;
            text-decoration: none;
            color: var(--anthracite);
            perspective: 1000px;
            margin-left: 0.4rem; /* Moved ~1cm to the right */
        }

        .logo-icon {
            width: 125px; /* Enlarged by 25% from 100px */
            height: 125px;
            background: url('/static/images/logo.png') no-repeat center;
            background-size: contain;
            transition: all 0.6s ease;
            transform-style: preserve-3d;
            animation: float3d 8s ease-in-out infinite; /* Slower, softer animation */
        }

        @keyframes float3d {
            0%, 100% {
                transform: translateY(0) rotateY(0deg);
            }
            25% {
                transform: translateY(-4px) rotateY(2deg); /* Reduced rotation from 5deg to 2deg */
            }
            50% {
                transform: translateY(0) rotateY(0deg);
            }
            75% {
                transform: translateY(-4px) rotateY(-2deg); /* Reduced rotation from -5deg to -2deg */
            }
        }

        .logo-icon:hover {
            animation: none;
            transform: rotateY(360deg) scale(1.15);
        }

        .logo-text {
            display: none; /* Texte retiré comme demandé */
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
            margin-left: auto;
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

        /* Hero Section - Full-Width Spectacular Golden Hour 4K */
        .hero {
            margin-top: 80px;
            min-height: 100vh; /* Full viewport height for maximum impact */
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: url('/static/images/facade-golden-hour-4k.jpg') center/cover fixed;
            overflow: hidden;
            /* High-quality image rendering */
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }

        /* Subtle warm overlay - let the photo shine through */
        .hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
                135deg,
                rgba(31, 31, 31, 0.35) 0%,  /* Lighter overlay to show more photo */
                rgba(90, 125, 140, 0.25) 50%,
                rgba(169, 199, 181, 0.15) 100%
            );
            z-index: 1;
        }
        
        /* Vignette effect to draw focus to center */
        .hero::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(
                ellipse at center,
                transparent 0%,
                transparent 40%,
                rgba(0, 0, 0, 0.15) 100%
            );
            z-index: 1;
            pointer-events: none;
        }

        .hero-content {
            position: relative;
            z-index: 2;
            text-align: center;
            color: white;
            max-width: 950px;
            padding: 4rem 3rem;
            /* More transparent to show photo beauty */
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px) saturate(120%);
            border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
            /* Smooth entrance animation */
            animation: heroContentFadeIn 1.2s ease-out;
        }
        
        @keyframes heroContentFadeIn {
            0% {
                opacity: 0;
                transform: translateY(30px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .hero-badge {
            display: inline-block;
            padding: 0.5rem 1.25rem;
            background: linear-gradient(135deg, var(--copper) 0%, rgba(201, 164, 114, 0.9) 100%);
            color: white;
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            margin-bottom: 2rem;
            width: fit-content;
            box-shadow: 0 4px 15px rgba(201, 164, 114, 0.3);
        }

        .hero-title {
            font-family: var(--font-serif);
            font-size: 4.5rem; /* Larger for more impact */
            font-weight: 700;
            color: white;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            text-shadow: 
                0 2px 4px rgba(0, 0, 0, 0.3),
                0 4px 12px rgba(0, 0, 0, 0.2),
                0 8px 24px rgba(0, 0, 0, 0.15);
            letter-spacing: -0.5px;
        }

        .hero-subtitle {
            font-size: 1.6rem;
            color: rgba(255, 255, 255, 0.98);
            font-weight: 500;
            margin-bottom: 1rem;
            text-shadow: 
                0 2px 8px rgba(0, 0, 0, 0.3),
                0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .hero-tagline {
            font-size: 1.2rem;
            color: rgba(255, 255, 255, 0.92);
            margin-bottom: 2.5rem;
            line-height: 1.8;
            text-shadow: 
                0 2px 8px rgba(0, 0, 0, 0.3),
                0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }

        .hero-cta-group {
            display: flex;
            gap: 1rem;
        }

        .hero-cta {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1.1rem 2.25rem;
            background: var(--copper);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.05rem;
            transition: all 0.3s;
            box-shadow: 0 6px 20px rgba(201, 164, 114, 0.4);
        }

        .hero-cta:hover {
            background: #B8935F;
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(201, 164, 114, 0.5);
        }

        .hero-cta-secondary {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1.1rem 2.25rem;
            background: rgba(255, 255, 255, 0.15);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.6);
            font-weight: 600;
            font-size: 1.05rem;
            transition: all 0.3s;
            backdrop-filter: blur(10px);
        }

        .hero-cta-secondary:hover {
            background: rgba(255, 255, 255, 0.25);
            border-color: white;
            transform: translateY(-3px);
        }

        /* Removed .hero-right - now using full-width hero with centered content */

        /* Liquid Image Effect */
        .liquid-image {
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .liquid-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
            will-change: transform;
        }

        .liquid-image:hover img {
            transform: scale(1.05);
        }

        .liquid-image::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(
                circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                rgba(255, 255, 255, 0.1) 0%,
                transparent 50%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        .liquid-image:hover::before {
            opacity: 1;
        }

        /* Horizontal Scroller Component */
        .horizontal-scroller {
            width: 100%;
            overflow: hidden;
            padding: 3rem 0;
        }

        .scroller-container {
            display: flex;
            gap: 2rem;
            overflow-x: auto;
            scroll-behavior: smooth;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE/Edge */
            padding: 0 2rem;
        }

        .scroller-container::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
        }

        .scroller-item {
            flex: 0 0 auto;
            width: 400px;
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .scroller-item:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
        }

        .testimonial-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .testimonial-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--blue-grey), var(--sage-green));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 1.5rem;
        }

        .testimonial-info h4 {
            font-size: 1.1rem;
            color: var(--anthracite);
            margin-bottom: 0.25rem;
        }

        .testimonial-info p {
            font-size: 0.9rem;
            color: var(--text-muted);
        }

        .testimonial-content {
            color: var(--text-muted);
            line-height: 1.8;
            font-size: 1rem;
            margin-bottom: 1.5rem;
        }

        /* Rating Component (0-5 stars) */
        .rating-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .stars {
            display: flex;
            gap: 0.25rem;
        }

        .star {
            color: #FFD700;
            font-size: 1.2rem;
        }

        .star.empty {
            color: #E0E0E0;
        }

        .rating-text {
            font-size: 0.9rem;
            color: var(--text-muted);
            font-weight: 500;
        }

        /* Scroll Navigation Buttons */
        .scroller-nav {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
        }

        .scroller-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid var(--blue-grey);
            background: white;
            color: var(--blue-grey);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 1.2rem;
        }

        .scroller-btn:hover {
            background: var(--blue-grey);
            color: white;
            transform: scale(1.1);
        }

        .scroller-btn:active {
            transform: scale(0.95);
        }

        /* Ripple Transition Effect */
        .ripple-container {
            position: relative;
            overflow: hidden;
        }

        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
        }

        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        /* Apply ripple to buttons and interactive elements */
        .hero-cta,
        .hero-cta-secondary,
        .scroller-btn,
        .nav-links a,
        .submit-btn,
        .gallery-item {
            position: relative;
            overflow: hidden;
        }

        /* Phone Extension Diagram Section */
        .phone-diagram-section {
            background: #F5EAD0;
            padding: 4rem 2rem;
            margin: 3rem 0;
            border-radius: 20px;
        }

        .phone-diagram-header {
            text-align: center;
            margin-bottom: 3rem;
        }

        .phone-diagram-header h3 {
            font-family: 'Playfair Display', serif;
            font-size: 2.2rem;
            color: #314D61;
            margin-bottom: 0.5rem;
        }

        .phone-diagram-header p {
            font-family: 'Lora', serif;
            color: #314D61;
            opacity: 0.8;
        }

        .logo-3d-container {
            width: 150px;
            height: 150px;
            margin: 0 auto 2rem;
            perspective: 1000px;
            cursor: pointer;
            transition: transform 0.3s ease;
        }

        .logo-3d-container:hover {
            transform: scale(1.05) rotateY(5deg);
            filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2));
        }

        .logo-3d-container model-viewer {
            width: 100%;
            height: 100%;
        }

        .phone-cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .phone-card {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 15px rgba(49, 77, 97, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .phone-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(49, 77, 97, 0.15);
        }

        .phone-card-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #C7A46E 0%, #D4B378 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
        }

        .phone-card h4 {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            color: #314D61;
            margin-bottom: 0.5rem;
        }

        .phone-card p {
            font-family: 'Lora', serif;
            color: #314D61;
            opacity: 0.7;
            margin-bottom: 1rem;
        }

        .phone-card-extensions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .extension-badge {
            background: #F5EAD0;
            color: #314D61;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
        }

        .phone-card-tooltip {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(199, 164, 110, 0.95);
            color: white;
            padding: 1rem;
            transform: translateY(100%);
            transition: transform 0.3s ease;
            font-size: 0.9rem;
            text-align: center;
        }

        .phone-card:hover .phone-card-tooltip {
            transform: translateY(0);
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

        /* Virtual Tour 3D Section */
        .virtual-tour-container {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 8px 40px rgba(90, 125, 140, 0.12);
            margin-top: 3rem;
        }

        .virtual-tour-intro {
            text-align: center;
            max-width: 800px;
            margin: 0 auto 3rem;
        }

        .virtual-tour-intro h3 {
            font-family: var(--font-serif);
            font-size: 2rem;
            color: var(--blue-grey);
            margin-bottom: 1rem;
        }

        .virtual-tour-intro p {
            font-size: 1.1rem;
            color: var(--text-muted);
            line-height: 1.8;
        }

        .polycam-wrapper {
            position: relative;
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 12px 50px rgba(90, 125, 140, 0.2);
            background: var(--cream);
        }

        .polycam-wrapper::before {
            content: '';
            display: block;
            padding-top: 56.25%; /* 16:9 aspect ratio */
        }

        .polycam-wrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }

        .tour-features {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            margin-top: 3rem;
            padding-top: 3rem;
            border-top: 1px solid rgba(169, 199, 181, 0.2);
        }

        .tour-feature {
            text-align: center;
        }

        .tour-feature-icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 1rem;
            background: linear-gradient(135deg, var(--sage-green) 0%, var(--blue-grey) 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            color: white;
        }

        .tour-feature h5 {
            font-size: 1.1rem;
            color: var(--anthracite);
            margin-bottom: 0.5rem;
        }

        .tour-feature p {
            font-size: 0.95rem;
            color: var(--text-muted);
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

        /* Interactive Background - Softer & Warmer */
        #particles-js {
            position: fixed;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            z-index: -1;
            background: linear-gradient(135deg, 
                #FBF9F7 0%, 
                rgba(245, 244, 242, 0.95) 50%,
                rgba(169, 199, 181, 0.08) 100%
            );
        }

        /* Scroll Animations */
        .scroll-fade-in {
            opacity: 0;
            transform: translateY(50px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .scroll-fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .scroll-slide-left {
            opacity: 0;
            transform: translateX(-50px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .scroll-slide-left.visible {
            opacity: 1;
            transform: translateX(0);
        }

        .scroll-slide-right {
            opacity: 0;
            transform: translateX(50px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }

        .scroll-slide-right.visible {
            opacity: 1;
            transform: translateX(0);
        }

        /* Floating Cards Effect */
        .value-card,
        .activity-card,
        .room-card {
            animation: float 6s ease-in-out infinite;
        }

        .value-card:nth-child(1) { animation-delay: 0s; }
        .value-card:nth-child(2) { animation-delay: 1s; }
        .value-card:nth-child(3) { animation-delay: 2s; }
        .value-card:nth-child(4) { animation-delay: 3s; }
        .value-card:nth-child(5) { animation-delay: 4s; }

        @keyframes float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-10px);
            }
        }

        /* Gradient Animation Background */
        body {
            position: relative;
        }

        body::before {
            content: '';
            position: fixed;
            width: 200%;
            height: 200%;
            top: -50%;
            left: -50%;
            z-index: -2;
            background: 
                radial-gradient(circle at 20% 50%, rgba(169, 199, 181, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(90, 125, 140, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(201, 164, 114, 0.05) 0%, transparent 50%);
            animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            33% {
                transform: translate(5%, 5%) rotate(120deg);
            }
            66% {
                transform: translate(-5%, 3%) rotate(240deg);
            }
        }

        /* Enhanced Hover Effects */
        .service-card,
        .security-card {
            position: relative;
            overflow: hidden;
        }

        .service-card::after,
        .security-card::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(169, 199, 181, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .service-card:hover::after,
        .security-card:hover::after {
            width: 400px;
            height: 400px;
        }

        /* Parallax Sections */
        .parallax-section {
            background-attachment: fixed;
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
        }

        /* Smooth Scroll Progress Bar */
        .scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 4px;
            background: linear-gradient(90deg, var(--sage-green) 0%, var(--copper) 100%);
            z-index: 9999;
            transition: width 0.1s ease;
        }

        /* Glass morphism effect */
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(90, 125, 140, 0.1);
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .hero {
                grid-template-columns: 1fr;
            }
            
            .hero {
                min-height: 80vh;
                padding: 2rem;
            }
            
            .hero-content {
                padding: 3rem 2rem;
                max-width: 600px;
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

            .logo {
                margin-left: 0; /* Reset margin on mobile */
            }
            
            .logo-icon {
                width: 90px; /* Smaller on mobile */
                height: 90px;
            }

            .nav-container {
                padding: 1rem;
            }
            
            .hero {
                min-height: 70vh;
                padding: 1.5rem;
            }
            
            .hero-content {
                padding: 2.5rem 1.5rem;
            }

            .hero-title {
                font-size: 2.5rem;
            }
            
            .hero-subtitle {
                font-size: 1.2rem;
            }
            
            .hero-tagline {
                font-size: 1rem;
            }
            
            .hero-cta-group {
                flex-direction: column;
            }
            
            .hero-cta, .hero-cta-secondary {
                width: 100%;
                justify-content: center;
            }

            .section-title {
                font-size: 2rem;
            }

            .values-grid,
            .activities-grid,
            .rooms-grid,
            .phone-cards-grid {
                grid-template-columns: 1fr;
            }
            
            .phone-diagram-section {
                padding: 2rem 1rem;
                margin: 2rem 0;
            }
            
            .logo-3d-container {
                width: 120px;
                height: 120px;
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
                <li><a href="#visite3d">Visite 3D</a></li>
                <li><a href="#galerie">Galerie</a></li>
                <li><a href="#temoignages">Témoignages</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section class="hero" id="accueil">
        <div class="hero-content">
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
            <div class="liquid-image mission-image">
                <img src="/static/images/facade-golden-hour.jpg" alt="L'Auberge Boischatel">
            </div>
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
            <div class="liquid-image mission-image">
                <img src="/static/images/vue-nocturne.jpg" alt="Équipe">
            </div>
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

    <section id="visite3d" style="background: var(--cream);">
        <div class="section-header">
            <span class="section-badge">Visite Virtuelle</span>
            <h2 class="section-title">Explorez notre résidence en 3D</h2>
            <p class="section-subtitle">Une expérience immersive pour découvrir L'Auberge Boischatel depuis chez vous</p>
        </div>

        <div class="virtual-tour-container">
            <div class="virtual-tour-intro">
                <h3>Parcourez nos espaces en toute liberté</h3>
                <p>Grâce à notre visite virtuelle 3D, explorez chaque recoin de notre résidence : salons, chambres, espaces communs, jardins. Naviguez librement pour vous projeter dans votre futur chez-vous.</p>
            </div>

            <div class="polycam-wrapper">
                <iframe 
                    src="https://poly.cam/capture/0173C8E7-21E2-4AB2-A66E-5757D3EDCFBC/embed" 
                    title="Visite virtuelle 3D de L'Auberge Boischatel"
                    allow="xr-spatial-tracking"
                    loading="lazy">
                </iframe>
            </div>

            <div class="tour-features">
                <div class="tour-feature">
                    <div class="tour-feature-icon">
                        <i class="fas fa-cube"></i>
                    </div>
                    <h5>Navigation 360°</h5>
                    <p>Explorez chaque espace sous tous les angles avec une liberté totale de mouvement</p>
                </div>

                <div class="tour-feature">
                    <div class="tour-feature-icon">
                        <i class="fas fa-expand-arrows-alt"></i>
                    </div>
                    <h5>Mesures Réelles</h5>
                    <p>Visualisez les dimensions exactes et l'aménagement des espaces en 3D</p>
                </div>

                <div class="tour-feature">
                    <div class="tour-feature-icon">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h5>Multi-dispositifs</h5>
                    <p>Accessible depuis votre ordinateur, tablette ou téléphone intelligent</p>
                </div>
            </div>
        </div>
    </section>

    <section id="galerie">
        <div class="section-header">
            <span class="section-badge">Galerie</span>
            <h2 class="section-title">Découvrez notre milieu de vie</h2>
            <p class="section-subtitle">Une visite en images de L'Auberge Boischatel</p>
        </div>

        <div class="gallery-grid">
            <div class="gallery-item liquid-image">
                <img src="/static/images/facade-golden-hour.jpg" alt="Façade">
                <div class="gallery-overlay">
                    <h4>Façade Victorienne</h4>
                    <p>Charme patrimonial et architecture distinctive</p>
                </div>
            </div>

            <div class="gallery-item liquid-image">
                <img src="/static/images/salle-manger.png" alt="Salle à manger">
                <div class="gallery-overlay">
                    <h4>Salle à Manger</h4>
                    <p>Espace lumineux et convivial pour les repas</p>
                </div>
            </div>

            <div class="gallery-item liquid-image">
                <img src="/static/images/chambre.png" alt="Chambre">
                <div class="gallery-overlay">
                    <h4>Chambres Privées</h4>
                    <p>Confort, intimité et adaptation</p>
                </div>
            </div>

            <div class="gallery-item liquid-image">
                <img src="/static/images/jardin.jpg" alt="Jardin">
                <div class="gallery-overlay">
                    <h4>Jardins Paysagers</h4>
                    <p>Espaces verts soigneusement entretenus</p>
                </div>
            </div>

            <div class="gallery-item liquid-image">
                <img src="/static/images/galerie.jpg" alt="Galerie">
                <div class="gallery-overlay">
                    <h4>Terrasse Couverte</h4>
                    <p>Espace détente protégé avec vue</p>
                </div>
            </div>

            <div class="gallery-item liquid-image">
                <img src="/static/images/vue-nocturne.jpg" alt="Vue nocturne">
                <div class="gallery-overlay">
                    <h4>Ambiance Chaleureuse</h4>
                    <p>Accueillante jour et nuit</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section with Horizontal Scroller -->
    <section id="temoignages" style="background: linear-gradient(135deg, var(--cream) 0%, white 100%);">
        <div class="section-header">
            <span class="section-badge">Témoignages</span>
            <h2 class="section-title">Ce que disent nos résidents et leurs familles</h2>
            <p class="section-subtitle">La satisfaction de nos résidents et de leurs proches est notre plus grande fierté</p>
        </div>

        <div class="horizontal-scroller">
            <div class="scroller-container" id="testimonialsScroller">
                <!-- Testimonial 1 -->
                <div class="scroller-item">
                    <div class="testimonial-header">
                        <div class="testimonial-avatar">MG</div>
                        <div class="testimonial-info">
                            <h4>Marie Gagnon</h4>
                            <p>Résidente depuis 2 ans</p>
                        </div>
                    </div>
                    <div class="rating-container">
                        <div class="stars">
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                        </div>
                        <span class="rating-text">5/5</span>
                    </div>
                    <p class="testimonial-content">"Un cadre de vie exceptionnel ! L'équipe est chaleureuse, attentive et toujours disponible. Je me sens vraiment chez moi dans cette magnifique résidence victorienne."</p>
                </div>

                <!-- Testimonial 2 -->
                <div class="scroller-item">
                    <div class="testimonial-header">
                        <div class="testimonial-avatar">JT</div>
                        <div class="testimonial-info">
                            <h4>Jean Tremblay</h4>
                            <p>Famille de résident</p>
                        </div>
                    </div>
                    <div class="rating-container">
                        <div class="stars">
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                        </div>
                        <span class="rating-text">5/5</span>
                    </div>
                    <p class="testimonial-content">"Ma mère est si heureuse depuis qu'elle a emménagé à L'Auberge. Les propriétaires sont jeunes, dynamiques et apportent une vision moderne tout en gardant une approche humaine."</p>
                </div>

                <!-- Testimonial 3 -->
                <div class="scroller-item">
                    <div class="testimonial-header">
                        <div class="testimonial-avatar">SL</div>
                        <div class="testimonial-info">
                            <h4>Sylvie Lavoie</h4>
                            <p>Résidente depuis 1 an</p>
                        </div>
                    </div>
                    <div class="rating-container">
                        <div class="stars">
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star empty">★</span>
                        </div>
                        <span class="rating-text">4.5/5</span>
                    </div>
                    <p class="testimonial-content">"La sécurité est exemplaire et les repas sont délicieux. J'apprécie particulièrement les activités organisées et l'ambiance conviviale entre résidents."</p>
                </div>

                <!-- Testimonial 4 -->
                <div class="scroller-item">
                    <div class="testimonial-header">
                        <div class="testimonial-avatar">PC</div>
                        <div class="testimonial-info">
                            <h4>Pierre Côté</h4>
                            <p>Famille de résident</p>
                        </div>
                    </div>
                    <div class="rating-container">
                        <div class="stars">
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                        </div>
                        <span class="rating-text">5/5</span>
                    </div>
                    <p class="testimonial-content">"L'emplacement est idéal à Boischatel, et l'architecture de la maison est magnifique. Mon père a enfin trouvé un endroit où il se sent respecté et valorisé."</p>
                </div>

                <!-- Testimonial 5 -->
                <div class="scroller-item">
                    <div class="testimonial-header">
                        <div class="testimonial-avatar">LB</div>
                        <div class="testimonial-info">
                            <h4>Louise Bérubé</h4>
                            <p>Résidente depuis 3 ans</p>
                        </div>
                    </div>
                    <div class="rating-container">
                        <div class="stars">
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                            <span class="star">★</span>
                        </div>
                        <span class="rating-text">5/5</span>
                    </div>
                    <p class="testimonial-content">"Une résidence à taille humaine où tout le monde se connaît. L'équipe jeune apporte une énergie positive et des idées innovantes pour améliorer notre quotidien."</p>
                </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="scroller-nav">
                <button class="scroller-btn" id="scrollLeft">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="scroller-btn" id="scrollRight">
                    <i class="fas fa-chevron-right"></i>
                </button>
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
                        <p>418-822-0347</p>
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

        <!-- Phone Extension Diagram Section -->
        <div class="phone-diagram-section">
            <div class="phone-diagram-header">
                <div class="logo-3d-container" id="logo3d" title="Cliquez pour revenir en haut">
                    <model-viewer 
                        src="/static/models/logo-3d.glb"
                        alt="Logo 3D L'Auberge Boischatel"
                        auto-rotate
                        camera-controls
                        shadow-intensity="1"
                        style="width: 100%; height: 100%;">
                    </model-viewer>
                </div>
                <h3>Diagramme des postes téléphoniques internes</h3>
                <p>Visualisez rapidement quel poste joint quel service à l'interne</p>
            </div>

            <div class="phone-cards-grid">
                <!-- Direction Card -->
                <div class="phone-card">
                    <div class="phone-card-icon">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <h4>Direction</h4>
                    <p>Poste 200 – Bureau de la Directrice</p>
                    <div class="phone-card-extensions">
                        <span class="extension-badge">200</span>
                    </div>
                    <div class="phone-card-tooltip">
                        Administration, gestion, demandes générales
                    </div>
                </div>

                <!-- Soins Infirmiers Card -->
                <div class="phone-card">
                    <div class="phone-card-icon">
                        <i class="fas fa-heartbeat"></i>
                    </div>
                    <h4>Soins infirmiers</h4>
                    <p>Postes multiples pour l'infirmière de garde</p>
                    <div class="phone-card-extensions">
                        <span class="extension-badge">203</span>
                        <span class="extension-badge">204</span>
                        <span class="extension-badge">212</span>
                        <span class="extension-badge">213</span>
                    </div>
                    <div class="phone-card-tooltip">
                        Pour rejoindre l'infirmière de garde
                    </div>
                </div>

                <!-- Cuisine Card -->
                <div class="phone-card">
                    <div class="phone-card-icon">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <h4>Cuisine</h4>
                    <p>Poste 205 – Cuisine interne</p>
                    <div class="phone-card-extensions">
                        <span class="extension-badge">205</span>
                    </div>
                    <div class="phone-card-tooltip">
                        Usage interne : repas et services alimentaires
                    </div>
                </div>
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
                    <li><a href="#visite3d">Visite 3D</a></li>
                    <li><a href="#galerie">Galerie</a></li>
                    <li><a href="#temoignages">Témoignages</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h4>Contact</h4>
                <ul class="footer-links">
                    <li>5424 Avenue Royale</li>
                    <li>Boischatel, QC G0A 1H0</li>
                    <li>418-822-0347</li>
                    <li>admin@aubergeboischatel.com</li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; 2025 L'Auberge Boischatel. Tous droits réservés. Résidence certifiée RPA Québec.</p>
        </div>
    </footer>

    <!-- Scroll Progress Bar -->
    <div class="scroll-progress" id="scrollProgress"></div>
    
    <!-- Interactive Background Container -->
    <div id="particles-js"></div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
    <script>
        // Scroll Progress Bar
        window.addEventListener('scroll', () => {
            const scrollProgress = document.getElementById('scrollProgress');
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            scrollProgress.style.width = scrolled + '%';
        });

        // Particles.js Background - Softer & Warmer
        particlesJS('particles-js', {
            particles: {
                number: { value: 45, density: { enable: true, value_area: 1000 } }, // Reduced from 80 to 45
                color: { value: '#C9A472' }, // Warm copper tone instead of sage green
                shape: { type: 'circle' },
                opacity: { value: 0.25, random: true }, // More subtle - reduced from 0.5
                size: { value: 2.5, random: true }, // Slightly smaller
                line_linked: {
                    enable: true,
                    distance: 120, // Shorter connections
                    color: '#A9C7B5', // Soft sage green for connections
                    opacity: 0.2, // Very subtle - reduced from 0.4
                    width: 0.8 // Thinner lines
                },
                move: {
                    enable: true,
                    speed: 1.2, // Slower, gentler movement
                    direction: 'none',
                    random: true, // More organic movement
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'grab' }, // Changed from 'repulse' to 'grab' for softer interaction
                    onclick: { enable: true, mode: 'bubble' }, // Changed from 'push' to 'bubble'
                    resize: true
                },
                modes: {
                    grab: { distance: 140, line_linked: { opacity: 0.3 } },
                    bubble: { distance: 250, size: 4, duration: 2, opacity: 0.5, speed: 3 },
                    repulse: { distance: 100, duration: 0.4 },
                    push: { particles_nb: 2 },
                    remove: { particles_nb: 2 }
                }
            },
            retina_detect: true
        });

        // Scroll Animations Observer
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe all animated elements
        document.addEventListener('DOMContentLoaded', () => {
            const fadeElements = document.querySelectorAll('.scroll-fade-in');
            const slideLeftElements = document.querySelectorAll('.scroll-slide-left');
            const slideRightElements = document.querySelectorAll('.scroll-slide-right');
            
            fadeElements.forEach(el => scrollObserver.observe(el));
            slideLeftElements.forEach(el => scrollObserver.observe(el));
            slideRightElements.forEach(el => scrollObserver.observe(el));

            // Add animation classes to sections
            document.querySelectorAll('.section-header').forEach(el => {
                el.classList.add('scroll-fade-in');
            });
            
            document.querySelectorAll('.value-card, .activity-card, .room-card').forEach((el, index) => {
                if (index % 2 === 0) {
                    el.classList.add('scroll-slide-left');
                } else {
                    el.classList.add('scroll-slide-right');
                }
            });
        });

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

        // Liquid Image Effect - Track mouse position
        document.addEventListener('DOMContentLoaded', () => {
            const liquidImages = document.querySelectorAll('.liquid-image');
            
            liquidImages.forEach(image => {
                image.addEventListener('mousemove', (e) => {
                    const rect = image.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    image.style.setProperty('--mouse-x', x + '%');
                    image.style.setProperty('--mouse-y', y + '%');
                });
                
                image.addEventListener('mouseleave', () => {
                    image.style.setProperty('--mouse-x', '50%');
                    image.style.setProperty('--mouse-y', '50%');
                });
            });
        });

        // Horizontal Scroller Navigation
        document.addEventListener('DOMContentLoaded', () => {
            const scroller = document.getElementById('testimonialsScroller');
            const scrollLeftBtn = document.getElementById('scrollLeft');
            const scrollRightBtn = document.getElementById('scrollRight');

            if (scroller && scrollLeftBtn && scrollRightBtn) {
                const scrollAmount = 420; // Width of item (400px) + gap (20px)

                scrollLeftBtn.addEventListener('click', () => {
                    scroller.scrollBy({
                        left: -scrollAmount,
                        behavior: 'smooth'
                    });
                });

                scrollRightBtn.addEventListener('click', () => {
                    scroller.scrollBy({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                });

                // Enable mouse drag scrolling
                let isDown = false;
                let startX;
                let scrollLeft;

                scroller.addEventListener('mousedown', (e) => {
                    isDown = true;
                    scroller.style.cursor = 'grabbing';
                    startX = e.pageX - scroller.offsetLeft;
                    scrollLeft = scroller.scrollLeft;
                });

                scroller.addEventListener('mouseleave', () => {
                    isDown = false;
                    scroller.style.cursor = 'grab';
                });

                scroller.addEventListener('mouseup', () => {
                    isDown = false;
                    scroller.style.cursor = 'grab';
                });

                scroller.addEventListener('mousemove', (e) => {
                    if (!isDown) return;
                    e.preventDefault();
                    const x = e.pageX - scroller.offsetLeft;
                    const walk = (x - startX) * 2;
                    scroller.scrollLeft = scrollLeft - walk;
                });

                // Set initial cursor
                scroller.style.cursor = 'grab';
            }
        });

        // Ripple Transition Effect
        function createRipple(event) {
            const button = event.currentTarget;
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            // Remove old ripples
            const oldRipple = button.querySelector('.ripple');
            if (oldRipple) {
                oldRipple.remove();
            }
            
            button.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        }

        // Apply ripple effect to all interactive elements
        document.addEventListener('DOMContentLoaded', () => {
            const rippleElements = document.querySelectorAll(
                '.hero-cta, .hero-cta-secondary, .scroller-btn, .nav-links a, .submit-btn, .gallery-item'
            );
            
            rippleElements.forEach(element => {
                element.addEventListener('click', createRipple);
            });

            // 3D Logo Click - Scroll to Top
            const logo3d = document.getElementById('logo3d');
            if (logo3d) {
                logo3d.addEventListener('click', () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
        });
    </script>
</body>
</html>`)
})

export default app
