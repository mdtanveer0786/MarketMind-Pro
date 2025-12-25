// Advanced Charting Engine (Canvas-based)

class ChartEngine {
    constructor(state) {
        this.state = state;
        this.utils = window.Utils;
        this.init();
    }

    async init() {
        this.cacheElements();
        this.initCanvas();
        this.setupEventListeners();
        this.setupStateSubscriptions();
        await this.loadChartData();
        this.drawChart();
    }

    cacheElements() {
        this.elements = {
            canvas: document.getElementById('chartCanvas'),
            crosshair: document.getElementById('crosshair'),
            tooltip: document.getElementById('chartTooltip'),
            timeframeBtns: document.querySelectorAll('.timeframe-btn'),
            drawSRBtn: document.getElementById('drawSRBtn'),
            clearDrawingsBtn: document.getElementById('clearDrawingsBtn'),
            zoomInBtn: document.getElementById('zoomIn'),
            zoomOutBtn: document.getElementById('zoomOut'),
            resetZoomBtn: document.getElementById('resetZoom')
        };

        this.canvas = this.elements.canvas;
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    }

    initCanvas() {
        if (!this.canvas || !this.ctx) return;

        // Set canvas size to match display size
        this.resizeCanvas();

        // Chart dimensions
        this.margin = {
            top: 40,
            right: 20,
            bottom: 60,
            left: 70
        };

        // Chart state
        this.chartState = {
            data: [],
            visibleData: [],
            timeframe: '1m',
            isDrawing: false,
            drawings: [],
            zoom: 1,
            pan: 0,
            hoverIndex: -1,
            crosshair: { x: -1, y: -1, visible: false }
        };

        // Color scheme
        this.colors = {
            bull: '#10b981',
            bear: '#ef4444',
            volume: '#3b82f6',
            grid: 'rgba(255, 255, 255, 0.1)',
            text: '#94a3b8',
            background: 'var(--bg-primary)',
            crosshair: 'rgba(255, 255, 255, 0.3)'
        };

        // Drawing tools
        this.drawingTools = {
            activeTool: null,
            tempLine: null,
            supportResistanceLines: []
        };
    }

