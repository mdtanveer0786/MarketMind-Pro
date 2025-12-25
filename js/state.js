// State Management for MarketMind Pro

class AppState {
    constructor() {
        // Initialize state with defaults
        this.state = {
            // Theme
            theme: localStorage.getItem('marketmind_theme') || 'dark',

            // Market Data
            activeMarket: 'BTC',
            markets: {
                BTC: {
                    name: 'Bitcoin',
                    symbol: 'BTC/USD',
                    price: 65234.56,
                    change: 2.34,
                    changePercent: 0,
                    volume: 32456789012,
                    marketCap: 1.28e12,
                    high24h: 65420.12,
                    low24h: 64890.34,
                    open: 63750.89,
                    volatility: 'High',
                    status: 'open',
                    sentiment: 'bullish'
                },
                GOLD: {
                    name: 'Gold',
                    symbol: 'XAU/USD',
                    price: 2345.67,
                    change: -0.45,
                    changePercent: 0,
                    volume: 128456789012,
                    marketCap: 13.5e12,
                    high24h: 2350.12,
                    low24h: 2338.90,
                    open: 2356.23,
                    volatility: 'Low',
                    status: 'open',
                    sentiment: 'neutral'
                },
                NIFTY: {
                    name: 'Nifty 50',
                    symbol: 'NIFTY',
                    price: 22450.75,
                    change: 0.89,
                    changePercent: 0,
                    volume: 45234567890,
                    marketCap: 2.1e12,
                    high24h: 22510.23,
                    low24h: 22380.45,
                    open: 22252.34,
                    volatility: 'Medium',
                    status: 'open',
                    sentiment: 'bullish'
                },
                BANKNIFTY: {
                    name: 'Bank Nifty',
                    symbol: 'BANKNIFTY',
                    price: 48234.56,
                    change: 1.23,
                    changePercent: 0,
                    volume: 28765432109,
                    marketCap: 1.8e12,
                    high24h: 48345.67,
                    low24h: 47980.12,
                    open: 47650.34,
                    volatility: 'High',
                    status: 'closed',
                    sentiment: 'bullish'
                }
            },

            // Chart Settings
            chart: {
                timeframe: '1m',
                drawingMode: false,
                drawings: [],
                indicators: [],
                crosshair: { x: 0, y: 0, visible: false }
            },

            // Strategy Builder
            strategy: {
                indicator: 'RSI',
                entryCondition: 'cross_above',
                exitCondition: 'trailing_stop',
                riskReward: '1:2',
                period: 14,
                successTarget: 65,
                backtestResults: null
            },

            // Trading Journal
            journal: {
                trades: JSON.parse(localStorage.getItem('marketmind_trades')) || [],
                filters: {
                    market: 'all',
                    dateRange: 'all',
                    side: 'all',
                    emotion: 'all'
                },
                sortBy: 'date',
                sortOrder: 'desc',
                currentPage: 1,
                pageSize: 10
            },

            // Risk Management
            risk: {
                capital: 10000,
                riskPercent: 1,
                stopLoss: 2,
                positionSize: 0,
                riskScore: 24,
                warnings: []
            },

            // UI State
            ui: {
                loading: false,
                activeModal: null,
                notifications: [],
                shortcutsVisible: false
            },

            // Performance Metrics
            performance: {
                winRate: 0,
                totalTrades: 0,
                netPL: 0,
                sharpeRatio: 0,
                maxDrawdown: 0,
                avgWin: 0,
                avgLoss: 0
            }
        };

        // Initialize subscriptions
        this.subscribers = new Map();

        // Load saved state
        this.loadState();

        // Initialize state updaters
        this.initStateUpdaters();
    }

    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(key);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    // Notify subscribers of state change
    notify(key, newValue, oldValue) {
        const callbacks = this.subscribers.get(key);
        if (callbacks) {
            callbacks.forEach(callback => callback(newValue, oldValue, this.state));
        }
    }

