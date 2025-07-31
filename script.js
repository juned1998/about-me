// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navbar = document.querySelector('.navbar');
const themeToggle = document.querySelector('.theme-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const fab = document.querySelector('.fab');

// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = this.getDefaultTheme();
        this.init();
    }

    getDefaultTheme() {
        try {
            // Check if user has a stored preference
            const storedTheme = localStorage && localStorage.getItem ? localStorage.getItem('theme') : null;
            if (storedTheme) {
                return storedTheme;
            }
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
        
        try {
            // Check system preference
            if (window.matchMedia && typeof window.matchMedia === 'function') {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                if (mediaQuery && mediaQuery.matches) {
                    return 'dark';
                }
            }
        } catch (e) {
            console.warn('matchMedia not available:', e);
        }
        
        // Default fallback
        return 'light';
    }

    init() {
        try {
            // Don't save initial theme as preference if it came from system
            let hasStoredPreference = false;
            try {
                hasStoredPreference = localStorage && localStorage.getItem && localStorage.getItem('theme') !== null;
            } catch (e) {
                console.warn('Could not check stored preference:', e);
            }
            
            this.setTheme(this.currentTheme, hasStoredPreference);
            this.updateThemeIcon();
            
            if (themeToggle && themeToggle.addEventListener) {
                themeToggle.addEventListener('click', () => this.toggleTheme());
            }
            
            // Listen for system theme changes
            try {
                if (window.matchMedia && typeof window.matchMedia === 'function') {
                    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                    if (mediaQuery && mediaQuery.addEventListener) {
                        mediaQuery.addEventListener('change', (e) => this.handleSystemThemeChange(e));
                    }
                }
            } catch (e) {
                console.warn('Could not set up system theme listener:', e);
            }
        } catch (e) {
            console.error('Theme initialization failed:', e);
        }
    }

    handleSystemThemeChange(e) {
        try {
            // Only auto-switch if user hasn't manually set a preference
            let hasStoredTheme = false;
            try {
                hasStoredTheme = localStorage && localStorage.getItem && localStorage.getItem('theme');
            } catch (err) {
                console.warn('Could not check stored theme:', err);
            }
            
            if (!hasStoredTheme && e && typeof e.matches !== 'undefined') {
                const newTheme = e.matches ? 'dark' : 'light';
                this.currentTheme = newTheme;
                this.setTheme(newTheme, false); // Don't save as preference
                this.updateThemeIcon();
            }
        } catch (e) {
            console.warn('Error handling system theme change:', e);
        }
    }

    setTheme(theme, savePreference = true) {
        try {
            if (document && document.documentElement && document.documentElement.setAttribute) {
                document.documentElement.setAttribute('data-theme', theme);
            }
        } catch (e) {
            console.warn('Could not set theme attribute:', e);
        }
        
        if (savePreference) {
            try {
                if (localStorage && localStorage.setItem) {
                    localStorage.setItem('theme', theme);
                }
            } catch (e) {
                console.warn('Could not save theme preference:', e);
            }
        }
        this.currentTheme = theme;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        try {
            if (themeToggle && themeToggle.querySelector) {
                const icon = themeToggle.querySelector('#theme-icon');
                if (icon && typeof icon.className !== 'undefined') {
                    if (this.currentTheme === 'dark') {
                        icon.className = 'fas fa-sun';
                    } else {
                        icon.className = 'fas fa-moon';
                    }
                }
            }
        } catch (e) {
            console.warn('Could not update theme icon:', e);
        }
    }
}

// Mobile Navigation
class MobileNav {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        if (navToggle && navbar) {
            navToggle.addEventListener('click', () => this.toggle());
            navLinks.forEach(link => {
                link.addEventListener('click', () => this.close());
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.isOpen && !navbar.contains(e.target) && !navToggle.contains(e.target)) {
                    this.close();
                }
            });
        }
    }

    toggle() {
        if (navbar && navToggle) {
            this.isOpen = !this.isOpen;
            navbar.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Prevent scrolling when menu is open
            document.body.style.overflow = this.isOpen ? 'hidden' : '';
        }
    }

    close() {
        if (navbar && navToggle) {
            this.isOpen = false;
            navbar.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

// Navigation Highlighting and Smooth Scroll
class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.initSmoothScroll();
        this.initActiveHighlighting();
    }

    initSmoothScroll() {
        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Update active link immediately
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Update URL hash
                    if (window.history && window.history.replaceState) {
                        window.history.replaceState(null, null, targetId);
                    }
                    
                    // Smooth scroll to section
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    initActiveHighlighting() {
        // Highlight active navigation link on scroll
        const updateActiveNavLink = () => {
            const sections = document.querySelectorAll('section[id]');
            const scrollPos = window.scrollY + 100;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');
                const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

                if (navLink && scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    navLink.classList.add('active');
                    
                    // Update URL hash for deep linking
                    if (window.history && window.history.replaceState) {
                        const currentHash = window.location.hash.substring(1);
                        if (currentHash !== sectionId) {
                            window.history.replaceState(null, null, `#${sectionId}`);
                        }
                    }
                }
            });
        };
        
        // Throttled scroll event for performance
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateActiveNavLink();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', onScroll);
        updateActiveNavLink(); // Initial call
        
        // Handle initial URL hash on page load
        const initialHash = window.location.hash;
        if (initialHash && initialHash.length > 1) {
            const targetId = initialHash.substring(1);
            const targetElement = document.getElementById(targetId);
            const targetNavLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
            
            if (targetElement && targetNavLink) {
                navLinks.forEach(link => link.classList.remove('active'));
                targetNavLink.classList.add('active');
                
                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        }
    }
}

// Simple initialization
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize Theme Manager
        new ThemeManager();
        
        // Initialize Mobile Navigation
        new MobileNav();
        
        // Initialize Navigation Manager
        new NavigationManager();
        
    } catch (e) {
        console.error('Error initializing application:', e);
    }
});