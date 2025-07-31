// Dynamic Portfolio Renderer - Completely Reusable
class PortfolioRenderer {
    constructor() {
        this.data = null;
        this.renderers = {
            'text': this.renderTextSection.bind(this),
            'timeline': this.renderTimelineSection.bind(this),
            'categories': this.renderCategoriesSection.bind(this),
            'cards': this.renderCardsSection.bind(this),
            'contact': this.renderContactSection.bind(this)
        };
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.renderPortfolio();
            this.applyTheme();
            this.generateNavigation();
        } catch (e) {
            console.error('Failed to initialize portfolio:', e);
            // Gracefully fall back to static content
        }
    }

    async loadData() {
        try {
            const response = await fetch('./data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (e) {
            console.warn('Could not load data.json:', e);
            throw e;
        }
    }

    renderPortfolio() {
        if (!this.data) return;

        this.updateMeta();
        this.renderHeader();
        this.renderSections();
        this.generateNavigation();
        this.initializeNavigation(); // Add this to initialize navigation after rendering
    }

    updateMeta() {
        if (this.data.meta) {
            if (this.data.meta.title) {
                document.title = this.data.meta.title;
            }
            if (this.data.meta.description) {
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    metaDesc.content = this.data.meta.description;
                } else {
                    const meta = document.createElement('meta');
                    meta.name = 'description';
                    meta.content = this.data.meta.description;
                    document.head.appendChild(meta);
                }
            }
        }
    }

    renderHeader() {
        const { personal } = this.data;
        if (!personal) return;

        this.setElementContent('.name', personal.name);
        this.setElementContent('.title', personal.title);
        this.setElementContent('#about p', personal.summary, true);

        this.renderContacts();
    }

    renderContacts() {
        // Render header contacts
        const contactInfo = document.querySelector('#header-contacts');
        if (contactInfo && this.data.contacts) {
            contactInfo.innerHTML = '';
            this.data.contacts.forEach(contact => {
                const link = this.createElement('a', {
                    href: contact.url,
                    className: 'contact-link',
                    target: contact.url.startsWith('http') ? '_blank' : undefined
                });

                link.appendChild(this.createElement('i', { className: contact.icon }));
                link.appendChild(this.createElement('span', { textContent: contact.label }));
                contactInfo.appendChild(link);
            });
        }

        // Render contact section links
        const contactLinks = document.querySelector('#contact-links');
        if (contactLinks && this.data.contacts) {
            contactLinks.innerHTML = '';
            this.data.contacts.forEach(contact => {
                const p = this.createElement('p');
                p.appendChild(this.createElement('i', { className: contact.icon }));
                p.appendChild(document.createTextNode(' '));
                
                const link = this.createElement('a', {
                    href: contact.url,
                    textContent: contact.label,
                    target: contact.url.startsWith('http') ? '_blank' : undefined
                });
                p.appendChild(link);
                
                contactLinks.appendChild(p);
            });
        }
    }

    renderSections() {
        if (!this.data.sections) return;

        this.data.sections.forEach(section => {
            const sectionElement = document.querySelector(`#${section.id}`);
            if (!sectionElement) return;

            const container = sectionElement.querySelector('.container');
            if (!container) return;

            // Clear existing content except keep h2
            const h2 = container.querySelector('h2');
            container.innerHTML = '';
            if (h2) {
                h2.textContent = section.title;
                container.appendChild(h2);
            } else {
                const newH2 = this.createElement('h2', { textContent: section.title });
                container.appendChild(newH2);
            }

            // Render section content based on type
            const renderer = this.renderers[section.type];
            if (renderer) {
                renderer(container, section);
            } else {
                console.warn(`No renderer found for section type: ${section.type}`);
            }
        });
    }

    renderTextSection(container, section) {
        const p = this.createElement('p');
        p.innerHTML = section.content;
        container.appendChild(p);
    }

    renderTimelineSection(container, section) {
        if (!section.items) return;

        section.items.forEach(item => {
            const itemDiv = this.createElement('div', { className: 'job' });

            // Title
            itemDiv.appendChild(this.createElement('h3', { textContent: item.title }));

            // Subtitle with links
            if (item.subtitle) {
                const h4 = this.createElement('h4');
                if (item.subtitle.links && item.subtitle.links.length > 0) {
                    h4.innerHTML = this.renderLinkedText(item.subtitle.text, item.subtitle.links);
                } else {
                    h4.textContent = item.subtitle.text;
                }
                itemDiv.appendChild(h4);
            }

            // Period
            if (item.period) {
                itemDiv.appendChild(this.createElement('p', { 
                    className: 'date', 
                    textContent: item.period 
                }));
            }

            // Details
            if (item.details && item.details.length > 0) {
                const ul = this.createElement('ul');
                item.details.forEach(detail => {
                    const li = this.createElement('li');
                    li.innerHTML = detail.text;

                    // Add link if present
                    if (detail.link) {
                        li.innerHTML += ` (<a href="${detail.link.url}" target="_blank">${detail.link.text}</a>)`;
                    }

                    // Add tech stack tags
                    if (detail.tags && detail.tags.length > 0) {
                        li.appendChild(this.createElement('br'));
                        li.appendChild(this.createElement('em', { 
                            textContent: `Tech Stack: ${detail.tags.join(', ')}` 
                        }));
                    }

                    ul.appendChild(li);
                });
                itemDiv.appendChild(ul);
            }

            container.appendChild(itemDiv);
        });
    }

    renderCategoriesSection(container, section) {
        if (!section.items) return;

        Object.entries(section.items).forEach(([category, items]) => {
            const p = this.createElement('p');
            p.innerHTML = `<strong>${category}:</strong> ${items.join(', ')}`;
            container.appendChild(p);
        });
    }

    renderCardsSection(container, section) {
        if (!section.items) return;

        section.items.forEach(item => {
            const cardDiv = this.createElement('div', { className: 'project' });

            cardDiv.appendChild(this.createElement('h3', { textContent: item.title }));
            cardDiv.appendChild(this.createElement('p', { textContent: item.content }));

            if (item.tags && item.tags.length > 0) {
                const tagP = this.createElement('p');
                tagP.appendChild(this.createElement('em', { 
                    textContent: `Tech Stack: ${item.tags.join(', ')}` 
                }));
                cardDiv.appendChild(tagP);
            }

            container.appendChild(cardDiv);
        });
    }

    renderContactSection(container, section) {
        const contactLinksDiv = this.createElement('div', { className: 'contact-links' });
        
        // Reference to contacts array
        const contacts = section.items === 'contacts' ? this.data.contacts : section.items;
        
        if (contacts) {
            contacts.forEach(contact => {
                const p = this.createElement('p');
                p.appendChild(this.createElement('i', { className: contact.icon }));
                
                const link = this.createElement('a', {
                    href: contact.url,
                    textContent: contact.label,
                    target: contact.url.startsWith('http') ? '_blank' : undefined
                });
                p.appendChild(link);
                
                contactLinksDiv.appendChild(p);
            });
        }
        
        container.appendChild(contactLinksDiv);
    }

    renderLinkedText(text, links) {
        let result = text;
        links.forEach(link => {
            const linkHtml = `<a href="${link.url}" target="_blank">${link.text}</a>`;
            if (text.includes('(') && text.includes(')')) {
                // Handle parenthetical links like "FanCode (Dream11)"
                result = result.replace(link.text, linkHtml);
            } else {
                result = result.replace(link.text, linkHtml);
            }
        });
        return result;
    }

    generateNavigation() {
        if (!this.data.config?.navigation?.enabled || !this.data.sections) return;

        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        navMenu.innerHTML = '';
        this.data.sections.forEach(section => {
            const li = this.createElement('li');
            const a = this.createElement('a', {
                href: `#${section.id}`,
                className: 'nav-link',
                textContent: section.title
            });
            li.appendChild(a);
            navMenu.appendChild(li);
        });
    }

    applyTheme() {
        if (!this.data.theme) return;

        const root = document.documentElement;
        
        if (this.data.theme.colors) {
            if (this.data.theme.colors.primary) {
                root.style.setProperty('--accent-color', this.data.theme.colors.primary);
            }
            if (this.data.theme.colors.primaryDark) {
                root.style.setProperty('--dark-accent-color', this.data.theme.colors.primaryDark);
            }
        }

        if (this.data.theme.fonts?.primary) {
            document.body.style.fontFamily = this.data.theme.fonts.primary;
        }

        if (this.data.theme.layout) {
            if (this.data.theme.layout.containerWidth) {
                root.style.setProperty('--container-width', this.data.theme.layout.containerWidth);
            }
        }
    }

    // Utility methods
    createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element[key] = value;
                }
            }
        });
        return element;
    }

    setElementContent(selector, content, isHTML = false) {
        const element = document.querySelector(selector);
        if (element && content) {
            if (isHTML) {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
    }

    initializeNavigation() {
        // Initialize navigation highlighting after dynamic content is loaded
        try {
            // Re-query nav links after they've been dynamically generated
            const navLinks = document.querySelectorAll('.nav-link');
            
            // Track last clicked navigation item
            let lastClickedNavId = null;
            let clickTimeout = null;
            
            // Close mobile menu when clicking on a link
            if (navLinks && navLinks.forEach) {
                navLinks.forEach(link => {
                    if (link && link.addEventListener) {
                        link.addEventListener('click', function() {
                            try {
                                const navToggle = document.querySelector('.nav-toggle');
                                const navbar = document.querySelector('.navbar');
                                if (navToggle && navbar) {
                                    navToggle.classList.remove('active');
                                    navbar.classList.remove('active');
                                }
                            } catch (e) {
                                console.warn('Error closing mobile menu:', e);
                            }
                        });
                    }
                });
            }

            // Smooth scrolling for navigation links
            if (navLinks && navLinks.forEach) {
                navLinks.forEach(link => {
                    if (link && link.addEventListener) {
                        link.addEventListener('click', function(e) {
                            try {
                                const href = this.getAttribute('href');
                                if (href && href.startsWith('#')) {
                                    e.preventDefault();
                                    const targetId = href.substring(1);
                                    const targetElement = document.getElementById(targetId);
                                    
                                    // Immediately highlight the clicked nav item
                                    const currentNavLinks = document.querySelectorAll('.nav-link');
                                    if (currentNavLinks && currentNavLinks.forEach) {
                                        currentNavLinks.forEach(navLink => navLink.classList && navLink.classList.remove('active'));
                                    }
                                    this.classList.add('active');
                                    
                                    // Update URL hash for deep linking
                                    if (window.history && window.history.replaceState) {
                                        window.history.replaceState(null, null, `#${targetId}`);
                                    } else {
                                        window.location.hash = targetId;
                                    }
                                    
                                    // Store the clicked nav ID and prevent scroll-based highlighting for a few seconds
                                    lastClickedNavId = targetId;
                                    if (clickTimeout) clearTimeout(clickTimeout);
                                    clickTimeout = setTimeout(() => {
                                        lastClickedNavId = null;
                                    }, 3000); // Keep click-based highlighting for 3 seconds
                                    
                                    if (targetElement) {
                                        // Try modern smooth scrolling first
                                        if (targetElement.scrollIntoView) {
                                            targetElement.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start'
                                            });
                                        } else if (window.scrollTo) {
                                            // Fallback for older browsers
                                            const offsetTop = targetElement.offsetTop - 80; // Account for fixed nav
                                            window.scrollTo({
                                                top: offsetTop,
                                                behavior: 'smooth'
                                            });
                                        }
                                    }
                                }
                            } catch (err) {
                                console.warn('Error with smooth scroll:', err);
                                // Final fallback - just scroll to section
                                try {
                                    const href = this.getAttribute('href');
                                    if (href && href.startsWith('#')) {
                                        const targetElement = document.getElementById(href.substring(1));
                                        if (targetElement) {
                                            targetElement.scrollIntoView();
                                        }
                                    }
                                } catch (fallbackErr) {
                                    console.warn('Fallback scroll failed:', fallbackErr);
                                }
                            }
                        });
                    }
                });
            } else {
                console.warn('Nav links not found or not iterable');
            }
            
            // Highlight active navigation link on scroll
            function updateActiveNavLink() {
                try {
                    // If user recently clicked a nav item, don't override with scroll-based highlighting
                    if (lastClickedNavId) {
                        return;
                    }
                    
                    const sections = document.querySelectorAll('section[id]');
                    const scrollPos = window.scrollY + 100;
                    const currentNavLinks = document.querySelectorAll('.nav-link'); // Get fresh reference

                    if (sections && sections.forEach) {
                        sections.forEach(section => {
                            try {
                                const sectionTop = section.offsetTop;
                                const sectionHeight = section.offsetHeight;
                                const sectionId = section.getAttribute('id');
                                const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

                                if (navLink && scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                                    if (currentNavLinks && currentNavLinks.forEach) {
                                        currentNavLinks.forEach(link => link.classList && link.classList.remove('active'));
                                    }
                                    navLink.classList && navLink.classList.add('active');
                                    
                                    // Update URL hash for deep linking on scroll
                                    if (window.history && window.history.replaceState) {
                                        const currentHash = window.location.hash.substring(1);
                                        if (currentHash !== sectionId) {
                                            window.history.replaceState(null, null, `#${sectionId}`);
                                        }
                                    } else if (window.location.hash !== `#${sectionId}`) {
                                        window.location.hash = sectionId;
                                    }
                                }
                            } catch (err) {
                                console.warn('Error updating active nav link:', err);
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Error in updateActiveNavLink:', e);
                }
            }
            
            // Throttled scroll event for performance
            let ticking = false;
            function onScroll() {
                try {
                    if (!ticking && window.requestAnimationFrame) {
                        window.requestAnimationFrame(function() {
                            updateActiveNavLink();
                            ticking = false;
                        });
                        ticking = true;
                    } else if (!window.requestAnimationFrame) {
                        // Fallback for older browsers
                        updateActiveNavLink();
                    }
                } catch (e) {
                    console.warn('Error in scroll handler:', e);
                }
            }
            
            if (window && window.addEventListener) {
                window.addEventListener('scroll', onScroll);
            }
            updateActiveNavLink(); // Initial call
            
            // Handle initial URL hash on page load
            try {
                const initialHash = window.location.hash;
                if (initialHash && initialHash.length > 1) {
                    const targetId = initialHash.substring(1);
                    const targetElement = document.getElementById(targetId);
                    const targetNavLink = document.querySelector(`.nav-link[href="#${targetId}"]`);
                    
                    if (targetElement && targetNavLink) {
                        // Highlight the appropriate nav link
                        const allNavLinks = document.querySelectorAll('.nav-link');
                        if (allNavLinks && allNavLinks.forEach) {
                            allNavLinks.forEach(link => link.classList && link.classList.remove('active'));
                        }
                        targetNavLink.classList.add('active');
                        
                        // Scroll to the section after a short delay to ensure page is loaded
                        setTimeout(() => {
                            if (targetElement.scrollIntoView) {
                                targetElement.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start'
                                });
                            }
                        }, 100);
                    }
                }
            } catch (e) {
                console.warn('Error handling initial hash:', e);
            }
            
        } catch (e) {
            console.error('Error initializing navigation:', e);
        }
    }
}

// DOM Elements
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const themeToggle = document.querySelector('.theme-toggle');
const navbar = document.querySelector('.navbar');
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
        
        // Add a smooth transition effect
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
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
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => this.toggle());
            navLinks.forEach(link => {
                link.addEventListener('click', () => this.close());
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.isOpen && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                    this.close();
                }
            });
        }
    }

    toggle() {
        if (navMenu && navToggle) {
            this.isOpen = !this.isOpen;
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            
            // Prevent scrolling when menu is open
            document.body.style.overflow = this.isOpen ? 'hidden' : '';
        }
    }

    close() {
        if (navMenu && navToggle) {
            this.isOpen = false;
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

// Advanced Scroll Effects with Enhanced Parallax
class AdvancedScrollEffects {
    constructor() {
        this.lastScrollY = window.scrollY;
        this.ticking = false;
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => this.requestTick());
        this.handleScroll(); // Initial call
    }

    requestTick() {
        if (!this.ticking) {
            requestAnimationFrame(() => this.handleScroll());
            this.ticking = true;
        }
    }

    handleScroll() {
        const currentScrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Update scroll progress
        this.updateScrollProgress(currentScrollY, documentHeight, windowHeight);
        
        // Enhanced parallax effects
        this.updateParallaxLayers(currentScrollY);
        this.updateBackgroundElements(currentScrollY);
        this.updateDynamicBackgrounds(currentScrollY);
        
        // Original effects
        this.updateParallax(currentScrollY);
        this.updateFloatingElements(currentScrollY);
        this.updateGeometricShapes(currentScrollY);
        
        // Show/hide floating action button
        if (fab) {
            if (currentScrollY > 300) {
                fab.classList.add('visible');
            } else {
                fab.classList.remove('visible');
            }
        }
        
        // Add in-view class to parallax sections
        this.updateInViewSections();
        
        this.lastScrollY = currentScrollY;
        this.ticking = false;
        
        // Update active nav link
        this.updateActiveNavLink();
    }

    updateScrollProgress(scrollY, docHeight, winHeight) {
        const progressBar = document.querySelector('.scroll-progress-bar');
        if (progressBar) {
            const progress = (scrollY / (docHeight - winHeight)) * 100;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    updateParallaxLayers(scrollY) {
        const parallaxLayers = document.querySelectorAll('.parallax-layer');
        parallaxLayers.forEach((layer, index) => {
            const speed = layer.dataset.speed || (0.2 + (index * 0.2));
            const yPos = -(scrollY * speed);
            const rotation = scrollY * 0.05;
            layer.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg)`;
        });
    }

    updateBackgroundElements(scrollY) {
        // Update background grid
        const gridLines = document.querySelectorAll('.grid-line');
        gridLines.forEach((line, index) => {
            const speed = 0.1 + (index * 0.02);
            const offset = scrollY * speed;
            if (line.classList.contains('grid-vertical')) {
                line.style.transform = `translateY(${offset}px)`;
            } else {
                line.style.transform = `translateX(${offset}px)`;
            }
        });

        // Update background dots
        const bgDots = document.querySelectorAll('.bg-dot');
        bgDots.forEach((dot, index) => {
            const speed = 0.15 + (index * 0.03);
            const yPos = -(scrollY * speed);
            const rotation = scrollY * (0.1 + index * 0.05);
            dot.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg)`;
        });

        // Update background circles
        const bgCircles = document.querySelectorAll('.bg-circle');
        bgCircles.forEach((circle, index) => {
            const speed = 0.08 + (index * 0.02);
            const yPos = -(scrollY * speed);
            const scale = 1 + (scrollY * 0.0001);
            circle.style.transform = `translate3d(0, ${yPos}px, 0) scale(${scale})`;
        });
    }

    updateDynamicBackgrounds(scrollY) {
        // Update code snippets
        const codeSnippets = document.querySelectorAll('.code-snippet');
        codeSnippets.forEach((snippet, index) => {
            const speed = 0.12 + (index * 0.02);
            const yPos = -(scrollY * speed);
            const rotation = scrollY * (0.05 + index * 0.02);
            snippet.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg)`;
        });

        // Update tech icons
        const techIcons = document.querySelectorAll('.tech-icon');
        techIcons.forEach((icon, index) => {
            const speed = 0.18 + (index * 0.03);
            const yPos = -(scrollY * speed);
            const bounce = Math.sin(scrollY * 0.01 + index) * 10;
            icon.style.transform = `translate3d(0, ${yPos + bounce}px, 0)`;
        });

        // Update background waves
        const waves = document.querySelectorAll('.wave');
        waves.forEach((wave, index) => {
            const speed = 0.05 + (index * 0.02);
            const rotation = scrollY * (0.1 + index * 0.05);
            const scale = 1 + (scrollY * 0.0002);
            wave.style.transform = `rotate(${rotation}deg) scale(${scale})`;
        });
    }

    updateInViewSections() {
        const sections = document.querySelectorAll('.parallax-section');
        const windowHeight = window.innerHeight;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const isInView = rect.top < windowHeight && rect.bottom > 0;
            
            if (isInView) {
                section.classList.add('in-view');
            } else {
                section.classList.remove('in-view');
            }
        });
    }

    updateParallax(scrollY) {
        const parallaxElements = document.querySelectorAll('.parallax-bg');
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrollY * speed);
            element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    }

    updateFloatingElements(scrollY) {
        const floatingOrbs = document.querySelectorAll('.floating-orb');
        floatingOrbs.forEach((orb, index) => {
            const speed = 0.2 + (index * 0.1);
            const rotation = (scrollY * 0.1) + (index * 30);
            const yPos = -(scrollY * speed);
            orb.style.transform = `translate3d(0, ${yPos}px, 0) rotateY(${rotation}deg) rotateX(${rotation * 0.5}deg)`;
        });
    }

    updateGeometricShapes(scrollY) {
        const shapes = document.querySelectorAll('.geometric-float');
        shapes.forEach((shape, index) => {
            const speed = 0.3 + (index * 0.15);
            const rotation = scrollY * (0.5 + index * 0.2);
            const yPos = -(scrollY * speed);
            shape.style.transform = `translate3d(0, ${yPos}px, 0) rotateZ(${rotation}deg)`;
        });
    }

    updateActiveNavLink() {
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
            }
        });
    }
}

// 3D Intersection Observer for Scroll Animations
class Advanced3DObserver {
    constructor() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Add staggered animation delay for multiple elements in the same container
                    if (entry.target.parentElement.classList.contains('skills-grid') || 
                        entry.target.parentElement.classList.contains('projects-grid') ||
                        entry.target.parentElement.classList.contains('experience-grid') ||
                        entry.target.parentElement.classList.contains('contact-info') ||
                        entry.target.parentElement.classList.contains('about-stats')) {
                        
                        const siblings = Array.from(entry.target.parentElement.children);
                        const index = siblings.indexOf(entry.target);
                        entry.target.style.transitionDelay = `${index * 0.1}s`;
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        this.init();
    }
    
    init() {
        // Observe all 3D scroll elements
        const elements = document.querySelectorAll('.scroll-3d');
        elements.forEach(el => {
            this.observer.observe(el);
        });
    }
}

// Subtle Mouse Movement Effects
class Mouse3DEffects {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            // Removed dramatic card tilts - keeping it clean like Apple
            this.updateFloatingElements(e);
        });
    }

    updateFloatingElements(e) {
        const floatingOrbs = document.querySelectorAll('.floating-orb');
        const { innerWidth, innerHeight } = window;
        
        floatingOrbs.forEach((orb, index) => {
            const speed = (index + 1) * 0.01; // Reduced from 0.02
            const x = (e.clientX - innerWidth / 2) * speed;
            const y = (e.clientY - innerHeight / 2) * speed;
            
            orb.style.transform += ` translate3d(${x}px, ${y}px, 0)`;
        });
    }
}

// Clean Smooth Scroll
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Clean FAB scroll
        if (fab) {
            fab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Subtle scale effect
                fab.style.transform = 'scale(0.95)';
                
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                
                // Reset FAB transform
                setTimeout(() => {
                    fab.style.transform = '';
                }, 200);
            });
        }
    }
}

// Interactive Cursor Trail Effect
class CursorTrail {
    constructor() {
        this.trails = [];
        this.maxTrails = 5;
        this.init();
    }

    init() {
        // Create cursor trail elements
        for (let i = 0; i < this.maxTrails; i++) {
            const trail = document.createElement('div');
            trail.className = 'cursor-trail';
            trail.style.opacity = (this.maxTrails - i) / this.maxTrails;
            trail.style.transform = 'scale(' + (this.maxTrails - i) / this.maxTrails + ')';
            document.body.appendChild(trail);
            this.trails.push({
                element: trail,
                x: 0,
                y: 0
            });
        }

        document.addEventListener('mousemove', (e) => {
            this.updateTrails(e.clientX, e.clientY);
        });
    }

    updateTrails(mouseX, mouseY) {
        this.trails.forEach((trail, index) => {
            if (index === 0) {
                trail.x = mouseX;
                trail.y = mouseY;
            } else {
                const prevTrail = this.trails[index - 1];
                trail.x += (prevTrail.x - trail.x) * 0.3;
                trail.y += (prevTrail.y - trail.y) * 0.3;
            }
            
            trail.element.style.left = trail.x + 'px';
            trail.element.style.top = trail.y + 'px';
        });
    }
}

// Performance-optimized Page Loader
class PageLoader {
    constructor() {
        this.init();
    }

    init() {
        // Add initial loading state
        document.body.style.opacity = '0';
        document.body.style.transform = 'scale(0.95)';
        
        // Animate in when everything is loaded
        window.addEventListener('load', () => {
            document.body.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            document.body.style.opacity = '1';
            document.body.style.transform = 'scale(1)';
            
            // Trigger initial scroll animations
            setTimeout(() => {
                const heroElements = document.querySelectorAll('.hero .scroll-3d');
                heroElements.forEach((el, index) => {
                    setTimeout(() => {
                        el.classList.add('visible');
                    }, index * 200);
                });
            }, 300);
        });
    }
}

// Simple navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize Portfolio Renderer (loads data.json)
        const portfolioRenderer = new PortfolioRenderer();
        
        // Initialize Theme Manager
        const themeManager = new ThemeManager();
        
        // Mobile navigation toggle
        const navToggle = document.querySelector('.nav-toggle');
        const navbar = document.querySelector('.navbar');
        
        if (navToggle && navbar && navToggle.addEventListener) {
            navToggle.addEventListener('click', function() {
                try {
                    navToggle.classList.toggle('active');
                    navbar.classList.toggle('active');
                } catch (e) {
                    console.warn('Error toggling navigation:', e);
                }
            });
        }
        
        // Close mobile menu when clicking outside
        if (document && document.addEventListener) {
            document.addEventListener('click', function(e) {
                try {
                    if (navbar && navToggle && 
                        navbar.contains && navToggle.contains &&
                        navbar.classList && navbar.classList.contains &&
                        !navbar.contains(e.target) && 
                        !navToggle.contains(e.target) && 
                        navbar.classList.contains('active')) {
                        navToggle.classList.remove('active');
                        navbar.classList.remove('active');
                    }
                } catch (err) {
                    console.warn('Error handling outside click:', err);
                }
            });
        }
        
    } catch (e) {
        console.error('Error initializing application:', e);
    }
}); 