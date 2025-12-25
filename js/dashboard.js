// Market Dashboard Module

class Dashboard {
    constructor(state) {
        this.state = state;
        this.utils = window.Utils;
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupStateSubscriptions();
        this.loadInitialData();
    }

    cacheElements() {
        this.elements = {
            marketTabs: document.getElementById('marketTabs'),
            marketGrid: document.getElementById('marketGrid'),
            marketLoader: document.getElementById('marketLoader'),
            marketStatus: document.getElementById('marketStatus'),
            marketSentiment: document.getElementById('marketSentiment'),
            volumeTrend: document.getElementById('volumeTrend'),
            chartMarket: document.getElementById('chartMarket')
        };
    }

    setupEventListeners() {
        // Market tab switching
        if (this.elements.marketTabs) {
            this.elements.marketTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.market-tab');
                if (tab) {
                    const market = tab.dataset.market;
                    this.switchMarket(market);
                }
            });
        }
    }

    setupStateSubscriptions() {
        // Subscribe to market data changes
        this.state.subscribe('markets', (markets) => {
            this.updateMarketData();
        });

        // Subscribe to active market changes
        this.state.subscribe('activeMarket', (market) => {
            this.updateActiveTab(market);
            this.updateMarketData();
            if (this.elements.chartMarket) {
                this.elements.chartMarket.textContent = market;
            }
        });
    }

    loadInitialData() {
        const activeMarket = this.state.get('activeMarket');
        this.updateMarketData();
        this.updateActiveTab(activeMarket);
    }

    switchMarket(market) {
        // Show loading skeleton
        if (this.elements.marketLoader) {
            this.elements.marketLoader.classList.add('active');
        }

        // Update state (this will trigger subscribers)
        this.state.update('activeMarket', market);

        // Simulate API delay
        setTimeout(() => {
            if (this.elements.marketLoader) {
                this.elements.marketLoader.classList.remove('active');
            }
        }, 300);
    }

    updateActiveTab(market) {
        if (!this.elements.marketTabs) return;

        // Remove active class from all tabs
        this.elements.marketTabs.querySelectorAll('.market-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to current market tab
        const activeTab = this.elements.marketTabs.querySelector(`[data-market="${market}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    updateMarketData() {
        const market = this.state.get('activeMarket');
        const marketData = this.state.get(`markets.${market}`);

        if (!marketData || !this.elements.marketGrid) return;

        // Format the data for display
        const formattedData = this.formatMarketData(marketData);

        // Update market grid
        this.elements.marketGrid.innerHTML = this.createMarketGridHTML(formattedData);

        // Update market status
        this.updateMarketStatus(marketData);

        // Update sentiment and volume trends
        this.updateMarketIndicators(marketData);
    }

    formatMarketData(data) {
        return {
            price: this.utils.formatPrice(data.price),
            change: this.utils.formatPercent(data.change),
            changePercent: data.changePercent ? this.utils.formatPercent(data.changePercent) : '0.00%',
            volume: this.utils.formatLargeNumber(data.volume),
            marketCap: this.utils.formatLargeNumber(data.marketCap),
            high24h: this.utils.formatPrice(data.high24h),
            low24h: this.utils.formatPrice(data.low24h),
            open: this.utils.formatPrice(data.open),
            volatility: data.volatility
        };
    }

    createMarketGridHTML(data) {
        const isPositive = data.change.includes('+');
        const changeClass = isPositive ? 'positive' : 'negative';

        return `
            <div class="data-item">
                <div class="data-label">Price</div>
                <div class="data-value">${data.price}</div>
            </div>
            <div class="data-item">
                <div class="data-label">24h Change</div>
                <div class="data-value ${changeClass}">${data.change}</div>
                <div class="data-change ${changeClass}">${data.changePercent}</div>
            </div>
            <div class="data-item">
                <div class="data-label">24h Volume</div>
                <div class="data-value">${data.volume}</div>
            </div>
            <div class="data-item">
                <div class="data-label">Market Cap</div>
                <div class="data-value">${data.marketCap}</div>
            </div>
            <div class="data-item">
                <div class="data-label">24h High</div>
                <div class="data-value">${data.high24h}</div>
            </div>
            <div class="data-item">
                <div class="data-label">24h Low</div>
                <div class="data-value">${data.low24h}</div>
            </div>
            <div class="data-item">
                <div class="data-label">Today's Open</div>
                <div class="data-value">${data.open}</div>
            </div>
            <div class="data-item">
                <div class="data-label">Volatility</div>
                <div class="data-value">${data.volatility}</div>
            </div>
        `;
    }

    updateMarketStatus(marketData) {
        if (!this.elements.marketStatus) return;

        const isOpen = marketData.status === 'open';
        const statusClass = isOpen ? 'open' : 'closed';
        const statusText = isOpen ? 'Market Open' : 'Market Closed';
        const iconClass = isOpen ? 'fas fa-circle' : 'fas fa-circle';

        this.elements.marketStatus.className = `market-status ${statusClass}`;
        this.elements.marketStatus.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${statusText}</span>
        `;
    }

    updateMarketIndicators(marketData) {
        if (this.elements.marketSentiment) {
            const sentiment = marketData.sentiment;
            const sentimentText = sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
            const sentimentClass = sentiment === 'bullish' ? 'positive' :
                sentiment === 'bearish' ? 'negative' : 'neutral';

            this.elements.marketSentiment.textContent = sentimentText;
            this.elements.marketSentiment.className = `summary-value ${sentimentClass}`;
        }

        if (this.elements.volumeTrend) {
            // Simulate volume trend based on recent changes
            const trend = Math.abs(marketData.change) > 0.5 ? 'Increasing' :
                Math.abs(marketData.change) < 0.1 ? 'Stable' : 'Decreasing';

            this.elements.volumeTrend.textContent = trend;
        }
    }

    // Public method to refresh data
    refresh() {
        this.updateMarketData();
    }

    // Public method to switch market (for external use)
    switchMarketExternal(market) {
        this.switchMarket(market);
    }

    // Export market data
    exportMarketData() {
        const market = this.state.get('activeMarket');
        const marketData = this.state.get(`markets.${market}`);

        const exportData = {
            market: market,
            timestamp: new Date().toISOString(),
            data: marketData
        };

        this.utils.exportJSON(exportData, `market-data-${market}-${Date.now()}.json`);

        this.utils.createNotification(
            'success',
            'Data Exported',
            `Market data for ${market} has been exported`
        );
    }
}