    resizeCanvas() {
        if (!this.canvas) return;

        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            return true;
        }
        return false;
    }

    setupEventListeners() {
        if (!this.canvas) return;

        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Timeframe buttons
        if (this.elements.timeframeBtns) {
            this.elements.timeframeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const timeframe = btn.dataset.tf;
                    this.setTimeframe(timeframe);
                });
            });
        }

        // Drawing tools
        if (this.elements.drawSRBtn) {
            this.elements.drawSRBtn.addEventListener('click', () => {
                this.toggleDrawingMode();
            });
        }

        if (this.elements.clearDrawingsBtn) {
            this.elements.clearDrawingsBtn.addEventListener('click', () => {
                this.clearDrawings();
            });
        }

        // Zoom controls
        if (this.elements.zoomInBtn) {
            this.elements.zoomInBtn.addEventListener('click', () => this.zoom(1.1));
        }

        if (this.elements.zoomOutBtn) {
            this.elements.zoomOutBtn.addEventListener('click', () => this.zoom(0.9));
        }

        if (this.elements.resetZoomBtn) {
            this.elements.resetZoomBtn.addEventListener('click', () => this.resetView());
        }

        // Window resize
        window.addEventListener('resize', this.utils.debounce(() => {
            if (this.resizeCanvas()) {
                this.drawChart();
            }
        }, 250));
    }

    setupStateSubscriptions() {
        // Subscribe to market changes
        this.state.subscribe('activeMarket', (market) => {
            this.loadChartData();
        });

        // Subscribe to timeframe changes
        this.state.subscribe('chart.timeframe', (timeframe) => {
            if (timeframe && timeframe !== this.chartState.timeframe) {
                this.chartState.timeframe = timeframe;
                this.loadChartData();
            }
        });
    }

    async loadChartData() {
        const market = this.state.get('activeMarket');
        const marketData = this.state.get(`markets.${market}`);

        if (!marketData) return;

        // Generate candle data based on market price and volatility
        const volatility = marketData.volatility === 'High' ? 0.02 :
            marketData.volatility === 'Medium' ? 0.01 : 0.005;

        this.chartState.data = this.utils.generateCandleData(200, marketData.price, volatility);
        this.updateVisibleData();
        this.drawChart();
    }

    updateVisibleData() {
        const data = this.chartState.data;
        const visibleCount = Math.floor((this.canvas.width - this.margin.left - this.margin.right) / 8);

        // Apply zoom and pan
        const start = Math.max(0, data.length - Math.floor(visibleCount / this.chartState.zoom) - this.chartState.pan);
        const end = Math.min(data.length, start + Math.floor(visibleCount / this.chartState.zoom));

        this.chartState.visibleData = data.slice(start, end);
    }

    drawChart() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackground();

        // Calculate price scale
        const priceScale = this.calculatePriceScale();
        if (!priceScale) return;

        // Draw grid
        this.drawGrid(priceScale);

        // Draw volume (if enabled)
        this.drawVolume(priceScale);

        // Draw candlesticks
        this.drawCandlesticks(priceScale);

        // Draw drawings
        this.drawSupportResistanceLines(priceScale);
        this.drawTemporaryLine(priceScale);

        // Draw crosshair if visible
        if (this.chartState.crosshair.visible) {
            this.drawCrosshair(priceScale);
        }

        // Draw price and time scales
        this.drawPriceScale(priceScale);
        this.drawTimeScale();
    }

    drawBackground() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    calculatePriceScale() {
        const data = this.chartState.visibleData;
        if (data.length === 0) return null;

        // Find min and max prices
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        let maxVolume = 0;

        data.forEach(candle => {
            minPrice = Math.min(minPrice, candle.low);
            maxPrice = Math.max(maxPrice, candle.high);
            maxVolume = Math.max(maxVolume, candle.volume);
        });

        // Add some padding
        const range = maxPrice - minPrice;
        minPrice -= range * 0.05;
        maxPrice += range * 0.05;

        return {
            minPrice,
            maxPrice,
            range: maxPrice - minPrice,
            maxVolume,
            chartWidth: this.canvas.width - this.margin.left - this.margin.right,
            chartHeight: this.canvas.height - this.margin.top - this.margin.bottom
        };
    }

    drawGrid(scale) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        // Horizontal grid lines (price levels)
        const priceLevels = 8;
        for (let i = 0; i <= priceLevels; i++) {
            const y = this.margin.top + (scale.chartHeight * (1 - i / priceLevels));
            this.drawDashedLine(this.margin.left, y, this.canvas.width - this.margin.right, y);
        }

        // Vertical grid lines (time divisions)
        const timeDivisions = Math.min(10, this.chartState.visibleData.length);
        const candleWidth = scale.chartWidth / this.chartState.visibleData.length;

        for (let i = 0; i <= timeDivisions; i++) {
            const x = this.margin.left + (scale.chartWidth * (i / timeDivisions));
            this.drawDashedLine(x, this.margin.top, x, this.canvas.height - this.margin.bottom);
        }
    }

    drawDashedLine(x1, y1, x2, y2) {
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 3]);
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawVolume(scale) {
        const data = this.chartState.visibleData;
        if (data.length === 0) return;

        const volumeHeight = 60;
        const volumeTop = this.canvas.height - this.margin.bottom - volumeHeight;
        const candleWidth = scale.chartWidth / data.length;

        this.ctx.fillStyle = `${this.colors.volume}40`;

        data.forEach((candle, i) => {
            const x = this.margin.left + (i * candleWidth) + (candleWidth * 0.1);
            const width = candleWidth * 0.8;
            const height = (candle.volume / scale.maxVolume) * volumeHeight;
            const y = volumeTop + (volumeHeight - height);

            this.ctx.fillRect(x, y, width, height);
        });

        // Draw volume separator line
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, volumeTop);
        this.ctx.lineTo(this.canvas.width - this.margin.right, volumeTop);
        this.ctx.stroke();
    }

    drawCandlesticks(scale) {
        const data = this.chartState.visibleData;
        if (data.length === 0) return;

        const candleWidth = scale.chartWidth / data.length;
        const candleSpacing = candleWidth * 0.1;

        data.forEach((candle, i) => {
            const x = this.margin.left + (i * candleWidth) + candleSpacing;
            const bodyWidth = candleWidth - (candleSpacing * 2);

            // Calculate y positions
            const yOpen = this.priceToY(candle.open, scale);
            const yClose = this.priceToY(candle.close, scale);
            const yHigh = this.priceToY(candle.high, scale);
            const yLow = this.priceToY(candle.low, scale);

            // Determine if bullish or bearish
            const isBullish = candle.close >= candle.open;
            const color = isBullish ? this.colors.bull : this.colors.bear;

            // Draw wick
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x + bodyWidth / 2, yHigh);
            this.ctx.lineTo(x + bodyWidth / 2, yLow);
            this.ctx.stroke();

            // Draw body
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.abs(yOpen - yClose);

            if (bodyHeight > 0) {
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, bodyTop, bodyWidth, bodyHeight);

                // Draw body border
                this.ctx.strokeStyle = color;
                this.ctx.strokeRect(x, bodyTop, bodyWidth, bodyHeight);
            } else {
                // Draw line for doji
                this.ctx.beginPath();
                this.ctx.moveTo(x, bodyTop);
                this.ctx.lineTo(x + bodyWidth, bodyTop);
                this.ctx.stroke();
            }

            // Highlight hovered candle
            if (i === this.chartState.hoverIndex) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x - 2, Math.min(yHigh, yLow) - 2, bodyWidth + 4, Math.abs(yHigh - yLow) + 4);
            }
        });
    }

    drawSupportResistanceLines(scale) {
        this.drawingTools.supportResistanceLines.forEach(line => {
            const y = this.priceToY(line.price, scale);

            this.ctx.strokeStyle = '#8b5cf6';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 3]);

            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.canvas.width - this.margin.right, y);
            this.ctx.stroke();

            this.ctx.setLineDash([]);

            // Draw label
            this.ctx.fillStyle = '#8b5cf6';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`S/R: ${this.utils.formatPrice(line.price)}`, this.margin.left + 5, y - 5);
        });
    }

    drawTemporaryLine(scale) {
        if (!this.drawingTools.tempLine) return;

        const { start, end } = this.drawingTools.tempLine;

        this.ctx.strokeStyle = '#8b5cf6';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawCrosshair(scale) {
        const { x, y } = this.chartState.crosshair;

        // Draw vertical line
        this.ctx.strokeStyle = this.colors.crosshair;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(x, this.margin.top);
        this.ctx.lineTo(x, this.canvas.height - this.margin.bottom);
        this.ctx.stroke();

        // Draw horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, y);
        this.ctx.lineTo(this.canvas.width - this.margin.right, y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawPriceScale(scale) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'right';

        const priceLevels = 8;
        for (let i = 0; i <= priceLevels; i++) {
            const price = scale.minPrice + (scale.range * (i / priceLevels));
            const y = this.margin.top + (scale.chartHeight * (1 - i / priceLevels));

            this.ctx.fillText(this.utils.formatPrice(price), this.margin.left - 10, y + 4);
        }
    }

    drawTimeScale() {
        const data = this.chartState.visibleData;
        if (data.length === 0) return;

        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';

        const timeSteps = 6;
        const step = Math.max(1, Math.floor(data.length / timeSteps));
        const candleWidth = (this.canvas.width - this.margin.left - this.margin.right) / data.length;

        for (let i = 0; i <= timeSteps; i++) {
            const idx = Math.min(i * step, data.length - 1);
            const candle = data[idx];
            const x = this.margin.left + (idx * candleWidth) + (candleWidth / 2);

            let timeStr;
            if (this.chartState.timeframe === '1D') {
                timeStr = candle.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                timeStr = candle.time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            this.ctx.fillText(timeStr, x, this.canvas.height - 30);
        }
    }

    priceToY(price, scale) {
        return this.margin.top + scale.chartHeight * (1 - (price - scale.minPrice) / scale.range);
    }

    yToPrice(y, scale) {
        return scale.minPrice + scale.range * (1 - (y - this.margin.top) / scale.chartHeight);
    }

    // Event Handlers
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.drawingTools.activeTool === 'sr') {
            this.startDrawing(x, y);
        } else {
            this.startPanning(x);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update crosshair
        if (x >= this.margin.left && x <= this.canvas.width - this.margin.right &&
            y >= this.margin.top && y <= this.canvas.height - this.margin.bottom) {

            this.chartState.crosshair = { x, y, visible: true };
            this.updateTooltip(x, y);
        } else {
            this.chartState.crosshair.visible = false;
            this.hideTooltip();
        }

        // Handle drawing
        if (this.drawingTools.isDrawing) {
            this.updateDrawing(x, y);
        }

        // Handle panning
        if (this.isPanning) {
            this.updatePanning(x);
        }

        // Update hover index
        this.updateHoverIndex(x);

        this.drawChart();
    }

    handleMouseUp() {
        if (this.drawingTools.isDrawing) {
            this.finishDrawing();
        }
        this.isPanning = false;
    }

    handleMouseLeave() {
        this.chartState.crosshair.visible = false;
        this.hideTooltip();
        this.drawChart();
    }

    handleWheel(e) {
        e.preventDefault();

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(zoomFactor);
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (this.drawingTools.activeTool === 'sr') {
                this.startDrawing(x, y);
            } else {
                this.startPanning(x);
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.handleMouseMove({ clientX: touch.clientX + rect.left, clientY: touch.clientY + rect.top });
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp();
    }

    // Drawing Methods
    startDrawing(x, y) {
        this.drawingTools.isDrawing = true;
        this.drawingTools.tempLine = {
            start: { x, y },
            end: { x, y }
        };
    }

    updateDrawing(x, y) {
        if (this.drawingTools.tempLine) {
            this.drawingTools.tempLine.end = { x, y };
        }
    }

    finishDrawing() {
        if (!this.drawingTools.tempLine) return;

        const { start, end } = this.drawingTools.tempLine;
        const scale = this.calculatePriceScale();

        if (scale) {
            const price = this.yToPrice((start.y + end.y) / 2, scale);
            this.drawingTools.supportResistanceLines.push({
                price: price,
                type: 'horizontal',
                timestamp: Date.now()
            });
        }

        this.drawingTools.isDrawing = false;
        this.drawingTools.tempLine = null;
        this.drawChart();
    }

    clearDrawings() {
        this.drawingTools.supportResistanceLines = [];
        this.drawChart();

        this.utils.createNotification('info', 'Drawings Cleared', 'All support/resistance lines removed');
    }

    // Panning and Zooming
    startPanning(startX) {
        this.isPanning = true;
        this.panStartX = startX;
        this.originalPan = this.chartState.pan;
    }

    updatePanning(currentX) {
        const delta = currentX - this.panStartX;
        const panSpeed = 0.5;
        this.chartState.pan = this.originalPan + Math.floor(delta * panSpeed);
        this.updateVisibleData();
    }

    zoom(factor) {
        this.chartState.zoom = Math.max(0.5, Math.min(5, this.chartState.zoom * factor));
        this.updateVisibleData();
        this.drawChart();
    }

    pan(amount) {
        this.chartState.pan += amount;
        this.updateVisibleData();
        this.drawChart();
    }

    resetView() {
        this.chartState.zoom = 1;
        this.chartState.pan = 0;
        this.updateVisibleData();
        this.drawChart();

        this.utils.createNotification('info', 'View Reset', 'Chart view has been reset');
    }

    // Tooltip Methods
    updateTooltip(x, y) {
        if (!this.elements.tooltip) return;

        const scale = this.calculatePriceScale();
        if (!scale) return;

        // Find nearest candle
        const candleIndex = this.getCandleIndexAtX(x);
        if (candleIndex === -1) return;

        const candle = this.chartState.visibleData[candleIndex];
        const price = this.yToPrice(y, scale);

        // Update tooltip content
        const timeStr = candle.time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const dateStr = candle.time.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        this.elements.tooltip.innerHTML = `
            <div><strong>Time:</strong> ${dateStr} ${timeStr}</div>
            <div><strong>O:</strong> ${this.utils.formatPrice(candle.open)}</div>
            <div><strong>H:</strong> ${this.utils.formatPrice(candle.high)}</div>
            <div><strong>L:</strong> ${this.utils.formatPrice(candle.low)}</div>
            <div><strong>C:</strong> ${this.utils.formatPrice(candle.close)}</div>
            <div><strong>Volume:</strong> ${this.utils.formatLargeNumber(candle.volume)}</div>
            <div><strong>Cursor:</strong> ${this.utils.formatPrice(price)}</div>
        `;

        // Position tooltip
        this.elements.tooltip.style.display = 'block';
        this.elements.tooltip.style.left = `${Math.min(x + 15, this.canvas.width - 250)}px`;
        this.elements.tooltip.style.top = `${y - 100}px`;
    }

    hideTooltip() {
        if (this.elements.tooltip) {
            this.elements.tooltip.style.display = 'none';
        }
    }

    updateHoverIndex(x) {
        const scale = this.calculatePriceScale();
        if (!scale) return;

        const candleIndex = this.getCandleIndexAtX(x);
        this.chartState.hoverIndex = candleIndex;
    }

    getCandleIndexAtX(x) {
        const scale = this.calculatePriceScale();
        if (!scale) return -1;

        const relativeX = x - this.margin.left;
        const candleWidth = scale.chartWidth / this.chartState.visibleData.length;
        const index = Math.floor(relativeX / candleWidth);

        return index >= 0 && index < this.chartState.visibleData.length ? index : -1;
    }

    // Public Methods
    setTimeframe(timeframe) {
        this.chartState.timeframe = timeframe;
        this.state.update('chart.timeframe', timeframe);

        // Update active button
        if (this.elements.timeframeBtns) {
            this.elements.timeframeBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tf === timeframe);
            });
        }

        this.loadChartData();
    }

    toggleDrawingMode() {
        this.drawingTools.activeTool = this.drawingTools.activeTool === 'sr' ? null : 'sr';

        if (this.elements.drawSRBtn) {
            this.elements.drawSRBtn.classList.toggle('active', this.drawingTools.activeTool === 'sr');
        }

        const message = this.drawingTools.activeTool === 'sr'
            ? 'Drawing mode enabled. Click and drag to draw support/resistance lines.'
            : 'Drawing mode disabled.';

        this.utils.createNotification('info', 'Drawing Mode', message, 3000);
    }

    handleResize() {
        if (this.resizeCanvas()) {
            this.drawChart();
        }
    }

    exportChartData() {
        const data = {
            timestamp: new Date().toISOString(),
            market: this.state.get('activeMarket'),
            timeframe: this.chartState.timeframe,
            candles: this.chartState.data.slice(-100), // Last 100 candles
            drawings: this.drawingTools.supportResistanceLines
        };

        this.utils.exportJSON(data, `chart-data-${Date.now()}.json`);

        this.utils.createNotification(
            'success',
            'Chart Data Exported',
            'Chart data and drawings have been exported'
        );
    }
}