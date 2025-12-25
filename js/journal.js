// Trading Journal Module - Fully Working Version

class TradingJournal {
    constructor(state) {
        this.state = state;
        this.utils = window.Utils;
        this.isEditing = false;
        this.currentTrade = null;
        this.init();
    }

    async init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupStateSubscriptions();
        await this.loadTrades();
        this.updateUI();
    }

    cacheElements() {
        this.elements = {
            addTradeBtn: document.getElementById('addTradeBtn'),
            tradeModal: document.getElementById('tradeModal'),
            closeModal: document.getElementById('closeModal'),
            cancelTrade: document.getElementById('cancelTrade'),
            tradeForm: document.getElementById('tradeForm'),
            emotionOptions: document.querySelectorAll('.emotion-option'),
            emotionInput: document.getElementById('emotionInput'),
            tradesTableBody: document.getElementById('tradesTableBody'),
            tradeCount: document.getElementById('tradeCount'),
            journalStats: document.getElementById('journalStats'),
            journalPeriod: document.getElementById('journalPeriod'),
            exportJournal: document.getElementById('exportJournal'),
            filterJournal: document.getElementById('filterJournal')
        };
    }

    setupEventListeners() {
        // Add trade button
        if (this.elements.addTradeBtn) {
            this.elements.addTradeBtn.addEventListener('click', () => this.showAddTradeModal());
        }

        // Modal controls
        if (this.elements.closeModal) {
            this.elements.closeModal.addEventListener('click', () => this.hideModal());
        }

        if (this.elements.cancelTrade) {
            this.elements.cancelTrade.addEventListener('click', () => this.hideModal());
        }

        // Trade form submission - FIXED
        document.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'tradeForm') {
                e.preventDefault();
                this.handleTradeSubmit(e);
            }
        });

        // Emotion selection - FIXED
        document.addEventListener('click', (e) => {
            if (e.target.closest('.emotion-option')) {
                const option = e.target.closest('.emotion-option');
                this.selectEmotion(option);
            }

            if (e.target.closest('.side-btn')) {
                const button = e.target.closest('.side-btn');
                this.selectTradeSide(button);
            }
        });

        // Export journal
        if (this.elements.exportJournal) {
            this.elements.exportJournal.addEventListener('click', () => this.exportJournal());
        }

        // Filter journal
        if (this.elements.filterJournal) {
            this.elements.filterJournal.addEventListener('click', () => this.showFilterModal());
        }

        // Live trade preview updates
        document.addEventListener('input', (e) => {
            const previewInputs = ['entryPrice', 'exitPrice', 'stopLoss', 'target', 'tradeSize'];
            if (previewInputs.includes(e.target.id)) {
                this.updateTradePreview();
            }

            if (e.target.id === 'tradeMarket') {
                this.updateCurrentPrice();
                this.updateTradePreview();
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (this.elements.tradeModal &&
                this.elements.tradeModal.classList.contains('active') &&
                e.target === this.elements.tradeModal) {
                this.hideModal();
            }
        });

        // Handle Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.tradeModal.classList.contains('active')) {
                this.hideModal();
            }
        });
    }

    setupStateSubscriptions() {
        // Subscribe to trades changes
        this.state.subscribe('journal.trades', () => {
            this.updateUI();
        });

        // Subscribe to performance metrics
        this.state.subscribe('performance', () => {
            this.updateStats();
        });
    }

    async loadTrades() {
        // Trades are loaded from state (which loads from localStorage)
        await this.utils.delay(100);
    }

    updateUI() {
        this.updateTradesTable();
        this.updateStats();
        this.updateTradeCount();
    }

    updateTradesTable() {
        if (!this.elements.tradesTableBody) return;

        const trades = this.state.get('journal.trades') || [];

        if (trades.length === 0) {
            this.elements.tradesTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 60px 20px;">
                        <div style="font-size: 48px; color: var(--text-tertiary); margin-bottom: 20px;">
                            <i class="fas fa-book"></i>
                        </div>
                        <h3 style="margin-bottom: 10px; color: var(--text-primary);">No trades recorded yet</h3>
                        <p style="color: var(--text-tertiary); margin-bottom: 20px;">Start by adding your first trade to build your trading journal.</p>
                        <button class="add-trade-btn" id="emptyAddTradeBtn" style="margin: 0 auto;">
                            <i class="fas fa-plus"></i> Add Your First Trade
                        </button>
                    </td>
                </tr>
            `;

            // Add event listener to the empty state button
            setTimeout(() => {
                const emptyBtn = document.getElementById('emptyAddTradeBtn');
                if (emptyBtn) {
                    emptyBtn.addEventListener('click', () => this.showAddTradeModal());
                }
            }, 100);

            return;
        }

        let html = '';

        trades.forEach(trade => {
            const date = new Date(trade.timestamp);
            const dateStr = this.utils.formatDate(date, 'short');
            const timeStr = this.utils.formatDate(date, 'time');

            const profit = trade.profit || 0;
            const profitClass = profit >= 0 ? 'positive' : 'negative';
            const profitSign = profit >= 0 ? '+' : '';
            const profitFormatted = `${profitSign}${profit.toFixed(2)}%`;

            const sideClass = trade.side === 'buy' ? 'buy' : 'sell';
            const sideText = trade.side === 'buy' ? 'BUY' : 'SELL';

            const emotionIcons = {
                neutral: '😐',
                fear: '😨',
                greed: '😄',
                anger: '😡',
                confusion: '😕'
            };

            const profitAmount = trade.exit ? ((trade.exit - trade.entry) * (trade.size || 1)).toFixed(2) : '0.00';
            const profitAmountSign = trade.exit && (trade.exit - trade.entry) >= 0 ? '+' : '';
            const profitAmountClass = trade.exit && (trade.exit - trade.entry) >= 0 ? 'positive' : 'negative';

            html += `
                <tr data-trade-id="${trade.id}">
                    <td>
                        <div style="font-weight: 500; color: var(--text-primary);">${dateStr}</div>
                        <div style="font-size: 12px; color: var(--text-tertiary);">${timeStr}</div>
                    </td>
                    <td>
                        <span style="display: inline-block; padding: 4px 10px; background-color: var(--bg-tertiary); border-radius: 12px; font-size: 12px; font-weight: 500; color: var(--text-secondary);">
                            ${trade.market}
                        </span>
                    </td>
                    <td>
                        <span class="side-badge ${sideClass}" style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; ${sideClass === 'buy' ? 'background-color: rgba(16, 185, 129, 0.15); color: var(--color-success);' : 'background-color: rgba(239, 68, 68, 0.15); color: var(--color-danger);'}">
                            ${sideText}
                        </span>
                    </td>
                    <td style="font-family: monospace;">${this.utils.formatPrice(trade.entry)}</td>
                    <td style="font-family: monospace;">${trade.exit ? this.utils.formatPrice(trade.exit) : '–'}</td>
                    <td>
                        <span class="profit-badge ${profitClass}" style="padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; min-width: 70px; text-align: center; ${profitClass === 'positive' ? 'background-color: rgba(76, 175, 80, 0.15); color: var(--color-success);' : 'background-color: rgba(255, 61, 0, 0.15); color: var(--color-danger);'}">
                            ${profitFormatted}
                        </span>
                        ${trade.exit ? `<div style="font-size: 11px; margin-top: 2px; opacity: 0.8; color: ${profitAmountClass === 'positive' ? 'var(--color-success)' : 'var(--color-danger)'}">${profitAmountSign}$${profitAmount}</div>` : ''}
                    </td>
                    <td style="text-align: center;">
                        <span style="font-size: 20px;">${emotionIcons[trade.emotion] || '😐'}</span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 6px;">
                            <button class="trade-action-btn edit" data-id="${trade.id}" title="Edit Trade" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background-color: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-secondary); border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-edit" style="font-size: 12px;"></i>
                            </button>
                            <button class="trade-action-btn delete" data-id="${trade.id}" title="Delete Trade" style="width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background-color: var(--bg-tertiary); border: 1px solid var(--border-primary); color: var(--text-secondary); border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                                <i class="fas fa-trash" style="font-size: 12px;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        this.elements.tradesTableBody.innerHTML = html;

        // Add event listeners to action buttons
        this.addTradeActionListeners();
    }

    addTradeActionListeners() {
        // Edit buttons
        document.querySelectorAll('.trade-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tradeId = e.currentTarget.dataset.id;
                this.editTrade(tradeId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.trade-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tradeId = e.currentTarget.dataset.id;
                this.deleteTrade(tradeId);
            });
        });
    }

    updateStats() {
        if (!this.elements.journalStats) return;

        const performance = this.state.get('performance') || {
            winRate: 0,
            netPL: 0,
            maxDrawdown: 0,
            sharpeRatio: 0
        };

        const trades = this.state.get('journal.trades') || [];

        const statsHTML = `
            <div class="stat-card">
                <div class="stat-value ${performance.winRate >= 50 ? 'positive' : 'negative'}">
                    ${performance.winRate}%
                </div>
                <div class="stat-label">Win Rate</div>
                <div class="stat-sublabel">${trades.length} trades</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${performance.netPL >= 0 ? 'positive' : 'negative'}">
                    $${performance.netPL.toFixed(2)}
                </div>
                <div class="stat-label">Net P&L</div>
                <div class="stat-sublabel">Total profit/loss</div>
            </div>
            <div class="stat-card">
                <div class="stat-value ${performance.maxDrawdown >= -10 ? 'positive' : 'negative'}">
                    ${performance.maxDrawdown}%
                </div>
                <div class="stat-label">Max Drawdown</div>
                <div class="stat-sublabel">Peak to trough</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">
                    ${performance.sharpeRatio.toFixed(2)}
                </div>
                <div class="stat-label">Sharpe Ratio</div>
                <div class="stat-sublabel">Risk-adjusted returns</div>
            </div>
        `;

        this.elements.journalStats.innerHTML = statsHTML;
    }

    updateTradeCount() {
        if (!this.elements.tradeCount) return;

        const trades = this.state.get('journal.trades') || [];
        const count = trades.length;
        this.elements.tradeCount.textContent = `${count} trade${count !== 1 ? 's' : ''}`;
    }

    showAddTradeModal(tradeData = null) {
        this.isEditing = tradeData !== null;
        this.currentTrade = tradeData;

        // Reset form
        const form = document.getElementById('tradeForm');
        if (form) {
            form.reset();
        }

        // Reset emotion selection
        document.querySelectorAll('.emotion-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        const neutralEmotion = document.querySelector('.emotion-option[data-emotion="neutral"]');
        if (neutralEmotion) {
            neutralEmotion.classList.add('selected');
            const emotionInput = document.getElementById('emotionInput');
            if (emotionInput) {
                emotionInput.value = 'neutral';
            }
        }

        // Reset side selection
        document.querySelectorAll('.side-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const buyBtn = document.querySelector('.side-btn.buy');
        if (buyBtn) {
            buyBtn.classList.add('active');
            const sideInput = document.getElementById('tradeSide');
            if (sideInput) sideInput.value = 'buy';
        }

        if (tradeData) {
            // Populate form with trade data for editing
            this.populateTradeForm(tradeData);
        } else {
            // Set default values for new trade
            this.setDefaultFormValues();
        }

        // Show modal
        const modal = document.getElementById('tradeModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    updateCurrentPrice() {
        const currentPriceElement = document.getElementById('currentPrice');
        if (!currentPriceElement) return;

        const marketSelect = document.getElementById('tradeMarket');
        const market = marketSelect ? marketSelect.value : 'BTC';
        const marketData = this.state.get(`markets.${market}`);

        if (marketData) {
            currentPriceElement.textContent = this.utils.formatPrice(marketData.price);

            // Set entry price to current market price if empty
            const entryInput = document.getElementById('entryPrice');
            if (entryInput && !entryInput.value) {
                entryInput.value = marketData.price.toFixed(2);
                this.updateTradePreview();
            }
        }
    }

    setDefaultFormValues() {
        const marketSelect = document.getElementById('tradeMarket');
        const activeMarket = this.state.get('activeMarket');

        if (marketSelect) {
            marketSelect.value = activeMarket;
        }

        // Update current price
        this.updateCurrentPrice();

        // Set default stop loss and target
        const entryInput = document.getElementById('entryPrice');
        const stopLossInput = document.getElementById('stopLoss');
        const targetInput = document.getElementById('target');
        const sizeInput = document.getElementById('tradeSize');

        if (entryInput && entryInput.value) {
            const entryPrice = parseFloat(entryInput.value);
            if (stopLossInput && !stopLossInput.value) {
                stopLossInput.value = (entryPrice * 0.98).toFixed(2);
            }
            if (targetInput && !targetInput.value) {
                targetInput.value = (entryPrice * 1.02).toFixed(2);
            }
        }

        if (sizeInput && !sizeInput.value) {
            sizeInput.value = '1';
        }

        this.updateTradePreview();
    }

    populateTradeForm(tradeData) {
        // Set form values from trade data
        const marketSelect = document.getElementById('tradeMarket');
        const entryInput = document.getElementById('entryPrice');
        const exitInput = document.getElementById('exitPrice');
        const stopLossInput = document.getElementById('stopLoss');
        const targetInput = document.getElementById('target');
        const sizeInput = document.getElementById('tradeSize');
        const notesInput = document.getElementById('tradeNotes');
        const sideInput = document.getElementById('tradeSide');

        if (marketSelect) marketSelect.value = tradeData.market;
        if (entryInput) entryInput.value = tradeData.entry.toFixed(2);
        if (exitInput) exitInput.value = tradeData.exit ? tradeData.exit.toFixed(2) : '';
        if (stopLossInput) stopLossInput.value = tradeData.stopLoss ? tradeData.stopLoss.toFixed(2) : '';
        if (targetInput) targetInput.value = tradeData.target ? tradeData.target.toFixed(2) : '';
        if (sizeInput) sizeInput.value = tradeData.size ? tradeData.size.toFixed(2) : '1';
        if (notesInput) notesInput.value = tradeData.notes || '';
        if (sideInput) sideInput.value = tradeData.side || 'buy';

        // Select side button
        const sideBtn = document.querySelector(`.side-btn.${tradeData.side}`);
        if (sideBtn) {
            this.selectTradeSide(sideBtn);
        }

        // Select emotion
        const emotionBtn = document.querySelector(`.emotion-option[data-emotion="${tradeData.emotion}"]`);
        if (emotionBtn) {
            this.selectEmotion(emotionBtn);
        }

        this.updateTradePreview();
    }

    selectEmotion(option) {
        // Remove selected class from all options
        document.querySelectorAll('.emotion-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Add selected class to clicked option
        option.classList.add('selected');

        // Update hidden input
        const emotion = option.dataset.emotion;
        const emotionInput = document.getElementById('emotionInput');
        if (emotionInput) {
            emotionInput.value = emotion;
        }
    }

    selectTradeSide(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.side-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');

        // Update hidden input
        const side = button.dataset.side;
        const sideInput = document.getElementById('tradeSide');
        if (sideInput) {
            sideInput.value = side;
        }

        this.updateTradePreview();
    }

    updateTradePreview() {
        const entryInput = document.getElementById('entryPrice');
        const exitInput = document.getElementById('exitPrice');
        const stopLossInput = document.getElementById('stopLoss');
        const targetInput = document.getElementById('target');
        const sideInput = document.getElementById('tradeSide');

        if (!entryInput || !stopLossInput || !targetInput || !sideInput) return;

        const entry = parseFloat(entryInput.value) || 0;
        const exit = parseFloat(exitInput.value) || 0;
        const stopLoss = parseFloat(stopLossInput.value) || 0;
        const target = parseFloat(targetInput.value) || 0;
        const side = sideInput.value;

        if (entry === 0 || stopLoss === 0 || target === 0) return;

        // Calculate risk and reward
        let risk, reward;

        if (side === 'buy') {
            risk = Math.abs((entry - stopLoss) / entry * 100);
            reward = Math.abs((target - entry) / entry * 100);
        } else {
            risk = Math.abs((stopLoss - entry) / entry * 100);
            reward = Math.abs((entry - target) / entry * 100);
        }

        const rrRatio = risk > 0 ? (reward / risk).toFixed(1) : '0.0';

        // Calculate P&L
        let pl = 0;
        if (exit > 0) {
            pl = side === 'buy' ?
                ((exit - entry) / entry * 100) :
                ((entry - exit) / entry * 100);
        } else {
            pl = side === 'buy' ?
                ((target - entry) / entry * 100) :
                ((entry - target) / entry * 100);
        }

        // Update preview elements
        const previewRisk = document.getElementById('previewRisk');
        const previewReward = document.getElementById('previewReward');
        const previewRR = document.getElementById('previewRR');
        const previewPL = document.getElementById('previewPL');

        if (previewRisk) previewRisk.textContent = `${risk.toFixed(1)}%`;
        if (previewReward) previewReward.textContent = `${reward.toFixed(1)}%`;
        if (previewRR) previewRR.textContent = `1:${rrRatio}`;
        if (previewPL) {
            const plClass = pl >= 0 ? 'positive' : 'negative';
            const plSign = pl >= 0 ? '+' : '';
            previewPL.textContent = `${plSign}${pl.toFixed(2)}%`;
            previewPL.className = `preview-pl ${plClass}`;
        }
    }

    handleTradeSubmit(e) {
        e.preventDefault();

        try {
            // Get form data
            const tradeData = {
                market: document.getElementById('tradeMarket').value,
                entry: parseFloat(document.getElementById('entryPrice').value),
                exit: document.getElementById('exitPrice').value ?
                    parseFloat(document.getElementById('exitPrice').value) : null,
                stopLoss: parseFloat(document.getElementById('stopLoss').value),
                target: parseFloat(document.getElementById('target').value),
                size: parseFloat(document.getElementById('tradeSize').value) || 1,
                side: document.getElementById('tradeSide').value,
                emotion: document.getElementById('emotionInput').value,
                notes: document.getElementById('tradeNotes').value,
                timestamp: this.isEditing && this.currentTrade ?
                    this.currentTrade.timestamp : Date.now()
            };

            // Validate required fields
            if (!tradeData.market || !tradeData.entry || !tradeData.stopLoss || !tradeData.target) {
                throw new Error('Please fill in all required fields');
            }

            if (tradeData.entry <= 0) {
                throw new Error('Entry price must be greater than 0');
            }

            if (tradeData.size <= 0) {
                throw new Error('Position size must be greater than 0');
            }

            // Calculate profit/loss percentage
            if (tradeData.exit) {
                if (tradeData.side === 'buy') {
                    tradeData.profit = ((tradeData.exit - tradeData.entry) / tradeData.entry * 100);
                } else {
                    tradeData.profit = ((tradeData.entry - tradeData.exit) / tradeData.entry * 100);
                }
            } else {
                tradeData.profit = 0;
            }

            // Generate unique ID
            tradeData.id = this.isEditing && this.currentTrade ? this.currentTrade.id : this.utils.generateId();

            // Get current trades
            const currentTrades = this.state.get('journal.trades') || [];
            let updatedTrades;

            if (this.isEditing) {
                // Update existing trade
                updatedTrades = currentTrades.map(trade =>
                    trade.id === tradeData.id ? tradeData : trade
                );
            } else {
                // Add new trade at the beginning
                updatedTrades = [tradeData, ...currentTrades];
            }

            // Update state
            this.state.update('journal.trades', updatedTrades);

            // Save to localStorage
            localStorage.setItem('marketmind_trades', JSON.stringify(updatedTrades));

            // Show success notification
            this.utils.createNotification(
                'success',
                this.isEditing ? 'Trade Updated' : 'Trade Added',
                `${tradeData.market} ${tradeData.side.toUpperCase()} trade ${this.isEditing ? 'updated' : 'saved'} successfully`
            );

            // Hide modal
            this.hideModal();

        } catch (error) {
            console.error('Trade submission error:', error);
            this.utils.createNotification('error', 'Trade Error', error.message);
        }
    }

    hideModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.isEditing = false;
        this.currentTrade = null;
    }

    editTrade(tradeId) {
        const trades = this.state.get('journal.trades') || [];
        const trade = trades.find(t => t.id === tradeId);

        if (trade) {
            this.showAddTradeModal(trade);
        }
    }

    deleteTrade(tradeId) {
        if (confirm('Are you sure you want to delete this trade?')) {
            const trades = this.state.get('journal.trades') || [];
            const updatedTrades = trades.filter(t => t.id !== tradeId);

            // Update state
            this.state.update('journal.trades', updatedTrades);

            // Save to localStorage
            localStorage.setItem('marketmind_trades', JSON.stringify(updatedTrades));

            this.utils.createNotification('info', 'Trade Deleted', 'Trade removed from journal');
        }
    }

    exportJournal() {
        const trades = this.state.get('journal.trades') || [];

        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: 'MarketMind Pro v2.1',
                totalTrades: trades.length
            },
            trades: trades.map(trade => ({
                ...trade,
                date: new Date(trade.timestamp).toLocaleDateString(),
                time: new Date(trade.timestamp).toLocaleTimeString()
            }))
        };

        this.utils.exportJSON(exportData, `trading-journal-${Date.now()}.json`);

        this.utils.createNotification(
            'success',
            'Journal Exported',
            `${trades.length} trades have been exported successfully`
        );
    }

    showFilterModal() {
        // Simple filter implementation
        const market = prompt('Filter by market (BTC, GOLD, NIFTY, BANKNIFTY) or leave empty for all:', '');

        if (market !== null) {
            // This is a simple client-side filter
            // In a real app, you'd update the state filter
            alert(`Filtering by ${market || 'all markets'}. This is a demo - filter would show filtered results.`);
        }
    }
}

// Make sure the journal module initializes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize TradingJournal when app starts
    if (window.AppState && window.Utils) {
        // The journal will be initialized by the main app.js
        console.log('Trading Journal module ready');
    }
});

