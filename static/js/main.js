// Modern UI script: search, cards, details, downloads, status, theme
// Reuses existing API endpoints. Keeps logic minimal and accessible.

(function () {
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
    advToggle: document.getElementById('toggle-advanced'),
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
    sidebarToggle: document.getElementById('sidebar-toggle'),
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
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      
      try {
        return await res.json();
      } catch (e) {
        // Fallback pour les réponses non-JSON
        const text = await res.text();
        if (text.trim() === '') {
          return null; // Pour les réponses 204
        }
        // Tenter de parser manuellement
        try {
          return JSON.parse(text);
        } catch {
          return { text }; // Retourner le texte dans un objet
        }
      }
    },
    // Build query string from basic + advanced filters
    buildQuery() {
      const q = [];
      const basic = el.searchInput?.value?.trim();
      if (basic) q.push(`query=${encodeURIComponent(basic)}`);

      if (!el.filtersForm || el.filtersForm.classList.contains('hidden')) {
        return q.join('&');
      }

      FILTERS.forEach((name) => {
        if (name === 'format') {
          const checked = Array.from(document.querySelectorAll('[id^="format-"]:checked'));
          checked.forEach((cb) => q.push(`format=${encodeURIComponent(cb.value)}`));
        } else {
          const input = document.querySelectorAll(`[id^="${name}-input"]`);
          input.forEach((node) => {
            const val = node.value?.trim();
            if (val) q.push(`${name}=${encodeURIComponent(val)}`);
          });
        }
      });

      return q.join('&');
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
    const year = book.year || book.releaseDate || '-';
    const language = book.language || '-';
    const format = book.format || '-';
    const size = book.size || '';

    const html = `
      <article class="rounded border p-3 flex flex-col gap-3 ${isAppleBook ? 'apple-book-card' : ''}" style="border-color: var(--border-muted); background: var(--bg-soft)">
        ${cover}
        <div class="flex-1 space-y-1">
          <h3 class="font-semibold leading-tight">${utils.e(book.title) || 'Untitled'}</h3>
          <p class="text-sm opacity-80">${utils.e(book.author) || 'Unknown author'}</p>
          <div class="text-xs opacity-70 flex flex-wrap gap-2">
            <span>${utils.e(year)}</span>
            <span>•</span>
            <span>${utils.e(language)}</span>
            <span>•</span>
            <span>${utils.e(format)}</span>
            ${size ? `<span>•</span><span>${utils.e(size)}</span>` : ''}
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
        homeSections.searchForAppleBook(book.title);
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
      if (!year) return '-';
      
      // Si l'année contient plusieurs années concaténées, prendre la première
      const yearMatch = year.match(/(\d{4})/);
      if (yearMatch) {
        return yearMatch[1];
      }
      
      return year;
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
    yearCell.textContent = utils.e(book.year) || '-';
    
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
    
    init() {
      // Récupérer la préférence sauvegardée
      const savedView = localStorage.getItem(VIEW_PREFERENCE_KEY) || VIEW_MODES.GRID;
      this.currentView = savedView;
      this.updateViewButtons();
      
      // Bind events
      el.viewGridBtn?.addEventListener('click', () => this.setView(VIEW_MODES.GRID));
      el.viewListBtn?.addEventListener('click', () => this.setView(VIEW_MODES.LIST));
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
      document.querySelectorAll('.view-toggle').forEach(btn => {
        if (btn.getAttribute('data-view') === this.currentView) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // Mettre à jour les classes du conteneur
      if (el.resultsContainer) {
        el.resultsContainer.classList.remove('grid-view', 'list-view');
        el.resultsContainer.classList.add(`${this.currentView}-view`);
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
      // Utiliser la fonction renderCards existante mais avec resultsContainer
      el.resultsContainer.innerHTML = '';
      if (!books || books.length === 0) {
        utils.show(el.noResults);
        return;
      }
      utils.hide(el.noResults);
      const frag = document.createDocumentFragment();
      books.forEach((b) => frag.appendChild(renderCard(b)));
      el.resultsContainer.appendChild(frag);
    },
    
    renderList(books) {
      el.resultsContainer.innerHTML = '';
      if (!books || books.length === 0) {
        utils.show(el.noResults);
        return;
      }
      utils.hide(el.noResults);
      
      // Créer la structure du tableau
      const table = document.createElement('div');
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
      
      el.resultsContainer.appendChild(table);
      const tbody = document.getElementById('results-tbody');
      
      // Ajouter chaque livre comme une ligne séparée
      books.forEach((book) => {
        const row = renderListItem(book);
        tbody.appendChild(row);
      });
    }
  };

  // ---- Search ----
  const search = {
    async run() {
      const qs = utils.buildQuery();
      if (!qs) {
        window.lastSearchResults = [];
        viewManager.renderResults([]);
        return;
      }
      utils.show(el.searchLoading);
      try {
        const data = await utils.j(`${API.search}?${qs}`);
        window.lastSearchResults = data; // Stocker pour le changement de vue
        viewManager.renderResults(data);
      } catch (e) {
        window.lastSearchResults = [];
        viewManager.renderResults([]);
      } finally {
        utils.hide(el.searchLoading);
      }
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
                <p><strong>Year:</strong> ${utils.e(book.year) || '-'}</p>
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
      el.sidebarToggle?.addEventListener('click', () => this.toggle());
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
      
      // Initial status fetch without loader (background) - only if sidebar will be used
      // Don't start automatic fetching to reduce unnecessary requests
      // this.fetchStatus(false);
      
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
            const fetchPromise = utils.j(API.status);
            const minDelayPromise = new Promise(resolve => setTimeout(resolve, 300));
            
            [data] = await Promise.all([fetchPromise, minDelayPromise]);
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
            optimisticItem.remove();
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
    el.searchBtn?.addEventListener('click', () => search.run());
    el.searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') search.run(); });
    document.getElementById('adv-search-button')?.addEventListener('click', () => search.run());

    if (el.advToggle && el.filtersForm) {
      el.advToggle.addEventListener('click', (e) => {
        e.preventDefault();
        el.filtersForm.classList.toggle('hidden');
      });
    }

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
      try {
        console.log('Fetching recent downloads...');
        utils.show(el.recentDownloadsLoading);
        
        // Récupérer les livres récemment téléchargés (disponibles)
        const status = await utils.j(API.status);
        console.log('Status data:', status);
        const recentBooks = status.available ? Object.values(status.available).slice(0, 12) : [];
        console.log('Recent books:', recentBooks);
        
        utils.hide(el.recentDownloadsLoading);
        this.renderRecentDownloads(recentBooks);
      } catch (e) {
        console.error('Error fetching recent downloads:', e);
        utils.hide(el.recentDownloadsLoading);
        utils.show(el.noRecentDownloads);
      }
    },
    
    renderRecentDownloads(books) {
      el.recentDownloadsGrid.innerHTML = '';
      if (!books || books.length === 0) {
        utils.show(el.noRecentDownloads);
        return;
      }
      utils.hide(el.noRecentDownloads);
      
      const frag = document.createDocumentFragment();
      books.forEach((book) => {
        const card = this.createMiniCard(book);
        frag.appendChild(card);
      });
      el.recentDownloadsGrid.appendChild(frag);
    },
    
    async fetchPopularBooks() {
      try {
        console.log('Fetching popular books...');
        utils.show(el.popularBooksLoading);
        
        // Utiliser le nouvel endpoint API pour les livres populaires
        const popularBooks = await utils.j(`${API.popular}?limit=12`);
        console.log('Popular books from API:', popularBooks);
        
        // Stocker les résultats pour le changement de vue
        window.lastPopularResults = popularBooks;
        
        utils.hide(el.popularBooksLoading);
        this.renderPopularBooks(popularBooks);
      } catch (e) {
        console.error('Error fetching popular books:', e);
        utils.hide(el.popularBooksLoading);
        utils.show(el.noPopularBooks);
        
        // Afficher un message plus spécifique en cas d'erreur
        if (el.noPopularBooks) {
          if (e.message && e.message.includes('404')) {
            el.noPopularBooks.innerHTML = 'Popular books feature not available. Please check back later.';
          } else if (e.message && e.message.includes('timeout')) {
            el.noPopularBooks.innerHTML = 'Request timeout. Please try again.';
          } else {
            el.noPopularBooks.innerHTML = 'Unable to load popular books. Please try again later.';
          }
        }
      }
    },
    
    renderPopularBooks(books) {
      el.popularBooksContainer.innerHTML = '';
      if (!books || books.length === 0) {
        utils.show(el.noPopularBooks);
        return;
      }
      utils.hide(el.noPopularBooks);
      
      // Utiliser les mêmes fonctions de rendu que la recherche
      this.renderPopularResults(books);
    },
    
    renderPopularResults(books) {
      // Utiliser la vue actuelle (grille par défaut)
      const currentView = this.getPopularViewMode();
      
      if (currentView === VIEW_MODES.GRID) {
        this.renderPopularGrid(books);
      } else {
        this.renderPopularList(books);
      }
    },
    
    getPopularViewMode() {
      // Récupérer la vue actuelle depuis les boutons
      const activeBtn = el.popularViewToggleContainer?.querySelector('.view-toggle.active');
      return activeBtn?.getAttribute('data-view') || VIEW_MODES.GRID;
    },
    
    renderPopularGrid(books) {
      el.popularBooksContainer.innerHTML = '';
      if (!books || books.length === 0) {
        utils.show(el.noPopularBooks);
        return;
      }
      utils.hide(el.noPopularBooks);
      
      // Configurer le conteneur pour la vue grille
      el.popularBooksContainer.classList.remove('list-view');
      el.popularBooksContainer.classList.add('grid-view');
      
      const frag = document.createDocumentFragment();
      books.forEach((book) => {
        const card = renderCard(book);
        frag.appendChild(card);
      });
      el.popularBooksContainer.appendChild(frag);
    },
    
    renderPopularList(books) {
      el.popularBooksContainer.innerHTML = '';
      if (!books || books.length === 0) {
        utils.show(el.noPopularBooks);
        return;
      }
      utils.hide(el.noPopularBooks);
      
      // Configurer le conteneur pour la vue liste
      el.popularBooksContainer.classList.remove('grid-view');
      el.popularBooksContainer.classList.add('list-view');
      
      // Créer la structure du tableau
      const table = document.createElement('div');
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
          <tbody id="popular-results-tbody">
            <!-- Les lignes seront injectées ici -->
          </tbody>
        </table>
      `;
      
      el.popularBooksContainer.appendChild(table);
      const tbody = document.getElementById('popular-results-tbody');
      
      // Ajouter chaque livre comme une ligne séparée
      books.forEach((book) => {
        const row = this.createPopularListItem(book);
        tbody.appendChild(row);
      });
    },
    
    createPopularListItem(book) {
      const isAppleBook = book.isAppleBook || false;
      
      // Fonctions utilitaires pour nettoyer les données
      const cleanAuthor = (author) => {
        if (!author) return 'Unknown author';
        return author.length > 30 ? author.substring(0, 30) + '...' : author;
      };
      
      const cleanYear = (year) => {
        if (!year) return '-';
        const yearMatch = year.match(/(\d{4})/);
        return yearMatch ? yearMatch[1] : year;
      };
      
      // Cellule Preview
      const previewCell = document.createElement('td');
      previewCell.className = 'p-3';
      
      if (book.preview) {
        const coverImg = document.createElement('img');
        coverImg.src = utils.e(book.preview);
        coverImg.alt = 'Cover';
        coverImg.className = 'w-12 h-16 object-cover rounded';
        previewCell.appendChild(coverImg);
      } else {
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
      
      // Cellule Author
      const authorCell = document.createElement('td');
      authorCell.className = 'p-3';
      authorCell.textContent = cleanAuthor(book.author);
      
      // Cellule Publisher
      const publisherCell = document.createElement('td');
      publisherCell.className = 'p-3';
      publisherCell.textContent = utils.e(book.publisher) || '-';
      
      // Cellule Year
      const yearCell = document.createElement('td');
      yearCell.className = 'p-3';
      yearCell.textContent = cleanYear(book.year || book.releaseDate);
      
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
      
      // Cellule Actions
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
          this.searchForAppleBook(book.title);
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
      // Remplir le champ de recherche avec uniquement le titre
      if (el.searchInput) {
        el.searchInput.value = title.trim();
        
        // Défiler vers la section de recherche
        const searchSection = document.getElementById('search-section');
        if (searchSection) {
          searchSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Lancer la recherche
        search.run();
      }
    },
    
    init() {
      // Bind refresh buttons
      el.refreshRecentBtn?.addEventListener('click', () => this.fetchRecentDownloads());
      el.refreshPopularBtn?.addEventListener('click', () => this.fetchPopularBooks());
      
      // Bind view toggle buttons for popular books
      el.popularViewGridBtn?.addEventListener('click', () => this.setPopularView(VIEW_MODES.GRID));
      el.popularViewListBtn?.addEventListener('click', () => this.setPopularView(VIEW_MODES.LIST));
      
      // Charger les données initiales
      this.fetchRecentDownloads();
      this.fetchPopularBooks();
    },
    
    setPopularView(viewMode) {
      // Mettre à jour les boutons
      document.querySelectorAll('#popular-view-toggle-container .view-toggle').forEach(btn => {
        if (btn.getAttribute('data-view') === viewMode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      
      // Re-render les résultats avec la nouvelle vue
      const currentData = window.lastPopularResults || [];
      this.renderPopularResults(currentData);
    }
  };

  // ---- Init ----
  compatibility.init(); // Initialize compatibility checks first
  compatibility.initDynamicWillChange(); // Initialize performance manager
  theme.init();
  viewManager.init(); // Initialize view manager
  homeSections.init(); // Initialize home sections
  sidebar.init();
  initEvents();
  initCoverZoomEvents(); // Initialize cover zoom events
  // status.fetch(); // Supprimé pour éviter les requêtes inutiles au chargement
})();
