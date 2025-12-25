// MarketMind Pro - Main Application Controller

class MarketMindApp {
    constructor() {
        this.state = window.AppState;
        this.utils = window.Utils;
        this.init();
    }

    // Update the init method in app.js to use real data

    async init() {
        try {
            this.showLoadingScreen();

            // Initialize real market data API
            this.marketAPI = new MarketDataAPI();
            await this.marketAPI.init();

            // Initialize modules with real data
            await this.initModules();

            this.setupEventListeners();
            this.startRealTimeUpdates();

            setTimeout(() => {
                this.hideLoadingScreen();
                this.showWelcomeNotification();
            }, 2000);

        } catch (error) {
            console.error('App initialization error:', error);
            this.utils.createNotification('error', 'Initialization Error',
                'Failed to initialize real market data. Using simulated data.');
            this.hideLoadingScreen();
        }
    }

    async initModules() {
        // Initialize dashboard with real data
        if (typeof Dashboard !== 'undefined') {
            this.dashboard = new Dashboard(this.state);
        }

        // Initialize real chart engine
        if (typeof RealChartEngine !== 'undefined') {
            try {
                this.chart = new RealChartEngine(this.state);
                await this.chart.init();
            } catch (error) {
                console.error('Real chart failed, falling back:', error);
                // Fallback to canvas chart
                if (typeof ChartEngine !== 'undefined') {
                    this.chart = new ChartEngine(this.state);
                    await this.chart.init();
                }
            }
        }
        // Initialize strategy builder
        if (typeof StrategyBuilder !== 'undefined') {
            this.strategy = new StrategyBuilder(this.state);
        }

        // Initialize journal
        if (typeof TradingJournal !== 'undefined') {
            this.journal = new TradingJournal(this.state);
            await this.journal.init();
        }

        // Initialize risk calculator
        if (typeof RiskManager !== 'undefined') {
            this.risk = new RiskManager(this.state);
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.state.toggleTheme();
                this.updateThemeIcon();
            });
        }

        // Live clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

        // Show shortcuts modal
        const showShortcuts = document.getElementById('showShortcuts');
        if (showShortcuts) {
            showShortcuts.addEventListener('click', () => this.showModal('shortcutsModal'));
        }

        // Close modals on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });

        // Handle window resize
        window.addEventListener('resize', this.utils.debounce(() => {
            if (this.chart) this.chart.handleResize();
        }, 250));

        // PWA: Detect install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Online/offline detection
        window.addEventListener('online', () => {
            this.utils.createNotification('success', 'Back Online', 'Connection restored');
        });

        window.addEventListener('offline', () => {
            this.utils.createNotification('warning', 'Offline Mode', 'Working with cached data');
        });

        // State change subscriptions
        this.state.subscribe('theme', this.onThemeChange.bind(this));
        this.state.subscribe('ui.activeModal', this.onModalChange.bind(this));
        this.state.subscribe('ui.loading', this.onLoadingChange.bind(this));
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';

            // Simulate loading progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress > 100) {
                    progress = 100;
                    clearInterval(interval);
                }

                const progressFill = document.getElementById('progressFill');
                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }
            }, 100);
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                loadingScreen.style.opacity = '1';
            }, 300);
        }
    }

    showWelcomeNotification() {
        this.utils.createNotification(
            'success',
            'Welcome to MarketMind Pro™',
            'Your professional trading dashboard is ready. Press H for keyboard shortcuts.',
            10000
        );
    }

    updateClock() {
        const clock = document.getElementById('liveClock');
        if (clock) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            clock.textContent = timeString;
        }
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            const theme = this.state.get('theme');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    onThemeChange(newTheme) {
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeIcon();
    }

    onModalChange(modalId) {
        // Hide all modals
        this.hideAllModals();

        // Show active modal
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');

                // Focus first input if present
                const firstInput = modal.querySelector('input, select, textarea');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            }
        }
    }

    onLoadingChange(loading) {
        // You could show/hide a global loading indicator here
        if (loading) {
            // Show loading
        } else {
            // Hide loading
        }
    }

    hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
        this.state.update('ui.activeModal', null);
    }

    showModal(modalId) {
        this.state.update('ui.activeModal', modalId);
    }

    handleKeyboardShortcuts(e) {
        // Don't trigger if typing in an input field
        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.tagName === 'SELECT') {
            return;
        }

        const key = e.key.toLowerCase();

        // Prevent default for our shortcuts
        const shortcuts = ['1', '2', '3', '4', 'c', 'j', 's', 'r', 'a', 'b', 'f', 'e', 't', 'h', '?', '+', '-', 'arrowleft', 'arrowright', 'd', ' '];

        if (shortcuts.includes(key)) {
            e.preventDefault();
        }

        switch (key) {
            // Navigation
            case '1':
            case '2':
            case '3':
            case '4':
                const markets = ['BTC', 'GOLD', 'NIFTY', 'BANKNIFTY'];
                const index = parseInt(key) - 1;
                if (markets[index]) {
                    this.state.update('activeMarket', markets[index]);
                    if (this.dashboard) this.dashboard.switchMarket(markets[index]);
                }
                break;

            case 'c':
                document.querySelector('.chart-module').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                break;

            case 'j':
                document.querySelector('.journal-module').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                break;

            case 's':
                document.querySelector('.strategy-module').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                break;

            case 'r':
                document.querySelector('.risk-module').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                break;

            // Actions
            case 'a':
                this.showModal('tradeModal');
                break;

            case 'b':
                const backtestBtn = document.getElementById('runBacktest');
                if (backtestBtn) backtestBtn.click();
                break;

            case 'f':
                this.toggleFullscreen();
                break;

            case 'e':
                this.exportData();
                break;

            // Interface
            case 't':
                this.state.toggleTheme();
                break;

            case 'h':
            case '?':
                const currentModal = this.state.get('ui.activeModal');
                if (currentModal === 'shortcutsModal') {
                    this.hideAllModals();
                } else {
                    this.showModal('shortcutsModal');
                }
                break;

            case 'escape':
                this.hideAllModals();
                break;

            // Chart controls
            case '+':
                if (this.chart) this.chart.zoom(1.1);
                break;

            case '-':
                if (this.chart) this.chart.zoom(0.9);
                break;

            case 'arrowleft':
                if (this.chart) this.chart.pan(50);
                break;

            case 'arrowright':
                if (this.chart) this.chart.pan(-50);
                break;

            case 'd':
                if (this.chart) this.chart.toggleDrawingMode();
                break;

            case ' ':
                if (this.chart) this.chart.resetView();
                break;
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            version: 'MarketMind Pro v2.1',
            state: this.state.getState(),
            trades: this.state.get('journal.trades'),
            performance: this.state.get('performance')
        };

        this.utils.exportJSON(data, `marketmind-export-${Date.now()}.json`);

        this.utils.createNotification(
            'success',
            'Export Complete',
            'All data has been exported successfully'
        );
    }

    showInstallPrompt() {
        // Show custom install prompt
        const installNotification = this.utils.createNotification(
            'info',
            'Install MarketMind Pro',
            'Install this app for a better experience',
            10000
        );

        if (installNotification) {
            const installBtn = document.createElement('button');
            installBtn.textContent = 'Install';
            installBtn.style.marginLeft = '10px';
            installBtn.style.padding = '4px 12px';
            installBtn.style.border = '1px solid var(--color-primary)';
            installBtn.style.borderRadius = '4px';
            installBtn.style.background = 'var(--color-primary)';
            installBtn.style.color = 'white';
            installBtn.style.cursor = 'pointer';

            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        this.utils.createNotification('success', 'App Installed', 'Thank you for installing!');
                    }
                    deferredPrompt = null;
                }
            });

            const notificationContent = installNotification.querySelector('.notification-content');
            if (notificationContent) {
                notificationContent.appendChild(installBtn);
            }
        }
    }

    startRealTimeUpdates() {
        // Market data updates are handled by AppState

        // Update UI every second
        setInterval(() => {
            this.updateUI();
        }, 1000);

        // Simulate network latency occasionally
        setInterval(() => {
            if (Math.random() > 0.8) { // 20% chance
                this.simulateNetworkLatency();
            }
        }, 30000);
    }

    updateUI() {
        // Update any real-time UI elements
        this.updateMarketIndicators();
        this.updatePerformanceMetrics();
    }

    updateMarketIndicators() {
        // Update market sentiment indicators
        const activeMarket = this.state.get('activeMarket');
        const marketData = this.state.get(`markets.${activeMarket}`);

        if (marketData) {
            const sentimentElement = document.getElementById('marketSentiment');
            if (sentimentElement) {
                sentimentElement.textContent = marketData.sentiment.charAt(0).toUpperCase() +
                    marketData.sentiment.slice(1);
                sentimentElement.className = `summary-value ${marketData.sentiment}`;
            }

            const volumeElement = document.getElementById('volumeTrend');
            if (volumeElement) {
                const trends = ['Increasing', 'Decreasing', 'Stable', 'Spiking'];
                volumeElement.textContent = trends[Math.floor(Math.random() * trends.length)];
            }
        }
    }

    updatePerformanceMetrics() {
        // Update performance metrics display
        const performance = this.state.get('performance');

        // You could update any performance-related UI elements here
        // For example, update the win rate in the header or footer
    }

    simulateNetworkLatency() {
        // Show network latency notification occasionally
        const latencies = [50, 100, 200, 350, 500];
        const latency = latencies[Math.floor(Math.random() * latencies.length)];

        this.utils.createNotification(
            'info',
            'Network Update',
            `Simulating market data delay: ${latency}ms`,
            3000
        );

        // Briefly show loading indicator
        this.state.update('ui.loading', true);
        setTimeout(() => {
            this.state.update('ui.loading', false);
        }, latency);
    }

    // Utility methods for modules to use
    showError(message) {
        this.utils.createNotification('error', 'Error', message);
    }

    showSuccess(message) {
        this.utils.createNotification('success', 'Success', message);
    }

    showInfo(message) {
        this.utils.createNotification('info', 'Info', message);
    }

    showWarning(message) {
        this.utils.createNotification('warning', 'Warning', message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set theme from state or system preference
    const state = window.AppState;
    const savedTheme = state.get('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    state.update('theme', theme);

    // Initialize the application
    window.app = new MarketMindApp();

    // Service worker registration for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/marketmind-pro/sw.js').then(registration => {
                console.log('ServiceWorker registered:', registration);
            }).catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
        });
    }
});