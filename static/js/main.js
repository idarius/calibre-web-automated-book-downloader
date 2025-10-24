// Modern UI script: search, cards, details, downloads, status, theme, navigation
// Reuses existing API endpoints. Keeps logic minimal and accessible.

(function () {
  // ---- Navigation State ----
  const navigation = {
    currentPage: 'home',
    isMobileMenuOpen: false,
    
    init() {
      this.setupMobileMenu();
      this.setupNavigationLinks();
      this.setupDownloadsLink();
      this.loadInitialState();
      this.setupScrollMonitoring();
    },
    
    setupMobileMenu() {
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      const sidebarOverlay = document.getElementById('sidebar-overlay');
      const sidebar = document.getElementById('sidebar');
      
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
          this.toggleMobileMenu();
        });
      }
      
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
          this.closeMobileMenu();
        });
      }
      
      // Close mobile menu when clicking a navigation item
      if (sidebar) {
        sidebar.addEventListener('click', (e) => {
          if (window.innerWidth <= 768 && e.target.closest('.sidebar-link')) {
            this.closeMobileMenu();
          }
        });
      }
    },
    
    setupNavigationLinks() {
      const sidebarItems = document.querySelectorAll('.sidebar-item');
      
      sidebarItems.forEach(item => {
        const link = item.querySelector('.sidebar-link');
        if (link && !link.id) { // Skip special links like downloads
          link.addEventListener('click', (e) => {
            // Toujours utiliser la navigation SPA pour toutes les pages
            e.preventDefault();
            
            // DEBUG: Log scroll position before navigation
            console.log(`DEBUG: Navigation link clicked - Current scroll position:`, {
              scrollX: window.scrollX,
              scrollY: window.scrollY,
              pageElement: document.documentElement.scrollTop,
              bodyElement: document.body.scrollTop,
              targetPage: item.getAttribute('data-page')
            });
            
            const targetPage = item.getAttribute('data-page');
            const hashUrl = '/' + (targetPage === 'home' ? '' : '#' + targetPage);
            this.navigateToPage(targetPage, hashUrl);
          });
        }
      });
      
      // Gérer également les liens dans le contenu (comme les boutons sur la page d'accueil)
      document.addEventListener('click', (e) => {
        const target = e.target.closest('a[href="/#search"], a[href="/#popular"]');
        if (target) {
          e.preventDefault();
          
          // DEBUG: Log scroll position before content navigation
          const href = target.getAttribute('href');
          const page = href.includes('/#search') ? 'search' : 'popular';
          console.log(`DEBUG: Content navigation link clicked - Current scroll position:`, {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            pageElement: document.documentElement.scrollTop,
            bodyElement: document.body.scrollTop,
            targetPage: page
          });
          
          this.navigateToPage(page, href);
        }
      });
    },
    
    getCurrentPageFromPath() {
      const path = window.location.pathname;
      if (path.includes('/search')) return 'search';
      if (path.includes('/popular')) return 'popular';
      return 'home';
    },
    
    setupDownloadsLink() {
      const downloadsLink = document.getElementById('downloads-sidebar-link');
      if (downloadsLink) {
        downloadsLink.addEventListener('click', (e) => {
          e.preventDefault();
          // Use existing sidebar functionality
          if (typeof sidebar !== 'undefined') {
            sidebar.toggle();
          }
        });
      }
    },
    
    
    toggleMobileMenu() {
      if (this.isMobileMenuOpen) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    },
    
    openMobileMenu() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      
      if (sidebar && overlay) {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        this.isMobileMenuOpen = true;
        
        // Garder la scrollbar visible pour éviter le décalage
        document.body.style.overflow = 'auto';
      }
    },
    
    closeMobileMenu() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      
      if (sidebar && overlay) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        this.isMobileMenuOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
      }
    },
    
    // Fonction pour réinitialiser la position de défilement en haut de la page
    resetScrollPosition() {
      console.log('=== RESETTING SCROLL POSITION ===');
      console.log('Before reset - Current scroll position:', {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        pageElement: document.documentElement.scrollTop,
        bodyElement: document.body.scrollTop
      });
      
      // Utiliser requestAnimationFrame pour garantir l'exécution après le rendu
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        // Pour les conteneurs avec défilement interne
        const scrollableContainers = document.querySelectorAll('[id$="-page"]');
        scrollableContainers.forEach(container => {
          container.scrollTop = 0;
        });
        
        console.log('After reset - New scroll position:', {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          pageElement: document.documentElement.scrollTop,
          bodyElement: document.body.scrollTop
        });
      });
    },
    
    // Configuration du monitoring de défilement pour le débogage
    setupScrollMonitoring() {
      let lastScrollY = 0;
      let lastScrollX = 0;
      
      // Observer les changements de position de défilement
      const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log('DEBUG: Element scrolled into view:', entry.target.id);
          }
        });
      });
      
      // Surveiller les changements de défilement
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const currentScrollX = window.scrollX;
        
        // Détecter les changements significatifs
        if (Math.abs(currentScrollY - lastScrollY) > 50 || Math.abs(currentScrollX - lastScrollX) > 50) {
          console.log('DEBUG: Significant scroll change detected:', {
            from: { x: lastScrollX, y: lastScrollY },
            to: { x: currentScrollX, y: currentScrollY },
            page: this.currentPage
          });
          
          lastScrollY = currentScrollY;
          lastScrollX = currentScrollX;
        }
      }, { passive: true });
      
      // Observer les conteneurs de page
      setTimeout(() => {
        const pageContainers = document.querySelectorAll('[id$="-page"]');
        pageContainers.forEach(container => {
          scrollObserver.observe(container);
        });
      }, 1000);
    },
    
    async navigateToPage(page, url) {
      if (page === this.currentPage) return;
      
      const navigationStartTime = performance.now();
      console.log(`⏱️ PERFORMANCE: Starting navigation to ${page} at ${navigationStartTime}ms`);
      
      try {
        // DEBUG: Log current scroll position before navigation
        console.log(`DEBUG: Navigation to ${page} - Current scroll position:`, {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          pageElement: document.documentElement.scrollTop,
          bodyElement: document.body.scrollTop
        });
        
        // Regrouper toutes les modifications DOM dans requestAnimationFrame pour éviter les reflows multiples
        await new Promise(resolve => {
          const rafStartTime = performance.now();
          console.log(`⏱️ PERFORMANCE: Entering first requestAnimationFrame at ${rafStartTime}ms (${rafStartTime - navigationStartTime}ms after start)`);
          
          requestAnimationFrame(async () => {
            const rafExecTime = performance.now();
            console.log(`⏱️ PERFORMANCE: First requestAnimationFrame executed at ${rafExecTime}ms (${rafExecTime - rafStartTime}ms after scheduling)`);
            try {
              // Show loading state
              this.showPageLoading();
              
              // Update current page IMMÉDIATEMENT pour éviter les conflits
              this.currentPage = page;
              
              // Update active state in sidebar
              this.updateActiveMenuItem(page);
              
              // Load page content with better error handling
              await this.loadPageContent(page);
              
              // Update browser history with hash for SPA navigation
              if (page === 'home') {
                history.pushState({ page }, '', '/');
              } else {
                // Utiliser l'URL avec hash pour éviter les requêtes au serveur
                const hashUrl = '/#' + page;
                history.pushState({ page }, '', hashUrl);
              }
              
              // Hide loading state
              this.hidePageLoading();
              
              // Reset scroll position after loading content
              this.resetScrollPosition();
              
              // DEBUG: Log scroll position after content load but before initialization
              console.log(`DEBUG: After loading ${page} content - Scroll position:`, {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                pageElement: document.documentElement.scrollTop,
                bodyElement: document.body.scrollTop
              });
              
              // Initialize page-specific functionality SANS délai pour éviter le décalage
              // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
              const initRafStartTime = performance.now();
              console.log(`⏱️ PERFORMANCE: Scheduling second requestAnimationFrame at ${initRafStartTime}ms (${initRafStartTime - navigationStartTime}ms after start)`);
              
              requestAnimationFrame(() => {
                const initRafExecTime = performance.now();
                console.log(`⏱️ PERFORMANCE: Second requestAnimationFrame executed at ${initRafExecTime}ms (${initRafExecTime - initRafStartTime}ms after scheduling)`);
                
                this.initializePage(page);
                
                const initCompleteTime = performance.now();
                console.log(`⏱️ PERFORMANCE: Page initialization completed at ${initCompleteTime}ms (${initCompleteTime - navigationStartTime}ms total navigation time)`);
                
                // DEBUG: Log scroll position after page initialization
                console.log(`DEBUG: After initializing ${page} - Scroll position:`, {
                  scrollX: window.scrollX,
                  scrollY: window.scrollY,
                  pageElement: document.documentElement.scrollTop,
                  bodyElement: document.body.scrollTop
                });
                
                resolve();
              });
            } catch (error) {
              console.error('Navigation error:', error);
              this.hidePageLoading();
              
              // Show error message and fallback
              this.showErrorMessage('Erreur de chargement. Tentative de navigation traditionnelle...');
              
              // Fallback to traditional navigation after a short delay
              setTimeout(() => {
                window.location.href = url;
              }, 1000);
              
              resolve();
            }
          });
        });
        
      } catch (error) {
        console.error('Navigation error:', error);
        this.hidePageLoading();
        
        // Show error message and fallback
        this.showErrorMessage('Erreur de chargement. Tentative de navigation traditionnelle...');
        
        // Fallback to traditional navigation after a short delay
        setTimeout(() => {
          window.location.href = url;
        }, 1000);
      }
    },
    
    showErrorMessage(message) {
      const pageContent = document.getElementById('page-content');
      if (pageContent) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-center py-8 px-4';
        errorDiv.style.color = 'var(--text)';
        errorDiv.innerHTML = `
          <div class="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-lg font-medium mb-2">${message}</p>
          <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Actualiser la page
          </button>
        `;
        pageContent.innerHTML = '';
        pageContent.appendChild(errorDiv);
      }
    },
    
    updateActiveMenuItem(page) {
      const sidebarItems = document.querySelectorAll('.sidebar-item');
      
      sidebarItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === page) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    },
    
    async loadPageContent(page) {
      console.log(`=== loadPageContent called for: ${page} ===`);
      
      // DEBUG: Log scroll position at the beginning of loadPageContent
      console.log(`DEBUG: loadPageContent(${page}) - Initial scroll position:`, {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        pageElement: document.documentElement.scrollTop,
        bodyElement: document.body.scrollTop
      });
      
      // Hide all page containers first
      const allPages = document.querySelectorAll('[id$="-page"]');
      console.log(`Found ${allPages.length} page containers`);
      for (const pageEl of allPages) {
        pageEl.classList.add('hidden');
      }
      
      // Show the target page container
      const targetPage = document.getElementById(`${page}-page`);
      if (!targetPage) {
        console.error(`Target page container not found: #${page}-page`);
        throw new Error(`Target page container not found: #${page}-page`);
      }
      
      console.log(`Target page container found: #${page}-page`);
      
      // Special handling for home page - content is already in HTML
      if (page === 'home') {
        console.log('Loading home page (content already in HTML)');
        targetPage.classList.remove('hidden');
        
        // DEBUG: Log scroll position after showing home page
        console.log(`DEBUG: After showing home page - Scroll position:`, {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          pageElement: document.documentElement.scrollTop,
          bodyElement: document.body.scrollTop
        });
        return;
      }
      
      // Make sure the target page is visible before loading content
      targetPage.classList.remove('hidden');
      console.log(`Made ${page}-page visible`);
      
      // DEBUG: Log scroll position after making page visible
      console.log(`DEBUG: After making ${page} visible - Scroll position:`, {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        pageElement: document.documentElement.scrollTop,
        bodyElement: document.body.scrollTop
      });
      
      // For search, popular and admin pages, fetch content
      const contentMap = {
        'search': this.getSearchContent(),
        'popular': this.getPopularContent(),
        'admin': this.getAdminContent()
      };
      
      const content = contentMap[page];
      if (!content) {
        console.error(`Unknown page: ${page}`);
        throw new Error(`Unknown page: ${page}`);
      }
      
      try {
        console.log(`Starting to load content for page: ${page}`);
        let finalContent;
        if (typeof content === 'string') {
          finalContent = content;
          console.log(`Content is a string, length: ${finalContent.length}`);
        } else {
          // For complex content, we might need to fetch from server
          console.log('Content is a function, calling it...');
          finalContent = await content;
          console.log(`Function returned content, length: ${finalContent ? finalContent.length : 'null'}`);
        }
        
        // Validate content before setting
        if (!finalContent || (typeof finalContent === 'string' && finalContent.trim() === '')) {
          console.error(`Empty content received for page: ${page}`);
          throw new Error(`Empty content received for page: ${page}`);
        }
        
        // Set content in the appropriate page container (replaces loading indicator)
        targetPage.innerHTML = finalContent;
        console.log(`Content set successfully for page: ${page}, innerHTML length: ${targetPage.innerHTML.length}`);
        
        // DEBUG: Log scroll position after setting content
        console.log(`DEBUG: After setting ${page} content - Scroll position:`, {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          pageElement: document.documentElement.scrollTop,
          bodyElement: document.body.scrollTop
        });
        
        // For search and popular pages, we need to ensure the content is properly structured
        if (page === 'search' || page === 'popular') {
          // OPTIMISATION: Réduire le délai de 50ms à 10ms et utiliser requestAnimationFrame
          // au lieu de setTimeout pour une meilleure synchronisation avec le cycle de rendu
          const delayStartTime = performance.now();
          console.log(`⏱️ PERFORMANCE: Starting optimized 10ms delay for ${page} at ${delayStartTime}ms`);
          
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              const delayEndTime = performance.now();
              console.log(`⏱️ PERFORMANCE: Optimized delay completed for ${page} at ${delayEndTime}ms (actual: ${delayEndTime - delayStartTime}ms)`);
              resolve();
            });
          });
          
          console.log(`Optimized delay added for ${page} page initialization`);
          
          // DEBUG: Log scroll position after delay
          console.log(`DEBUG: After ${page} delay - Scroll position:`, {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            pageElement: document.documentElement.scrollTop,
            bodyElement: document.body.scrollTop
          });
        }
        
      } catch (contentError) {
        console.error('Error setting page content:', contentError);
        console.error('Error details:', {
          message: contentError.message,
          stack: contentError.stack,
          page
        });
        // Set fallback content
        targetPage.innerHTML = `
          <div class="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium mb-2">Erreur lors du chargement du contenu</p>
            <p class="text-sm opacity-70 mb-4">Veuillez réessayer plus tard</p>
            <p class="text-xs opacity-50 mb-4">Erreur: ${contentError.message}</p>
            <button onclick="navigation.navigateToPage('${page}', '/${page}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Réessayer
            </button>
          </div>
        `;
      }
    },
    
    getHomeContent() {
      // Pour la page d'accueil, nous retournons une chaîne vide car le contenu est déjà dans le HTML
      // Nous allons juste afficher/masquer les conteneurs appropriés
      return '';
    },
    
    async getSearchContent() {
      const searchFetchStart = performance.now();
      console.log('⏱️ PERFORMANCE: Starting getSearchContent fetch at', searchFetchStart, 'ms');
      
      try {
        const response = await fetch('/request/search');
        const responseTime = performance.now();
        console.log('⏱️ PERFORMANCE: Search fetch response received at', responseTime, 'ms (', responseTime - searchFetchStart, 'ms)');
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const parseTime = performance.now();
        console.log('⏱️ PERFORMANCE: Search JSON parsed at', parseTime, 'ms (', parseTime - responseTime, 'ms)');
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const content = data.content || '';
        if (!content || content.trim() === '') {
          throw new Error('Empty content received');
        }
        
        return content;
      } catch (error) {
        console.error('Error loading search content:', error);
        // Return fallback content instead of throwing
        return `
          <div class="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium mb-2">Erreur lors du chargement de la recherche</p>
            <p class="text-sm opacity-70 mb-4">Veuillez réessayer plus tard</p>
            <button onclick="navigation.navigateToPage('search', '/search')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Réessayer
            </button>
          </div>
        `;
      }
    },
    
    async getPopularContent() {
      const popularFetchStart = performance.now();
      console.log('⏱️ PERFORMANCE: Starting getPopularContent fetch at', popularFetchStart, 'ms');
      
      try {
        const response = await fetch('/request/popular');
        const responseTime = performance.now();
        console.log('⏱️ PERFORMANCE: Popular fetch response received at', responseTime, 'ms (', responseTime - popularFetchStart, 'ms)');
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const parseTime = performance.now();
        console.log('⏱️ PERFORMANCE: Popular JSON parsed at', parseTime, 'ms (', parseTime - responseTime, 'ms)');
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const content = data.content || '';
        if (!content || content.trim() === '') {
          throw new Error('Empty content received');
        }
        
        return content;
      } catch (error) {
        console.error('Error loading popular content:', error);
        // Return fallback content instead of throwing
        return `
          <div class="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium mb-2">Erreur lors du chargement des livres populaires</p>
            <p class="text-sm opacity-70 mb-4">Veuillez réessayer plus tard</p>
            <button onclick="navigation.navigateToPage('popular', '/popular')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Réessayer
            </button>
          </div>
        `;
      }
    },
    
    async getAdminContent() {
      const adminFetchStart = performance.now();
      console.log('⏱️ PERFORMANCE: Starting getAdminContent fetch at', adminFetchStart, 'ms');
      
      try {
        const response = await fetch('/request/admin');
        const responseTime = performance.now();
        console.log('⏱️ PERFORMANCE: Admin fetch response received at', responseTime, 'ms (', responseTime - adminFetchStart, 'ms)');
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const parseTime = performance.now();
        console.log('⏱️ PERFORMANCE: Admin JSON parsed at', parseTime, 'ms (', parseTime - responseTime, 'ms)');
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format');
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const content = data.content || '';
        if (!content || content.trim() === '') {
          throw new Error('Empty content received');
        }
        
        return content;
      } catch (error) {
        console.error('Error loading admin content:', error);
        // Return fallback content instead of throwing
        return `
          <div class="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium mb-2">Erreur lors du chargement de la page d'administration</p>
            <p class="text-sm opacity-70 mb-4">Veuillez réessayer plus tard</p>
            <button onclick="navigation.navigateToPage('admin', '/admin')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Réessayer
            </button>
          </div>
        `;
      }
    },
    
    initializeAdminPage() {
      // Initialisation de la page d'administration
      console.log('Initializing admin page...');
      
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt SANS délai
      requestAnimationFrame(() => {
        // Lier les boutons ou formulaires spécifiques à l'administration
        const adminButtons = document.querySelectorAll('[data-admin-action]');
        adminButtons.forEach(button => {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            const action = button.getAttribute('data-admin-action');
            console.log(`Admin action triggered: ${action}`);
            // Ajoutez ici la logique pour chaque action d'administration
          });
        });
        
        console.log('Admin page initialized successfully');
      });
    },
    
    showPageLoading() {
      const pageContent = document.getElementById('page-content');
      if (pageContent) {
        pageContent.classList.add('page-loading');
      }
    },
    
    hidePageLoading() {
      const pageContent = document.getElementById('page-content');
      if (pageContent) {
        pageContent.classList.remove('page-loading');
      }
    },
    
    initializePage(page) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt sans délai
      requestAnimationFrame(() => {
        switch (page) {
          case 'search':
            this.initializeSearchPage();
            break;
          case 'popular':
            this.initializePopularPage();
            break;
          case 'admin':
            this.initializeAdminPage();
            break;
        }
      });
    },
    
    refreshSearchElements() {
      // Mettre à jour les références aux éléments de recherche
      el.resultsContainer = document.getElementById('results-container');
      el.noResults = document.getElementById('no-results');
      el.searchLoading = document.getElementById('search-loading');
      el.viewToggleContainer = document.getElementById('view-toggle-container');
      el.viewGridBtn = document.getElementById('view-grid');
      el.viewListBtn = document.getElementById('view-list');
      
      // Mettre également à jour les éléments de formulaire de recherche
      el.searchInput = document.getElementById('search-input');
      el.searchBtn = document.getElementById('search-button');
      el.filtersForm = document.getElementById('search-filters');
      el.isbn = document.getElementById('isbn-input');
      el.author = document.getElementById('author-input');
      el.title = document.getElementById('title-input');
      el.lang = document.getElementById('lang-input');
      el.sort = document.getElementById('sort-input');
      el.content = document.getElementById('content-input');
      
      const elements = {
        resultsContainer: el.resultsContainer,
        noResults: el.noResults,
        searchLoading: el.searchLoading,
        viewToggleContainer: el.viewToggleContainer,
        viewGridBtn: el.viewGridBtn,
        viewListBtn: el.viewListBtn,
        searchInput: el.searchInput,
        searchBtn: el.searchBtn,
        filtersForm: el.filtersForm
      };
      
      console.log('Search elements refreshed:', {
        resultsContainer: !!el.resultsContainer,
        noResults: !!el.noResults,
        searchLoading: !!el.searchLoading,
        viewToggleContainer: !!el.viewToggleContainer,
        viewGridBtn: !!el.viewGridBtn,
        viewListBtn: !!el.viewListBtn,
        searchInput: !!el.searchInput,
        searchBtn: !!el.searchBtn,
        filtersForm: !!el.filtersForm
      });
      
      return elements;
    },

    initializeSearchPage() {
      // Utiliser requestAnimationFrame avec retry pour s'assurer que le DOM est prêt
      const initWithRetry = (retryCount = 0) => {
        requestAnimationFrame(() => {
          try {
            // Mettre à jour les références aux éléments de recherche
            this.refreshSearchElements();
            
            // Vérifier que les éléments essentiels existent
            const searchBtn = document.getElementById('search-button');
            const searchInput = document.getElementById('search-input');
            const advSearchBtn = document.getElementById('adv-search-button');
            
            console.log('Initializing search page, elements found:', {
              searchBtn: !!searchBtn,
              searchInput: !!searchInput,
              advSearchBtn: !!advSearchBtn,
              retryCount
            });
            
            // Si les éléments essentiels ne sont pas trouvés, réessayer
            if (!searchBtn && !searchInput && retryCount < 3) {
              console.warn('Search elements not found, retrying...');
              initWithRetry(retryCount + 1);
              return;
            }
            
            // Réinitialiser l'état de recherche au chargement de la page
            searchState.reset();
            
            // Toujours lier les événements, même si l'objet search n'est pas encore disponible
            if (searchBtn) {
              // Utiliser une approche plus simple et fiable pour lier les événements
              // Supprimer tous les gestionnaires d'événements existants
              searchBtn.removeEventListener('click', this.searchButtonHandler);
              // Créer et attacher le nouveau gestionnaire
              this.searchButtonHandler = (e) => {
                e.preventDefault();
                console.log('Search button clicked');
                this.performSearch();
              };
              searchBtn.addEventListener('click', this.searchButtonHandler);
            }
            
            if (searchInput) {
              // Utiliser une approche plus simple et fiable pour lier les événements
              // Supprimer tous les gestionnaires d'événements existants
              searchInput.removeEventListener('keydown', this.searchInputHandler);
              // Créer et attacher le nouveau gestionnaire
              this.searchInputHandler = (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  console.log('Enter key pressed in search input');
                  this.performSearch();
                }
              };
              searchInput.addEventListener('keydown', this.searchInputHandler);
            }
            
            // Advanced search toggle removed - filters are always visible
            console.log('Advanced search toggle removed - filters are always visible');
            
            // Bind advanced search button
            if (advSearchBtn) {
              // Utiliser une approche plus simple et fiable pour lier les événements
              // Supprimer tous les gestionnaires d'événements existants
              advSearchBtn.removeEventListener('click', this.advSearchButtonHandler);
              // Créer et attacher le nouveau gestionnaire
              this.advSearchButtonHandler = (e) => {
                e.preventDefault();
                console.log('Advanced search button clicked');
                this.performSearch();
              };
              advSearchBtn.addEventListener('click', this.advSearchButtonHandler);
            }
            
            // Initialize view toggle for search results avec vérification
            if (typeof viewManager !== 'undefined') {
              // Forcer la réinitialisation du gestionnaire de vue
              viewManager.currentView = localStorage.getItem(VIEW_PREFERENCE_KEY) || VIEW_MODES.GRID;
              
              // Vérifier que les éléments de vue existent avant de réinitialiser
              const viewToggleContainer = document.getElementById('view-toggle-container');
              if (viewToggleContainer) {
                // Utiliser requestAnimationFrame au lieu de setTimeout pour éviter le décalage
                requestAnimationFrame(() => {
                  viewManager.reinitViewButtons();
                  console.log('View manager reinitialized for search page');
                });
              } else {
                console.log('View toggle container not found, skipping view manager reinitialization');
              }
            } else {
              console.warn('View manager not available during search page initialization');
            }
            
          } catch (error) {
            console.error('Error initializing search page:', error);
            if (retryCount < 3) {
              initWithRetry(retryCount + 1);
            }
          }
        });
      };
      
      initWithRetry();
    },
    
    performSearch() {
      console.log('=== PERFORM SEARCH CALLED ===');
      console.log('search object available:', typeof search !== 'undefined');
      console.log('search.run available:', typeof search !== 'undefined' && search.run);
      
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt SANS délai
      requestAnimationFrame(() => {
        // Exécuter la recherche en utilisant l'objet global search si disponible
        if (typeof search !== 'undefined' && search.run) {
          console.log('Using global search object');
          try {
            search.run();
          } catch (error) {
            console.error('Error in global search.run():', error);
            // Fallback vers la méthode manuelle
            this.performManualSearch();
          }
        } else {
          console.log('Using fallback search method');
          this.performManualSearch();
        }
      });
    },
    
    performManualSearch() {
      console.log('=== PERFORM MANUAL SEARCH ===');
      
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt SANS délai
      requestAnimationFrame(() => {
        // Fallback: exécuter la recherche directement
        const qs = utils.buildQuery();
        console.log('Search query string:', qs);
        
        if (!qs) {
          console.log('Empty query, showing no results');
          window.lastSearchResults = [];
          if (typeof viewManager !== 'undefined') {
            viewManager.renderResults([]);
          }
          // Réinitialiser l'état de recherche si la requête est vide
          searchState.reset();
          return;
        }
        
        // Afficher le chargement
        const searchLoading = document.getElementById('search-loading');
        if (searchLoading) {
          searchLoading.classList.remove('hidden');
          console.log('Showing loading indicator');
        }
        
        // Vérifier les éléments de résultats
        let resultsContainer = document.getElementById('results-container');
        const noResults = document.getElementById('no-results');
        console.log('Results container available:', !!resultsContainer);
        console.log('No results element available:', !!noResults);
        
        if (!resultsContainer) {
          console.error('Results container not found, available elements:',
            Array.from(document.querySelectorAll('[id*="result"]')).map(el => el.id));
          console.error('All elements with IDs containing "result":',
            Array.from(document.querySelectorAll('[id*="result"]')));
          console.error('All elements in page:',
            Array.from(document.querySelectorAll('[id]')).slice(0, 20).map(el => el.id));
        }
        
        // Exécuter la recherche
        const searchUrl = `${API.search}?${qs}`;
        console.log('Executing search with URL:', searchUrl);
        
        // Afficher un message de débogage dans le conteneur de résultats
        if (resultsContainer) {
          resultsContainer.innerHTML = '<div class="text-center p-4">Recherche en cours...</div>';
        } else {
          console.error('Results container not found in performManualSearch, trying to refresh elements');
          // Essayer de rafraîchir les éléments si le conteneur n'est pas trouvé
          if (typeof navigation !== 'undefined' && navigation.refreshSearchElements) {
            navigation.refreshSearchElements();
            resultsContainer = el.resultsContainer || document.getElementById('results-container');
            if (resultsContainer) {
              resultsContainer.innerHTML = '<div class="text-center p-4">Recherche en cours...</div>';
            }
          }
        }
        
        utils.j(searchUrl).then(data => {
          console.log('=== SEARCH RESULTS RECEIVED ===');
          console.log('Data type:', typeof data);
          console.log('Data:', data);
          console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
          
          window.lastSearchResults = data;
          if (typeof viewManager !== 'undefined') {
            console.log('Calling viewManager.renderResults');
            viewManager.renderResults(data);
          } else {
            console.error('View manager not available');
          }
        }).catch(e => {
          console.error('=== SEARCH ERROR ===');
          console.error('Search error:', e);
          console.error('Error message:', e.message);
          console.error('Error stack:', e.stack);
          
          window.lastSearchResults = [];
          if (typeof viewManager !== 'undefined') {
            viewManager.renderResults([]);
          } else {
            console.error('View manager not available for error rendering');
          }
          
          // Afficher un message d'erreur détaillé
          if (resultsContainer) {
            resultsContainer.innerHTML = `
              <div class="text-center p-4">
                <p class="text-red-500 mb-2">Erreur lors de la recherche</p>
                <p class="text-sm opacity-70">${e.message}</p>
                <button onclick="navigation.performSearch()" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                  Réessayer
                </button>
              </div>
            `;
          } else {
            // Si le conteneur n'existe pas, créer une alerte
            console.error('Results container not found for error display');
            alert(`Erreur lors de la recherche: ${e.message}`);
          }
        }).finally(() => {
          // Cacher le chargement
          if (searchLoading) {
            searchLoading.classList.add('hidden');
            console.log('Hiding loading indicator');
          }
        });
      });
    },
    
    initializePopularPage() {
      console.log('=== INITIALIZING POPULAR PAGE ===');
      
      // Utiliser requestAnimationFrame avec retry pour s'assurer que le DOM est prêt
      const initWithRetry = (retryCount = 0) => {
        requestAnimationFrame(() => {
          try {
            // Check if required elements exist
            const container = document.getElementById('popular-books-container');
            const loading = document.getElementById('popular-books-loading');
            const noBooks = document.getElementById('no-popular-books');
            const viewGridBtn = document.getElementById('popular-view-grid');
            const viewListBtn = document.getElementById('popular-view-list');
            const viewToggleContainer = document.getElementById('popular-view-toggle-container');
            
            console.log('=== POPULAR PAGE ELEMENTS CHECK ===');
            console.log('container:', !!container, 'id:', container?.id);
            console.log('loading:', !!loading, 'id:', loading?.id);
            console.log('noBooks:', !!noBooks, 'id:', noBooks?.id);
            console.log('viewGridBtn:', !!viewGridBtn, 'id:', viewGridBtn?.id);
            console.log('viewListBtn:', !!viewListBtn, 'id:', viewListBtn?.id);
            console.log('viewToggleContainer:', !!viewToggleContainer, 'id:', viewToggleContainer?.id);
            console.log('retryCount:', retryCount);
            
            // Si le conteneur principal n'existe pas, réessayer
            if (!container) {
              console.warn('Popular books container not found, retrying...');
              if (retryCount < 3) {
                initWithRetry(retryCount + 1);
              } else {
                console.error('Failed to initialize popular page after 3 retries');
                this.showPopularPageError();
              }
              return;
            }
            
            // Utiliser le viewManager pour initialiser les boutons de vue avec vérification
            if (typeof viewManager !== 'undefined') {
              console.log('Using viewManager to initialize popular view toggle');
              // Ajouter un délai supplémentaire pour s'assurer que les boutons sont dans le DOM
              const viewToggleStart = performance.now();
              console.log('⏱️ PERFORMANCE: Starting 100ms delay for view toggle at', viewToggleStart, 'ms');
              
              setTimeout(() => {
                const viewToggleExecTime = performance.now();
                console.log('⏱️ PERFORMANCE: 100ms view toggle delay completed at', viewToggleExecTime, 'ms (actual:', viewToggleExecTime - viewToggleStart, 'ms)');
                viewManager.reinitPopularViewButtons();
              }, 100);
            } else {
              console.warn('viewManager not available for popular view initialization');
            }
            
            // Fetch popular books immediately avec vérification
            console.log('Initializing popular page, fetching books...');
            if (typeof homeSections !== 'undefined') {
              homeSections.fetchPopularBooks();
            } else {
              console.warn('homeSections object not available for fetching popular books');
            }
            
            // Re-bind refresh button avec vérification
            const refreshBtn = document.getElementById('refresh-popular');
            if (refreshBtn) {
              // Remove existing listeners to avoid duplicates
              refreshBtn.replaceWith(refreshBtn.cloneNode(true));
              const newRefreshBtn = document.getElementById('refresh-popular');
              newRefreshBtn.addEventListener('click', () => {
                console.log('Refresh button clicked, fetching popular books...');
                if (typeof homeSections !== 'undefined') {
                  homeSections.fetchPopularBooks(true);
                }
              });
            }
            
            // Set up a timeout to check if loading is stuck
            if (loading) {
              setTimeout(() => {
                if (loading && !loading.classList.contains('hidden')) {
                  console.warn('Popular books loading seems stuck, retrying...');
                  if (typeof homeSections !== 'undefined') {
                    homeSections.fetchPopularBooks();
                  }
                }
              }, 5000);
            }
            
          } catch (error) {
            console.error('Error initializing popular page:', error);
            if (retryCount < 3) {
              initWithRetry(retryCount + 1);
            } else {
              this.showPopularPageError();
            }
          }
        });
      };
      
      initWithRetry();
    },
    
    showPopularPageError() {
      const container = document.getElementById('popular-books-container');
      const loading = document.getElementById('popular-books-loading');
      
      if (loading) loading.classList.add('hidden');
      
      if (container) {
        container.innerHTML = `
          <div class="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium mb-2">Erreur lors du chargement des livres populaires</p>
            <p class="text-sm opacity-70 mb-4">Veuillez réessayer plus tard</p>
            <button onclick="navigation.initializePopularPage(); return false;" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Réessayer
            </button>
          </div>
        `;
      }
    },
    
    loadInitialState() {
      console.log('=== loadInitialState called ===');
      console.log('Current URL:', window.location.href);
      console.log('Current hash:', window.location.hash);
      
      
      // Déterminer la page depuis l'URL
      let page = 'home';
      const hash = window.location.hash.substring(1); // Enlever le #
      
      if (hash === 'search' || hash === 'popular' || hash === 'admin') {
        page = hash;
        console.log(`Hash detected: ${hash}, setting page to: ${page}`);
      } else {
        // Determine current page from URL path (pour les accès directs)
        const path = window.location.pathname;
        
        if (path.includes('/search')) {
          page = 'search';
        } else if (path.includes('/popular')) {
          page = 'popular';
        } else if (path.includes('/admin')) {
          page = 'admin';
        }
        
        // Vérifier si nous sommes sur une page directe (/search ou /popular)
        // et si le contenu affiché est du JSON brut
        if (page !== 'home') {
          // Vérifier si le corps de la page contient du JSON
          const bodyText = document.body.textContent || document.body.innerText;
          if (bodyText.trim().startsWith('{') && bodyText.includes('"content"')) {
            // Nous sommes sur une page JSON brute, rediriger vers la page d'accueil
            // puis naviguer vers la page appropriée
            console.log('Detected raw JSON page, redirecting to SPA navigation');
            window.location.href = '/#' + page;
            return;
          }
        }
      }
      
      console.log(`Initial page determined: ${page}`);
      
      // IMMÉDIATEMENT masquer la page d'accueil si nous ne sommes pas sur home
      // C'est crucial pour éviter le flash lors du rafraîchissement
      if (page !== 'home') {
        const homePage = document.getElementById('home-page');
        if (homePage) {
          homePage.classList.add('hidden');
          console.log('Home page hidden immediately');
        }
      }
      
      this.currentPage = page;
      this.updateActiveMenuItem(page);
      
      // Si nous ne sommes pas sur la page d'accueil, charger le contenu approprié IMMÉDIATEMENT
      if (page !== 'home') {
        console.log(`Loading initial page: ${page}`);
        // Utiliser une approche directe pour éviter tout délai
        this.handleInitialPageLoad(page);
      } else {
        // Pour la page d'accueil, s'assurer qu'elle est visible et masquer les autres
        console.log('Setting up home page');
        const homePage = document.getElementById('home-page');
        if (homePage) {
          homePage.classList.remove('hidden');
        }
        // Masquer les autres pages
        const searchPage = document.getElementById('search-page');
        const popularPage = document.getElementById('popular-page');
        const adminPage = document.getElementById('admin-page');
        if (searchPage) searchPage.classList.add('hidden');
        if (popularPage) popularPage.classList.add('hidden');
        if (adminPage) adminPage.classList.add('hidden');
      }
      
      // Handle browser back/forward
      window.addEventListener('popstate', (e) => {
        console.log('Popstate event detected:', e.state);
        
        // DEBUG: Log scroll position on popstate
        console.log(`DEBUG: Popstate event - Current scroll position:`, {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          pageElement: document.documentElement.scrollTop,
          bodyElement: document.body.scrollTop
        });
        
        if (e.state && e.state.page) {
          this.navigateToPage(e.state.page, window.location.pathname);
        } else {
          // Reset scroll position on popstate when no state is available
          this.resetScrollPosition();
          // Gérer le cas où l'état est vide (rafraîchissement de page avec hash)
          const currentHash = window.location.hash.substring(1);
          const currentPath = window.location.pathname;
          let currentPage = 'home';
          let currentUrl = '/';
          
          if (currentHash === 'search') {
            currentPage = 'search';
            currentUrl = '/#search';
          } else if (currentHash === 'popular') {
            currentPage = 'popular';
            currentUrl = '/#popular';
          } else if (currentHash === 'admin') {
            currentPage = 'admin';
            currentUrl = '/#admin';
          } else if (currentPath.includes('/search')) {
            currentPage = 'search';
            currentUrl = '/search';
          } else if (currentPath.includes('/popular')) {
            currentPage = 'popular';
            currentUrl = '/popular';
          } else if (currentPath.includes('/admin')) {
            currentPage = 'admin';
            currentUrl = '/admin';
          }
          
          console.log('Navigating to page from popstate:', currentPage, currentUrl);
          this.navigateToPage(currentPage, currentUrl);
        }
      });
      
      // Handle hash changes
      window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1);
        console.log('Hash change detected:', newHash);
        
        // DEBUG: Log scroll position on hashchange
        console.log(`DEBUG: Hashchange event - Current scroll position:`, {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          pageElement: document.documentElement.scrollTop,
          bodyElement: document.body.scrollTop,
          newHash
        });
        
        // Éviter les navigations en double
        if (newHash === this.currentPage) {
          console.log('Already on this page, skipping navigation');
          return;
        }
        
        if (newHash === 'search' || newHash === 'popular' || newHash === 'admin') {
          const hashUrl = '/#' + newHash;
          this.navigateToPage(newHash, hashUrl);
        } else if (newHash === '' || newHash === 'home') {
          this.navigateToPage('home', '/');
        } else {
          // Reset scroll position for unknown hash changes
          this.resetScrollPosition();
        }
      });
    },

    async handleInitialPageLoad(page) {
      console.log(`=== handleInitialPageLoad called for: ${page} ===`);
      
      // Regrouper toutes les modifications DOM dans requestAnimationFrame
      await new Promise(resolve => {
        requestAnimationFrame(async () => {
          try {
            // Masquer toutes les pages sauf la cible
            const allPages = document.querySelectorAll('[id$="-page"]');
            for (const pageEl of allPages) {
              pageEl.classList.add('hidden');
            }
            
            // Afficher la page cible
            const targetPage = document.getElementById(`${page}-page`);
            if (!targetPage) {
              throw new Error(`Target page container not found: #${page}-page`);
            }
            targetPage.classList.remove('hidden');
            console.log(`Target page ${page}-page shown`);
            
            // Charger le contenu
            await this.loadPageContent(page);
            
            // Reset scroll position for initial page load
            this.resetScrollPosition();
            
            // Initialiser les fonctionnalités de la page SANS délai pour éviter le décalage
            requestAnimationFrame(() => {
              this.initializePage(page);
              resolve();
            });
            
            // Mettre à jour l'historique du navigateur
            if (page === 'home') {
              history.pushState({ page }, '', '/');
            } else {
              const hashUrl = '/#' + page;
              history.pushState({ page }, '', hashUrl);
            }
            
            console.log(`Initial page ${page} loaded successfully`);
            
          } catch (error) {
            console.error('Error in handleInitialPageLoad:', error);
            
            // Afficher un message d'erreur dans la page cible
            const targetPage = document.getElementById(`${page}-page`);
            if (targetPage) {
              targetPage.innerHTML = `
                <div class="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-lg font-medium mb-2">Erreur lors du chargement de la page</p>
                  <p class="text-sm opacity-70 mb-4">Veuillez réessayer plus tard</p>
                  <button onclick="navigation.handleInitialPageLoad('${page}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                    Réessayer
                  </button>
                </div>
              `;
            }
            resolve();
          }
        });
      });
    },
    
  };

  // ---- Browser Compatibility Detection ----
  const compatibility = {
    // Detect CSS feature support
    features: {
      hasSelector: CSS.supports('selector(:has(*))'),
      scrollTimeline: CSS.supports('animation-timeline: scroll()'),
      backdropFilter: CSS.supports('backdrop-filter: blur(8px)'),
      willChange: CSS.supports('will-change: transform'),
      contain: CSS.supports('contain: layout style paint')
    },
    
    // Initialize compatibility checks and fallbacks
    init() {
      this.detectFeatures();
      this.setupFallbacks();
      this.optimizeForDevice();
    },
    
    detectFeatures() {
      console.log('Browser Compatibility Report:', this.features);
      
      // Add body classes for CSS targeting
      if (!this.features.hasSelector) {
        document.body.classList.add('no-has-support');
        console.log('🔧 :has() not supported - JavaScript fallback activated');
      }
      
      if (!this.features.backdropFilter) {
        document.body.classList.add('no-backdrop-filter');
        console.log('🔧 backdrop-filter not supported - CSS fallback active');
      }
      
      if (!this.features.scrollTimeline) {
        document.body.classList.add('no-scroll-timeline');
        console.log('🔧 scroll-driven animations not supported');
      }
    },
    
    setupFallbacks() {
      // Setup scroll-based header shadow for browsers without :has()
      if (!this.features.hasSelector) {
        this.setupHeaderScrollFallback();
      }
    },
    
    setupHeaderScrollFallback() {
      let ticking = false;
      
      function updateHeaderShadow() {
        const header = document.querySelector('header');
        if (window.scrollY > 10) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        ticking = false;
      }
      
      // Optimized scroll listener with throttling
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateHeaderShadow);
          ticking = true;
        }
      }, { passive: true });
      
      // Initial check
      updateHeaderShadow();
    },
    
    optimizeForDevice() {
      const isMobile = window.innerWidth <= 768;
      const isLowEnd = navigator.hardwareConcurrency <= 2;
      
      if (isMobile || isLowEnd) {
        document.body.classList.add('reduced-performance');
        console.log('📱 Mobile/low-end device detected - performance optimizations active');
      }
      
      // Respect user preferences
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.body.classList.add('reduced-motion');
        console.log('♿ Reduced motion preference detected');
      }
    },
    
    initDynamicWillChange() {
      // Dynamic will-change management for performance
      const performanceManager = {
        elements: new Set(),
        
        add(element, property) {
          if (element && property) {
            element.style.willChange = property;
            this.elements.add(element);
            
            // Auto-cleanup after 2 seconds
            setTimeout(() => {
              this.remove(element);
            }, 2000);
          }
        },
        
        remove(element) {
          if (element && this.elements.has(element)) {
            element.style.willChange = 'auto';
            this.elements.delete(element);
          }
        },
        
        clear() {
          this.elements.forEach(element => {
            element.style.willChange = 'auto';
          });
          this.elements.clear();
        }
      };
      
      // Make it globally available
      window.performanceManager = performanceManager;
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        performanceManager.clear();
      });
    }
  };

  // ---- DOM ----
  const el = {
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-button'),
    // advToggle removed - advanced search is always visible
    filtersForm: document.getElementById('search-filters'),
    isbn: document.getElementById('isbn-input'),
    author: document.getElementById('author-input'),
    title: document.getElementById('title-input'),
    lang: document.getElementById('lang-input'),
    sort: document.getElementById('sort-input'),
    content: document.getElementById('content-input'),
    resultsGrid: document.getElementById('results-grid'),
    resultsContainer: document.getElementById('results-container'),
    noResults: document.getElementById('no-results'),
    searchLoading: document.getElementById('search-loading'),
    modalOverlay: document.getElementById('modal-overlay'),
    detailsContainer: document.getElementById('details-container'),
    refreshStatusBtn: document.getElementById('refresh-status-button'),
    clearCompletedBtn: document.getElementById('clear-completed-button'),
    statusLoading: document.getElementById('status-loading'),
    statusList: document.getElementById('status-list'),
    activeDownloadsCount: document.getElementById('active-downloads-count'),
    // Active downloads (top section under search)
    activeTopSec: document.getElementById('active-downloads-top'),
    activeTopList: document.getElementById('active-downloads-list'),
    activeTopRefreshBtn: document.getElementById('active-refresh-button'),
    themeToggle: document.getElementById('theme-toggle'),
    themeText: document.getElementById('theme-text'),
    themeMenu: document.getElementById('theme-menu'),
    // View toggle elements
    viewToggleContainer: document.getElementById('view-toggle-container'),
    viewGridBtn: document.getElementById('view-grid'),
    viewListBtn: document.getElementById('view-list'),
    // Home sections elements
    homeSections: document.getElementById('home-sections'),
    recentDownloadsGrid: document.getElementById('recent-downloads-grid'),
    recentDownloadsLoading: document.getElementById('recent-downloads-loading'),
    noRecentDownloads: document.getElementById('no-recent-downloads'),
    refreshRecentBtn: document.getElementById('refresh-recent'),
    popularBooksContainer: document.getElementById('popular-books-container'),
    popularBooksLoading: document.getElementById('popular-books-loading'),
    noPopularBooks: document.getElementById('no-popular-books'),
    refreshPopularBtn: document.getElementById('refresh-popular'),
    popularViewGridBtn: document.getElementById('popular-view-grid'),
    popularViewListBtn: document.getElementById('popular-view-list'),
    popularViewToggleContainer: document.getElementById('popular-view-toggle-container'),
    // Sidebar elements
    sidebarBadge: document.getElementById('sidebar-badge'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    sidebarPanel: document.getElementById('sidebar-panel'),
    sidebarClose: document.getElementById('sidebar-close'),
    sidebarStatusLoading: document.getElementById('sidebar-status-loading'),
    sidebarStatusList: document.getElementById('sidebar-status-list'),
    sidebarNoResults: document.getElementById('sidebar-no-results'),
    sidebarRefreshBtn: document.getElementById('sidebar-refresh-button'),
    sidebarClearCompletedBtn: document.getElementById('sidebar-clear-completed-button'),
    sidebarActiveDownloadsCount: document.getElementById('sidebar-active-downloads-count')
  };

  // ---- Constants ----
  const API = {
    search: '/request/api/search',
    info: '/request/api/info',
    download: '/request/api/download',
    status: '/request/api/status',
    cancelDownload: '/request/api/download',
    setPriority: '/request/api/queue',
    clearCompleted: '/request/api/queue/clear',
    activeDownloads: '/request/api/downloads/active',
    popular: '/request/api/popular'
  };
  const FILTERS = ['isbn', 'author', 'title', 'lang', 'sort', 'content', 'format'];
  const SIDEBAR_REFRESH_INTERVAL = 10000; // 10 seconds to reduce server load
  const SIDEBAR_INACTIVITY_TIMEOUT = 30000; // 30 seconds
  const VIEW_PREFERENCE_KEY = 'preferred-view-mode';
  const VIEW_MODES = {
    GRID: 'grid',
    LIST: 'list'
  };
  
  // ---- Search State ----
  const searchState = {
    hasSearched: false,
    
    reset() {
      this.hasSearched = false;
      this.hideSearchSection();
    },
    
    markSearched() {
      this.hasSearched = true;
      this.showSearchSection();
    },
    
    hideSearchSection() {
      const searchSection = document.getElementById('search-section');
      if (searchSection) {
        searchSection.classList.add('hidden');
      }
    },
    
    showSearchSection() {
      const searchSection = document.getElementById('search-section');
      if (searchSection) {
        searchSection.classList.remove('hidden');
        console.log('Search section shown');
      } else {
        console.warn('Search section element not found');
      }
    }
  };
  
  // ---- API Cache ----
  const apiCache = {
    status: null,
    activeDownloads: null,
    lastStatusFetch: 0,
    lastActiveFetch: 0,
    ttl: 8000, // 8 seconds cache TTL for better efficiency
    
    isValid(endpoint) {
      const now = Date.now();
      if (endpoint === 'status') {
        // Cache de 8 secondes pour éviter les requêtes multiples
        // mais permettre le rafraîchissement toutes les 10s
        return this.status !== null && (now - this.lastStatusFetch) < this.ttl;
      } else if (endpoint === 'activeDownloads') {
        return this.activeDownloads !== null && (now - this.lastActiveFetch) < this.ttl;
      }
      return false;
    },
    
    get(endpoint) {
      if (endpoint === 'status') {
        return this.status;
      } else if (endpoint === 'activeDownloads') {
        return this.activeDownloads;
      }
      return null;
    },
    
    set(endpoint, data) {
      const now = Date.now();
      if (endpoint === 'status') {
        this.status = data;
        this.lastStatusFetch = now;
      } else if (endpoint === 'activeDownloads') {
        this.activeDownloads = data;
        this.lastActiveFetch = now;
      }
    },
    
    clear(endpoint) {
      if (endpoint === 'status') {
        this.status = null;
      } else if (endpoint === 'activeDownloads') {
        this.activeDownloads = null;
      }
    },
    
    clearAll() {
      this.status = null;
      this.activeDownloads = null;
      this.lastStatusFetch = 0;
      this.lastActiveFetch = 0;
    }
  };

  // ---- DOM Utils ----
  const dom = {
    safeSetHTML(elementId, content) {
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = content;
      } else {
        console.warn(`Element with ID '${elementId}' not found`);
      }
    },
    
    safeGetElement(elementId) {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element with ID '${elementId}' not found`);
      }
      return element;
    },
    
    safeAppendHTML(elementId, content) {
      const element = document.getElementById(elementId);
      if (element) {
        element.insertAdjacentHTML('beforeend', content);
      } else {
        console.warn(`Element with ID '${elementId}' not found`);
      }
    }
  };

  // ---- Utils ----
  const utils = {
    show(node) { node && node.classList.remove('hidden'); },
    hide(node) { node && node.classList.add('hidden'); },
    async j(url, opts = {}) {
      console.log('=== UTILS.J FETCH ===');
      console.log('URL:', url);
      console.log('Options:', opts);
      
      try {
        const res = await fetch(url, opts);
        console.log('Response status:', res.status);
        console.log('Response statusText:', res.statusText);
        console.log('Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Response error text:', errorText);
          throw new Error(`${res.status} ${res.statusText}: ${errorText}`);
        }
        
        try {
          const data = await res.json();
          console.log('JSON response received successfully');
          console.log('Response data type:', typeof data);
          console.log('Is array:', Array.isArray(data));
          console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
          return data;
        } catch (e) {
          console.log('Failed to parse JSON, trying fallback');
          // Fallback pour les réponses non-JSON
          const text = await res.text();
          console.log('Raw response text:', text);
          
          if (text.trim() === '') {
            console.log('Empty response, returning null');
            return null; // Pour les réponses 204
          }
          
          // Tenter de parser manuellement
          try {
            const parsedData = JSON.parse(text);
            console.log('Manual JSON parse successful');
            return parsedData;
          } catch (parseError) {
            console.log('Manual JSON parse failed, returning text in object');
            console.log('Parse error:', parseError);
            return { text }; // Retourner le texte dans un objet
          }
        }
      } catch (e) {
        console.error('=== UTILS.J ERROR ===');
        console.error('Fetch error:', e);
        console.error('Error message:', e.message);
        console.error('Error stack:', e.stack);
        throw e;
      }
    },
    // Build query string from basic + advanced filters
    buildQuery() {
      console.log('buildQuery called');
      
      // Utiliser des références dynamiques pour éviter les erreurs
      const searchInput = el.searchInput || document.getElementById('search-input');
      
      console.log('searchInput:', searchInput);
      
      const q = [];
      const basic = searchInput?.value?.trim();
      console.log('Basic search input value:', basic);
      
      if (basic) {
        q.push(`query=${encodeURIComponent(basic)}`);
        console.log('Added basic query:', `query=${encodeURIComponent(basic)}`);
      }

      // Les filtres sont maintenant toujours visibles, plus besoin de vérifier s'ils sont masqués
      const filtersContainer = document.getElementById('search-filters');
      if (!filtersContainer) {
        console.log('Filters container not available, returning basic query');
        return q.join('&');
      }

      console.log('Processing advanced filters...');
      FILTERS.forEach((name) => {
        if (name === 'format') {
          const checked = Array.from(document.querySelectorAll('[id^="format-"]:checked'));
          console.log(`Format checkboxes checked:`, checked);
          checked.forEach((cb) => {
            q.push(`format=${encodeURIComponent(cb.value)}`);
            console.log('Added format filter:', `format=${encodeURIComponent(cb.value)}`);
          });
        } else {
          // Utiliser des sélecteurs plus spécifiques pour éviter les conflits
          const input = document.getElementById(`${name}-input`);
          console.log(`Filter input for ${name}:`, input);
          if (input) {
            const val = input.value?.trim();
            console.log(`Value for ${name}:`, val);
            if (val) {
              q.push(`${name}=${encodeURIComponent(val)}`);
              console.log('Added filter:', `${name}=${encodeURIComponent(val)}`);
            }
          }
        }
      });

      const result = q.join('&');
      console.log('Final query string:', result);
      return result;
    },
    // Simple notification via alert fallback
    toast(msg) { try { console.info(msg); } catch (_) {} },
    // Escapes text for safe HTML injection
    e(text) { return (text ?? '').toString(); }
  };

  // ---- Modal ----
  const modal = {
    open() { el.modalOverlay?.classList.add('active'); },
    close() { el.modalOverlay?.classList.remove('active'); el.detailsContainer.innerHTML = ''; }
  };

  // ---- Cards ----
  function renderCard(book) {
    const isAppleBook = book.isAppleBook || false;
    
    const cover = book.preview ? `<img src="${utils.e(book.preview)}" alt="Cover" class="w-full h-88 object-cover rounded">` :
      `<div class="w-full h-88 rounded flex items-center justify-center opacity-70" style="background: var(--bg-soft)">No Cover</div>`;

    // Pour les livres Apple Books, utiliser les informations disponibles
    // Extraire uniquement l'année de la date complète
    const getYearOnly = (dateStr) => {
      if (!dateStr || dateStr === '-') return '';
      const yearMatch = dateStr.match(/(\d{4})/);
      return yearMatch ? yearMatch[1] : '';
    };
    
    const year = getYearOnly(book.year || book.releaseDate);
    const language = book.language || '';
    const format = book.format || '';
    const size = book.size || '';

    // Construire les métadonnées avec des séparateurs conditionnels
    const metadata = [];
    if (year) metadata.push(year);
    if (language) metadata.push(language);
    if (format) metadata.push(format);
    if (size) metadata.push(size);

    const html = `
      <article class="rounded border p-3 flex flex-col gap-3 ${isAppleBook ? 'apple-book-card' : ''}" style="border-color: var(--border-muted); background: var(--bg-soft)">
        ${cover}
        <div class="flex-1 space-y-1">
          <h3 class="font-semibold leading-tight">${utils.e(book.title) || 'Untitled'}</h3>
          <p class="text-sm opacity-80">${utils.e(book.author) || 'Unknown author'}</p>
          <div class="text-xs opacity-70 flex flex-wrap gap-2">
            ${metadata.map((item, index) => `<span>${utils.e(item)}</span>${index < metadata.length - 1 ? '<span>•</span>' : ''}`).join('')}
          </div>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-2 rounded border text-sm flex-1" data-action="${isAppleBook ? 'search' : 'details'}" data-id="${utils.e(book.id)}" data-title="${utils.e(book.title)}" style="border-color: var(--border-muted);">${isAppleBook ? 'Search' : 'Details'}</button>
          ${!isAppleBook ? `<button class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm flex-1" data-action="download" data-id="${utils.e(book.id)}">Download</button>` : ''}
        </div>
      </article>`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    // Bind actions
    const detailsBtn = wrapper.querySelector('[data-action="details"]');
    const searchBtn = wrapper.querySelector('[data-action="search"]');
    const downloadBtn = wrapper.querySelector('[data-action="download"]');
    
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => bookDetails.show(book.id));
    }
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        homeSections.searchForAppleBook(book.title, book.author);
      });
    }
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => bookDetails.download(book));
    }
    
    return wrapper.firstElementChild;
  }

  function renderCards(books) {
    viewManager.renderGrid(books);
  }

  function renderListItem(book) {
    // Créer un élément de tableau détaillé
    const row = document.createElement('tr');
    row.className = 'border-b';
    row.style.borderColor = 'var(--border-muted)';
    
    // Fonction pour nettoyer les données de l'éditeur
    const cleanPublisher = (publisher) => {
      if (!publisher) return '-';
      // Prendre seulement la première partie avant la première virgule ou parenthèse
      const cleaned = publisher.split(',')[0].split('(')[0].trim();
      return cleaned || '-';
    };
    
    // Fonction pour nettoyer les données de l'auteur
    const cleanAuthor = (author) => {
      if (!author) return 'Unknown author';
      
      // Essayer d'extraire le nom complet (nom + prénom) avant les séparateurs
      const patterns = [
        /^(.+?)\s*\[/,  // Avant le premier crochet
        /^(.+?)\s*;/,   // Avant le premier point-virgule
        /^(.+?)\s*-\s/, // Avant le premier tiret avec espaces
        /^(.+?)\s*\(/,  // Avant la première parenthèse
      ];
      
      for (const pattern of patterns) {
        const match = author.match(pattern);
        if (match && match[1]) {
          let cleaned = match[1].trim();
          
          // Si le nom contient des virgules, essayer de prendre les deux premières parties (nom, prénom)
          if (cleaned.includes(',')) {
            const parts = cleaned.split(',').map(p => p.trim());
            if (parts.length >= 2) {
              // Inverser pour avoir "Prénom Nom" au lieu de "Nom, Prénom"
              cleaned = parts[1] + ' ' + parts[0];
            } else {
              cleaned = parts[0];
            }
          }
          
          // Limiter à un nom raisonnable (max 30 caractères)
          if (cleaned.length > 30) {
            const words = cleaned.split(/\s+/);
            if (words.length >= 2) {
              // Prendre les deux premiers mots (généralement prénom + nom)
              cleaned = words.slice(0, 2).join(' ');
            } else {
              cleaned = cleaned.substring(0, 30);
            }
          }
          
          // Vérifier si c'est un nom propre (contient au moins une majuscule)
          if (/[A-Z]/.test(cleaned) && cleaned.length > 1) {
            return cleaned;
          }
        }
      }
      
      // Si aucun pattern ne correspond, essayer de trouver les deux premiers mots avec majuscules
      const words = author.split(/\s+/);
      const capitalizedWords = words.filter(word => /[A-Z]/.test(word) && word.length > 1);
      
      if (capitalizedWords.length >= 2) {
        return capitalizedWords.slice(0, 2).join(' ');
      } else if (capitalizedWords.length === 1) {
        return capitalizedWords[0];
      }
      
      // En dernier recours, retourner les deux premiers mots
      if (words.length >= 2) {
        return words.slice(0, 2).join(' ');
      } else {
        return words[0] || 'Unknown author';
      }
    };
    
    // Fonction pour nettoyer les dates (prendre seulement la première année)
    const cleanYear = (year) => {
      if (!year) return '';
      
      // Si l'année contient plusieurs années concaténées, prendre la première
      const yearMatch = year.match(/(\d{4})/);
      if (yearMatch) {
        return yearMatch[1];
      }
      
      return '';
    };
    
    // Cellule Preview
    const previewCell = document.createElement('td');
    previewCell.className = 'p-3';
    
    // Vérifier si on est sur mobile (désactiver le zoom sur mobile)
    const isMobile = window.innerWidth <= 768;
    
    if (book.preview && !isMobile) {
      const coverContainer = document.createElement('div');
      coverContainer.className = 'cover-zoom-container';
      
      const coverImg = document.createElement('img');
      coverImg.src = utils.e(book.preview);
      coverImg.alt = 'Cover';
      coverImg.className = 'book-cover w-12 h-16 object-cover rounded cursor-pointer';
      coverImg.setAttribute('data-book-id', utils.e(book.id));
      coverImg.setAttribute('data-src', utils.e(book.preview));
      
      // Ajouter le gestionnaire d'événements pour le zoom animé
      coverImg.addEventListener('click', (e) => {
        e.stopPropagation();
        coverZoomManager.showZoomedImage(coverImg);
      });
      
      coverContainer.appendChild(coverImg);
      previewCell.appendChild(coverContainer);
    } else if (book.preview && isMobile) {
      // Sur mobile, juste l'image sans zoom
      const coverImg = document.createElement('img');
      coverImg.src = utils.e(book.preview);
      coverImg.alt = 'Cover';
      coverImg.className = 'w-12 h-16 object-cover rounded';
      previewCell.appendChild(coverImg);
    } else {
      // Pas d'image disponible
      const noCover = document.createElement('div');
      noCover.className = 'w-12 h-16 rounded flex items-center justify-center opacity-70 text-xs';
      noCover.style.background = 'var(--bg-soft)';
      noCover.textContent = 'No Cover';
      previewCell.appendChild(noCover);
    }
    
    // Cellule Title
    const titleCell = document.createElement('td');
    titleCell.className = 'p-3 font-medium';
    titleCell.textContent = utils.e(book.title) || 'Untitled';
    
    // Cellule Author (nettoyée)
    const authorCell = document.createElement('td');
    authorCell.className = 'p-3';
    authorCell.textContent = cleanAuthor(book.author);
    
    // Cellule Publisher (nettoyée)
    const publisherCell = document.createElement('td');
    publisherCell.className = 'p-3';
    publisherCell.textContent = cleanPublisher(book.publisher);
    
    // Cellule Year
    const yearCell = document.createElement('td');
    yearCell.className = 'p-3';
    yearCell.textContent = cleanYear(book.year) || '-';
    
    // Cellule Language
    const languageCell = document.createElement('td');
    languageCell.className = 'p-3';
    languageCell.textContent = utils.e(book.language) || '-';
    
    // Cellule Format
    const formatCell = document.createElement('td');
    formatCell.className = 'p-3';
    formatCell.textContent = utils.e(book.format) || '-';
    
    // Cellule Size
    const sizeCell = document.createElement('td');
    sizeCell.className = 'p-3';
    sizeCell.textContent = utils.e(book.size) || '-';
    
    // Cellule Actions (verticale)
    const actionsCell = document.createElement('td');
    actionsCell.className = 'p-3';
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'flex flex-col gap-1 items-center';
    
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'px-2 py-1 rounded border text-xs w-full';
    detailsBtn.style.borderColor = 'var(--border-muted)';
    detailsBtn.textContent = 'Details';
    detailsBtn.setAttribute('data-action', 'details');
    detailsBtn.setAttribute('data-id', utils.e(book.id));
    detailsBtn.addEventListener('click', () => bookDetails.show(book.id));
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs w-full';
    downloadBtn.textContent = 'Download';
    downloadBtn.setAttribute('data-action', 'download');
    downloadBtn.setAttribute('data-id', utils.e(book.id));
    downloadBtn.addEventListener('click', () => bookDetails.download(book));
    
    actionsContainer.appendChild(detailsBtn);
    actionsContainer.appendChild(downloadBtn);
    actionsCell.appendChild(actionsContainer);
    
    // Assembler la ligne
    row.appendChild(previewCell);
    row.appendChild(titleCell);
    row.appendChild(authorCell);
    row.appendChild(publisherCell);
    row.appendChild(yearCell);
    row.appendChild(languageCell);
    row.appendChild(formatCell);
    row.appendChild(sizeCell);
    row.appendChild(actionsCell);
    
    return row;
  }

  // ---- View Management ----
  const viewManager = {
    currentView: VIEW_MODES.GRID,
    popularCurrentView: VIEW_MODES.GRID,
    
    init() {
      // Récupérer la préférence sauvegardée
      const savedView = localStorage.getItem(VIEW_PREFERENCE_KEY) || VIEW_MODES.GRID;
      this.currentView = savedView;
      this.updateViewButtons();
      
      // Bind events - utiliser des références dynamiques pour éviter les erreurs
      const viewGridBtn = el.viewGridBtn || document.getElementById('view-grid');
      const viewListBtn = el.viewListBtn || document.getElementById('view-list');
      
      if (viewGridBtn) {
        viewGridBtn.addEventListener('click', () => this.setView(VIEW_MODES.GRID));
      }
      
      if (viewListBtn) {
        viewListBtn.addEventListener('click', () => this.setView(VIEW_MODES.LIST));
      }
      
      // Initialiser les boutons de vue pour les livres populaires
      this.initPopularViewToggle();
    },
    
    reinitViewButtons() {
      // Réinitialiser les boutons de vue après le chargement dynamique du contenu
      console.log('Reinitializing view buttons for search page');
      
      // Récupérer les boutons de vue
      const viewGridBtn = el.viewGridBtn || document.getElementById('view-grid');
      const viewListBtn = el.viewListBtn || document.getElementById('view-list');
      
      if (!viewGridBtn || !viewListBtn) {
        console.warn('View buttons not found for reinitialization');
        return;
      }
      
      // Cloner les boutons pour supprimer les anciens gestionnaires d'événements
      const newGridBtn = viewGridBtn.cloneNode(true);
      const newListBtn = viewListBtn.cloneNode(true);
      
      // Remplacer les anciens boutons par les nouveaux
      viewGridBtn.parentNode.replaceChild(newGridBtn, viewGridBtn);
      viewListBtn.parentNode.replaceChild(newListBtn, viewListBtn);
      
      // Mettre à jour les références dans l'objet el
      el.viewGridBtn = newGridBtn;
      el.viewListBtn = newListBtn;
      
      // Ajouter les nouveaux gestionnaires d'événements
      newGridBtn.addEventListener('click', () => this.setView(VIEW_MODES.GRID));
      newListBtn.addEventListener('click', () => this.setView(VIEW_MODES.LIST));
      
      // Mettre à jour l'état visuel des boutons
      this.updateViewButtons();
      
      console.log('View buttons reinitialized successfully');
    },
    
    setView(viewMode) {
      if (this.currentView === viewMode) return;
      
      this.currentView = viewMode;
      localStorage.setItem(VIEW_PREFERENCE_KEY, viewMode);
      this.updateViewButtons();
      
      // Re-render les résultats avec la nouvelle vue
      const currentData = window.lastSearchResults || [];
      this.renderResults(currentData);
    },
    
    updateViewButtons() {
      // Mettre à jour l'état actif des boutons
      const toggleButtons = document.querySelectorAll('.view-toggle');
      if (toggleButtons.length === 0) {
        console.warn('View toggle buttons not found in updateViewButtons');
        return;
      }
      
      toggleButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === this.currentView) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // Mettre à jour les classes du conteneur avec vérifications robustes
      let resultsContainer = el.resultsContainer;
      if (!resultsContainer) {
        // Essayer de rafraîchir les éléments si el.resultsContainer est null
        if (typeof navigation !== 'undefined' && navigation.refreshSearchElements) {
          navigation.refreshSearchElements();
          resultsContainer = el.resultsContainer;
        }
        
        // Si toujours null, essayer de récupérer directement
        if (!resultsContainer) {
          resultsContainer = document.getElementById('results-container');
        }
      }
      
      if (resultsContainer) {
        resultsContainer.classList.remove('grid-view', 'list-view');
        resultsContainer.classList.add(`${this.currentView}-view`);
      } else {
        // Ne pas afficher d'erreur si nous sommes sur une page qui n'a pas de conteneur de résultats
        const currentPage = typeof navigation !== 'undefined' ? navigation.currentPage : 'unknown';
        if (currentPage === 'search') {
          console.warn('Results container not found in updateViewButtons on search page - this might be expected during initialization');
        }
      }
    },
    
    renderResults(books) {
      if (this.currentView === VIEW_MODES.GRID) {
        this.renderGrid(books);
      } else {
        this.renderList(books);
      }
    },
    
    renderGrid(books) {
      try {
        // Vérifier que resultsContainer existe avec retry
        let resultsContainer = el.resultsContainer;
        if (!resultsContainer) {
          console.warn('Results container not found in renderGrid, refreshing elements...');
          // Tenter de rafraîchir les éléments
          if (typeof navigation !== 'undefined' && navigation.refreshSearchElements) {
            navigation.refreshSearchElements();
          }
          
          // Si toujours null, essayer de récupérer directement
          resultsContainer = document.getElementById('results-container');
          if (!resultsContainer) {
            console.warn('Results container not found - this might be expected if not on search page');
            return;
          }
        }
        
        // Masquer les états de chargement avant de commencer le rendu
        const searchLoading = el.searchLoading || document.getElementById('search-loading');
        if (searchLoading) {
          searchLoading.classList.add('hidden');
          searchLoading.style.display = 'none';
        }
        
        // S'assurer que le conteneur est vide avant d'ajouter du contenu
        resultsContainer.innerHTML = '';
        
        // Nettoyer les éléments optimistes qui pourraient encore être présents
        this.cleanupOptimisticElements(resultsContainer);
        
        // Vérifier si nous avons des livres à afficher
        if (!books || books.length === 0) {
          // Masquer le conteneur s'il n'y a pas de résultats pour éviter le cadre vide
          resultsContainer.style.display = 'none';
          resultsContainer.classList.add('empty-container');
          if (el.noResults) {
            utils.show(el.noResults);
            el.noResults.style.display = '';
          }
          return;
        }
        
        // Afficher le conteneur et masquer le message "no results"
        resultsContainer.style.display = '';
        resultsContainer.classList.remove('empty-container');
        if (el.noResults) {
          utils.hide(el.noResults);
          el.noResults.style.display = 'none';
        }
        
        // Créer et ajouter les éléments de manière efficace
        const frag = document.createDocumentFragment();
        let validCards = 0;
        
        books.forEach((b) => {
          try {
            const card = renderCard(b);
            if (card) {
              frag.appendChild(card);
              validCards++;
            }
          } catch (error) {
            console.error('Error rendering card for book:', b, error);
          }
        });
        
        // N'ajouter le contenu que s'il y a des éléments valides
        if (validCards > 0) {
          resultsContainer.appendChild(frag);
          resultsContainer.classList.remove('empty-container');
        } else {
          // Si aucun élément valide n'a été créé, masquer le conteneur
          resultsContainer.style.display = 'none';
          resultsContainer.classList.add('empty-container');
          if (el.noResults) {
            utils.show(el.noResults);
            el.noResults.style.display = '';
          }
        }
      } catch (error) {
        console.error('Error in renderGrid:', error);
        // En cas d'erreur, masquer le conteneur et afficher le message d'erreur
        const resultsContainer = el.resultsContainer || document.getElementById('results-container');
        if (resultsContainer) {
          resultsContainer.style.display = 'none';
          resultsContainer.classList.add('empty-container');
        }
        if (el.noResults) {
          utils.show(el.noResults);
          el.noResults.style.display = '';
        }
      }
    },
    
    renderList(books) {
      console.log('=== renderList called ===');
      console.log('Books data:', books ? `${books.length} items` : 'null/undefined');
      
      let criticalError = false;
      let errorMessage = '';
      
      try {
        // Vérifier que resultsContainer existe avec retry
        let resultsContainer = el.resultsContainer;
        if (!resultsContainer) {
          console.warn('Results container not found in renderList, refreshing elements...');
          // Tenter de rafraîchir les éléments
          if (typeof navigation !== 'undefined' && navigation.refreshSearchElements) {
            navigation.refreshSearchElements();
          }
          
          // Si toujours null, essayer de récupérer directement
          resultsContainer = document.getElementById('results-container');
          if (!resultsContainer) {
            console.warn('Results container not found - this might be expected if not on search page');
            return;
          }
        }
        
        // Masquer les états de chargement avant de commencer le rendu
        const searchLoading = el.searchLoading || document.getElementById('search-loading');
        if (searchLoading) {
          searchLoading.classList.add('hidden');
          searchLoading.style.display = 'none';
        }
        
        // S'assurer que le conteneur est vide avant d'ajouter du contenu
        resultsContainer.innerHTML = '';
        
        // Nettoyer les éléments optimistes qui pourraient encore être présents
        try {
          this.cleanupOptimisticElements(resultsContainer);
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
          // Continuer malgré l'erreur de nettoyage
        }
        
        // Vérifier si nous avons des livres à afficher
        if (!books || books.length === 0) {
          console.log('No books to display, showing empty state');
          // Masquer le conteneur s'il n'y a pas de résultats pour éviter le cadre vide
          resultsContainer.style.display = 'none';
          resultsContainer.classList.add('empty-container');
          if (el.noResults) {
            utils.show(el.noResults);
            el.noResults.style.display = '';
          }
          return;
        }
        
        // Afficher le conteneur et masquer le message "no results"
        resultsContainer.style.display = '';
        resultsContainer.classList.remove('empty-container');
        if (el.noResults) {
          utils.hide(el.noResults);
          el.noResults.style.display = 'none';
        }
        
        // Créer la structure du tableau avec gestion d'erreur
        let table, tbody;
        try {
          table = document.createElement('div');
          table.className = 'overflow-x-auto';
          table.innerHTML = `
            <table class="w-full border-collapse" style="border-color: var(--border-muted);">
              <thead>
                <tr style="background: var(--bg-soft);">
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Preview</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Title</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Author</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Publisher</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Year</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Language</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Format</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Size</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Actions</th>
                </tr>
              </thead>
              <tbody id="results-tbody">
                <!-- Les lignes seront injectées ici -->
              </tbody>
            </table>
          `;
          
          resultsContainer.appendChild(table);
          tbody = document.getElementById('results-tbody');
          
          if (!tbody) {
            throw new Error('Failed to create or find tbody element');
          }
        } catch (tableError) {
          console.error('Error creating table structure:', tableError);
          // Afficher un message d'erreur dans le conteneur mais ne pas le masquer complètement
          el.resultsContainer.innerHTML = `
            <div class="text-center p-4">
              <p class="text-red-500 mb-2">Erreur lors de la création du tableau</p>
              <p class="text-sm opacity-70">${tableError.message}</p>
              <button onclick="viewManager.renderList(window.lastSearchResults)" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                Réessayer
              </button>
            </div>
          `;
          return;
        }
        
        // Ajouter chaque livre comme une ligne séparée avec gestion d'erreur individuelle
        let validRows = 0;
        let errorCount = 0;
        
        books.forEach((book, index) => {
          try {
            // Vérification de base des données du livre
            if (!book || typeof book !== 'object') {
              console.warn(`Invalid book object at index ${index}:`, book);
              errorCount++;
              return;
            }
            
            const row = renderListItem(book);
            if (row) {
              tbody.appendChild(row);
              validRows++;
            } else {
              console.warn(`Failed to render row for book at index ${index}:`, book);
              errorCount++;
            }
          } catch (itemError) {
            console.error(`Error rendering list item for book at index ${index}:`, book, itemError);
            errorCount++;
            
            // Ajouter une ligne d'erreur pour ce livre spécifique
            try {
              const errorRow = document.createElement('tr');
              errorRow.className = 'border-b';
              errorRow.style.borderColor = 'var(--border-muted)';
              errorRow.innerHTML = `
                <td colspan="9" class="p-3 text-center text-sm opacity-70">
                  Erreur d'affichage: ${itemError.message}
                </td>
              `;
              tbody.appendChild(errorRow);
            } catch (errorRowError) {
              console.error('Failed to create error row:', errorRowError);
            }
          }
        });
        
        console.log(`renderList completed: ${validRows} valid rows, ${errorCount} errors`);
        
        // Si aucune ligne valide n'a été créée, afficher un message approprié
        if (validRows === 0) {
          console.warn('No valid rows were created');
          resultsContainer.innerHTML = `
            <div class="text-center p-4">
              <p class="text-red-500 mb-2">Aucun livre ne peut être affiché</p>
              <p class="text-sm opacity-70">Vérifiez les données et réessayez</p>
              <button onclick="viewManager.renderList(window.lastSearchResults)" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                Réessayer
              </button>
            </div>
          `;
        } else {
          resultsContainer.classList.remove('empty-container');
          
          // S'il y a eu des erreurs mais que des lignes valides existent, afficher un avertissement
          if (errorCount > 0) {
            const warningRow = document.createElement('tr');
            warningRow.innerHTML = `
              <td colspan="9" class="p-2 text-center text-xs opacity-70" style="background: var(--bg-soft);">
                ⚠️ ${errorCount} livre(s) n'ont pas pu être affichés correctement
              </td>
            `;
            tbody.insertBefore(warningRow, tbody.firstChild);
          }
        }
      } catch (error) {
        criticalError = true;
        errorMessage = error.message;
        console.error('Critical error in renderList:', error);
        console.error('Error stack:', error.stack);
        
        // En cas d'erreur critique, afficher un message détaillé mais ne masquer le conteneur qu'en dernier recours
        const resultsContainer = el.resultsContainer || document.getElementById('results-container');
        if (resultsContainer) {
          resultsContainer.innerHTML = `
            <div class="text-center p-4">
              <p class="text-red-500 mb-2">Erreur critique lors de l'affichage en liste</p>
              <p class="text-sm opacity-70">${errorMessage}</p>
              <button onclick="viewManager.renderList(window.lastSearchResults)" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                Réessayer
              </button>
            </div>
          `;
        }
      }
      
      // Journalisation pour le débogage
      if (criticalError) {
        console.error('renderList failed with critical error:', errorMessage);
      } else {
        console.log('renderList completed successfully');
      }
    },
    
    // Méthode pour nettoyer les éléments optimistes
    cleanupOptimisticElements(container) {
      if (!container) return;
      
      try {
        // Nettoyer les éléments optimistes qui pourraient encore être présents
        const optimisticElements = container.querySelectorAll('.optimistic-item, [data-optimistic-id]');
        
        if (optimisticElements.length > 0) {
          console.log(`Cleaning up ${optimisticElements.length} optimistic elements`);
          
          optimisticElements.forEach(element => {
            // Ajouter une animation de disparition
            element.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
            element.style.opacity = '0';
            element.style.transform = 'scale(0.95)';
            
            // Supprimer après l'animation
            setTimeout(() => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            }, 200);
          });
          
          // Forcer le nettoyage après un délai plus long au cas où l'animation échouerait
          setTimeout(() => {
            const remainingElements = container.querySelectorAll('.optimistic-item, [data-optimistic-id]');
            remainingElements.forEach(element => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
              }
            });
          }, 500);
        }
        
        // Nettoyer également les conteneurs vides qui pourraient rester
        const emptyContainers = container.querySelectorAll('.empty-container');
        emptyContainers.forEach(element => {
          element.style.display = 'none';
        });
        
      } catch (error) {
        console.error('Error in cleanupOptimisticElements:', error);
        // En cas d'erreur, forcer le nettoyage immédiat
        try {
          const optimisticElements = container.querySelectorAll('.optimistic-item, [data-optimistic-id]');
          optimisticElements.forEach(element => {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          });
        } catch (cleanupError) {
          console.error('Error in emergency cleanup:', cleanupError);
        }
      }
    },
    
    // Méthodes pour gérer les vues des livres populaires
    initPopularViewToggle() {
      console.log('=== INIT POPULAR VIEW TOGGLE IN VIEWMANAGER ===');
      
      // Récupérer les boutons de vue pour les livres populaires
      const viewGridBtn = document.getElementById('popular-view-grid');
      const viewListBtn = document.getElementById('popular-view-list');
      
      console.log('Popular view buttons found:', {
        grid: !!viewGridBtn,
        list: !!viewListBtn
      });
      
      if (viewGridBtn) {
        viewGridBtn.addEventListener('click', () => this.setPopularView(VIEW_MODES.GRID));
      }
      
      if (viewListBtn) {
        viewListBtn.addEventListener('click', () => this.setPopularView(VIEW_MODES.LIST));
      }
      
      // Initialiser l'état des boutons
      this.updatePopularViewButtons();
    },
    
    reinitPopularViewButtons() {
      console.log('=== REINITIALIZING POPULAR VIEW BUTTONS IN VIEWMANAGER ===');
      
      // Récupérer les boutons de vue populaires
      const viewGridBtn = document.getElementById('popular-view-grid');
      const viewListBtn = document.getElementById('popular-view-list');
      
      if (!viewGridBtn || !viewListBtn) {
        console.warn('Popular view buttons not found for reinitialization');
        return;
      }
      
      // Cloner les boutons pour supprimer les anciens gestionnaires d'événements
      const newGridBtn = viewGridBtn.cloneNode(true);
      const newListBtn = viewListBtn.cloneNode(true);
      
      // Remplacer les anciens boutons par les nouveaux
      viewGridBtn.parentNode.replaceChild(newGridBtn, viewGridBtn);
      viewListBtn.parentNode.replaceChild(newListBtn, viewListBtn);
      
      // Ajouter les nouveaux gestionnaires d'événements
      newGridBtn.addEventListener('click', () => this.setPopularView(VIEW_MODES.GRID));
      newListBtn.addEventListener('click', () => this.setPopularView(VIEW_MODES.LIST));
      
      // Mettre à jour l'état visuel des boutons
      this.updatePopularViewButtons();
      
      console.log('Popular view buttons reinitialized successfully');
    },
    
    setPopularView(viewMode) {
      console.log('=== SET POPULAR VIEW CALLED IN VIEWMANAGER ===');
      console.log('viewMode:', viewMode);
      
      if (this.popularCurrentView === viewMode) return;
      
      this.popularCurrentView = viewMode;
      this.updatePopularViewButtons();
      
      // Re-render les résultats avec la nouvelle vue
      const currentData = window.lastPopularResults || [];
      this.renderPopularResults(currentData);
    },
    
    updatePopularViewButtons() {
      console.log('=== UPDATE POPULAR VIEW BUTTONS CALLED IN VIEWMANAGER ===');
      
      // Vérifier d'abord si nous sommes sur la page populaire
      const currentPage = typeof navigation !== 'undefined' ? navigation.currentPage : 'unknown';
      if (currentPage !== 'popular') {
        console.log('Not on popular page, skipping updatePopularViewButtons');
        return;
      }
      
      // Mettre à jour l'état actif des boutons - utiliser le bon sélecteur CSS
      const toggleContainer = document.getElementById('popular-view-toggle-container');
      if (!toggleContainer) {
        console.warn('Popular view toggle container not found - might be expected during initialization');
        return;
      }
      
      const toggleButtons = toggleContainer.querySelectorAll('.view-toggle');
      if (toggleButtons.length === 0) {
        console.warn('Popular view toggle buttons not found - might be expected during initialization');
        return;
      }
      
      toggleButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === this.popularCurrentView) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // Mettre à jour les classes du conteneur avec vérification robuste
      const popularContainer = document.getElementById('popular-books-container');
      if (popularContainer) {
        popularContainer.classList.remove('grid-view', 'list-view');
        popularContainer.classList.add(`${this.popularCurrentView}-view`);
      } else {
        console.warn('Popular books container not found in updatePopularViewButtons - this might be expected during initialization');
      }
    },
    
    renderPopularResults(books) {
      console.log('=== RENDER POPULAR RESULTS CALLED IN VIEWMANAGER ===');
      console.log('Books count:', books ? books.length : 0);
      console.log('Current view:', this.popularCurrentView);
      
      if (this.popularCurrentView === VIEW_MODES.GRID) {
        this.renderPopularGrid(books);
      } else {
        this.renderPopularList(books);
      }
    },
    
    renderPopularGrid(books) {
      try {
        const container = document.getElementById('popular-books-container');
        const noBooks = document.getElementById('no-popular-books');
        
        if (!container) {
          console.error('Popular books container not found in viewManager.renderPopularGrid');
          return;
        }
        
        // Masquer les états de chargement
        const loading = document.getElementById('popular-books-loading');
        if (loading) {
          loading.classList.add('hidden');
          loading.style.display = 'none';
        }
        
        // S'assurer que le conteneur est vide
        container.innerHTML = '';
        
        // Nettoyer les éléments optimistes
        this.cleanupOptimisticElements(container);
        
        if (!books || books.length === 0) {
          // Masquer le conteneur s'il n'y a pas de livres
          container.style.display = 'none';
          container.classList.add('empty-container');
          if (noBooks) {
            noBooks.classList.remove('hidden');
            noBooks.style.display = '';
          }
          return;
        }
        
        // Afficher le conteneur et masquer le message "no books"
        container.style.display = '';
        container.classList.remove('empty-container');
        if (noBooks) {
          noBooks.classList.add('hidden');
          noBooks.style.display = 'none';
        }
        
        // Configurer le conteneur pour la vue grille
        container.classList.remove('list-view');
        container.classList.add('grid-view');
        
        const frag = document.createDocumentFragment();
        let validCards = 0;
        
        books.forEach((book) => {
          try {
            const card = renderCard(book);
            if (card) {
              frag.appendChild(card);
              validCards++;
            }
          } catch (error) {
            console.error('Error rendering popular card for book:', book, error);
          }
        });
        
        // N'ajouter le contenu que s'il y a des éléments valides
        if (validCards > 0) {
          container.appendChild(frag);
          container.classList.remove('empty-container');
        } else {
          // Si aucun élément valide n'a été créé, masquer le conteneur
          container.style.display = 'none';
          container.classList.add('empty-container');
          if (noBooks) {
            noBooks.classList.remove('hidden');
            noBooks.style.display = '';
          }
        }
      } catch (error) {
        console.error('Error in viewManager.renderPopularGrid:', error);
        // En cas d'erreur, masquer le conteneur et afficher le message d'erreur
        const container = document.getElementById('popular-books-container');
        const noBooks = document.getElementById('no-popular-books');
        
        if (container) {
          container.style.display = 'none';
          container.classList.add('empty-container');
        }
        if (noBooks) {
          noBooks.classList.remove('hidden');
          noBooks.style.display = '';
        }
      }
    },
    
    renderPopularList(books) {
      console.log('=== RENDER POPULAR LIST CALLED IN VIEWMANAGER ===');
      console.log('Books data:', books ? `${books.length} items` : 'null/undefined');
      
      let criticalError = false;
      let errorMessage = '';
      
      try {
        const container = document.getElementById('popular-books-container');
        const noBooks = document.getElementById('no-popular-books');
        
        if (!container) {
          criticalError = true;
          errorMessage = 'Popular books container not found in viewManager.renderPopularList';
          console.error(errorMessage);
          return;
        }
        
        // Masquer les états de chargement
        const loading = document.getElementById('popular-books-loading');
        if (loading) {
          loading.classList.add('hidden');
          loading.style.display = 'none';
        }
        
        // S'assurer que le conteneur est vide
        container.innerHTML = '';
        
        // Nettoyer les éléments optimistes avec gestion d'erreur
        try {
          this.cleanupOptimisticElements(container);
        } catch (cleanupError) {
          console.warn('Error during cleanup in viewManager.renderPopularList:', cleanupError);
          // Continuer malgré l'erreur de nettoyage
        }
        
        if (!books || books.length === 0) {
          console.log('No popular books to display, showing empty state');
          // Masquer le conteneur s'il n'y a pas de livres
          container.style.display = 'none';
          container.classList.add('empty-container');
          if (noBooks) {
            noBooks.classList.remove('hidden');
            noBooks.style.display = '';
          }
          return;
        }
        
        // Afficher le conteneur et masquer le message "no books"
        container.style.display = '';
        container.classList.remove('empty-container');
        if (noBooks) {
          noBooks.classList.add('hidden');
          noBooks.style.display = 'none';
        }
        
        // Configurer le conteneur pour la vue liste
        container.classList.remove('grid-view');
        container.classList.add('list-view');
        
        // Créer la structure du tableau avec gestion d'erreur
        let table, tbody;
        try {
          table = document.createElement('div');
          table.className = 'overflow-x-auto';
          table.innerHTML = `
            <table class="w-full border-collapse" style="border-color: var(--border-muted);">
              <thead>
                <tr style="background: var(--bg-soft);">
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Classement</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Preview</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Title</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Author</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Year</th>
                  <th class="p-3 text-left font-semibold border-b" style="border-color: var(--border-muted);">Actions</th>
                </tr>
              </thead>
              <tbody id="popular-results-tbody">
                <!-- Les lignes seront injectées ici -->
              </tbody>
            </table>
          `;
          
          container.appendChild(table);
          tbody = document.getElementById('popular-results-tbody');
          
          if (!tbody) {
            throw new Error('Failed to create or find popular results tbody element');
          }
        } catch (tableError) {
          console.error('Error creating popular table structure in viewManager:', tableError);
          // Afficher un message d'erreur dans le conteneur mais ne pas le masquer complètement
          container.innerHTML = `
            <div class="text-center p-4">
              <p class="text-red-500 mb-2">Erreur lors de la création du tableau des livres populaires</p>
              <p class="text-sm opacity-70">${tableError.message}</p>
              <button onclick="viewManager.renderPopularResults(window.lastPopularResults)" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                Réessayer
              </button>
            </div>
          `;
          return;
        }
        
        // Ajouter chaque livre comme une ligne séparée avec gestion d'erreur individuelle
        let validRows = 0;
        let errorCount = 0;
        
        books.forEach((book, index) => {
          try {
            // Vérification de base des données du livre
            if (!book || typeof book !== 'object') {
              console.warn(`Invalid popular book object at index ${index}:`, book);
              errorCount++;
              return;
            }
            
            const row = this.createPopularListItem(book, index + 1); // Ajouter 1 pour commencer à 1
            if (row) {
              tbody.appendChild(row);
              validRows++;
            } else {
              console.warn(`Failed to render popular row for book at index ${index}:`, book);
              errorCount++;
            }
          } catch (itemError) {
            console.error(`Error rendering popular list item for book at index ${index}:`, book, itemError);
            errorCount++;
            
            // Ajouter une ligne d'erreur pour ce livre spécifique
           try {
             const errorRow = document.createElement('tr');
             errorRow.className = 'border-b';
             errorRow.style.borderColor = 'var(--border-muted)';
             errorRow.innerHTML = `
               <td colspan="6" class="p-3 text-center text-sm opacity-70">
                 Erreur d'affichage: ${itemError.message}
               </td>
             `;
             tbody.appendChild(errorRow);
           } catch (errorRowError) {
             console.error('Failed to create popular error row:', errorRowError);
           }
          }
        });
        
        console.log(`viewManager.renderPopularList completed: ${validRows} valid rows, ${errorCount} errors`);
        
        // Si aucune ligne valide n'a été créée, afficher un message approprié
        if (validRows === 0) {
          console.warn('No valid popular rows were created');
          container.innerHTML = `
            <div class="text-center p-4">
              <p class="text-red-500 mb-2">Aucun livre populaire ne peut être affiché</p>
              <p class="text-sm opacity-70">Vérifiez les données et réessayez</p>
              <button onclick="viewManager.renderPopularResults(window.lastPopularResults)" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                Réessayer
              </button>
            </div>
          `;
        } else {
          container.classList.remove('empty-container');
          
          // S'il y a eu des erreurs mais que des lignes valides existent, afficher un avertissement
          if (errorCount > 0) {
            const warningRow = document.createElement('tr');
            warningRow.innerHTML = `
              <td colspan="5" class="p-2 text-center text-xs opacity-70" style="background: var(--bg-soft);">
                ⚠️ ${errorCount} livre(s) populaire(s) n'ont pas pu être affichés correctement
              </td>
            `;
            tbody.insertBefore(warningRow, tbody.firstChild);
          }
        }
      } catch (error) {
        criticalError = true;
        errorMessage = error.message;
        console.error('Critical error in viewManager.renderPopularList:', error);
        console.error('Error stack:', error.stack);
        
        // En cas d'erreur critique, afficher un message détaillé mais ne masquer le conteneur qu'en dernier recours
        const container = document.getElementById('popular-books-container');
        if (container) {
          container.innerHTML = `
            <div class="text-center p-4">
              <p class="text-red-500 mb-2">Erreur critique lors de l'affichage des livres populaires en liste</p>
              <p class="text-sm opacity-70">${errorMessage}</p>
              <button onclick="viewManager.renderPopularResults(window.lastPopularResults)" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                Réessayer
              </button>
            </div>
          `;
        }
      }
      
      // Journalisation pour le débogage
      if (criticalError) {
        console.error('viewManager.renderPopularList failed with critical error:', errorMessage);
      } else {
        console.log('viewManager.renderPopularList completed successfully');
      }
    },
    
    createPopularListItem(book, rank) {
      const isAppleBook = book.isAppleBook || false;
      
      // Fonction pour nettoyer les données de l'auteur (identique à renderListItem)
      const cleanAuthor = (author) => {
        if (!author) return 'Unknown author';
        
        // Essayer d'extraire le nom complet (nom + prénom) avant les séparateurs
        const patterns = [
          /^(.+?)\s*\[/,  // Avant le premier crochet
          /^(.+?)\s*;/,   // Avant le premier point-virgule
          /^(.+?)\s*-\s/, // Avant le premier tiret avec espaces
          /^(.+?)\s*\(/,  // Avant la première parenthèse
        ];
        
        for (const pattern of patterns) {
          const match = author.match(pattern);
          if (match && match[1]) {
            let cleaned = match[1].trim();
            
            // Si le nom contient des virgules, essayer de prendre les deux premières parties (nom, prénom)
            if (cleaned.includes(',')) {
              const parts = cleaned.split(',').map(p => p.trim());
              if (parts.length >= 2) {
                // Inverser pour avoir "Prénom Nom" au lieu de "Nom, Prénom"
                cleaned = parts[1] + ' ' + parts[0];
              } else {
                cleaned = parts[0];
              }
            }
            
            // Limiter à un nom raisonnable (max 30 caractères)
            if (cleaned.length > 30) {
              const words = cleaned.split(/\s+/);
              if (words.length >= 2) {
                // Prendre les deux premiers mots (généralement prénom + nom)
                cleaned = words.slice(0, 2).join(' ');
              } else {
                cleaned = cleaned.substring(0, 30);
              }
            }
            
            // Vérifier si c'est un nom propre (contient au moins une majuscule)
            if (/[A-Z]/.test(cleaned) && cleaned.length > 1) {
              return cleaned;
            }
          }
        }
        
        // Si aucun pattern ne correspond, essayer de trouver les deux premiers mots avec majuscules
        const words = author.split(/\s+/);
        const capitalizedWords = words.filter(word => /[A-Z]/.test(word) && word.length > 1);
        
        if (capitalizedWords.length >= 2) {
          return capitalizedWords.slice(0, 2).join(' ');
        } else if (capitalizedWords.length === 1) {
          return capitalizedWords[0];
        }
        
        // En dernier recours, retourner les deux premiers mots
        if (words.length >= 2) {
          return words.slice(0, 2).join(' ');
        } else {
          return words[0] || 'Unknown author';
        }
      };
      
      // Fonction pour nettoyer les dates (prendre seulement la première année)
      const cleanYear = (year) => {
        if (!year) return '';
        
        // Si l'année contient plusieurs années concaténées, prendre la première
        const yearMatch = year.match(/(\d{4})/);
        if (yearMatch) {
          return yearMatch[1];
        }
        
        return '';
      };
      
      // Cellule Classement
      const rankCell = document.createElement('td');
      rankCell.className = 'p-3 font-medium text-center';
      rankCell.textContent = rank || '-';
      
      // Cellule Preview
      const previewCell = document.createElement('td');
      previewCell.className = 'p-3';
      
      // Vérifier si on est sur mobile (désactiver le zoom sur mobile)
      const isMobile = window.innerWidth <= 768;
      
      if (book.preview && !isMobile) {
        const coverContainer = document.createElement('div');
        coverContainer.className = 'cover-zoom-container';
        
        const coverImg = document.createElement('img');
        coverImg.src = utils.e(book.preview);
        coverImg.alt = 'Cover';
        coverImg.className = 'book-cover w-12 h-16 object-cover rounded cursor-pointer';
        coverImg.setAttribute('data-book-id', utils.e(book.id));
        coverImg.setAttribute('data-src', utils.e(book.preview));
        
        // Ajouter le gestionnaire d'événements pour le zoom animé
        coverImg.addEventListener('click', (e) => {
          e.stopPropagation();
          coverZoomManager.showZoomedImage(coverImg);
        });
        
        coverContainer.appendChild(coverImg);
        previewCell.appendChild(coverContainer);
      } else if (book.preview && isMobile) {
        // Sur mobile, juste l'image sans zoom
        const coverImg = document.createElement('img');
        coverImg.src = utils.e(book.preview);
        coverImg.alt = 'Cover';
        coverImg.className = 'w-12 h-16 object-cover rounded';
        previewCell.appendChild(coverImg);
      } else {
        // Pas d'image disponible
        const noCover = document.createElement('div');
        noCover.className = 'w-12 h-16 rounded flex items-center justify-center opacity-70 text-xs';
        noCover.style.background = 'var(--bg-soft)';
        noCover.textContent = 'No Cover';
        previewCell.appendChild(noCover);
      }
      
      // Cellule Title
      const titleCell = document.createElement('td');
      titleCell.className = 'p-3 font-medium';
      titleCell.textContent = utils.e(book.title) || 'Untitled';
      
      // Cellule Author (nettoyée)
      const authorCell = document.createElement('td');
      authorCell.className = 'p-3';
      authorCell.textContent = cleanAuthor(book.author);
      
      // Cellule Year
      const yearCell = document.createElement('td');
      yearCell.className = 'p-3';
      yearCell.textContent = cleanYear(book.year || book.releaseDate) || '-';
      
      // Cellule Actions (verticale)
      const actionsCell = document.createElement('td');
      actionsCell.className = 'p-3';
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'flex flex-col gap-1 items-center';
      
      const actionBtn = document.createElement('button');
      actionBtn.className = 'px-2 py-1 rounded border text-xs w-full';
      actionBtn.style.borderColor = 'var(--border-muted)';
      actionBtn.textContent = isAppleBook ? 'Search' : 'Details';
      actionBtn.setAttribute('data-action', isAppleBook ? 'search' : 'details');
      actionBtn.setAttribute('data-title', utils.e(book.title));
      
      if (isAppleBook) {
        actionBtn.addEventListener('click', () => {
          homeSections.searchForAppleBook(book.title, book.author);
        });
      } else {
        actionBtn.addEventListener('click', () => {
          bookDetails.show(book.id);
        });
      }
      
      actionsContainer.appendChild(actionBtn);
      actionsCell.appendChild(actionsContainer);
      
      // Assembler la ligne
      const row = document.createElement('tr');
      row.className = 'border-b';
      row.style.borderColor = 'var(--border-muted)';
      if (isAppleBook) {
        row.classList.add('apple-book-card');
      }
      
      row.appendChild(rankCell);
      row.appendChild(previewCell);
      row.appendChild(titleCell);
      row.appendChild(authorCell);
      row.appendChild(yearCell);
      row.appendChild(actionsCell);
      
      return row;
    }
  };

  // ---- Search ----
  const search = {
    async run() {
      console.log('=== SEARCH.RUN CALLED ===');
      
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt SANS délai
      return new Promise((resolve, reject) => {
        requestAnimationFrame(async () => {
          try {
            // S'assurer que les éléments de recherche sont à jour
            if (typeof navigation !== 'undefined' && navigation.refreshSearchElements) {
              navigation.refreshSearchElements();
            }
            
            const qs = utils.buildQuery();
            console.log('Query string from buildQuery:', qs);
            
            if (!qs) {
              console.log('Empty query string in search.run()');
              window.lastSearchResults = [];
              // Réinitialiser l'état de recherche si la requête est vide
              searchState.reset();
              if (typeof viewManager !== 'undefined') {
                viewManager.renderResults([]);
              } else {
                console.error('viewManager not available in search.run()');
              }
              resolve();
              return;
            }
            
            // Marquer que nous avons effectué une recherche
            searchState.markSearched();
            
            // Afficher le chargement
            let searchLoading = el.searchLoading;
            if (!searchLoading) {
              searchLoading = document.getElementById('search-loading');
            }
            
            if (searchLoading) {
              utils.show(searchLoading);
              console.log('Showing search loading indicator');
            } else {
              console.warn('searchLoading element not found');
            }
            
            const searchUrl = `${API.search}?${qs}`;
            console.log('Fetching search results from:', searchUrl);
            
            // Afficher un message de débogage dans le conteneur de résultats
            let resultsContainer = el.resultsContainer;
            if (!resultsContainer) {
              // Essayer de récupérer directement
              resultsContainer = document.getElementById('results-container');
            }
            
            if (resultsContainer) {
              resultsContainer.innerHTML = '<div class="text-center p-4">Recherche en cours...</div>';
            } else {
              console.error('Results container not found in search.run()');
            }
            
            const data = await utils.j(searchUrl);
            console.log('=== SEARCH.RUN RESULTS ===');
            console.log('Data type:', typeof data);
            console.log('Data:', data);
            console.log('Is array:', Array.isArray(data));
            console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
            
            window.lastSearchResults = data; // Stocker pour le changement de vue
            
            if (typeof viewManager !== 'undefined') {
              console.log('Calling viewManager.renderResults from search.run()');
              viewManager.renderResults(data);
            } else {
              console.error('viewManager not available in search.run()');
            }
            
            resolve();
            
          } catch (e) {
            console.error('=== SEARCH.RUN ERROR ===');
            console.error('Error in search.run():', e);
            console.error('Error message:', e.message);
            console.error('Error stack:', e.stack);
            
            window.lastSearchResults = [];
            
            // Afficher un message d'erreur détaillé
            let resultsContainer = el.resultsContainer;
            if (!resultsContainer) {
              resultsContainer = document.getElementById('results-container');
            }
            
            if (resultsContainer) {
              resultsContainer.innerHTML = `
                <div class="text-center p-4">
                  <p class="text-red-500 mb-2">Erreur lors de la recherche</p>
                  <p class="text-sm opacity-70">${e.message}</p>
                  <button onclick="search.run()" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                    Réessayer
                  </button>
                </div>
              `;
            } else {
              // Si le conteneur n'existe pas, créer une alerte
              console.error('Results container not found for error display');
              alert(`Erreur lors de la recherche: ${e.message}`);
            }
            
            if (typeof viewManager !== 'undefined') {
              viewManager.renderResults([]);
            } else {
              console.error('viewManager not available for error rendering in search.run()');
            }
            
            reject(e);
          } finally {
            // Cacher le chargement
            let searchLoading = el.searchLoading;
            if (!searchLoading) {
              searchLoading = document.getElementById('search-loading');
            }
            
            if (searchLoading) {
              utils.hide(searchLoading);
              console.log('Hiding search loading indicator');
            }
          }
        });
      });
    }
  };

  // ---- Details ----
  const bookDetails = {
    async show(id) {
      try {
        modal.open();
        el.detailsContainer.innerHTML = '<div class="p-4">Loading…</div>';
        const book = await utils.j(`${API.info}?id=${encodeURIComponent(id)}`);
        el.detailsContainer.innerHTML = this.tpl(book);
        document.getElementById('close-details')?.addEventListener('click', modal.close);
        document.getElementById('download-button')?.addEventListener('click', () => this.download(book));
      } catch (e) {
        el.detailsContainer.innerHTML = '<div class="p-4">Failed to load details.</div>';
      }
    },
    tpl(book) {
      const cover = book.preview ? `<img src="${utils.e(book.preview)}" alt="Cover" class="w-full h-88 object-cover rounded">` : '';
      const infoList = book.info ? Object.entries(book.info).map(([k, v]) => `<li><strong>${utils.e(k)}:</strong> ${utils.e((v||[]).join 
        ? v.join(', ') : v)}</li>`).join('') : '';
      return `
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>${cover}</div>
            <div>
              <h3 class="text-lg font-semibold mb-1">${utils.e(book.title) || 'Untitled'}</h3>
              <p class="text-sm opacity-80">${utils.e(book.author) || 'Unknown author'}</p>
              <div class="text-sm mt-2 space-y-1">
                <p><strong>Publisher:</strong> ${utils.e(book.publisher) || '-'}</p>
                <p><strong>Year:</strong> ${(() => {
                  const year = book.year;
                  if (!year) return '-';
                  const yearMatch = year.match(/(\d{4})/);
                  return yearMatch ? yearMatch[1] : '-';
                })()}</p>
                <p><strong>Language:</strong> ${utils.e(book.language) || '-'}</p>
                <p><strong>Format:</strong> ${utils.e(book.format) || '-'}</p>
                <p><strong>Size:</strong> ${utils.e(book.size) || '-'}</p>
              </div>
            </div>
          </div>
          ${infoList ? `<div><h4 class="font-semibold mb-2">Further Information</h4><ul class="list-disc pl-6 space-y-1 text-sm">${infoList}</ul></div>` : ''}
          <div class="flex gap-2">
            <button id="download-button" class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm">Download</button>
            <button id="close-details" class="px-3 py-2 rounded border text-sm" style="border-color: var(--border-muted);">Close</button>
          </div>
        </div>`;
    },
    async download(book) {
      if (!book) return;
      
      // Feedback immédiat optimiste
      this.showImmediateFeedback(book);
      
      try {
        await utils.j(`${API.download}?id=${encodeURIComponent(book.id)}`);
        utils.toast('Livre ajouté à la file de téléchargement');
        modal.close();
        status.fetch();
        sidebar.fetchStatus(); // Also update sidebar
      } catch (e) {
        // En cas d'erreur, on retire le feedback optimiste
        this.hideImmediateFeedback(book);
        utils.toast('Erreur lors de l\'ajout à la file de téléchargement');
        console.error('Download error:', e);
      }
    },
    
    showImmediateFeedback(book) {
      // Mettre à jour immédiatement le badge du panneau latéral
      sidebar.incrementBadge();
      
      // Ajouter un état visuel sur le bouton de download
      const downloadBtn = document.querySelector(`[data-action="download"][data-id="${book.id}"]`);
      if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
          <svg class="animate-spin h-4 w-4 mr-1 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Ajout...
        `;
        downloadBtn.classList.add('opacity-75', 'cursor-not-allowed');
      }
      
      // Ajouter l'élément à la liste du panneau latéral immédiatement
      sidebar.addOptimisticItem(book);
      
      // Déclencher un rafraîchissement accéléré après 1 seconde pour récupérer rapidement le statut réel
      setTimeout(() => {
        sidebar.fetchStatus(false); // Sans loader pour éviter le flicker
      }, 1000);
    },
    
    hideImmediateFeedback(book) {
      // Décrémenter le badge en cas d'erreur
      sidebar.decrementBadge();
      
      // Restaurer le bouton de download
      const downloadBtn = document.querySelector(`[data-action="download"][data-id="${book.id}"]`);
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = 'Download';
        downloadBtn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
      
      // Retirer l'élément optimiste du panneau latéral
      sidebar.removeOptimisticItem(book.id);
    },
  };

  // ---- Status ----
  const status = {
    async fetch() {
      try {
        utils.show(el.statusLoading);
        
        // Use cache to avoid redundant requests
        let data;
        if (apiCache.isValid('status')) {
          data = apiCache.get('status');
          console.log('Status: using cached data');
        } else {
          data = await utils.j(API.status);
          apiCache.set('status', data);
          console.log('Status: fetched fresh data');
        }
        
        this.render(data);
        // Also reflect active downloads in the top section
        this.renderTop(data);
        this.updateActive();
      } catch (e) {
        dom.safeSetHTML('status-list', '<div class="text-sm opacity-80">Error loading status.</div>');
      } finally { utils.hide(el.statusLoading); }
    },
    render(data) {
      // data shape: {queued: {...}, downloading: {...}, completed: {...}, error: {...}}
      const sections = [];
      for (const [name, items] of Object.entries(data || {})) {
        if (!items || Object.keys(items).length === 0) continue;
        const rows = Object.values(items).map((b) => {
          const titleText = utils.e(b.title) || '-';
          const maybeLinkedTitle = b.download_path
            ? `<a href="/request/api/localdownload?id=${encodeURIComponent(b.id)}" class="text-blue-600 hover:underline">${titleText}</a>`
            : titleText;
          const actions = (name === 'queued' || name === 'downloading')
            ? `<button class="px-2 py-1 rounded border text-xs" data-cancel="${utils.e(b.id)}" style="border-color: var(--border-muted);">Cancel</button>`
            : '';
          const progress = (name === 'downloading' && typeof b.progress === 'number')
            ? `<div class="h-2 bg-black/10 rounded overflow-hidden"><div class="h-2 bg-blue-600" style="width:${Math.round(b.progress)}%"></div></div>`
            : '';
          return `<li class="p-3 rounded border flex flex-col gap-2" style="border-color: var(--border-muted); background: var(--bg-soft)">
            <div class="text-sm"><span class="opacity-70">${utils.e(name)}</span> • <strong>${maybeLinkedTitle}</strong></div>
            ${progress}
            <div class="flex items-center gap-2">${actions}</div>
          </li>`;
        }).join('');
        sections.push(`
          <div>
            <h4 class="font-semibold mb-2">${name.charAt(0).toUpperCase() + name.slice(1)}</h4>
            <ul class="space-y-2">${rows}</ul>
          </div>`);
      }
      if (el.statusList) {
        el.statusList.innerHTML = sections.join('') || '<div class="text-sm opacity-80">No items.</div>';
        // Bind cancel buttons
        el.statusList.querySelectorAll('[data-cancel]')?.forEach((btn) => {
          btn.addEventListener('click', () => queue.cancel(btn.getAttribute('data-cancel')));
        });
      }
    },
    // Render compact active downloads list near the search bar
    renderTop(data) {
      try {
        const downloading = (data && data.downloading) ? Object.values(data.downloading) : [];
        if (!el.activeTopSec || !el.activeTopList) return;
        if (!downloading.length) {
          if (el.activeTopList) {
            el.activeTopList.innerHTML = '';
          }
          if (el.activeTopSec) {
            el.activeTopSec.classList.add('hidden');
          }
          return;
        }
        // Build compact rows with title and progress bar + cancel
        const rows = downloading.map((b) => {
          const prog = (typeof b.progress === 'number')
            ? `<div class="h-1.5 bg-black/10 rounded overflow-hidden"><div class="h-1.5 bg-blue-600" style="width:${Math.round(b.progress)}%"></div></div>`
            : '';
          const cancel = `<button class="px-2 py-0.5 rounded border text-xs" data-cancel="${utils.e(b.id)}" style="border-color: var(--border-muted);">Cancel</button>`;
          return `<div class="p-3 rounded border" style="border-color: var(--border-muted); background: var(--bg-soft)">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm truncate"><strong>${utils.e(b.title || '-') }</strong></div>
              <div class="shrink-0">${cancel}</div>
            </div>
            ${prog}
          </div>`;
        }).join('');
        if (el.activeTopList) {
          el.activeTopList.innerHTML = rows;
        }
        if (el.activeTopSec) {
          el.activeTopSec.classList.remove('hidden');
        }
        // Bind cancel handlers for the top section
        if (el.activeTopList) {
          el.activeTopList.querySelectorAll('[data-cancel]')?.forEach((btn) => {
            btn.addEventListener('click', () => queue.cancel(btn.getAttribute('data-cancel')));
          });
        }
      } catch (_) {}
    },
    async updateActive() {
      try {
        // Use cache to avoid redundant requests
        let d;
        if (apiCache.isValid('activeDownloads')) {
          d = apiCache.get('activeDownloads');
        } else {
          d = await utils.j(API.activeDownloads);
          apiCache.set('activeDownloads', d);
        }
        
        const n = Array.isArray(d.active_downloads) ? d.active_downloads.length : 0;
        if (el.activeDownloadsCount) el.activeDownloadsCount.textContent = `Active: ${n}`;
      } catch (_) {}
    }
  };

  // ---- Queue ----
  const queue = {
    async cancel(id) {
      try {
        await fetch(`${API.cancelDownload}/${encodeURIComponent(id)}/cancel`, { method: 'DELETE' });
        status.fetch();
        sidebar.fetchStatus(); // Also update sidebar
      } catch (_){}
    }
  };

  // ---- Theme ----
  const theme = {
    KEY: 'preferred-theme',
    init() {
      const saved = localStorage.getItem(this.KEY) || 'auto';
      this.apply(saved);
      this.updateLabel(saved);
      // toggle dropdown
      el.themeToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!el.themeMenu) return;
        
        // Position the dropdown dynamically relative to the button (left-aligned)
        const buttonRect = el.themeToggle.getBoundingClientRect();
        el.themeMenu.style.top = `${buttonRect.bottom + 2}px`;
        el.themeMenu.style.left = `${buttonRect.left}px`;
        
        const isOpening = el.themeMenu.classList.contains('hidden');
        el.themeMenu.classList.toggle('hidden');
        
        // Optimize performance for dropdown animation
        if (window.performanceManager) {
          if (isOpening) {
            window.performanceManager.add(el.themeMenu, 'opacity, transform');
          } else {
            window.performanceManager.remove(el.themeMenu);
          }
        }
      });
      // outside click to close
      document.addEventListener('click', (ev) => {
        if (!el.themeMenu || !el.themeToggle) return;
        if (el.themeMenu.contains(ev.target) || el.themeToggle.contains(ev.target)) return;
        el.themeMenu.classList.add('hidden');
      });
      // selection
      el.themeMenu?.querySelectorAll('a[data-theme]')?.forEach((a) => {
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          const pref = a.getAttribute('data-theme');
          localStorage.setItem(theme.KEY, pref);
          theme.apply(pref);
          theme.updateLabel(pref);
          el.themeMenu.classList.add('hidden');
        });
      });
      // react to system change if auto
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', (e) => {
        if ((localStorage.getItem(theme.KEY) || 'auto') === 'auto') {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    },
    apply(pref) {
      if (pref === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', pref);
      }
    },
    updateLabel(pref) { if (el.themeText) el.themeText.textContent = `Theme (${pref})`; }
  };

  // ---- Sidebar ----
  const sidebar = {
    isOpen: false,
    refreshTimer: null,
    inactivityTimer: null,
    isFetching: false, // Prevent multiple simultaneous requests
    isVisible: true, // Track if tab is visible
    hasActiveDownloads: false, // Track if there are active downloads
    lastData: null, // Cache last data to prevent unnecessary re-renders
    optimisticItems: new Set(), // Track optimistic items
    retryTimer: null, // Timer for retry attempts
    
    init() {
      // Bind toggle events
      el.sidebarClose?.addEventListener('click', () => this.close());
      el.sidebarOverlay?.addEventListener('click', () => this.close());
      
      // Track page visibility for performance optimization
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
        if (this.isVisible && this.isOpen) {
          // Refresh when tab becomes visible
          this.fetchStatus(true); // Show loader when tab becomes visible
        }
      });
      
      // Bind sidebar buttons
      el.sidebarRefreshBtn?.addEventListener('click', () => {
        this.fetchStatus(true, true); // Show loader for manual refresh et force refresh
      });
      
      el.sidebarClearCompletedBtn?.addEventListener('click', async () => {
        try {
          await fetch(API.clearCompleted, { method: 'DELETE' });
          this.fetchStatus(true); // Show loader for manual action
        } catch (_) {}
      });
      
      // Close sidebar on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
      
      // Initialize with clean state instead of calling ensureValidState
      if (el.sidebarStatusList) {
        el.sidebarStatusList.innerHTML = '<div class="text-sm opacity-80">No downloads.</div>';
      }
    },
    
    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },
    
    open() {
      this.isOpen = true;
      el.sidebarOverlay?.classList.add('sidebar-overlay-active');
      el.sidebarPanel?.classList.add('sidebar-panel-open');
      
      // Optimize performance with dynamic will-change
      if (window.performanceManager) {
        window.performanceManager.add(el.sidebarPanel, 'transform');
        window.performanceManager.add(el.sidebarOverlay, 'opacity');
      }
      
      // Prevent background scrolling and compensate for scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      // Start auto-refresh
      this.startAutoRefresh();
      
      // Fetch initial data with loader
      this.fetchStatus(true);
      
      // Ensure valid state after opening
      this.ensureValidState();
    },
    
    close() {
      this.isOpen = false;
      el.sidebarOverlay?.classList.remove('sidebar-overlay-active');
      el.sidebarPanel?.classList.remove('sidebar-panel-open');
      
      // Clean up performance optimizations
      if (window.performanceManager) {
        window.performanceManager.remove(el.sidebarPanel);
        window.performanceManager.remove(el.sidebarOverlay);
      }
      
      // Restore scrolling and remove compensation
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Stop auto-refresh when closed
      this.stopAutoRefresh();
    },
    
    startAutoRefresh() {
      this.stopAutoRefresh(); // Clear any existing timer
      this.refreshTimer = setInterval(() => {
        // Continuer à rafraîchir toutes les 10s si sidebar ouvert ET visible
        if (this.isOpen && this.isVisible) {
          this.fetchStatus(false); // No loader for auto-refresh
        } else {
          // Arrêter uniquement si sidebar fermé OU onglet non visible
          this.stopAutoRefresh();
        }
      }, SIDEBAR_REFRESH_INTERVAL);
    },
    
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },
    
    resetInactivityTimer() {
      // Disabled - let user control opening/closing manually
      this.clearInactivityTimer();
    },
    
    clearInactivityTimer() {
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer);
        this.inactivityTimer = null;
      }
    },
    
    async fetchStatus(showLoader = false, forceRefresh = false) {
      // Prevent multiple simultaneous requests
      if (this.isFetching) return;
      
      try {
        this.isFetching = true;
        
        // Only show loader for manual refresh or initial load
        if (showLoader) {
          utils.show(el.sidebarStatusLoading);
        }
        
        // Check cache first to avoid redundant requests (sauf si forceRefresh)
        let data;
        if (!forceRefresh && apiCache.isValid('status')) {
          data = apiCache.get('status');
          console.log('Using cached status data');
        } else {
          // Forcer le rafraîchissement si demandé
          if (forceRefresh) {
            console.log('Force refreshing status data (bypassing cache)');
            apiCache.invalidate('status');
          }
          
          try {
            // Add a small delay to prevent flicker for fast responses
            const sidebarFetchStart = performance.now();
            console.log('⏱️ PERFORMANCE: Starting sidebar fetch with 300ms minimum delay at', sidebarFetchStart, 'ms');
            
            const fetchPromise = utils.j(API.status);
            const minDelayPromise = new Promise(resolve => setTimeout(resolve, 300));
            
            [data] = await Promise.all([fetchPromise, minDelayPromise]);
            const sidebarFetchEnd = performance.now();
            console.log('⏱️ PERFORMANCE: Sidebar fetch completed at', sidebarFetchEnd, 'ms (total:', sidebarFetchEnd - sidebarFetchStart, 'ms - includes 300ms minimum delay)');
            apiCache.set('status', data);
          } catch (fetchError) {
            console.error('Error fetching status:', fetchError);
            
            // En cas d'erreur, utiliser les données en cache si disponibles
            if (apiCache.isValid('status')) {
              console.log('Using cached data due to fetch error');
              data = apiCache.get('status');
              
              // Afficher un message d'erreur plus subtil
              this.showErrorState('Using cached data. Refresh failed.', true);
            } else {
              throw fetchError;
            }
          }
        }
        
        // Debug logging
        console.log('Sidebar status data received:', data);
        
        // Clear any previous error state
        this.clearErrorState();
        
        // Ensure data is valid before rendering
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from status API');
        }
        
        // Check if data has actually changed before re-rendering
        const dataStr = JSON.stringify(data);
        if (this.lastData !== dataStr) {
          this.render(data);
          this.lastData = dataStr;
        }
        
        this.updateActiveCount();
        this.updateBadge();
      } catch (e) {
        console.error('Sidebar fetch error:', e);
        console.error('Error details:', {
          message: e.message,
          stack: e.stack,
          showLoader
        });
        
        // Try to recover with a fallback render
        this.renderFallback();
        
        // Only show error message for manual refresh, not for auto-refresh
        if (showLoader) {
          this.showErrorState('Error loading status. Please try again.');
        } else {
          // For auto-refresh, don't show error but try to recover
          this.scheduleRetry();
        }
      } finally {
        if (showLoader) {
          utils.hide(el.sidebarStatusLoading);
        }
        this.isFetching = false;
        
        // Ensure valid state after fetch attempt
        setTimeout(() => this.ensureValidState(), 100);
      }
    },
    
    clearErrorState() {
      // Clear any error messages that might be displayed
      if (el.sidebarStatusList) {
        const errorElements = el.sidebarStatusList.querySelectorAll('.error-message');
        errorElements.forEach(el => el.remove());
      }
    },
    
    showErrorState(message, showSubtle = false) {
      if (el.sidebarStatusList) {
        // Toujours préserver le contenu existant et ajouter un message subtil
        const errorDiv = document.createElement('div');
        errorDiv.className = 'status-message text-xs p-2 rounded mb-2';
        errorDiv.style.cssText = `
          background: ${showSubtle ? 'rgba(255, 193, 7, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
          border: 1px solid ${showSubtle ? 'rgba(255, 193, 7, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
          color: ${showSubtle ? 'rgba(255, 193, 7, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: slideDown 0.3s ease;
        `;
        
        errorDiv.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>${message}</span>
        `;
        
        // Ajouter au début de la liste
        if (el.sidebarStatusList.firstChild) {
          el.sidebarStatusList.insertBefore(errorDiv, el.sidebarStatusList.firstChild);
        } else {
          el.sidebarStatusList.appendChild(errorDiv);
        }
        
        // Auto-supprimer après 5 secondes
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
              if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
              }
            }, 300);
          }
        }, 5000);
      }
    },
    
    scheduleRetry() {
      // Schedule a retry after 5 seconds
      if (!this.retryTimer) {
        this.retryTimer = setTimeout(() => {
          this.retryTimer = null;
          if (this.isOpen) {
            console.log('Retrying status fetch after error');
            this.fetchStatus(false); // Retry without showing loader
          }
        }, 5000);
      }
    },
    
    renderFallback() {
      try {
        console.log('Rendering fallback content');
        
        if (!el.sidebarStatusList) {
          console.error('Sidebar status list element not found');
          return;
        }
        
        // Clear any previous error state
        this.clearErrorState();
        
        // Show a minimal fallback content
        if (this.optimisticItems.size > 0) {
          // If we have optimistic items, show them
          const content = `
            <div>
              <h4 class="font-semibold mb-2">Queued</h4>
              <ul class="space-y-2">
                ${Array.from(this.optimisticItems).map(id => {
                  return `<li class="p-3 rounded border flex flex-col gap-2 optimistic-item" data-optimistic-id="${id}" style="border-color: var(--border-muted); background: var(--bg-soft); opacity: 0.7; border-style: dashed;">
                    <div class="text-sm"><span class="opacity-70">queued</span> • <strong>Processing...</strong></div>
                    <div class="h-2 bg-black/10 rounded overflow-hidden">
                      <div class="h-2 bg-blue-300 animate-pulse" style="width: 0%"></div>
                    </div>
                    <div class="text-xs opacity-60 italic">Ajout à la file d'attente...</div>
                  </li>`;
                }).join('')}
              </ul>
            </div>
          `;
          if (el.sidebarStatusList) {
            el.sidebarStatusList.innerHTML = content;
          }
        } else {
          // Show empty state with a retry button
          const content = `
            <div class="text-sm opacity-80 text-center p-4">
              <div class="mb-2">No downloads.</div>
              <button id="sidebar-retry-button" class="px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                Retry
              </button>
            </div>
          `;
          if (el.sidebarStatusList) {
            el.sidebarStatusList.innerHTML = content;
          }
          
          // Bind retry button
          const retryBtn = document.getElementById('sidebar-retry-button');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => {
              this.fetchStatus(true); // Show loader for manual retry
            });
          }
        }
        
        // Update badge with optimistic items count
        this.updateBadge();
      } catch (error) {
        console.error('Error in fallback render:', error);
        // Last resort - show minimal content
        if (el.sidebarStatusList) {
          if (el.sidebarStatusList) {
            el.sidebarStatusList.innerHTML = '<div class="text-sm opacity-80">No downloads.</div>';
          }
        }
      }
    },
    
    render(data) {
      try {
        console.log('Sidebar render called with data:', data);
        
        // Clear any previous error state before rendering
        this.clearErrorState();
        
        // data shape: {queued: {...}, downloading: {...}, completed: {...}, error: {...}}
        const sections = [];
        let hasActiveDownloads = false;
        
        // Validate data structure more gracefully
        if (!data || typeof data !== 'object') {
          console.warn('Invalid data structure in render:', data);
          // Don't show error immediately, try fallback first
          this.renderFallback();
          return;
        }
        
        // Clear optimistic items for books that are now in the real data
        // But only after a short delay to avoid the "hole" effect
        setTimeout(() => {
          for (const [name, items] of Object.entries(data || {})) {
            if (items && typeof items === 'object') {
              Object.values(items).forEach(book => {
                if (book && book.id && this.optimisticItems.has(book.id)) {
                  this.removeOptimisticItem(book.id);
                }
              });
            }
          }
        }, 500); // Short delay to ensure smooth transition
        
        for (const [name, items] of Object.entries(data || {})) {
          if (!items || typeof items !== 'object' || Object.keys(items).length === 0) continue;
          
          // Track if there are active downloads
          if (name === 'downloading' || name === 'queued') {
            hasActiveDownloads = true;
          }
          
          const rows = Object.values(items).map((b) => {
            // Validate book object more gracefully
            if (!b || typeof b !== 'object') {
              console.warn('Invalid book object:', b);
              return '';
            }
            
            const titleText = utils.e(b.title) || 'Untitled';
            const maybeLinkedTitle = b.download_path
              ? `<a href="/request/api/localdownload?id=${encodeURIComponent(b.id)}" class="text-blue-600 hover:underline">${titleText}</a>`
              : titleText;
            const actions = (name === 'queued' || name === 'downloading')
              ? `<button class="px-2 py-1 rounded border text-xs" data-cancel="${utils.e(b.id)}" style="border-color: var(--border-muted);">Cancel</button>`
              : '';
            const progress = (name === 'downloading' && typeof b.progress === 'number')
              ? `<div class="h-2 bg-black/10 rounded overflow-hidden"><div class="h-2 bg-blue-600" style="width:${Math.round(b.progress)}%"></div></div>`
              : '';
            return `<li class="p-3 rounded border flex flex-col gap-2" style="border-color: var(--border-muted); background: var(--bg-soft)">
              <div class="text-sm"><span class="opacity-70">${utils.e(name)}</span> • <strong>${maybeLinkedTitle}</strong></div>
              ${progress}
              <div class="flex items-center gap-2">${actions}</div>
            </li>`;
          }).filter(row => row.length > 0).join('');
          
          if (rows.length > 0) {
            sections.push(`
              <div>
                <h4 class="font-semibold mb-2">${name.charAt(0).toUpperCase() + name.slice(1)}</h4>
                <ul class="space-y-2">${rows}</ul>
              </div>`);
          }
        }
        
        // Only show "No downloads" if we have no optimistic items either
        const hasContent = sections.length > 0 || this.optimisticItems.size > 0;
        const content = hasContent ? sections.join('') : '<div class="text-sm opacity-80">No downloads.</div>';
        
        // Only update DOM if content has changed
        if (el.sidebarStatusList) {
          const currentContent = el.sidebarStatusList.innerHTML;
          if (currentContent !== content) {
            el.sidebarStatusList.innerHTML = content;
            
            // Bind cancel buttons
            el.sidebarStatusList.querySelectorAll('[data-cancel]')?.forEach((btn) => {
              btn.addEventListener('click', () => {
                queue.cancel(btn.getAttribute('data-cancel'));
              });
            });
          }
        }
        
        // Update active downloads status
        this.hasActiveDownloads = hasActiveDownloads;
        
        // Reset inactivity timer if there are active downloads
        if (hasActiveDownloads) {
          this.resetInactivityTimer();
        }
        
      } catch (error) {
        console.error('Error in sidebar render:', error);
        // Try fallback before showing error
        this.renderFallback();
      }
    },
    
    async updateActiveCount() {
      try {
        // Use cache to avoid redundant requests
        let d;
        if (apiCache.isValid('activeDownloads')) {
          d = apiCache.get('activeDownloads');
        } else {
          d = await utils.j(API.activeDownloads);
          apiCache.set('activeDownloads', d);
        }
        
        console.log('Active downloads data:', d);
        const n = Array.isArray(d.active_downloads) ? d.active_downloads.length : 0;
        if (el.sidebarActiveDownloadsCount) el.sidebarActiveDownloadsCount.textContent = `Active: ${n}`;
      } catch (error) {
        console.error('Error updating active count:', error);
        // Set default value on error
        if (el.sidebarActiveDownloadsCount) el.sidebarActiveDownloadsCount.textContent = `Active: 0`;
      }
    },
    
    updateBadge() {
      if (!el.sidebarBadge) return;
      
      // Get all real items in the DOM
      const allRealItems = Array.from(el.sidebarStatusList?.querySelectorAll('li') || [])
        .filter(li => !li.hasAttribute('data-optimistic-id'));
      
      // Get IDs of real items to avoid double counting during transition
      const realItemIds = new Set();
      allRealItems.forEach(li => {
        const cancelBtn = li.querySelector('[data-cancel]');
        if (cancelBtn) {
          realItemIds.add(cancelBtn.getAttribute('data-cancel'));
        }
      });
      
      // Count real items (queued + downloading)
      const realItems = allRealItems.filter(li =>
        li.textContent.includes('downloading') || li.textContent.includes('queued')
      );
      
      // Add ONLY optimistic items that don't have a real counterpart yet
      // This prevents double counting during queue→downloading transition
      const optimisticItemsWithoutReal = Array.from(this.optimisticItems).filter(id =>
        !realItemIds.has(id)
      );
      
      const totalCount = realItems.length + optimisticItemsWithoutReal.length;
      
      const hasError = allRealItems.some(li => li.textContent.includes('error'));
      const hasDownloading = allRealItems.some(li => li.textContent.includes('downloading'));
      
      if (totalCount > 0) {
        el.sidebarBadge.textContent = totalCount;
        el.sidebarBadge.classList.add('sidebar-badge-active');
        
        // Update badge color based on status
        el.sidebarBadge.classList.remove('sidebar-badge-error', 'sidebar-badge-downloading');
        if (hasError) {
          el.sidebarBadge.classList.add('sidebar-badge-error');
        } else if (hasDownloading || optimisticItemsWithoutReal.length > 0) {
          el.sidebarBadge.classList.add('sidebar-badge-downloading', 'sidebar-badge-pulse');
        }
      } else {
        el.sidebarBadge.classList.remove('sidebar-badge-active', 'sidebar-badge-error', 'sidebar-badge-downloading', 'sidebar-badge-pulse');
      }
    },
    
    incrementBadge() {
      if (!el.sidebarBadge) return;
      
      // Get current count or default to 0
      const currentCount = parseInt(el.sidebarBadge.textContent) || 0;
      const newCount = currentCount + 1;
      
      el.sidebarBadge.textContent = newCount;
      el.sidebarBadge.classList.add('sidebar-badge-active', 'sidebar-badge-downloading', 'sidebar-badge-pulse');
    },
    
    decrementBadge() {
      if (!el.sidebarBadge) return;
      
      const currentCount = parseInt(el.sidebarBadge.textContent) || 0;
      const newCount = Math.max(0, currentCount - 1);
      
      if (newCount > 0) {
        el.sidebarBadge.textContent = newCount;
      } else {
        el.sidebarBadge.classList.remove('sidebar-badge-active', 'sidebar-badge-error', 'sidebar-badge-downloading', 'sidebar-badge-pulse');
      }
    },
    
    addOptimisticItem(book) {
      try {
        console.log('Adding optimistic item for book:', book);
        this.optimisticItems.add(book.id);
        
        // Create optimistic item for sidebar
        const optimisticItem = document.createElement('li');
        optimisticItem.className = 'p-3 rounded border flex flex-col gap-2 optimistic-item';
        optimisticItem.setAttribute('data-optimistic-id', book.id);
        optimisticItem.style.cssText = 'border-color: var(--border-muted); background: var(--bg-soft); opacity: 0.7; border-style: dashed;';
        optimisticItem.innerHTML = `
          <div class="text-sm"><span class="opacity-70">queued</span> • <strong>${utils.e(book.title || 'Untitled')}</strong></div>
          <div class="h-2 bg-black/10 rounded overflow-hidden">
            <div class="h-2 bg-blue-300 animate-pulse" style="width: 0%"></div>
          </div>
          <div class="text-xs opacity-60 italic">Ajout à la file d'attente...</div>
        `;
        
        // Ensure sidebar list exists
        if (!el.sidebarStatusList) {
          console.error('Sidebar status list element not found');
          return;
        }
        
        // Add to the top of the sidebar list
        const queuedSection = this.findOrCreateSection('queued');
        const list = queuedSection.querySelector('ul');
        if (list) {
          list.insertBefore(optimisticItem, list.firstChild);
        } else {
          console.error('Could not find or create queued section list');
        }
        
        // Auto-remove optimistic item after 30 seconds (fail-safe)
        // Increased timeout to avoid premature removal
        setTimeout(() => {
          this.removeOptimisticItem(book.id);
        }, 30000);
      } catch (error) {
        console.error('Error adding optimistic item:', error);
      }
    },
    
    removeOptimisticItem(bookId) {
      this.optimisticItems.delete(bookId);
      
      // Check if a real item with the same ID already exists
      const realItem = el.sidebarStatusList?.querySelector(`[data-cancel="${bookId}"]`);
      if (realItem) {
        // Real item exists, just remove the optimistic one
        const optimisticItem = el.sidebarStatusList?.querySelector(`[data-optimistic-id="${bookId}"]`);
        if (optimisticItem) {
          optimisticItem.remove();
        }
        return;
      }
      
      // If no real item exists yet, check if we should keep the optimistic one a bit longer
      const optimisticItem = el.sidebarStatusList?.querySelector(`[data-optimistic-id="${bookId}"]`);
      if (optimisticItem) {
        // Add a transition effect before removing
        optimisticItem.style.transition = 'opacity 0.3s ease-out';
        optimisticItem.style.opacity = '0.3';
        
        // Remove after transition
        setTimeout(() => {
          if (optimisticItem.parentNode) {
            optimisticItem.parentNode.removeChild(optimisticItem);
          }
        }, 300);
      }
    },
    
    findOrCreateSection(statusName) {
      try {
        // Ensure sidebar list exists
        if (!el.sidebarStatusList) {
          console.error('Sidebar status list element not found');
          // Create a dummy section to prevent errors
          const dummySection = document.createElement('div');
          dummySection.innerHTML = `
            <h4 class="font-semibold mb-2">${statusName.charAt(0).toUpperCase() + statusName.slice(1)}</h4>
            <ul class="space-y-2"></ul>
          `;
          return dummySection;
        }
        
        // Find existing section
        let section = Array.from(el.sidebarStatusList.children || [])
          .find(child => {
            const heading = child.querySelector('h4');
            return heading && heading.textContent.toLowerCase() === statusName;
          });
        
        if (!section) {
          // Create new section
          section = document.createElement('div');
          section.innerHTML = `
            <h4 class="font-semibold mb-2">${statusName.charAt(0).toUpperCase() + statusName.slice(1)}</h4>
            <ul class="space-y-2"></ul>
          `;
          el.sidebarStatusList.appendChild(section);
        }
        
        return section;
      } catch (error) {
        console.error('Error finding or creating section:', error);
        // Return a dummy section to prevent errors
        const dummySection = document.createElement('div');
        dummySection.innerHTML = `
          <h4 class="font-semibold mb-2">${statusName.charAt(0).toUpperCase() + statusName.slice(1)}</h4>
          <ul class="space-y-2"></ul>
        `;
        return dummySection;
      }
    },
    
    ensureValidState() {
      // Ensure sidebar shows valid state, especially after errors
      try {
        if (!el.sidebarStatusList) return;
        
        const currentContent = el.sidebarStatusList.innerHTML;
        
        // Check if current content shows an error
        if (currentContent.includes('Error rendering status') ||
            currentContent.includes('Error loading status') ||
            currentContent.trim() === '') {
          console.log('Ensuring valid sidebar state');
          this.renderFallback();
        }
      } catch (error) {
        console.error('Error ensuring valid state:', error);
        this.renderFallback();
      }
    }
  };

  // ---- Wire up ----
  function initEvents() {
    // Utiliser des références dynamiques pour les éléments de recherche
    const searchBtn = el.searchBtn || document.getElementById('search-button');
    const searchInput = el.searchInput || document.getElementById('search-input');
    const advSearchBtn = document.getElementById('adv-search-button');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        console.log('Search button clicked from initEvents');
        if (typeof search !== 'undefined' && search.run) {
          search.run();
        } else if (typeof navigation !== 'undefined' && navigation.performSearch) {
          navigation.performSearch();
        }
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          console.log('Enter key pressed from initEvents');
          if (typeof search !== 'undefined' && search.run) {
            search.run();
          } else if (typeof navigation !== 'undefined' && navigation.performSearch) {
            navigation.performSearch();
          }
        }
      });
    }
    
    if (advSearchBtn) {
      advSearchBtn.addEventListener('click', () => {
        console.log('Advanced search button clicked from initEvents');
        if (typeof search !== 'undefined' && search.run) {
          search.run();
        } else if (typeof navigation !== 'undefined' && navigation.performSearch) {
          navigation.performSearch();
        }
      });
    }

    // Advanced search toggle removed - filters are always visible
    console.log('Advanced search toggle logic removed - filters are always visible');

    el.refreshStatusBtn?.addEventListener('click', () => {
      // Feedback immédiat
      el.refreshStatusBtn.disabled = true;
      el.refreshStatusBtn.style.opacity = '0.6';
      
      // Don't fetch status automatically on page load to reduce unnecessary requests
      // Users can manually refresh when needed
      const fetchPromise = sidebar.fetchStatus(false, true); // Force refresh
      
      // Réactiver le bouton après le chargement
      fetchPromise.finally(() => {
        el.refreshStatusBtn.disabled = false;
        el.refreshStatusBtn.style.opacity = '1';
      });
    });
    el.activeTopRefreshBtn?.addEventListener('click', () => {
      // Feedback immédiat
      el.activeTopRefreshBtn.disabled = true;
      el.activeTopRefreshBtn.style.opacity = '0.6';
      
      const fetchPromise = Promise.all([
        status.fetch(),
        sidebar.fetchStatus(false, true) // Force refresh
      ]);
      
      // Réactiver le bouton après le chargement
      fetchPromise.finally(() => {
        el.activeTopRefreshBtn.disabled = false;
        el.activeTopRefreshBtn.style.opacity = '1';
      });
    });
    el.clearCompletedBtn?.addEventListener('click', async () => {
      // Feedback immédiat
      el.clearCompletedBtn.disabled = true;
      el.clearCompletedBtn.style.opacity = '0.6';
      
      try {
        // Supprimer immédiatement les éléments terminés de l'interface
        const completedItems = document.querySelectorAll('[data-status="done"]');
        completedItems.forEach(item => {
          // Animation de disparition
          item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          item.style.opacity = '0';
          item.style.transform = 'translateX(20px)';
          
          // Supprimer après l'animation
          setTimeout(() => {
            if (item.parentNode) {
              item.parentNode.removeChild(item);
            }
          }, 300);
        });
        
        // Mettre à jour le compteur
        const activeCount = document.getElementById('active-downloads-count');
        const sidebarActiveCount = document.getElementById('sidebar-active-downloads-count');
        if (activeCount) {
          const currentCount = parseInt(activeCount.textContent) || 0;
          const newCount = Math.max(0, currentCount - completedItems.length);
          activeCount.textContent = newCount;
        }
        if (sidebarActiveCount) {
          const currentCount = parseInt(sidebarActiveCount.textContent) || 0;
          const newCount = Math.max(0, currentCount - completedItems.length);
          sidebarActiveCount.textContent = newCount;
        }
        
        // Ensuite faire l'appel API
        await fetch(API.clearCompleted, { method: 'DELETE' });
        
        // Rafraîchir les données pour s'assurer que tout est synchronisé
        const fetchPromise = Promise.all([
          status.fetch(),
          sidebar.fetchStatus(false, true) // Force refresh
        ]);
        
        // Réactiver le bouton après le chargement
        fetchPromise.finally(() => {
          el.clearCompletedBtn.disabled = false;
          el.clearCompletedBtn.style.opacity = '1';
        });
      } catch (e) {
        // En cas d'erreur, réactiver immédiatement et rafraîchir
        el.clearCompletedBtn.disabled = false;
        el.clearCompletedBtn.style.opacity = '1';
        
        // Rafraîchir pour restaurer l'état correct
        Promise.all([
          status.fetch(),
          sidebar.fetchStatus(false, true)
        ]);
      }
    });

    // Close modal on overlay click
    el.modalOverlay?.addEventListener('click', (e) => { if (e.target === el.modalOverlay) modal.close(); });
  }

  // ---- Sticky Header (CSS-only approach) ----
  // No JavaScript needed - using CSS pseudo-elements for shadow effect
  // This eliminates all timing conflicts and provides smooth performance

  // ---- Animated Cover Zoom Manager ----
  const coverZoomManager = {
    currentZoomedImage: null,
    isAnimating: false,
    
    showZoomedImage(thumbnailImg) {
      // Désactiver sur mobile
      if (window.innerWidth <= 768) return;
      
      // Si une image est déjà zoomée, la fermer d'abord
      if (this.currentZoomedImage && !this.isAnimating) {
        this.hideZoomedImage();
      }
      
      // Ne pas continuer si on est déjà en train d'animer
      if (this.isAnimating) return;
      
      this.isAnimating = true;
      
      // Récupérer la position de l'image miniature
      const rect = thumbnailImg.getBoundingClientRect();
      const src = thumbnailImg.getAttribute('data-src');
      
      // Créer l'image zoomée
      const zoomedImage = document.createElement('img');
      zoomedImage.src = src;
      zoomedImage.className = 'animated-zoom-image';
      zoomedImage.style.position = 'fixed';
      zoomedImage.style.zIndex = '1000';
      zoomedImage.style.borderRadius = '12px';
      zoomedImage.style.boxShadow = '0 16px 64px rgba(0, 0, 0, 0.4)';
      zoomedImage.style.cursor = 'pointer';
      zoomedImage.style.transformOrigin = 'top left';
      
      // Positionner initialement à la même place que la miniature
      zoomedImage.style.left = `${rect.left}px`;
      zoomedImage.style.top = `${rect.top}px`;
      zoomedImage.style.width = `${rect.width}px`;
      zoomedImage.style.height = `${rect.height}px`;
      zoomedImage.style.objectFit = 'cover';
      
      // Ajouter au DOM
      document.body.appendChild(zoomedImage);
      
      // Créer l'arrière-plan
      const backdrop = document.createElement('div');
      backdrop.className = 'zoom-backdrop';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.right = '0';
      backdrop.style.bottom = '0';
      backdrop.style.background = 'rgba(0, 0, 0, 0.8)';
      backdrop.style.zIndex = '999';
      backdrop.style.opacity = '0';
      backdrop.style.transition = 'opacity 0.3s ease';
      
      document.body.appendChild(backdrop);
      
      // Forcer le chargement de l'image avant l'animation
      zoomedImage.onload = () => {
        // Calculer la taille cible (plus grande mais adaptée à l'écran)
        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.8;
        
        // Ratio de l'image
        const imgRatio = zoomedImage.naturalWidth / zoomedImage.naturalHeight;
        
        // Calculer la taille cible en respectant le ratio
        let targetWidth, targetHeight;
        if (maxWidth / maxHeight > imgRatio) {
          targetHeight = maxHeight;
          targetWidth = maxHeight * imgRatio;
        } else {
          targetWidth = maxWidth;
          targetHeight = maxWidth / imgRatio;
        }
        
        // Position cible (centre de l'écran)
        const targetLeft = (window.innerWidth - targetWidth) / 2;
        const targetTop = (window.innerHeight - targetHeight) / 2;
        
        // Démarrer l'animation (plus rapide à l'ouverture)
        requestAnimationFrame(() => {
          zoomedImage.style.transition = 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          zoomedImage.style.left = `${targetLeft}px`;
          zoomedImage.style.top = `${targetTop}px`;
          zoomedImage.style.width = `${targetWidth}px`;
          zoomedImage.style.height = `${targetHeight}px`;
          
          backdrop.style.opacity = '1';
        });
        
        // Marquer la fin de l'animation
        setTimeout(() => {
          this.isAnimating = false;
        }, 250);
      };
      
      // Stocker les références
      this.currentZoomedImage = zoomedImage;
      this.currentBackdrop = backdrop;
      
      // Ajouter les gestionnaires d'événements pour fermer
      const closeHandler = (e) => {
        e.stopPropagation();
        this.hideZoomedImage();
      };
      
      zoomedImage.addEventListener('click', closeHandler);
      backdrop.addEventListener('click', closeHandler);
      
      // Fermer avec Escape
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.hideZoomedImage();
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      // Stocker les gestionnaires pour pouvoir les retirer plus tard
      this.zoomCloseHandler = closeHandler;
      this.escapeHandler = escapeHandler;
    },
    
    hideZoomedImage() {
      if (this.isAnimating || !this.currentZoomedImage) return;
      
      this.isAnimating = true;
      
      const zoomedImage = this.currentZoomedImage;
      const backdrop = this.currentBackdrop;
      
      // Retirer les gestionnaires d'événements
      if (this.zoomCloseHandler) {
        zoomedImage.removeEventListener('click', this.zoomCloseHandler);
        backdrop.removeEventListener('click', this.zoomCloseHandler);
      }
      
      if (this.escapeHandler) {
        document.removeEventListener('keydown', this.escapeHandler);
      }
      
      // Animation de retour (plus rapide et réactive)
      requestAnimationFrame(() => {
        // Trouver l'image miniature d'origine
        const bookId = zoomedImage.getAttribute('data-book-id');
        const thumbnailImg = document.querySelector(`.book-cover[data-book-id="${bookId}"]`);
        
        if (thumbnailImg) {
          const rect = thumbnailImg.getBoundingClientRect();
          
          // Animer vers la position de la miniature (symétrique à l'ouverture)
          zoomedImage.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          zoomedImage.style.left = `${rect.left}px`;
          zoomedImage.style.top = `${rect.top}px`;
          zoomedImage.style.width = `${rect.width}px`;
          zoomedImage.style.height = `${rect.height}px`;
          
          backdrop.style.opacity = '0';
          
          // Retirer du DOM après l'animation
          setTimeout(() => {
            if (zoomedImage.parentNode) {
              zoomedImage.parentNode.removeChild(zoomedImage);
            }
            if (backdrop.parentNode) {
              backdrop.parentNode.removeChild(backdrop);
            }
            this.currentZoomedImage = null;
            this.currentBackdrop = null;
            this.isAnimating = false;
          }, 300);
        } else {
          // Si on ne trouve pas la miniature, juste disparaître (plus rapide)
          zoomedImage.style.transition = 'opacity 0.15s ease';
          zoomedImage.style.opacity = '0';
          backdrop.style.opacity = '0';
          
          setTimeout(() => {
            if (zoomedImage.parentNode) {
              zoomedImage.parentNode.removeChild(zoomedImage);
            }
            if (backdrop.parentNode) {
              backdrop.parentNode.removeChild(backdrop);
            }
            this.currentZoomedImage = null;
            this.currentBackdrop = null;
            this.isAnimating = false;
          }, 150);
        }
      });
    }
  };

  // ---- Cover Zoom Events ----
  function initCoverZoomEvents() {
    // Pas besoin de gestionnaires globaux, tout est géré par coverZoomManager
  }

  // ---- Home Sections ----
  const homeSections = {
    async fetchRecentDownloads() {
      // Fonctionnalité désactivée - les "recent downloads" ne sont plus utilisées
      console.log('Recent downloads feature is disabled - fetchRecentDownloads skipped');
      return;
      
      // Ancien code conservé pour référence si la fonctionnalité doit être réactivée
      /*
      // Vérifier si nous sommes sur la page d'accueil avant de continuer
      const currentPage = typeof navigation !== 'undefined' ? navigation.currentPage : 'unknown';
      if (currentPage !== 'home') {
        console.log('Not on home page, skipping fetchRecentDownloads');
        return;
      }
      
      try {
        console.log('Fetching recent downloads...');
        
        // Vérifier que les éléments existent avant de les manipuler
        const recentDownloadsLoading = el.recentDownloadsLoading || document.getElementById('recent-downloads-loading');
        if (recentDownloadsLoading) {
          utils.show(recentDownloadsLoading);
        } else {
          console.warn('Recent downloads loading element not found - feature might be disabled');
          return; // Sortir si l'élément n'existe pas
        }
        
        // Récupérer les livres récemment téléchargés (disponibles)
        const status = await utils.j(API.status);
        console.log('Status data:', status);
        const recentBooks = status.available ? Object.values(status.available).slice(0, 12) : [];
        console.log('Recent books:', recentBooks);
        
        if (recentDownloadsLoading) {
          utils.hide(recentDownloadsLoading);
        }
        
        this.renderRecentDownloads(recentBooks);
      } catch (e) {
        console.error('Error fetching recent downloads:', e);
        const recentDownloadsLoading = el.recentDownloadsLoading || document.getElementById('recent-downloads-loading');
        if (recentDownloadsLoading) {
          utils.hide(recentDownloadsLoading);
        }
        const noRecentDownloads = el.noRecentDownloads || document.getElementById('no-recent-downloads');
        if (noRecentDownloads) {
          utils.show(noRecentDownloads);
        }
      }
      */
    },
    
    renderRecentDownloads(books) {
      // Fonctionnalité désactivée - les "recent downloads" ne sont plus utilisées
      console.log('Recent downloads feature is disabled - renderRecentDownloads skipped');
      return;
      
      // Ancien code conservé pour référence si la fonctionnalité doit être réactivée
      /*
      // Vérifier que nous sommes sur la page d'accueil
      const currentPage = typeof navigation !== 'undefined' ? navigation.currentPage : 'unknown';
      if (currentPage !== 'home') {
        console.log('Not on home page, skipping renderRecentDownloads');
        return;
      }
      
      // Vérifier que les éléments existent avant de les manipuler
      const recentDownloadsGrid = el.recentDownloadsGrid || document.getElementById('recent-downloads-grid');
      if (!recentDownloadsGrid) {
        console.warn('Recent downloads grid element not found - feature might be disabled');
        return;
      }
      
      const noRecentDownloads = el.noRecentDownloads || document.getElementById('no-recent-downloads');
      
      recentDownloadsGrid.innerHTML = '';
      if (!books || books.length === 0) {
        if (noRecentDownloads) {
          utils.show(noRecentDownloads);
        }
        return;
      }
      
      if (noRecentDownloads) {
        utils.hide(noRecentDownloads);
      }
      
      const frag = document.createDocumentFragment();
      books.forEach((book) => {
        const card = this.createMiniCard(book);
        frag.appendChild(card);
      });
      recentDownloadsGrid.appendChild(frag);
      */
    },
    
    async fetchPopularBooks(forceRefresh = false) {
      try {
        console.log('Fetching popular books...');
        
        // Vérifier d'abord si nous sommes sur la page appropriée
        const currentPage = typeof navigation !== 'undefined' ? navigation.currentPage : 'unknown';
        if (currentPage !== 'popular' && currentPage !== 'home') {
          console.log('Not on popular or home page, skipping fetchPopularBooks');
          return;
        }
        
        // S'assurer que les éléments existent avec vérification robuste
        const container = document.getElementById('popular-books-container');
        const loading = document.getElementById('popular-books-loading');
        const noBooks = document.getElementById('no-popular-books');
        
        if (!container) {
          console.warn('Popular books container not found - might be expected if not on popular page');
          return;
        }
        
        if (!loading) {
          console.warn('Popular books loading element not found - proceeding without loading indicator');
        }
        
        // Vérifier le cache en premier (sauf si rafraîchissement forcé)
        const cacheKey = 'popular-books-cache';
        const cacheTimestampKey = 'popular-books-cache-timestamp';
        const cacheTTL = 24 * 60 * 60 * 1000; // 24 heures (1 jour) en millisecondes
        
        if (!forceRefresh) {
          try {
            const cachedData = localStorage.getItem(cacheKey);
            const cachedTimestamp = localStorage.getItem(cacheTimestampKey);
            
            if (cachedData && cachedTimestamp) {
              const now = Date.now();
              const cacheAge = now - parseInt(cachedTimestamp, 10);
              
              if (cacheAge < cacheTTL) {
                console.log('Using cached popular books data, age:', Math.round(cacheAge / 1000), 'seconds');
                
                // Utiliser les données du cache
                const popularBooks = JSON.parse(cachedData);
                window.lastPopularResults = popularBooks;
                
                // Afficher directement les livres depuis le cache
                this.renderPopularBooks(popularBooks);
                return;
              } else {
                console.log('Cache expired, age:', Math.round(cacheAge / 1000), 'seconds');
              }
            }
          } catch (cacheError) {
            console.warn('Error reading from cache:', cacheError);
          }
        } else {
          console.log('Force refresh requested, bypassing cache');
        }
        
        // Afficher le chargement uniquement si on va faire une requête réseau
        loading.classList.remove('hidden');
        loading.style.display = 'block';
        if (noBooks) {
          noBooks.classList.add('hidden');
          noBooks.style.display = 'none';
        }
        
        try {
          // Utiliser l'endpoint backend existant pour les livres populaires
          console.log('Fetching from backend API:', `${API.popular}?limit=25`);
          const popularBooks = await utils.j(`${API.popular}?limit=25`);
          console.log('Popular books from backend API:', popularBooks);
          
          // Stocker les résultats pour le changement de vue
          window.lastPopularResults = popularBooks;
          
          // Mettre en cache les résultats avec timestamp
          try {
            localStorage.setItem(cacheKey, JSON.stringify(popularBooks));
            localStorage.setItem(cacheTimestampKey, Date.now().toString());
            console.log('Popular books cached successfully');
          } catch (cacheError) {
            console.warn('Error caching popular books:', cacheError);
          }
          
          // Cacher le chargement de manière explicite
          loading.classList.add('hidden');
          loading.style.display = 'none';
          
          // Afficher les livres
          this.renderPopularBooks(popularBooks);
          
        } catch (apiError) {
          console.error('Error fetching from backend API:', apiError);
          console.log('Error details:', {
            message: apiError.message,
            name: apiError.name,
            stack: apiError.stack
          });
          
          // En cas d'erreur réseau, essayer d'utiliser le cache même s'il est expiré
          try {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
              console.log('Network error, using expired cache as fallback');
              const popularBooks = JSON.parse(cachedData);
              window.lastPopularResults = popularBooks;
              
              // Cacher le chargement
              loading.classList.add('hidden');
              loading.style.display = 'none';
              
              // Afficher les livres depuis le cache avec un message
              this.renderPopularBooks(popularBooks, true); // Passer un flag pour indiquer l'utilisation du cache expiré
              return;
            }
          } catch (fallbackError) {
            console.warn('Error using fallback cache:', fallbackError);
          }
          
          // Afficher un message d'erreur détaillé
          const noBooks = document.getElementById('no-popular-books');
          if (noBooks) {
            noBooks.classList.remove('hidden');
            noBooks.style.display = 'block';
            
            let errorMessage = 'Unable to load popular books. Please try again later.';
            
            if (apiError.message && apiError.message.includes('404')) {
              errorMessage = 'Popular books feature not available. Please check back later.';
            } else if (apiError.message && apiError.message.includes('timeout')) {
              errorMessage = 'Request timeout. Please try again.';
            } else if (apiError.message && apiError.message.includes('Failed to fetch')) {
              errorMessage = 'Network error. Please check your connection and try again.';
            }
            
            noBooks.innerHTML = `
              <div class="text-center">
                <p class="mb-2">${errorMessage}</p>
                <p class="text-xs opacity-60">Error: ${apiError.message}</p>
                <button onclick="homeSections.fetchPopularBooks()" class="mt-2 px-3 py-1 rounded border text-xs" style="border-color: var(--border-muted);">
                  Retry
                </button>
              </div>
            `;
          }
          
          // Cacher le chargement
          loading.classList.add('hidden');
          loading.style.display = 'none';
          
          throw apiError;
        }
      } catch (e) {
        console.error('Error fetching popular books:', e);
        
        // Cacher le chargement de manière explicite
        const loading = document.getElementById('popular-books-loading');
        if (loading) {
          loading.classList.add('hidden');
          loading.style.display = 'none';
        }
        
        // L'erreur a déjà été affichée dans le bloc catch ci-dessus
        // donc nous n'avons pas besoin de l'afficher à nouveau ici
      }
    },
    
    transformAppleBooksData(appleData) {
      try {
        console.log('Transforming Apple Books data:', appleData);
        
        // Vérifier si les données contiennent des livres
        if (!appleData || !appleData.books || !Array.isArray(appleData.books)) {
          console.error('Invalid Apple Books data structure:', appleData);
          return [];
        }
        
        // Transformer chaque livre d'Apple Books au format attendu
        const transformedBooks = appleData.books.map((book, index) => {
          return {
            id: `apple-book-${index}`,
            title: book.name || 'Titre inconnu',
            author: book.artist || 'Auteur inconnu',
            preview: book.artworkUrl || '',
            format: 'Apple Books',
            year: book.releaseDate ? new Date(book.releaseDate).getFullYear().toString() : new Date().getFullYear().toString(),
            language: 'fr',
            publisher: book.publisher || 'Éditeur inconnu',
            size: '', // Apple Books ne fournit pas cette information
            isAppleBook: true,
            // Ajouter des informations supplémentaires pour la recherche
            info: {
              'Genre': book.genres ? book.genres.join(', ') : 'Non spécifié',
              'Prix': book.price ? `${book.price} ${book.currency || 'EUR'}` : 'Non spécifié',
              'Note': book.averageUserRating ? `${book.averageUserRating}/5` : 'Non noté',
              'URL': book.url || ''
            }
          };
        });
        
        console.log('Transformed books:', transformedBooks);
        return transformedBooks;
      } catch (error) {
        console.error('Error transforming Apple Books data:', error);
        return [];
      }
    },
    
    renderPopularBooks(books, fromExpiredCache = false) {
      // Vérifier si nous sommes sur une page appropriée
      const currentPage = typeof navigation !== 'undefined' ? navigation.currentPage : 'unknown';
      if (currentPage !== 'popular' && currentPage !== 'home') {
        console.log('Not on popular or home page, skipping renderPopularBooks');
        return;
      }
      
      const container = document.getElementById('popular-books-container');
      const noBooks = document.getElementById('no-popular-books');
      
      if (!container) {
        console.warn('Popular books container not found - might be expected if not on popular page');
        return;
      }
      
      container.innerHTML = '';
      if (!books || books.length === 0) {
        if (noBooks) {
          noBooks.classList.remove('hidden');
          noBooks.innerHTML = 'No popular books available.';
        }
        return;
      }
      
      if (noBooks) noBooks.classList.add('hidden');
      
      // Afficher un message si les données proviennent du cache expiré
      if (fromExpiredCache) {
        const cacheNotice = document.createElement('div');
        cacheNotice.className = 'mb-4 p-3 rounded text-sm';
        cacheNotice.style.cssText = 'background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); color: rgba(255, 193, 7, 0.9);';
        cacheNotice.innerHTML = `
          <div class="flex items-center justify-between">
            <span>⚠️ Données chargées depuis le cache (connexion indisponible)</span>
            <button onclick="homeSections.fetchPopularBooks(true)" class="px-2 py-1 rounded text-xs" style="background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.4);">
              Rafraîchir
            </button>
          </div>
        `;
        container.appendChild(cacheNotice);
      }
      
      // Ajouter les informations sur le cache
      const cacheInfo = this.getCacheInfo();
      if (cacheInfo.hasCache) {
        const cacheInfoDiv = document.createElement('div');
        cacheInfoDiv.className = 'mb-4 p-2 rounded text-xs';
        cacheInfoDiv.style.cssText = 'background: var(--bg-soft); border: 1px solid var(--border-muted); color: var(--text-muted);';
        cacheInfoDiv.innerHTML = `
          <div class="flex items-center justify-between">
            <span>📦 Cache: ${cacheInfo.sizeFormatted}, ${this.formatDuration(cacheInfo.age)}${cacheInfo.isExpired ? ' (expiré)' : ''}</span>
            <div class="flex gap-1">
              <button onclick="homeSections.clearPopularBooksCache(); homeSections.fetchPopularBooks(true);" class="px-2 py-1 rounded" style="background: var(--bg); border: 1px solid var(--border-muted);" title="Vider le cache">
                🗑️
              </button>
              <button onclick="console.log(homeSections.getCacheInfo());" class="px-2 py-1 rounded" style="background: var(--bg); border: 1px solid var(--border-muted);" title="Afficher les détails du cache dans la console">
                ℹ️
              </button>
            </div>
          </div>
        `;
        container.appendChild(cacheInfoDiv);
      }
      
      // Utiliser le viewManager unifié pour le rendu
      if (typeof viewManager !== 'undefined') {
        viewManager.renderPopularResults(books);
      } else {
        console.error('viewManager not available for rendering popular books');
      }
    },
    
    createMiniCard(book) {
      const isAppleBook = book.isAppleBook || false;
      
      const cover = book.preview ?
        `<img src="${utils.e(book.preview)}" alt="Cover" class="w-full h-32 object-cover rounded cursor-pointer mini-cover" data-book-id="${utils.e(book.id)}" data-src="${utils.e(book.preview)}">` :
        `<div class="w-full h-32 rounded flex items-center justify-center opacity-70 text-xs" style="background: var(--bg-soft)">No Cover</div>`;
      
      const html = `
        <div class="mini-book-card cursor-pointer hover:opacity-80 transition-opacity ${isAppleBook ? 'apple-book-card' : ''}" data-book-id="${utils.e(book.id)}" data-apple-book="${isAppleBook}">
          ${cover}
          <div class="mt-2">
            <h4 class="text-sm font-medium line-clamp-2" title="${utils.e(book.title || 'Untitled')}">${utils.e(book.title) || 'Untitled'}</h4>
            <p class="text-xs opacity-70 line-clamp-1" title="${utils.e(book.author || 'Unknown author')}">${utils.e(book.author) || 'Unknown author'}</p>
          </div>
        </div>
      `;
      
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const card = wrapper.firstElementChild;
      
      // Ajouter le gestionnaire d'événements pour le zoom (uniquement pour les non-Apple Books)
      const coverImg = card.querySelector('.mini-cover');
      if (coverImg && window.innerWidth > 768 && !isAppleBook) {
        coverImg.addEventListener('click', (e) => {
          e.stopPropagation();
          coverZoomManager.showZoomedImage(coverImg);
        });
      }
      
      // Ajouter le gestionnaire pour les détails/recherche
      card.addEventListener('click', () => {
        if (isAppleBook) {
          // Pour les livres Apple Books, lancer une recherche avec le titre
          this.searchForAppleBook(book.title, book.author);
        } else {
          // Pour les livres normaux, afficher les détails
          bookDetails.show(book.id);
        }
      });
      
      return card;
    },
    
    searchForAppleBook(title, author) {
      // Naviguer vers la page de recherche avec le titre comme paramètre
      if (typeof navigation !== 'undefined') {
        // Naviguer vers la page de recherche
        navigation.navigateToPage('search', '/#search').then(() => {
          // Une fois sur la page de recherche, remplir le champ et lancer la recherche
          setTimeout(() => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
              searchInput.value = title.trim();
              
              // Lancer la recherche
              if (typeof search !== 'undefined' && search.run) {
                search.run();
              } else if (typeof navigation !== 'undefined' && navigation.performSearch) {
                navigation.performSearch();
              }
            }
          }, 200); // Délai pour s'assurer que la page est chargée
        });
      } else {
        // Fallback si navigation n'est pas disponible
        console.error('Navigation system not available');
        // Redirection traditionnelle
        window.location.href = `/#search`;
      }
    },
    
    init() {
      console.log('=== HOME SECTIONS INIT CALLED ===');
      
      // Vérifier si nous sommes sur la page d'accueil avant d'initialiser
      const currentPage = typeof navigation !== 'undefined' ? navigation.currentPage : 'unknown';
      if (currentPage !== 'home') {
        console.log('Not on home page, skipping homeSections initialization');
        return;
      }
      
      // La fonctionnalité "recent downloads" est désactivée car non utilisée
      console.log('Recent downloads feature is disabled - not initializing');
      
      // Bind refresh buttons seulement si les éléments existent
      const refreshPopularBtn = el.refreshPopularBtn || document.getElementById('refresh-popular');
      if (refreshPopularBtn) {
        refreshPopularBtn.addEventListener('click', () => this.fetchPopularBooks());
      } else {
        console.warn('Refresh popular button not found');
      }
      
      // Utiliser le viewManager pour initialiser les boutons de vue popular
      if (typeof viewManager !== 'undefined') {
        viewManager.initPopularViewToggle();
      }
      
      // Charger uniquement les données des livres populaires
      const popularBooksContainer = el.popularBooksContainer || document.getElementById('popular-books-container');
      if (popularBooksContainer) {
        this.fetchPopularBooks();
      } else {
        console.log('Popular books container not found, skipping fetchPopularBooks');
      }
    },
    
    
    clearPopularBooksCache() {
      try {
        localStorage.removeItem('popular-books-cache');
        localStorage.removeItem('popular-books-cache-timestamp');
        console.log('Popular books cache cleared successfully');
        return true;
      } catch (error) {
        console.error('Error clearing popular books cache:', error);
        return false;
      }
    },
    
    getCacheInfo() {
      try {
        const cachedData = localStorage.getItem('popular-books-cache');
        const cachedTimestamp = localStorage.getItem('popular-books-cache-timestamp');
        
        if (cachedData && cachedTimestamp) {
          const now = Date.now();
          const cacheAge = now - parseInt(cachedTimestamp, 10);
          const cacheSize = new Blob([cachedData]).size;
          
          return {
            hasCache: true,
            age: Math.round(cacheAge / 1000), // en secondes
            size: cacheSize, // en octets
            sizeFormatted: this.formatBytes(cacheSize),
            isExpired: cacheAge >= (60 * 60 * 1000) // 1 heure
          };
        } else {
          return {
            hasCache: false,
            age: 0,
            size: 0,
            sizeFormatted: '0 B',
            isExpired: false
          };
        }
      } catch (error) {
        console.error('Error getting cache info:', error);
        return {
          hasCache: false,
          age: 0,
          size: 0,
          sizeFormatted: '0 B',
          isExpired: false,
          error: error.message
        };
      }
    },
    
    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatDuration(seconds) {
      if (seconds < 60) {
        return `${seconds}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const remainingMinutes = Math.floor((seconds % 3600) / 60);
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      }
    }
  };

  // ---- Init ----
  compatibility.init(); // Initialize compatibility checks first
  compatibility.initDynamicWillChange(); // Initialize performance manager
  navigation.init(); // Initialize navigation system
  theme.init();
  viewManager.init(); // Initialize view manager
  homeSections.init(); // Initialize home sections
  sidebar.init();
  initEvents();
  initCoverZoomEvents(); // Initialize cover zoom events
  
  // Make navigation globally available
  window.navigation = navigation;
  
  // status.fetch(); // Supprimé pour éviter les requêtes inutiles au chargement
})();
