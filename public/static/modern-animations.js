/**
 * Modern Animations for Auberge Boischatel
 * Inspired by 2025 award-winning website trends
 * - Scroll-triggered animations (Intersection Observer)
 * - Animated counters
 * - Smooth reveal effects
 * - Magnetic buttons
 * - Parallax subtle effects
 */

(function() {
    'use strict';

    // ============================================
    // 1. SCROLL-TRIGGERED ANIMATIONS
    // ============================================
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -80px 0px',
        threshold: [0, 0.1, 0.2, 0.3]
    };

    const animationClasses = {
        fadeUp: 'animate-fade-up',
        fadeIn: 'animate-fade-in',
        scaleIn: 'animate-scale-in',
        slideLeft: 'animate-slide-left',
        slideRight: 'animate-slide-right'
    };

    // Add CSS for animations
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        /* Scroll-triggered animation states */
        [data-animate] {
            opacity: 0;
            transition: opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1),
                        transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
        }

        [data-animate="fade-up"] {
            transform: translateY(40px);
        }

        [data-animate="fade-in"] {
            transform: scale(0.98);
        }

        [data-animate="scale-in"] {
            transform: scale(0.9);
        }

        [data-animate="slide-left"] {
            transform: translateX(60px);
        }

        [data-animate="slide-right"] {
            transform: translateX(-60px);
        }

        [data-animate].is-visible {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
        }

        /* Staggered children animation */
        [data-stagger] > * {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s cubic-bezier(0.23, 1, 0.32, 1),
                        transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        [data-stagger].is-visible > *:nth-child(1) { transition-delay: 0.1s; }
        [data-stagger].is-visible > *:nth-child(2) { transition-delay: 0.2s; }
        [data-stagger].is-visible > *:nth-child(3) { transition-delay: 0.3s; }
        [data-stagger].is-visible > *:nth-child(4) { transition-delay: 0.4s; }
        [data-stagger].is-visible > *:nth-child(5) { transition-delay: 0.5s; }
        [data-stagger].is-visible > *:nth-child(6) { transition-delay: 0.6s; }

        [data-stagger].is-visible > * {
            opacity: 1;
            transform: translateY(0);
        }

        /* Counter animation */
        .counter-animated {
            display: inline-block;
            min-width: 2ch;
        }

        /* Magnetic button effect */
        .magnetic-btn {
            transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Text reveal line by line */
        .text-reveal-line {
            overflow: hidden;
        }

        .text-reveal-line span {
            display: block;
            transform: translateY(100%);
            transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .text-reveal-line.is-visible span {
            transform: translateY(0);
        }

        /* Smooth section transitions */
        .section-reveal {
            position: relative;
        }

        .section-reveal::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg,
                transparent,
                rgba(169, 199, 181, 0.3) 20%,
                rgba(201, 164, 114, 0.3) 80%,
                transparent
            );
            transform: scaleX(0);
            transition: transform 1s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .section-reveal.is-visible::before {
            transform: scaleX(1);
        }

        /* Image parallax container */
        .parallax-img {
            overflow: hidden;
        }

        .parallax-img img {
            transition: transform 0.1s linear;
            will-change: transform;
        }

        /* Glow effect on hover for cards */
        .glow-card {
            position: relative;
            overflow: hidden;
        }

        .glow-card::after {
            content: '';
            position: absolute;
            top: var(--mouse-y, 50%);
            left: var(--mouse-x, 50%);
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(201, 164, 114, 0.15), transparent 70%);
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }

        .glow-card:hover::after {
            opacity: 1;
        }

        /* Smooth underline animation for links */
        .link-underline {
            position: relative;
            display: inline-block;
        }

        .link-underline::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, var(--copper, #C9A472), var(--sage-green, #A9C7B5));
            transform: scaleX(0);
            transform-origin: right;
            transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .link-underline:hover::after {
            transform: scaleX(1);
            transform-origin: left;
        }

        /* Loading shimmer effect */
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }

        .shimmer {
            background: linear-gradient(90deg,
                rgba(255,255,255,0) 0%,
                rgba(255,255,255,0.3) 50%,
                rgba(255,255,255,0) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
    `;
    document.head.appendChild(styleSheet);

    // Intersection Observer for scroll animations
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');

                // Trigger counter animation if present
                if (entry.target.hasAttribute('data-counter')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);

    // Initialize scroll animations
    function initScrollAnimations() {
        // Animate elements with data-animate attribute
        document.querySelectorAll('[data-animate]').forEach(el => {
            scrollObserver.observe(el);
        });

        // Animate staggered groups
        document.querySelectorAll('[data-stagger]').forEach(el => {
            scrollObserver.observe(el);
        });

        // Section reveals
        document.querySelectorAll('.section-reveal').forEach(el => {
            scrollObserver.observe(el);
        });

        // Text reveal lines
        document.querySelectorAll('.text-reveal-line').forEach(el => {
            scrollObserver.observe(el);
        });
    }

    // ============================================
    // 2. ANIMATED COUNTERS
    // ============================================
    function animateCounter(element) {
        if (element.classList.contains('counter-done')) return;

        const target = parseInt(element.getAttribute('data-counter'), 10);
        const duration = parseInt(element.getAttribute('data-duration') || '2000', 10);
        const suffix = element.getAttribute('data-suffix') || '';
        const prefix = element.getAttribute('data-prefix') || '';

        let startTime = null;
        const startValue = 0;

        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function updateCounter(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);

            element.textContent = prefix + currentValue.toLocaleString('fr-CA') + suffix;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.classList.add('counter-done');
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // ============================================
    // 3. MAGNETIC BUTTONS
    // ============================================
    function initMagneticButtons() {
        const magneticElements = document.querySelectorAll('.magnetic-btn, .hero-cta, .hero-cta-secondary');

        magneticElements.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Subtle magnetic pull (reduced intensity)
                const pullX = x * 0.15;
                const pullY = y * 0.15;

                btn.style.transform = `translate(${pullX}px, ${pullY}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
            });
        });
    }

    // ============================================
    // 4. GLOW CARDS
    // ============================================
    function initGlowCards() {
        const cards = document.querySelectorAll('.glow-card, .value-card, .service-container, .security-card, .room-card, .activity-card');

        cards.forEach(card => {
            card.classList.add('glow-card');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                card.style.setProperty('--mouse-x', x + '%');
                card.style.setProperty('--mouse-y', y + '%');
            });
        });
    }

    // ============================================
    // 5. SUBTLE PARALLAX
    // ============================================
    function initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax-img img, .mission-image, .meals-image, .about-image');

        if (parallaxElements.length === 0) return;

        let ticking = false;

        function updateParallax() {
            parallaxElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const viewportHeight = window.innerHeight;

                // Check if element is in viewport
                if (rect.top < viewportHeight && rect.bottom > 0) {
                    const scrollPercent = (viewportHeight - rect.top) / (viewportHeight + rect.height);
                    const translateY = (scrollPercent - 0.5) * 30; // Subtle 30px max movement

                    el.style.transform = `translateY(${translateY}px) scale(1.05)`;
                }
            });
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }

    // ============================================
    // 6. AUTO-APPLY ANIMATIONS TO EXISTING ELEMENTS
    // ============================================
    function autoApplyAnimations() {
        // Section headers - fade up
        document.querySelectorAll('.section-header').forEach((el, i) => {
            el.setAttribute('data-animate', 'fade-up');
            el.style.transitionDelay = '0.1s';
        });

        // Value cards - stagger
        document.querySelectorAll('.values-grid').forEach(grid => {
            grid.setAttribute('data-stagger', '');
        });

        // Service containers - fade up with stagger
        document.querySelectorAll('.services-grid').forEach(grid => {
            grid.setAttribute('data-stagger', '');
        });

        // Security cards - slide animations
        document.querySelectorAll('.security-card').forEach((card, i) => {
            card.setAttribute('data-animate', i % 2 === 0 ? 'slide-right' : 'slide-left');
            card.style.transitionDelay = (i * 0.15) + 's';
        });

        // Activity cards - stagger
        document.querySelectorAll('.activities-grid').forEach(grid => {
            grid.setAttribute('data-stagger', '');
        });

        // Rooms grid - stagger
        document.querySelectorAll('.rooms-grid').forEach(grid => {
            grid.setAttribute('data-stagger', '');
        });

        // Gallery items - scale in
        document.querySelectorAll('.gallery-item, .bento-item').forEach((item, i) => {
            item.setAttribute('data-animate', 'scale-in');
            item.style.transitionDelay = (i * 0.08) + 's';
        });

        // Stats - counter animation
        document.querySelectorAll('.stat-number').forEach(stat => {
            const text = stat.textContent.trim();
            const match = text.match(/(\d+)/);
            if (match) {
                const number = match[1];
                const suffix = text.replace(number, '');
                stat.setAttribute('data-counter', number);
                stat.setAttribute('data-suffix', suffix);
                stat.textContent = '0' + suffix;
                scrollObserver.observe(stat);
            }
        });

        // About stats grid - stagger
        document.querySelectorAll('.about-stats').forEach(grid => {
            grid.setAttribute('data-stagger', '');
        });

        // Mission content - alternate slides
        document.querySelectorAll('.mission-content').forEach(content => {
            const children = content.children;
            if (children[0]) {
                children[0].setAttribute('data-animate', 'slide-right');
            }
            if (children[1]) {
                children[1].setAttribute('data-animate', 'slide-left');
            }
        });

        // About grid - alternate slides
        document.querySelectorAll('.about-grid').forEach(content => {
            const children = content.children;
            if (children[0]) {
                children[0].setAttribute('data-animate', 'slide-right');
            }
            if (children[1]) {
                children[1].setAttribute('data-animate', 'slide-left');
            }
        });

        // Meals content - alternate slides
        document.querySelectorAll('.meals-content').forEach(content => {
            const children = content.children;
            if (children[0]) {
                children[0].setAttribute('data-animate', 'slide-right');
            }
            if (children[1]) {
                children[1].setAttribute('data-animate', 'slide-left');
            }
        });

        // Add section-reveal to all main sections
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('section-reveal');
        });

        // Phone cards - stagger
        document.querySelectorAll('.phone-cards-grid').forEach(grid => {
            grid.setAttribute('data-stagger', '');
        });
    }

    // ============================================
    // 7. SMOOTH SCROLL ENHANCEMENT
    // ============================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();

                    const navHeight = document.querySelector('nav')?.offsetHeight || 0;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAll);
        } else {
            initAll();
        }
    }

    function initAll() {
        // Auto-apply animations to existing elements
        autoApplyAnimations();

        // Initialize all features
        initScrollAnimations();
        initMagneticButtons();
        initGlowCards();
        initParallax();
        initSmoothScroll();

        console.log('Modern animations initialized');
    }

    // Start
    init();

})();
