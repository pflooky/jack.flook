// General site interactivity
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.setAttribute('data-animate', 'true');
            }
        });
    }, observerOptions);
    
    // Observe all cards
    document.querySelectorAll('.about-card').forEach(card => {
        observer.observe(card);
    });
    
    // Check if hero image exists
    const heroImage = document.getElementById('heroImage');
    const placeholder = document.getElementById('imagePlaceholder');
    
    if (heroImage) {
        heroImage.onerror = () => {
            if (placeholder) {
                placeholder.style.display = 'flex';
            }
        };
        
        heroImage.onload = () => {
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
        
        // Trigger check
        if (heroImage.src) {
            heroImage.src = heroImage.src;
        }
    }
    
    // Add parallax effect to hero
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.style.transform = `translateY(${currentScroll * 0.5}px)`;
        }
        lastScroll = currentScroll;
    });
    
    // Add active state to nav links based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinksArray = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });
        
        navLinksArray.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});

