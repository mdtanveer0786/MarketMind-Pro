// Strategy Builder Module

class StrategyBuilder {
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
            form: document.getElementById('strategyForm'),
            indicatorSelect: document.getElementById('indicatorSelect'),
            entryCondition: document.getElementById('entryCondition'),
            exitCondition: document.getElementById('exitCondition'),
            riskReward: document.getElementById('riskReward'),
            indicatorPeriod: document.getElementById('indicatorPeriod'),
            periodValue: document.getElementById('periodValue'),
            successTarget: document.getElementById('successTarget'),
            successValue: document.getElementById('successValue'),
            runBacktest: document.getElementById('runBacktest'),
            resultsGrid: document.getElementById('resultsGrid'),
            equityCanvas: document.getElementById('equityCanvas'),
            strategyName: document.getElementById('strategyName')
        };
    }

    setupEventListeners() {
        // Form inputs
        if (this.elements.indicatorSelect) {
            this.elements.indicatorSelect.addEventListener('change', () => this.updateStrategyName());
        }

        if (this.elements.indicatorPeriod) {
            this.elements.indicatorPeriod.addEventListener('input', (e) => {
                this.updatePeriodValue(e.target.value);
            });
        }

        if (this.elements.successTarget) {
            this.elements.successTarget.addEventListener('input', (e) => {
                this.updateSuccessValue(e.target.value);
            });
        }

        // Run backtest button
        if (this.elements.runBacktest) {
            this.elements.runBacktest.addEventListener('click', () => this.runBacktest());
        }

        // Form submission
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveStrategy();
            });
        }
    }

    setupStateSubscriptions() {
        // Subscribe to backtest results
        this.state.subscribe('strategy.backtestResults', (results) => {
            if (results) {
                this.displayBacktestResults(results);
            }
        });

        // Subscribe to equity curve data
        this.state.subscribe('strategy.equityCurve', (data) => {
            if (data) {
                this.drawEquityCurve(data);
            }
        });
    }

    loadInitialData() {
        const strategy = this.state.get('strategy');

        // Set form values from state
        if (this.elements.indicatorSelect) {
            this.elements.indicatorSelect.value = strategy.indicator;
        }

        if (this.elements.entryCondition) {
            this.elements.entryCondition.value = strategy.entryCondition;
        }

        if (this.elements.exitCondition) {
            this.elements.exitCondition.value = strategy.exitCondition;
        }

        if (this.elements.riskReward) {
            this.elements.riskReward.value = strategy.riskReward;
        }

        if (this.elements.indicatorPeriod) {
            this.elements.indicatorPeriod.value = strategy.period;
            this.updatePeriodValue(strategy.period);
        }

        if (this.elements.successTarget) {
            this.elements.successTarget.value = strategy.successTarget;
            this.updateSuccessValue(strategy.successTarget);
        }

        this.updateStrategyName();

        // Load any existing backtest results
        const results = this.state.get('strategy.backtestResults');
        if (results) {
            this.displayBacktestResults(results);
        }

        const equityData = this.state.get('strategy.equityCurve');
        if (equityData) {
            this.drawEquityCurve(equityData);
        }
    }

    updatePeriodValue(value) {
        if (this.elements.periodValue) {
            this.elements.periodValue.textContent = value;
            this.state.update('strategy.period', parseInt(value));
        }
    }

    updateSuccessValue(value) {
        if (this.elements.successValue) {
            this.elements.successValue.textContent = `${value}%`;
            this.state.update('strategy.successTarget', parseInt(value));
        }
    }

    updateStrategyName() {
        if (!this.elements.strategyName) return;

        const indicator = this.elements.indicatorSelect ? this.elements.indicatorSelect.value : 'RSI';
        const entry = this.elements.entryCondition ? this.elements.entryCondition.value : 'cross_above';

        const indicatorNames = {
            'RSI': 'RSI Strategy',
            'EMA': 'Moving Average Strategy',
            'VWAP': 'VWAP Strategy',
            'MACD': 'MACD Strategy',
            'BOLLINGER': 'Bollinger Bands Strategy'
        };

        const entryNames = {
            'cross_above': 'Crossover',
            'cross_below': 'Crossunder',
            'overbought': 'Reversal',
            'oversold': 'Bounce'
        };

        const name = `${indicatorNames[indicator] || 'Custom'} ${entryNames[entry] || 'v1.0'}`;
        this.elements.strategyName.textContent = name;
    }

    getStrategyConfig() {
        return {
            indicator: this.elements.indicatorSelect ? this.elements.indicatorSelect.value : 'RSI',
            entryCondition: this.elements.entryCondition ? this.elements.entryCondition.value : 'cross_above',
            exitCondition: this.elements.exitCondition ? this.elements.exitCondition.value : 'trailing_stop',
            riskReward: this.elements.riskReward ? this.elements.riskReward.value : '1:2',
            period: this.elements.indicatorPeriod ? parseInt(this.elements.indicatorPeriod.value) : 14,
            successTarget: this.elements.successTarget ? parseInt(this.elements.successTarget.value) : 65
        };
    }

    async runBacktest() {
        // Show loading state
        if (this.elements.runBacktest) {
            this.elements.runBacktest.disabled = true;
            this.elements.runBacktest.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
        }

        // Get strategy configuration
        const config = this.getStrategyConfig();

        // Simulate backtest processing
        await this.utils.delay(1500);

        try {
            // Run backtest through state manager
            const results = this.state.runBacktest(config);

            // Display results
            this.displayBacktestResults(results);

            // Update state
            this.state.update('strategy', {
                ...this.state.get('strategy'),
                ...config,
                backtestResults: results
            });

        } catch (error) {
            console.error('Backtest error:', error);
            this.utils.createNotification('error', 'Backtest Failed', error.message);
        } finally {
            // Restore button state
            if (this.elements.runBacktest) {
                this.elements.runBacktest.disabled = false;
                this.elements.runBacktest.innerHTML = '<i class="fas fa-play"></i> Run Backtest';
            }
        }
    }

    displayBacktestResults(results) {
        if (!this.elements.resultsGrid) return;

        const winRateColor = results.winRate >= 70 ? 'positive' :
            results.winRate >= 50 ? 'warning' : 'negative';

        const netPLColor = results.netPL >= 0 ? 'positive' : 'negative';
        const maxDrawdownColor = results.maxDrawdown >= -5 ? 'positive' :
            results.maxDrawdown >= -10 ? 'warning' : 'negative';

        this.elements.resultsGrid.innerHTML = `
            <div class="result-item">
                <div class="result-value ${winRateColor}">${results.winRate}%</div>
                <div class="result-label">Win Rate</div>
                <div class="result-sublabel">${results.profitableTrades}/${results.totalTrades} trades</div>
            </div>
            <div class="result-item">
                <div class="result-value">${results.totalTrades}</div>
                <div class="result-label">Total Trades</div>
                <div class="result-sublabel">${results.profitableTrades}W / ${results.losingTrades}L</div>
            </div>
            <div class="result-item">
                <div class="result-value ${maxDrawdownColor}">${results.maxDrawdown.toFixed(1)}%</div>
                <div class="result-label">Max Drawdown</div>
                <div class="result-sublabel">Peak to trough</div>
            </div>
            <div class="result-item">
                <div class="result-value ${netPLColor}">$${results.netPL.toFixed(2)}</div>
                <div class="result-label">Net P&L</div>
                <div class="result-sublabel">Total profit/loss</div>
            </div>
            <div class="result-item">
                <div class="result-value">${results.sharpeRatio.toFixed(2)}</div>
                <div class="result-label">Sharpe Ratio</div>
                <div class="result-sublabel">Risk-adjusted returns</div>
            </div>
            <div class="result-item">
                <div class="result-value">${results.profitFactor.toFixed(2)}</div>
                <div class="result-label">Profit Factor</div>
                <div class="result-sublabel">Gross profit / gross loss</div>
            </div>
            <div class="result-item">
                <div class="result-value positive">${results.avgWin.toFixed(2)}%</div>
                <div class="result-label">Avg Win</div>
                <div class="result-sublabel">Average winning trade</div>
            </div>
            <div class="result-item">
                <div class="result-value negative">${results.avgLoss.toFixed(2)}%</div>
                <div class="result-label">Avg Loss</div>
                <div class="result-sublabel">Average losing trade</div>
            </div>
        `;
    }

    drawEquityCurve(data) {
        const canvas = this.elements.equityCanvas;
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.clientWidth;
        const height = canvas.height = canvas.clientHeight;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Find min and max equity for scaling
        const equities = data.map(d => d.equity);
        const minEquity = Math.min(...equities);
        const maxEquity = Math.max(...equities);
        const equityRange = maxEquity - minEquity;

        // Add some padding
        const padding = equityRange * 0.1;
        const yMin = minEquity - padding;
        const yMax = maxEquity + padding;
        const yRange = yMax - yMin;

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = height - (height * (i / gridLines));
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // Draw price label
            const price = yMin + (yRange * (i / gridLines));
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`$${price.toFixed(0)}`, width - 5, y - 2);
        }

        // Draw equity curve
        ctx.beginPath();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        data.forEach((point, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((point.equity - yMin) / yRange) * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Fill under curve
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw start and end markers
        if (data.length > 1) {
            // Start marker
            const startX = 0;
            const startY = height - ((data[0].equity - yMin) / yRange) * height;
            this.drawEquityMarker(ctx, startX, startY, 'Start', '#10b981');

            // End marker
            const endX = width;
            const endY = height - ((data[data.length - 1].equity - yMin) / yRange) * height;
            this.drawEquityMarker(ctx, endX, endY, 'End', '#10b981');

            // Draw final value
            const finalEquity = data[data.length - 1].equity;
            const returnPercent = ((finalEquity - data[0].equity) / data[0].equity) * 100;

            ctx.fillStyle = returnPercent >= 0 ? '#10b981' : '#ef4444';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(
                `Final: $${finalEquity.toFixed(2)} (${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(1)}%)`,
                width - 10,
                20
            );
        }
    }

    drawEquityMarker(ctx, x, y, label, color) {
        // Draw circle
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw label
        ctx.fillStyle = color;
        ctx.font = '10px sans-serif';
        ctx.textAlign = x < 50 ? 'left' : 'right';
        ctx.fillText(label, x + (x < 50 ? 8 : -8), y - 8);
    }

    saveStrategy() {
        const config = this.getStrategyConfig();

        // Save to localStorage
        const strategies = JSON.parse(localStorage.getItem('marketmind_strategies') || '[]');
        const newStrategy = {
            id: this.utils.generateId(),
            name: this.elements.strategyName ? this.elements.strategyName.textContent : 'Custom Strategy',
            config: config,
            createdAt: new Date().toISOString(),
            backtestResults: this.state.get('strategy.backtestResults')
        };

        strategies.unshift(newStrategy);
        localStorage.setItem('marketmind_strategies', JSON.stringify(strategies));

        // Update state
        this.state.update('strategy', {
            ...this.state.get('strategy'),
            ...config
        });

        this.utils.createNotification(
            'success',
            'Strategy Saved',
            `${newStrategy.name} has been saved to your strategy library`
        );
    }

    loadStrategy(strategyId) {
        const strategies = JSON.parse(localStorage.getItem('marketmind_strategies') || '[]');
        const strategy = strategies.find(s => s.id === strategyId);

        if (!strategy) {
            this.utils.createNotification('error', 'Strategy Not Found', 'The selected strategy could not be loaded');
            return;
        }

        const { config, backtestResults } = strategy;

        // Update form inputs
        if (this.elements.indicatorSelect) this.elements.indicatorSelect.value = config.indicator;
        if (this.elements.entryCondition) this.elements.entryCondition.value = config.entryCondition;
        if (this.elements.exitCondition) this.elements.exitCondition.value = config.exitCondition;
        if (this.elements.riskReward) this.elements.riskReward.value = config.riskReward;
        if (this.elements.indicatorPeriod) {
            this.elements.indicatorPeriod.value = config.period;
            this.updatePeriodValue(config.period);
        }
        if (this.elements.successTarget) {
            this.elements.successTarget.value = config.successTarget;
            this.updateSuccessValue(config.successTarget);
        }

        // Update strategy name
        if (this.elements.strategyName) {
            this.elements.strategyName.textContent = strategy.name;
        }

        // Update state
        this.state.update('strategy', {
            ...config,
            backtestResults: backtestResults
        });

        // Display backtest results if available
        if (backtestResults) {
            this.displayBacktestResults(backtestResults);
        }

        this.utils.createNotification('success', 'Strategy Loaded', `${strategy.name} has been loaded`);
    }

    getSavedStrategies() {
        return JSON.parse(localStorage.getItem('marketmind_strategies') || '[]');
    }

    deleteStrategy(strategyId) {
        const strategies = JSON.parse(localStorage.getItem('marketmind_strategies') || '[]');
        const filtered = strategies.filter(s => s.id !== strategyId);

        localStorage.setItem('marketmind_strategies', JSON.stringify(filtered));

        this.utils.createNotification('info', 'Strategy Deleted', 'Strategy has been removed from library');

        return filtered;
    }

    exportStrategy() {
        const config = this.getStrategyConfig();
        const backtestResults = this.state.get('strategy.backtestResults');

        const exportData = {
            name: this.elements.strategyName ? this.elements.strategyName.textContent : 'Custom Strategy',
            config: config,
            backtestResults: backtestResults,
            exportDate: new Date().toISOString(),
            version: 'MarketMind Pro v2.1'
        };

        this.utils.exportJSON(exportData, `strategy-${Date.now()}.json`);

        this.utils.createNotification(
            'success',
            'Strategy Exported',
            'Strategy configuration and results have been exported'
        );
    }

    importStrategy(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate imported data
                if (!data.config || !data.name) {
                    throw new Error('Invalid strategy file format');
                }

                // Load the strategy
                const strategies = JSON.parse(localStorage.getItem('marketmind_strategies') || '[]');
                strategies.unshift({
                    ...data,
                    id: this.utils.generateId(),
                    importedAt: new Date().toISOString()
                });

                localStorage.setItem('marketmind_strategies', JSON.stringify(strategies));

                // Load the strategy
                this.loadStrategy(strategies[0].id);

                this.utils.createNotification(
                    'success',
                    'Strategy Imported',
                    `${data.name} has been imported successfully`
                );

            } catch (error) {
                console.error('Import error:', error);
                this.utils.createNotification('error', 'Import Failed', 'Invalid strategy file');
            }
        };

        reader.readAsText(file);
    }

    // Strategy analysis methods
    calculateStrategyMetrics(trades) {
        if (!trades || trades.length === 0) {
            return {
                winRate: 0,
                profitFactor: 0,
                expectancy: 0,
                sharpeRatio: 0,
                maxDrawdown: 0
            };
        }

        const profitableTrades = trades.filter(t => t.profit > 0);
        const losingTrades = trades.filter(t => t.profit <= 0);

        const winRate = (profitableTrades.length / trades.length) * 100;
        const totalProfit = profitableTrades.reduce((sum, t) => sum + t.profit, 0);
        const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : Infinity;

        const avgWin = profitableTrades.length > 0 ? totalProfit / profitableTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
        const expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);

        // Simple Sharpe ratio calculation
        const returns = trades.map(t => t.profit);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
        const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

        // Calculate max drawdown
        let maxDrawdown = 0;
        let peak = -Infinity;
        let trough = Infinity;
        let cumulative = 0;

        trades.forEach(trade => {
            cumulative += trade.profit;
            if (cumulative > peak) peak = cumulative;
            if (cumulative < trough) trough = cumulative;
            const drawdown = ((peak - trough) / peak) * 100;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        return {
            winRate: parseFloat(winRate.toFixed(1)),
            profitFactor: parseFloat(profitFactor.toFixed(2)),
            expectancy: parseFloat(expectancy.toFixed(2)),
            sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
            maxDrawdown: parseFloat(maxDrawdown.toFixed(1)),
            avgWin: parseFloat(avgWin.toFixed(2)),
            avgLoss: parseFloat(avgLoss.toFixed(2)),
            totalTrades: trades.length,
            profitableTrades: profitableTrades.length,
            losingTrades: losingTrades.length
        };
    }

    generateTradeSignals(data, config) {
        const signals = [];

        // This is a simplified signal generation logic
        // In a real application, this would be much more sophisticated

        for (let i = config.period; i < data.length; i++) {
            const slice = data.slice(i - config.period, i);
            const closes = slice.map(d => d.close);
            const currentPrice = data[i].close;

            let signal = null;

            switch (config.indicator) {
                case 'RSI':
                    const rsi = this.calculateRSI(closes, config.period);
                    if (config.entryCondition === 'oversold' && rsi < 30) {
                        signal = 'BUY';
                    } else if (config.entryCondition === 'overbought' && rsi > 70) {
                        signal = 'SELL';
                    }
                    break;

                case 'EMA':
                    const ema = this.calculateEMA(closes, config.period);
                    if (config.entryCondition === 'cross_above' && currentPrice > ema) {
                        signal = 'BUY';
                    } else if (config.entryCondition === 'cross_below' && currentPrice < ema) {
                        signal = 'SELL';
                    }
                    break;

                // Add more indicator logic here
            }

            if (signal) {
                signals.push({
                    index: i,
                    time: data[i].time,
                    price: currentPrice,
                    signal: signal,
                    indicator: config.indicator,
                    confidence: Math.random() * 0.5 + 0.5 // Simulated confidence
                });
            }
        }

        return signals;
    }

    calculateRSI(prices, period) {
        if (prices.length < period) return 50;

        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    calculateEMA(prices, period) {
        if (prices.length < period) return prices[prices.length - 1];

        const multiplier = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }

        return ema;
    }
}