/**
 * AgentSearch UI Application — Exa-Inspired Client
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  const state = {
    activeTab: 'search',
    mode: 'web', // 'web', 'auto', 'news', 'code', 'reference', 'academic', 'community'
    selectedEngine: 'all',
    count: 5,
    deepExtract: false,
    viewMode: 'cards', // 'cards' or 'json'
    lastQuery: '',
    lastResults: null,
    drawerData: null,
  };

  // DOM Elements - Navigation & Header
  const tabButtons = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');
  const brandHomeBtn = document.getElementById('brand-home-btn');
  const systemStatusIndicator = document.getElementById('system-status-indicator');
  const systemStatusLabel = document.getElementById('system-status-label');

  // DOM Elements - Search
  const searchInput = document.getElementById('search-input');
  const searchBoxWrapper = document.getElementById('search-box-wrapper');
  const searchSubmitBtn = document.getElementById('search-submit-btn');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const modePills = document.querySelectorAll('.mode-pill');
  const countSegments = document.querySelectorAll('#count-selector .segment-btn');
  const engineSelector = document.getElementById('engine-selector');
  const extractToggle = document.getElementById('extract-toggle');
  const switchViewCards = document.getElementById('switch-view-cards');
  const switchViewJson = document.getElementById('switch-view-json');
  const quickPrompts = document.querySelectorAll('.prompt-chip');
  const quickPromptsContainer = document.getElementById('quick-prompts-container');

  // DOM Elements - Results
  const resultsStatsBar = document.getElementById('results-stats-bar');
  const statsCountLabel = document.getElementById('stats-count-label');
  const statsLatencyLabel = document.getElementById('stats-latency-label');
  const statsEnginesLabel = document.getElementById('stats-engines-label');
  const copyJsonBtn = document.getElementById('copy-json-btn');
  const resultsCardsContainer = document.getElementById('results-cards-container');
  const resultsJsonContainer = document.getElementById('results-json-container');
  const jsonCodeBlock = document.getElementById('json-code-block');
  const searchSkeleton = document.getElementById('search-skeleton');
  const errorBanner = document.getElementById('error-banner');
  const errorTitle = document.getElementById('error-title');
  const errorMessage = document.getElementById('error-message');

  // DOM Elements - Reader View
  const readerUrlInput = document.getElementById('reader-url-input');
  const readerExtractBtn = document.getElementById('reader-extract-btn');
  const browserRenderToggle = document.getElementById('browser-render-toggle');
  const readerResultWrapper = document.getElementById('reader-result-wrapper');
  const readerStrategyBadge = document.getElementById('reader-strategy-badge');
  const readerCharsVal = document.getElementById('reader-chars-val');
  const readerChainVal = document.getElementById('reader-chain-val');
  const readerExtractedText = document.getElementById('reader-extracted-text');
  const readerCopyContentBtn = document.getElementById('reader-copy-content-btn');

  // DOM Elements - Telemetry View
  const refreshTelemetryBtn = document.getElementById('refresh-telemetry-btn');
  const searxngStatusBadge = document.getElementById('searxng-status-badge');
  const searxngUrlVal = document.getElementById('searxng-url-val');
  const searxngReadyVal = document.getElementById('searxng-ready-val');

  // DOM Elements - Drawer
  const readerDrawer = document.getElementById('reader-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerTitle = document.getElementById('drawer-title');
  const drawerEngineBadge = document.getElementById('drawer-engine-badge');
  const drawerUrlLink = document.getElementById('drawer-url-link');
  const drawerUrlText = document.getElementById('drawer-url-text');
  const drawerScoreTag = document.getElementById('drawer-score-tag');
  const drawerStrategyTag = document.getElementById('drawer-strategy-tag');
  const drawerContentBody = document.getElementById('drawer-content-body');
  const drawerLoading = document.getElementById('drawer-loading');
  const drawerCopyBtn = document.getElementById('drawer-copy-btn');

  // Toast
  const toast = document.getElementById('toast');

  // --- Initial Cluster Health Check ---
  async function checkHealth() {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        const dot = systemStatusIndicator.querySelector('.status-dot');
        const isHealthy = data.searxng_available || data.status === 'healthy' || data.status === 'ok';
        if (isHealthy) {
          dot.className = 'status-dot pulse';
          systemStatusLabel.textContent = 'SearXNG Online';
          if (searxngStatusBadge) {
            searxngStatusBadge.className = 'badge-success';
            searxngStatusBadge.textContent = 'Connected & Active';
            searxngReadyVal.textContent = 'Active (Bing, Wikipedia, GitHub, arXiv, News)';
          }
        } else {
          // Degraded
          dot.className = 'status-dot degraded';
          systemStatusLabel.textContent = 'Direct Providers Ready';
          if (searxngStatusBadge) {
            searxngStatusBadge.className = 'badge-neutral';
            searxngStatusBadge.textContent = 'Connecting...';
            searxngReadyVal.textContent = 'Direct Providers Active';
          }
        }
      }
    } catch {
      systemStatusLabel.textContent = 'Offline';
    }
  }

  checkHealth();

  // --- Toast Notification Helper ---
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- Tab Navigation ---
  function switchTab(tabName) {
    state.activeTab = tabName;
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    viewPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${tabName}`);
    });

    if (tabName === 'telemetry') {
      checkHealth();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  if (brandHomeBtn) {
    brandHomeBtn.addEventListener('click', () => {
      switchTab('search');
      searchInput.focus();
    });
  }

  // --- Mode Pills ---
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.mode = pill.dataset.mode;
      if (searchInput.value.trim()) {
        executeSearch();
      }
    });
  });

  // --- Count Selector ---
  countSegments.forEach(seg => {
    seg.addEventListener('click', () => {
      countSegments.forEach(s => s.classList.remove('active'));
      seg.classList.add('active');
      state.count = parseInt(seg.dataset.count, 10);
      if (searchInput.value.trim()) {
        executeSearch();
      }
    });
  });

  // --- Engine Selector ---
  if (engineSelector) {
    engineSelector.addEventListener('change', (e) => {
      state.selectedEngine = e.target.value;
      if (searchInput.value.trim()) {
        executeSearch();
      }
    });
  }

  // --- Extract Toggle ---
  extractToggle.addEventListener('change', (e) => {
    state.deepExtract = e.target.checked;
    if (searchInput.value.trim()) {
      executeSearch();
    }
  });

  // --- View Switcher (Cards vs JSON) ---
  switchViewCards.addEventListener('click', () => {
    state.viewMode = 'cards';
    switchViewCards.classList.add('active');
    switchViewJson.classList.remove('active');
    resultsCardsContainer.classList.remove('hidden');
    resultsJsonContainer.classList.add('hidden');
  });

  switchViewJson.addEventListener('click', () => {
    state.viewMode = 'json';
    switchViewJson.classList.add('active');
    switchViewCards.classList.remove('active');
    resultsCardsContainer.classList.add('hidden');
    resultsJsonContainer.classList.remove('hidden');
  });

  // --- Search Input Actions ---
  searchInput.addEventListener('input', () => {
    clearSearchBtn.classList.toggle('hidden', !searchInput.value.length);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  });

  searchSubmitBtn.addEventListener('click', executeSearch);

  // Quick Prompts
  quickPrompts.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      searchInput.value = q;
      clearSearchBtn.classList.remove('hidden');
      executeSearch();
    });
  });

  // --- Search Execution ---
  async function executeSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    state.lastQuery = query;
    if (quickPromptsContainer) quickPromptsContainer.classList.add('hidden');
    errorBanner.classList.add('hidden');
    resultsCardsContainer.innerHTML = '';
    resultsJsonContainer.classList.add('hidden');
    resultsStatsBar.classList.add('hidden');
    searchSkeleton.classList.remove('hidden');

    const startTime = performance.now();

    // Determine target API endpoint based on selected mode & extract toggle
    let endpoint = '';
    const params = new URLSearchParams({
      q: query,
      count: state.count.toString(),
    });

    if (state.deepExtract) {
      if (state.selectedEngine && state.selectedEngine !== 'all') {
        params.set('engines', state.selectedEngine);
      }
      endpoint = `/search/extract?${params.toString()}`;
    } else if (state.mode === 'web') {
      if (state.selectedEngine && state.selectedEngine !== 'all') {
        params.set('engines', state.selectedEngine);
      }
      endpoint = `/search?${params.toString()}`;
    } else if (state.mode === 'news') {
      endpoint = `/news?${params.toString()}`;
    } else if (state.mode === 'code') {
      params.set('mode', 'code');
      endpoint = `/search/strategy?${params.toString()}`;
    } else if (state.mode === 'reference') {
      params.set('mode', 'reference');
      endpoint = `/search/strategy?${params.toString()}`;
    } else if (state.mode === 'academic') {
      params.set('mode', 'academic');
      endpoint = `/search/strategy?${params.toString()}`;
    } else if (state.mode === 'community') {
      params.set('mode', 'community');
      endpoint = `/search/strategy?${params.toString()}`;
    } else {
      // Auto / Deep mode
      if (state.selectedEngine && state.selectedEngine !== 'all') {
        params.set('engines', state.selectedEngine);
      }
      endpoint = `/search/deep?${params.toString()}`;
    }

    try {
      let res = await fetch(endpoint);
      
      // Graceful fallback: If SearXNG is offline for broad search, try direct reference mode
      if (!res.ok && state.mode === 'auto') {
        const fallbackParams = new URLSearchParams({
          q: query,
          mode: 'reference',
          count: state.count.toString(),
        });
        res = await fetch(`/search/strategy?${fallbackParams.toString()}`);
      }

      const elapsed = Math.round(performance.now() - startTime);
      searchSkeleton.classList.add('hidden');

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: 'Unknown error occurred' }));
        showError('Search Request Failed', errJson.detail || 'Could not complete search.');
        return;
      }

      const data = await res.json();
      state.lastResults = data;
      renderResults(data, elapsed);

    } catch (err) {
      searchSkeleton.classList.add('hidden');
      showError('Connection Error', `Failed to reach AgentSearch API: ${err.message}`);
    }
  }

  function showError(title, msg) {
    errorTitle.textContent = title;
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
  }

  // --- Render Results ---
  function renderResults(data, elapsedMs) {
    const results = data.results || [];
    const meta = data.meta || {};

    // Stats bar
    statsCountLabel.textContent = `${results.length} results`;
    statsLatencyLabel.textContent = `${meta.response_time_ms ? Math.round(meta.response_time_ms) : elapsedMs}ms`;
    
    const enginesUsed = meta.engines_used && meta.engines_used.length > 0
      ? `SearXNG: ${meta.engines_used.map(e => e.toUpperCase()).join(', ')}`
      : (state.selectedEngine && state.selectedEngine !== 'all' ? `SearXNG: ${state.selectedEngine.toUpperCase()}` : 'SearXNG Active');
    statsEnginesLabel.textContent = enginesUsed;
    resultsStatsBar.classList.remove('hidden');

    // JSON View render
    jsonCodeBlock.textContent = JSON.stringify(data, null, 2);

    if (state.viewMode === 'json') {
      resultsJsonContainer.classList.remove('hidden');
      resultsCardsContainer.classList.add('hidden');
    } else {
      resultsCardsContainer.classList.remove('hidden');
      resultsJsonContainer.classList.add('hidden');
    }

    if (results.length === 0) {
      resultsCardsContainer.innerHTML = `
        <div class="result-card" style="text-align: center; padding: 3rem 1rem;">
          <h3 style="color: #9ca3af; margin-bottom: 0.5rem;">No results found for "${escapeHtml(state.lastQuery)}"</h3>
          <p style="color: #6b7280; font-size: 0.9rem;">Try switching search modes (e.g. Reference, Code, Academic) or altering query keywords.</p>
        </div>
      `;
      return;
    }

    // Render Cards
    results.forEach((item, idx) => {
      const card = document.createElement('article');
      card.className = 'result-card';

      let domain = 'unknown';
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '');
      } catch {
        domain = item.url;
      }

      let engineName = 'SearXNG';
      if (item.engines && item.engines.length && item.engines[0]) {
        engineName = item.engines[0];
      } else if (item.engine) {
        engineName = item.engine;
      } else if (state.selectedEngine && state.selectedEngine !== 'all') {
        engineName = state.selectedEngine;
      }

      const score = item.score ? item.score.toFixed(2) : (1.0 - idx * 0.05).toFixed(2);
      const isHighTrust = score > 0.6;

      const snippet = item.snippet || (item.content ? item.content.slice(0, 300) + '...' : 'No preview available.');

      card.innerHTML = `
        <div class="card-top-meta">
          <div class="meta-source-info">
            <span class="engine-pill searxng-pill" title="Aggregated via SearXNG">🔍 ${escapeHtml(engineName.toUpperCase())}</span>
            <span class="domain-pill">${escapeHtml(domain)}</span>
          </div>
          <span class="trust-badge ${isHighTrust ? 'trust-high' : 'trust-med'}">
            Rank #${item.position || idx + 1}
          </span>
        </div>

        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="card-title-link">
          <span>${escapeHtml(item.title || item.url)}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>

        <p class="card-snippet">${escapeHtml(snippet)}</p>

        <div class="card-footer">
          <div class="card-actions-left">
            <button class="btn-read-preview" data-idx="${idx}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              ${item.content ? 'View Full Content' : 'Extract & Read'}
            </button>
            <button class="btn-copy-url" data-url="${escapeHtml(item.url)}" title="Copy Link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <span class="card-score">pos #${item.position || idx + 1}</span>
        </div>
      `;

      // Event listener for drawer preview
      const readBtn = card.querySelector('.btn-read-preview');
      readBtn.addEventListener('click', () => openReaderDrawer(item));

      // Event listener for copying URL
      const copyUrlBtn = card.querySelector('.btn-copy-url');
      copyUrlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.url);
        showToast('Link copied to clipboard!');
      });

      resultsCardsContainer.appendChild(card);
    });
  }

  // --- Copy JSON Button ---
  copyJsonBtn.addEventListener('click', () => {
    if (state.lastResults) {
      navigator.clipboard.writeText(JSON.stringify(state.lastResults, null, 2));
      showToast('API JSON copied to clipboard!');
    }
  });

  // --- Exa-Style Reader Drawer ---
  async function openReaderDrawer(item) {
    state.drawerData = item;
    drawerTitle.textContent = item.title || item.url;
    drawerEngineBadge.textContent = (item.engines && item.engines[0]) ? item.engines[0].toUpperCase() : 'SEARCH RESULT';
    drawerUrlLink.href = item.url;
    drawerUrlText.textContent = item.url;
    drawerScoreTag.textContent = `Score: ${(item.score || 0.95).toFixed(2)}`;
    drawerStrategyTag.textContent = item.content ? 'Inline Content' : 'Kill Chain Extraction';

    readerDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
    readerDrawer.setAttribute('aria-hidden', 'false');

    if (item.content) {
      // Content was already extracted via /search/extract
      drawerLoading.classList.add('hidden');
      drawerContentBody.textContent = item.content;
    } else {
      // Run on-demand kill chain extraction via /read
      drawerContentBody.textContent = '';
      drawerLoading.classList.remove('hidden');

      try {
        const res = await fetch(`/read?url=${encodeURIComponent(item.url)}`);
        drawerLoading.classList.add('hidden');
        if (res.ok) {
          const readData = await res.json();
          drawerStrategyTag.textContent = `Strategy: ${readData.strategy || 'direct'}`;
          drawerContentBody.textContent = readData.content || 'No readable text content extracted.';
          state.drawerData.content = readData.content;
        } else {
          drawerContentBody.textContent = `Unable to extract content (HTTP ${res.status}). You can open the link directly in your browser.`;
        }
      } catch (err) {
        drawerLoading.classList.add('hidden');
        drawerContentBody.textContent = `Extraction error: ${err.message}`;
      }
    }
  }

  function closeReaderDrawer() {
    readerDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
    readerDrawer.setAttribute('aria-hidden', 'true');
  }

  drawerCloseBtn.addEventListener('click', closeReaderDrawer);
  drawerOverlay.addEventListener('click', closeReaderDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && readerDrawer.classList.contains('open')) {
      closeReaderDrawer();
    }
  });

  drawerCopyBtn.addEventListener('click', () => {
    const text = drawerContentBody.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      showToast('Extracted text copied to clipboard!');
    }
  });

  // --- Dedicated Reader Tab Execution ---
  readerExtractBtn.addEventListener('click', async () => {
    const url = readerUrlInput.value.trim();
    if (!url) return;

    readerResultWrapper.classList.add('hidden');
    readerExtractBtn.disabled = true;
    readerExtractBtn.innerHTML = `Extracting...`;

    const useBrowser = browserRenderToggle.checked;
    const endpoint = useBrowser
      ? `/providers/browser/fetch?url=${encodeURIComponent(url)}`
      : `/read?url=${encodeURIComponent(url)}`;

    try {
      const res = await fetch(endpoint);
      readerExtractBtn.disabled = false;
      readerExtractBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Extract Content
      `;

      if (!res.ok) {
        showToast(`Extraction failed (HTTP ${res.status})`);
        return;
      }

      const data = await res.json();
      readerStrategyBadge.textContent = data.strategy || (useBrowser ? 'Headless Browser' : 'Direct');
      readerCharsVal.textContent = (data.chars || (data.content ? data.content.length : 0)).toLocaleString();
      readerChainVal.textContent = data.strategies_tried ? data.strategies_tried.join(' → ') : 'direct';
      readerExtractedText.textContent = data.content || (data.text || 'No extracted content.');

      readerResultWrapper.classList.remove('hidden');
      showToast('Document extracted successfully!');
    } catch (err) {
      readerExtractBtn.disabled = false;
      readerExtractBtn.innerHTML = `Extract Content`;
      showToast(`Extraction error: ${err.message}`);
    }
  });

  readerCopyContentBtn.addEventListener('click', () => {
    const text = readerExtractedText.textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      showToast('Extracted markdown copied to clipboard!');
    }
  });

  // --- Telemetry Refresh Button ---
  refreshTelemetryBtn.addEventListener('click', async () => {
    refreshTelemetryBtn.textContent = 'Refreshing...';
    await checkHealth();
    setTimeout(() => {
      refreshTelemetryBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        Refresh Telemetry
      `;
      showToast('Telemetry updated');
    }, 600);
  });

  // HTML escape utility
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
