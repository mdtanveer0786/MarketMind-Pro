// Professional Charting with TradingView Lightweight Charts (FREE)
// We'll use the official TradingView Lightweight Charts library

class RealChartEngine {
    constructor(state) {
        this.state = state;
        this.utils = window.Utils;
        this.api = window.MarketDataAPI;
        this.chart = null;
        this.candlestickSeries = null;
        this.volumeSeries = null;
        this.init();
    }

    async init() {
        // Load TradingView Lightweight Charts library
        await this.loadChartLibrary();

        this.cacheElements();
        this.setupEventListeners();
        this.setupStateSubscriptions();
        await this.initChart();
        this.setupRealTimeUpdates();
    }

    async loadChartLibrary() {
        return new Promise((resolve, reject) => {
            if (window.LightweightCharts) {
                resolve();
                return;
            }

            // Load TradingView Lightweight Charts from CDN
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
            script.onload = () => {
                console.log('TradingView Lightweight Charts loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load chart library');
                reject();
            };
            document.head.appendChild(script);
        });
    }

    cacheElements() {
        this.elements = {
            canvas: document.getElementById('chartCanvas'),
            container: document.querySelector('.chart-container'),
            timeframeBtns: document.querySelectorAll('.timeframe-btn'),
            drawSRBtn: document.getElementById('drawSRBtn'),
            clearDrawingsBtn: document.getElementById('clearDrawingsBtn'),
            zoomInBtn: document.getElementById('zoomIn'),
            zoomOutBtn: document.getElementById('zoomOut'),
            resetZoomBtn: document.getElementById('resetZoom')
        };
    }