    // Update state
    update(key, value) {
        const oldValue = this.get(key);

        // Handle nested updates
        if (key.includes('.')) {
            const keys = key.split('.');
            let obj = this.state;
            for (let i = 0; i < keys.length - 1; i++) {
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = value;
        } else {
            this.state[key] = value;
        }

        // Notify subscribers
        this.notify(key, value, oldValue);

        // Save to localStorage for persistent state
        this.saveState();
    }

    // Get state value
    get(key) {
        if (key.includes('.')) {
            const keys = key.split('.');
            let value = this.state;
            for (const k of keys) {
                value = value?.[k];
            }
            return value;
        }
        return this.state[key];
    }

    // Get entire state
    getState() {
        return Utils.deepClone(this.state);
    }

    // Load state from localStorage
    loadState() {
        try {
            const saved = localStorage.getItem('marketmind_state');
            if (saved) {
                const parsed = JSON.parse(saved);

                // Merge saved state with defaults (excluding some properties)
                const { trades, ...savedState } = parsed;
                Object.assign(this.state, savedState);

                // Handle trades separately
                if (trades && Array.isArray(trades)) {
                    this.state.journal.trades = trades;
                }

                console.log('State loaded from localStorage');
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    // Save state to localStorage
    saveState() {
        try {
            const stateToSave = Utils.deepClone(this.state);

            // Don't save large arrays in localStorage
            delete stateToSave.markets;
            delete stateToSave.chart.drawings;
            delete stateToSave.chart.indicators;

            localStorage.setItem('marketmind_state', JSON.stringify(stateToSave));
            localStorage.setItem('marketmind_trades', JSON.stringify(this.state.journal.trades));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    // Initialize state updaters
    initStateUpdaters() {
        // Update market prices periodically
        this.startMarketUpdates();

        // Update performance metrics when trades change
        this.subscribe('journal.trades', () => {
            this.updatePerformanceMetrics();
        });

        // Update risk calculations when inputs change
        this.subscribe('risk.capital', () => this.updateRiskCalculations());
        this.subscribe('risk.riskPercent', () => this.updateRiskCalculations());
        this.subscribe('risk.stopLoss', () => this.updateRiskCalculations());

        // Update chart when market changes
        this.subscribe('activeMarket', (newMarket) => {
            this.updateChartData(newMarket);
        });
    }

    // Start simulated market updates
    startMarketUpdates() {
        setInterval(() => {
            Object.keys(this.state.markets).forEach(market => {
                const marketData = this.state.markets[market];
                if (marketData.status === 'open') {
                    // Simulate price movement
                    const volatility = marketData.volatility === 'High' ? 0.1 :
                        marketData.volatility === 'Medium' ? 0.05 : 0.02;

                    const change = (Math.random() - 0.5) * 2 * volatility;
                    const newPrice = marketData.price * (1 + change / 100);

                    // Update market data
                    this.update(`markets.${market}.price`, newPrice);
                    this.update(`markets.${market}.change`, change);
                    this.update(`markets.${market}.changePercent`,
                        Utils.calculateChange(marketData.open, newPrice));

                    // Update high/low
                    if (newPrice > marketData.high24h) {
                        this.update(`markets.${market}.high24h`, newPrice);
                    }
                    if (newPrice < marketData.low24h) {
                        this.update(`markets.${market}.low24h`, newPrice);
                    }

                    // Update sentiment
                    const sentiment = change > 0.1 ? 'bullish' :
                        change < -0.1 ? 'bearish' : 'neutral';
                    this.update(`markets.${market}.sentiment`, sentiment);
                }
            });

            // Notify market data subscribers
            this.notify('markets', this.state.markets);
        }, 3000); // Update every 3 seconds
    }

    // Update performance metrics
    updatePerformanceMetrics() {
        const trades = this.state.journal.trades;
        if (trades.length === 0) {
            this.update('performance', {
                winRate: 0,
                totalTrades: 0,
                netPL: 0,
                sharpeRatio: 0,
                maxDrawdown: 0,
                avgWin: 0,
                avgLoss: 0
            });
            return;
        }

        const profitableTrades = trades.filter(t => t.profit > 0);
        const losingTrades = trades.filter(t => t.profit <= 0);

        const winRate = (profitableTrades.length / trades.length) * 100;
        const netPL = trades.reduce((sum, trade) => sum + trade.profit, 0);

        const avgWin = profitableTrades.length > 0 ?
            profitableTrades.reduce((sum, trade) => sum + trade.profit, 0) / profitableTrades.length : 0;

        const avgLoss = losingTrades.length > 0 ?
            losingTrades.reduce((sum, trade) => sum + trade.profit, 0) / losingTrades.length : 0;

        // Simple Sharpe ratio simulation
        const sharpeRatio = trades.length > 10 ?
            (winRate / 100) / Math.max(0.01, Math.abs(avgLoss) / 100) : 0;

        // Calculate max drawdown (simplified)
        let maxDrawdown = 0;
        let peak = -Infinity;
        let trough = Infinity;

        trades.forEach(trade => {
            if (trade.profit > peak) peak = trade.profit;
            if (trade.profit < trough) trough = trade.profit;
            const drawdown = ((peak - trough) / peak) * 100;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        this.update('performance', {
            winRate: parseFloat(winRate.toFixed(1)),
            totalTrades: trades.length,
            netPL: parseFloat(netPL.toFixed(2)),
            sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
            maxDrawdown: parseFloat(maxDrawdown.toFixed(1)),
            avgWin: parseFloat(avgWin.toFixed(2)),
            avgLoss: parseFloat(avgLoss.toFixed(2))
        });
    }

    // Update risk calculations
    updateRiskCalculations() {
        const capital = this.state.risk.capital;
        const riskPercent = this.state.risk.riskPercent;
        const stopLoss = this.state.risk.stopLoss;

        // Calculate position size
        const riskAmount = capital * (riskPercent / 100);
        const positionSize = riskAmount / (stopLoss / 100);

        // Calculate risk score
        const riskScore = Utils.calculateRiskScore(capital, riskPercent, stopLoss);

        // Update warnings
        const warnings = [];
        if (riskPercent > 2) {
            warnings.push('Risk per trade exceeds 2%');
        }
        if (stopLoss > 10) {
            warnings.push('Stop loss is too wide (>10%)');
        }
        if (positionSize > capital * 0.5) {
            warnings.push('Position size exceeds 50% of capital');
        }

        this.update('risk.positionSize', parseFloat(positionSize.toFixed(2)));
        this.update('risk.riskScore', riskScore);
        this.update('risk.warnings', warnings);
    }

    // Update chart data for active market
    updateChartData(market) {
        const marketData = this.state.markets[market];
        if (!marketData) return;

        // Generate new chart data based on current market price
        const volatility = marketData.volatility === 'High' ? 0.02 :
            marketData.volatility === 'Medium' ? 0.01 : 0.005;

        const chartData = Utils.generateCandleData(100, marketData.price, volatility);
        this.update('chart.data', chartData);
    }

    // Add new trade to journal
    addTrade(trade) {
        const validation = Utils.validateTrade(trade);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const newTrade = {
            id: Utils.generateId(),
            timestamp: Date.now(),
            ...trade,
            profit: ((trade.exit - trade.entry) / trade.entry * 100) * (trade.side === 'buy' ? 1 : -1)
        };

        const trades = [...this.state.journal.trades, newTrade];
        this.update('journal.trades', trades);

        // Show notification
        Utils.createNotification(
            'success',
            'Trade Added',
            `${trade.market} ${trade.side.toUpperCase()} trade saved successfully`
        );

        return newTrade;
    }

    // Update existing trade
    updateTrade(id, updates) {
        const trades = this.state.journal.trades.map(trade =>
            trade.id === id ? { ...trade, ...updates } : trade
        );
        this.update('journal.trades', trades);

        Utils.createNotification('success', 'Trade Updated', 'Trade updated successfully');
    }

    // Delete trade
    deleteTrade(id) {
        const trades = this.state.journal.trades.filter(trade => trade.id !== id);
        this.update('journal.trades', trades);

        Utils.createNotification('info', 'Trade Deleted', 'Trade removed from journal');
    }

    // Run strategy backtest
    runBacktest(strategyParams) {
        // Simulate backtesting
        const results = {
            winRate: Utils.randomInt(60, 85),
            totalTrades: Utils.randomInt(50, 200),
            profitableTrades: 0,
            losingTrades: 0,
            netPL: Utils.random(1000, 5000),
            maxDrawdown: -Utils.random(5, 15),
            sharpeRatio: Utils.random(1.5, 3.0),
            avgWin: Utils.random(1.5, 3.0),
            avgLoss: -Utils.random(1.0, 2.0),
            profitFactor: Utils.random(1.2, 2.5)
        };

        results.profitableTrades = Math.round(results.totalTrades * (results.winRate / 100));
        results.losingTrades = results.totalTrades - results.profitableTrades;

        this.update('strategy.backtestResults', results);

        // Generate equity curve data
        const equityData = this.generateEquityCurve(results);
        this.update('strategy.equityCurve', equityData);

        Utils.createNotification('success', 'Backtest Complete', 'Strategy simulation completed');

        return results;
    }

    // Generate equity curve data for backtest results
    generateEquityCurve(results) {
        const data = [];
        let equity = 10000; // Starting equity

        for (let i = 0; i < 100; i++) {
            // Simulate equity changes
            const change = (Math.random() - 0.45) * 2; // -0.9% to +0.9%
            equity *= (1 + change / 100);

            data.push({
                time: i,
                equity: equity
            });
        }

        return data;
    }

    // Toggle theme
    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.update('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('marketmind_theme', newTheme);
    }

    // Show notification
    showNotification(type, title, message) {
        const notification = { type, title, message, id: Utils.generateId() };
        const notifications = [...this.state.ui.notifications, notification];
        this.update('ui.notifications', notifications);

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }

    // Remove notification
    removeNotification(id) {
        const notifications = this.state.ui.notifications.filter(n => n.id !== id);
        this.update('ui.notifications', notifications);
    }

    // Show modal
    showModal(modalId) {
        this.update('ui.activeModal', modalId);
    }

    // Hide modal
    hideModal() {
        this.update('ui.activeModal', null);
    }

    // Toggle loading state
    setLoading(loading) {
        this.update('ui.loading', loading);
    }

    // Get filtered and sorted trades
    getFilteredTrades() {
        let trades = [...this.state.journal.trades];
        const filters = this.state.journal.filters;

        // Apply filters
        if (filters.market !== 'all') {
            trades = trades.filter(t => t.market === filters.market);
        }

        if (filters.side !== 'all') {
            trades = trades.filter(t => t.side === filters.side);
        }

        if (filters.emotion !== 'all') {
            trades = trades.filter(t => t.emotion === filters.emotion);
        }

        // Apply date range filter
        if (filters.dateRange !== 'all') {
            const now = Date.now();
            let startDate;

            switch (filters.dateRange) {
                case 'today':
                    startDate = now - 24 * 60 * 60 * 1000;
                    break;
                case 'week':
                    startDate = now - 7 * 24 * 60 * 60 * 1000;
                    break;
                case 'month':
                    startDate = now - 30 * 24 * 60 * 60 * 1000;
                    break;
                case 'year':
                    startDate = now - 365 * 24 * 60 * 60 * 1000;
                    break;
            }

            trades = trades.filter(t => t.timestamp >= startDate);
        }

        // Apply sorting
        const { sortBy, sortOrder } = this.state.journal;
        trades.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle special cases
            if (sortBy === 'date') {
                aValue = a.timestamp;
                bValue = b.timestamp;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Apply pagination
        const { currentPage, pageSize } = this.state.journal;
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTrades = trades.slice(startIndex, endIndex);

        return {
            trades: paginatedTrades,
            total: trades.length,
            totalPages: Math.ceil(trades.length / pageSize)
        };
    }
}

// Create global state instance
window.AppState = new AppState();