    setupEventListeners() {
        // Timeframe buttons
        if (this.elements.timeframeBtns) {
            this.elements.timeframeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const timeframe = btn.dataset.tf;
                    this.setTimeframe(timeframe);
                });
            });
        }

        // Chart tools
        if (this.elements.drawSRBtn) {
            this.elements.drawSRBtn.addEventListener('click', () => this.toggleDrawingMode());
        }

        if (this.elements.clearDrawingsBtn) {
            this.elements.clearDrawingsBtn.addEventListener('click', () => this.clearDrawings());
        }

        // Zoom controls
        if (this.elements.zoomInBtn) {
            this.elements.zoomInBtn.addEventListener('click', () => this.zoom(1.2));
        }

        if (this.elements.zoomOutBtn) {
            this.elements.zoomOutBtn.addEventListener('click', () => this.zoom(0.8));
        }

        if (this.elements.resetZoomBtn) {
            this.elements.resetZoomBtn.addEventListener('click', () => this.resetView());
        }

        // Window resize
        window.addEventListener('resize', this.utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Market data events
        window.addEventListener('marketUpdate', (e) => {
            this.handleMarketUpdate(e.detail);
        });

        window.addEventListener('candleUpdate', (e) => {
            this.handleCandleUpdate(e.detail);
        });

        window.addEventListener('chartDataUpdate', (e) => {
            this.handleChartDataUpdate(e.detail);
        });
    }

    setupStateSubscriptions() {
        this.state.subscribe('activeMarket', (market) => {
            this.loadChartData(market);
        });
    }

    async initChart() {
        if (!window.LightweightCharts || !this.elements.container) {
            console.error('Chart library or container not available');
            return;
        }

        try {
            // Create chart container
            const chartContainer = document.createElement('div');
            chartContainer.style.width = '100%';
            chartContainer.style.height = '100%';
            this.elements.container.innerHTML = '';
            this.elements.container.appendChild(chartContainer);

            // Create chart
            this.chart = LightweightCharts.createChart(chartContainer, {
                width: chartContainer.clientWidth,
                height: chartContainer.clientHeight,
                layout: {
                    backgroundColor: 'transparent',
                    textColor: 'var(--text-secondary)',
                },
                grid: {
                    vertLines: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                    horzLines: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                },
                crosshair: {
                    mode: LightweightCharts.CrosshairMode.Normal,
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    timeVisible: true,
                    secondsVisible: false,
                },
                handleScroll: {
                    mouseWheel: true,
                    pressedMouseMove: true,
                },
                handleScale: {
                    axisPressedMouseMove: true,
                    mouseWheel: true,
                }
            });

            // Create candlestick series
            this.candlestickSeries = this.chart.addCandlestickSeries({
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });

            // Create volume series
            this.volumeSeries = this.chart.addHistogramSeries({
                color: 'rgba(59, 130, 246, 0.5)',
                priceFormat: {
                    type: 'volume',
                },
                priceScaleId: '', // Place volume in its own scale
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });

            // Add price line for current price
            this.priceLine = this.candlestickSeries.createPriceLine({
                price: 0,
                color: '#2962ff',
                lineWidth: 1,
                lineStyle: 2, // Dashed
                axisLabelVisible: true,
                title: 'Current',
            });

            // Add moving averages
            this.addTechnicalIndicators();

            // Subscribe to crosshair move for tooltips
            this.chart.subscribeCrosshairMove(this.handleCrosshairMove.bind(this));

            // Load initial data
            const activeMarket = this.state.get('activeMarket');
            await this.loadChartData(activeMarket);

            // Apply theme
            this.applyTheme();

        } catch (error) {
            console.error('Chart initialization failed:', error);
            this.fallbackToCanvasChart();
        }
    }

    fallbackToCanvasChart() {
        console.log('Falling back to canvas chart');
        // Use our existing canvas-based chart if TradingView fails
        const existingChart = new ChartEngine(this.state);
        existingChart.init();
    }

    async loadChartData(market) {
        if (!this.candlestickSeries || !this.api) return;

        try {
            // Show loading
            this.showLoading(true);

            const symbol = this.api.getSymbol(market);
            const timeframe = this.state.get('chart.timeframe') || '1d';

            // Map our timeframe to API interval
            const intervalMap = {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '1H': '1h',
                '4H': '4h',
                '1D': '1d'
            };

            const apiInterval = intervalMap[timeframe] || '1d';

            // Fetch historical data
            const historicalData = await this.api.fetchHistoricalData(market, apiInterval, 100);

            if (historicalData && historicalData.length > 0) {
                // Format data for TradingView
                const candles = historicalData.map(candle => ({
                    time: Math.floor(candle.time / 1000), // Convert to seconds
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close
                }));

                const volumes = historicalData.map(candle => ({
                    time: Math.floor(candle.time / 1000),
                    value: candle.volume,
                    color: candle.close >= candle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
                }));

                // Set data
                this.candlestickSeries.setData(candles);
                this.volumeSeries.setData(volumes);

                // Calculate and add indicators
                this.updateIndicators(candles);

                // Fit content
                this.chart.timeScale().fitContent();

                // Update current price line
                const latestPrice = candles[candles.length - 1].close;
                this.priceLine.applyOptions({ price: latestPrice });
            }

            this.showLoading(false);

        } catch (error) {
            console.error('Error loading chart data:', error);
            this.showLoading(false);
        }
    }

    addTechnicalIndicators() {
        // Add moving averages
        this.ma20Series = this.chart.addLineSeries({
            color: 'rgba(41, 98, 255, 0.8)',
            lineWidth: 1,
            title: 'MA 20',
        });

        this.ma50Series = this.chart.addLineSeries({
            color: 'rgba(156, 39, 176, 0.8)',
            lineWidth: 1,
            title: 'MA 50',
        });

        // Add RSI indicator (separate pane)
        this.rsiPane = this.chart.addPane({
            height: 100,
        });

        this.rsiSeries = this.rsiPane.addLineSeries({
            color: '#8b5cf6',
            lineWidth: 2,
            title: 'RSI',
        });

        // Add RSI levels
        this.rsiPane.addLineSeries({
            data: [{ time: 0, value: 70 }, { time: Date.now() / 1000, value: 70 }],
            color: 'rgba(239, 83, 80, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
        });

        this.rsiPane.addLineSeries({
            data: [{ time: 0, value: 30 }, { time: Date.now() / 1000, value: 30 }],
            color: 'rgba(38, 166, 154, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
        });
    }

    updateIndicators(candles) {
        if (!candles || candles.length < 50) return;

        const closes = candles.map(c => c.close);

        // Calculate moving averages
        const ma20 = this.calculateMA(closes, 20);
        const ma50 = this.calculateMA(closes, 50);

        // Format MA data
        const ma20Data = candles.slice(19).map((candle, i) => ({
            time: candle.time,
            value: ma20[i]
        }));

        const ma50Data = candles.slice(49).map((candle, i) => ({
            time: candle.time,
            value: ma50[i]
        }));

        // Update MA series
        this.ma20Series.setData(ma20Data);
        this.ma50Series.setData(ma50Data);

        // Calculate RSI
        const rsi = this.calculateRSI(closes, 14);
        const rsiData = candles.slice(13).map((candle, i) => ({
            time: candle.time,
            value: rsi[i]
        }));

        // Update RSI series
        this.rsiSeries.setData(rsiData);
    }

    calculateMA(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }

    calculateRSI(data, period) {
        const gains = [];
        const losses = [];

        for (let i = 1; i < data.length; i++) {
            const change = data[i] - data[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? -change : 0);
        }

        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

        const rsi = [100 - (100 / (1 + avgGain / avgLoss))];

        for (let i = period; i < gains.length; i++) {
            avgGain = (avgGain * (period - 1) + gains[i]) / period;
            avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
            const rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }

        return rsi;
    }

    handleMarketUpdate({ symbol, data }) {
        const marketKey = this.api.getMarketKey(symbol);
        const activeMarket = this.state.get('activeMarket');

        if (marketKey === activeMarket && this.priceLine) {
            // Update price line
            this.priceLine.applyOptions({ price: data.price });

            // Update chart title with latest price
            this.updateChartTitle(data);
        }
    }

    handleCandleUpdate({ symbol, candle }) {
        const marketKey = this.api.getMarketKey(symbol);
        const activeMarket = this.state.get('activeMarket');

        if (marketKey === activeMarket && this.candlestickSeries) {
            const tvCandle = {
                time: Math.floor(candle.time / 1000),
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close
            };

            // Update or add candle
            this.candlestickSeries.update(tvCandle);

            // Update volume
            if (this.volumeSeries) {
                const volumeBar = {
                    time: Math.floor(candle.time / 1000),
                    value: candle.volume,
                    color: candle.close >= candle.open ?
                        'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
                };
                this.volumeSeries.update(volumeBar);
            }
        }
    }

    handleChartDataUpdate({ symbol, candles }) {
        const marketKey = this.api.getMarketKey(symbol);
        const activeMarket = this.state.get('activeMarket');

        if (marketKey === activeMarket && this.candlestickSeries) {
            const tvCandles = candles.map(candle => ({
                time: Math.floor(candle.time / 1000),
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close
            }));

            const tvVolumes = candles.map(candle => ({
                time: Math.floor(candle.time / 1000),
                value: candle.volume,
                color: candle.close >= candle.open ?
                    'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
            }));

            this.candlestickSeries.setData(tvCandles);
            this.volumeSeries.setData(tvVolumes);

            // Update indicators
            this.updateIndicators(tvCandles);
        }
    }

    handleCrosshairMove(param) {
        if (!param.time || !param.point || !this.elements.container) return;

        const chartContainer = this.elements.container;
        const tooltip = chartContainer.querySelector('.chart-tooltip') || this.createTooltip();

        const data = param.seriesData.get(this.candlestickSeries);
        if (!data) {
            tooltip.style.display = 'none';
            return;
        }

        const price = data.close;
        const high = data.high;
        const low = data.low;
        const open = data.open;
        const change = price - open;
        const changePercent = (change / open) * 100;

        const date = new Date(param.time * 1000);
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        tooltip.innerHTML = `
            <div class="tooltip-header">
                <strong>${dateStr} ${timeStr}</strong>
            </div>
            <div class="tooltip-grid">
                <div>Open: <span class="tooltip-value">${this.utils.formatPrice(open)}</span></div>
                <div>High: <span class="tooltip-value">${this.utils.formatPrice(high)}</span></div>
                <div>Low: <span class="tooltip-value">${this.utils.formatPrice(low)}</span></div>
                <div>Close: <span class="tooltip-value">${this.utils.formatPrice(price)}</span></div>
                <div>Change: <span class="tooltip-value ${change >= 0 ? 'positive' : 'negative'}">
                    ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)
                </span></div>
            </div>
        `;

        // Position tooltip
        const containerRect = chartContainer.getBoundingClientRect();
        const x = param.point.x + containerRect.left;
        const y = param.point.y + containerRect.top;

        tooltip.style.left = `${x + 10}px`;
        tooltip.style.top = `${y - 150}px`;
        tooltip.style.display = 'block';
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 6px;
            padding: 12px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            display: none;
            min-width: 200px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        this.elements.container.appendChild(tooltip);
        return tooltip;
    }

    updateChartTitle(data) {
        const titleElement = document.querySelector('.chart-title');
        if (titleElement) {
            const changeClass = data.change >= 0 ? 'positive' : 'negative';
            const changeSign = data.change >= 0 ? '+' : '';

            titleElement.innerHTML = `
                ${data.symbol} 
                <span class="price">${this.utils.formatPrice(data.price)}</span>
                <span class="change ${changeClass}">
                    ${changeSign}${data.change.toFixed(2)} (${changeSign}${data.changePercent.toFixed(2)}%)
                </span>
            `;
        }
    }

    setTimeframe(timeframe) {
        this.state.update('chart.timeframe', timeframe);

        // Update active button
        if (this.elements.timeframeBtns) {
            this.elements.timeframeBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tf === timeframe);
            });
        }

        // Reload chart data with new timeframe
        const activeMarket = this.state.get('activeMarket');
        this.loadChartData(activeMarket);
    }

    toggleDrawingMode() {
        // Implement drawing tools
        const isDrawing = this.state.get('chart.drawingMode');
        this.state.update('chart.drawingMode', !isDrawing);

        if (this.elements.drawSRBtn) {
            this.elements.drawSRBtn.classList.toggle('active', !isDrawing);
        }

        const message = !isDrawing ?
            'Drawing mode enabled. Click on chart to draw support/resistance lines.' :
            'Drawing mode disabled.';

        this.utils.createNotification('info', 'Drawing Mode', message, 3000);
    }

    clearDrawings() {
        // Remove all drawings
        const drawings = this.state.get('chart.drawings') || [];
        drawings.forEach(drawing => {
            if (drawing.line) {
                this.chart.removeEntity(drawing.line);
            }
        });

        this.state.update('chart.drawings', []);
        this.utils.createNotification('info', 'Drawings Cleared', 'All drawings removed');
    }

    zoom(factor) {
        if (!this.chart) return;

        const timeScale = this.chart.timeScale();
        const visibleRange = timeScale.getVisibleRange();

        if (visibleRange) {
            const range = visibleRange.to - visibleRange.from;
            const newRange = range * factor;
            const center = (visibleRange.from + visibleRange.to) / 2;

            timeScale.setVisibleRange({
                from: center - newRange / 2,
                to: center + newRange / 2
            });
        }
    }

    resetView() {
        if (this.chart) {
            this.chart.timeScale().fitContent();
        }
    }

    handleResize() {
        if (this.chart && this.elements.container) {
            const container = this.elements.container;
            this.chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight
            });
        }
    }

    applyTheme() {
        if (!this.chart) return;

        const isDark = this.state.get('theme') === 'dark';

        this.chart.applyOptions({
            layout: {
                backgroundColor: 'transparent',
                textColor: isDark ? '#a0aec0' : '#4a5568',
            },
            grid: {
                vertLines: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
                horzLines: {
                    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
            },
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }
        });
    }

    setupRealTimeUpdates() {
        // Subscribe to real-time updates
        this.state.subscribe('theme', () => {
            this.applyTheme();
        });
    }

    showLoading(show) {
        const loadingElement = this.elements.container.querySelector('.chart-loading');

        if (show) {
            if (!loadingElement) {
                const loader = document.createElement('div');
                loader.className = 'chart-loading';
                loader.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Loading chart data...</div>
                `;
                loader.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                `;
                this.elements.container.appendChild(loader);
            }
        } else {
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }

    // Export chart as image
    exportChart() {
        if (!this.chart) return;

        const chartContainer = this.elements.container.querySelector('div[class*="tv-lightweight-charts"]');
        if (!chartContainer) return;

        html2canvas(chartContainer).then(canvas => {
            const link = document.createElement('a');
            link.download = `chart-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    // Add drawing tools
    addDrawingTool(type, points) {
        if (!this.chart) return;

        let drawing;

        switch (type) {
            case 'horizontal':
                drawing = this.chart.createPriceLine({
                    price: points.price,
                    color: '#8b5cf6',
                    lineWidth: 2,
                    lineStyle: 2,
                    title: 'S/R'
                });
                break;

            case 'trendline':
                drawing = this.chart.createTrendLine({
                    points: points.map(p => ({ time: p.time, price: p.price })),
                    color: '#f59e0b',
                    lineWidth: 2,
                    lineStyle: 0
                });
                break;

            case 'fibonacci':
                // Implement Fibonacci retracement
                const levels = this.calculateFibonacci(points.high, points.low);
                drawing = Object.entries(levels).map(([level, price]) =>
                    this.chart.createPriceLine({
                        price: price,
                        color: '#10b981',
                        lineWidth: 1,
                        lineStyle: 2,
                        title: level
                    })
                );
                break;
        }

        // Save drawing reference
        const drawings = this.state.get('chart.drawings') || [];
        drawings.push({ type, points, line: drawing });
        this.state.update('chart.drawings', drawings);

        return drawing;
    }

    calculateFibonacci(high, low) {
        const diff = high - low;
        return {
            '0.0': high,
            '0.236': high - diff * 0.236,
            '0.382': high - diff * 0.382,
            '0.5': high - diff * 0.5,
            '0.618': high - diff * 0.618,
            '0.786': high - diff * 0.786,
            '1.0': low
        };
    }

    // Add technical studies
    addStudy(studyType) {
        if (!this.chart) return;

        switch (studyType) {
            case 'bollinger':
                this.addBollingerBands();
                break;
            case 'macd':
                this.addMACD();
                break;
            case 'stochastic':
                this.addStochastic();
                break;
        }
    }

    addBollingerBands() {
        if (!this.candlestickSeries || !this.chart) return;

        // Get price data
        const data = this.candlestickSeries.data();
        if (!data || data.length < 20) return;

        const closes = data.map(d => d.close);

        // Calculate Bollinger Bands
        const period = 20;
        const stdDev = 2;
        const middleBand = this.calculateSMA(closes, period);
        const std = this.calculateStdDev(closes, period);

        const upperBand = middleBand.map((sma, i) => sma + (std[i] * stdDev));
        const lowerBand = middleBand.map((sma, i) => sma - (std[i] * stdDev));

        // Add bands to chart
        const upperSeries = this.chart.addLineSeries({
            color: 'rgba(59, 130, 246, 0.7)',
            lineWidth: 1,
            title: 'BB Upper'
        });

        const middleSeries = this.chart.addLineSeries({
            color: 'rgba(156, 39, 176, 0.7)',
            lineWidth: 1,
            title: 'BB Middle'
        });

        const lowerSeries = this.chart.addLineSeries({
            color: 'rgba(59, 130, 246, 0.7)',
            lineWidth: 1,
            title: 'BB Lower'
        });

        // Format data
        const bandData = data.slice(period - 1);
        const upperData = bandData.map((d, i) => ({ time: d.time, value: upperBand[i] }));
        const middleData = bandData.map((d, i) => ({ time: d.time, value: middleBand[i] }));
        const lowerData = bandData.map((d, i) => ({ time: d.time, value: lowerBand[i] }));

        upperSeries.setData(upperData);
        middleSeries.setData(middleData);
        lowerSeries.setData(lowerData);
    }

    calculateSMA(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }

    calculateStdDev(data, period) {
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            const slice = data.slice(i - period + 1, i + 1);
            const mean = slice.reduce((a, b) => a + b, 0) / period;
            const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
            result.push(Math.sqrt(variance));
        }
        return result;
    }

    // Cleanup
    destroy() {
        if (this.chart) {
            // Remove event listeners
            this.chart.unsubscribeCrosshairMove();

            // Remove chart
            this.chart.remove();
            this.chart = null;
        }

        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize globally
window.RealChartEngine = RealChartEngine;