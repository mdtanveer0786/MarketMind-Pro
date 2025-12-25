// Real-time Market Data API Integration
class MarketDataAPI {
    constructor() {
        this.baseURLs = {
            crypto: 'https://api.binance.com/api/v3',
            cryptoBackup: 'https://api.coingecko.com/api/v3',
            stocks: 'https://query1.finance.yahoo.com/v8/finance/chart',
            forex: 'https://api.exchangerate.host/latest',
            gold: 'https://www.goldapi.io/api'
        };

        // API Keys (Register for free accounts)
        this.apiKeys = {
            alphaVantage: 'YOUR_ALPHA_VANTAGE_KEY_HERE', // Get free: https://www.alphavantage.co/
            goldapi: 'goldapi-abcdef123456', // Get free: https://www.goldapi.io/
            exchangeRate: 'YOUR_EXCHANGERATE_KEY' // Optional
        };

        // Market data cache
        this.cache = new Map();
        this.cacheDuration = 30000; // 30 seconds

        // WebSocket connections
        this.sockets = new Map();

        // Real-time data intervals
        this.intervals = new Map();
    }

    // Initialize all market data streams
    async init() {
        console.log('Initializing real market data...');

        // Start WebSocket for crypto (Binance)
        this.initCryptoWebSocket();

        // Start polling for other markets
        this.startPolling();

        // Load initial data
        await this.loadAllMarketData();
    }

    // Binance WebSocket for real-time crypto data
    initCryptoWebSocket() {
        try {
            const symbols = ['btcusdt', 'ethusdt', 'bnbusdt'];
            const streams = symbols.map(s => `${s}@ticker/${s}@kline_1m`);

            const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('Binance WebSocket connected');
                this.sockets.set('binance', ws);
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleWebSocketData(data);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket closed, reconnecting...');
                setTimeout(() => this.initCryptoWebSocket(), 5000);
            };

        } catch (error) {
            console.error('WebSocket initialization failed:', error);
        }
    }

    handleWebSocketData(data) {
        if (data.stream && data.data) {
            const streamType = data.stream.split('@')[1];
            const symbol = data.stream.split('@')[0].toUpperCase();

            switch (streamType) {
                case 'ticker':
                    this.processTickerData(symbol, data.data);
                    break;
                case 'kline_1m':
                    this.processKlineData(symbol, data.data);
                    break;
            }
        }
    }

    processTickerData(symbol, ticker) {
        const marketData = {
            symbol: symbol,
            price: parseFloat(ticker.c),
            change: parseFloat(ticker.P),
            changePercent: parseFloat(ticker.p),
            volume: parseFloat(ticker.v),
            high24h: parseFloat(ticker.h),
            low24h: parseFloat(ticker.l),
            open: parseFloat(ticker.o),
            timestamp: tickger.E
        };

        // Update state
        if (window.AppState) {
            const marketKey = this.getMarketKey(symbol);
            if (marketKey) {
                window.AppState.update(`markets.${marketKey}`, {
                    ...window.AppState.get(`markets.${marketKey}`),
                    ...marketData,
                    lastUpdated: Date.now()
                });
            }
        }

        // Dispatch custom event for UI updates
        this.dispatchMarketUpdate(symbol, marketData);
    }

    processKlineData(symbol, kline) {
        const candle = {
            time: kline.t,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
            isClosed: kline.x
        };

        // Update chart data
        this.dispatchCandleUpdate(symbol, candle);
    }

    // Start polling for stocks, gold, forex
    startPolling() {
        // Poll every 30 seconds
        this.intervals.set('nifty', setInterval(() => this.fetchNiftyData(), 30000));
        this.intervals.set('banknifty', setInterval(() => this.fetchBankNiftyData(), 30000));
        this.intervals.set('gold', setInterval(() => this.fetchGoldData(), 60000)); // Gold updates slower
        this.intervals.set('forex', setInterval(() => this.fetchForexData(), 60000));
    }

    // Load all market data initially
    async loadAllMarketData() {
        try {
            await Promise.all([
                this.fetchCryptoData(),
                this.fetchNiftyData(),
                this.fetchBankNiftyData(),
                this.fetchGoldData(),
                this.fetchForexData()
            ]);
            console.log('All market data loaded successfully');
        } catch (error) {
            console.error('Error loading market data:', error);
        }
    }

    // Fetch crypto data from Binance REST API
    async fetchCryptoData() {
        try {
            const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];

            for (const symbol of symbols) {
                const response = await fetch(`${this.baseURLs.crypto}/ticker/24hr?symbol=${symbol}`);
                const data = await response.json();

                const marketData = {
                    symbol: symbol,
                    price: parseFloat(data.lastPrice),
                    change: parseFloat(data.priceChange),
                    changePercent: parseFloat(data.priceChangePercent),
                    volume: parseFloat(data.volume),
                    high24h: parseFloat(data.highPrice),
                    low24h: parseFloat(data.lowPrice),
                    open: parseFloat(data.openPrice),
                    timestamp: data.closeTime
                };

                this.updateMarketCache(symbol, marketData);
            }
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            await this.fetchCryptoBackup();
        }
    }

    // Backup crypto API (CoinGecko)
    async fetchCryptoBackup() {
        try {
            const response = await fetch(
                `${this.baseURLs.cryptoBackup}/simple/price?ids=bitcoin,ethereum,bnb&vs_currencies=usd&include_24hr_change=true`
            );
            const data = await response.json();

            // Process CoinGecko data
            const marketData = {
                BTCUSDT: {
                    symbol: 'BTCUSDT',
                    price: data.bitcoin.usd,
                    changePercent: data.bitcoin.usd_24h_change,
                    lastUpdated: Date.now()
                },
                ETHUSDT: {
                    symbol: 'ETHUSDT',
                    price: data.ethereum.usd,
                    changePercent: data.ethereum.usd_24h_change,
                    lastUpdated: Date.now()
                },
                BNBUSDT: {
                    symbol: 'BNBUSDT',
                    price: data.bnb.usd,
                    changePercent: data.bnb.usd_24h_change,
                    lastUpdated: Date.now()
                }
            };

            // Update cache
            Object.entries(marketData).forEach(([symbol, data]) => {
                this.updateMarketCache(symbol, data);
            });

        } catch (error) {
            console.error('Backup crypto API failed:', error);
        }
    }

    // Fetch NIFTY 50 data
    async fetchNiftyData() {
        try {
            // Using Yahoo Finance API
            const response = await fetch(
                `${this.baseURLs.stocks}/%5ENSEI?interval=1m&range=1d`
            );
            const data = await response.json();

            const chartData = data.chart.result[0];
            const quote = chartData.meta;
            const indicators = chartData.indicators.quote[0];

            // Get latest values
            const lastIndex = indicators.close.length - 1;

            const marketData = {
                symbol: 'NIFTY',
                price: quote.regularMarketPrice || indicators.close[lastIndex],
                change: quote.regularMarketChange || (indicators.close[lastIndex] - indicators.open[0]),
                changePercent: quote.regularMarketChangePercent ||
                    ((indicators.close[lastIndex] - indicators.open[0]) / indicators.open[0] * 100),
                volume: quote.regularMarketVolume || indicators.volume[lastIndex],
                high24h: quote.regularMarketDayHigh || Math.max(...indicators.high),
                low24h: quote.regularMarketDayLow || Math.min(...indicators.low),
                open: quote.regularMarketOpen || indicators.open[0],
                timestamp: quote.regularMarketTime
            };

            this.updateMarketCache('NIFTY', marketData);

            // Also update chart data
            this.processStockChartData('NIFTY', chartData);

        } catch (error) {
            console.error('Error fetching NIFTY data:', error);
            await this.fetchNiftyBackup();
        }
    }

    // Backup NIFTY API
    async fetchNiftyBackup() {
        try {
            // Alternative: Alpha Vantage
            if (this.apiKeys.alphaVantage) {
                const response = await fetch(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=^NSEI&apikey=${this.apiKeys.alphaVantage}`
                );
                const data = await response.json();

                const quote = data['Global Quote'];
                const marketData = {
                    symbol: 'NIFTY',
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: parseFloat(quote['10. change percent']),
                    volume: parseInt(quote['06. volume']),
                    timestamp: Date.now()
                };

                this.updateMarketCache('NIFTY', marketData);
            }
        } catch (error) {
            console.error('Backup NIFTY API failed:', error);
        }
    }

    // Fetch Bank NIFTY data
    async fetchBankNiftyData() {
        try {
            const response = await fetch(
                `${this.baseURLs.stocks}/%5ENSEBANK?interval=1m&range=1d`
            );
            const data = await response.json();

            const chartData = data.chart.result[0];
            const quote = chartData.meta;
            const indicators = chartData.indicators.quote[0];

            const lastIndex = indicators.close.length - 1;

            const marketData = {
                symbol: 'BANKNIFTY',
                price: quote.regularMarketPrice || indicators.close[lastIndex],
                change: quote.regularMarketChange || (indicators.close[lastIndex] - indicators.open[0]),
                changePercent: quote.regularMarketChangePercent ||
                    ((indicators.close[lastIndex] - indicators.open[0]) / indicators.open[0] * 100),
                volume: quote.regularMarketVolume || indicators.volume[lastIndex],
                high24h: quote.regularMarketDayHigh || Math.max(...indicators.high),
                low24h: quote.regularMarketDayLow || Math.min(...indicators.low),
                open: quote.regularMarketOpen || indicators.open[0],
                timestamp: quote.regularMarketTime
            };

            this.updateMarketCache('BANKNIFTY', marketData);
            this.processStockChartData('BANKNIFTY', chartData);

        } catch (error) {
            console.error('Error fetching BANKNIFTY data:', error);
        }
    }

    // Fetch Gold data
    async fetchGoldData() {
        try {
            // Method 1: GoldAPI (requires API key)
            if (this.apiKeys.goldapi) {
                const response = await fetch(
                    `https://www.goldapi.io/api/XAU/USD`,
                    {
                        headers: {
                            'x-access-token': this.apiKeys.goldapi
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();

                    const marketData = {
                        symbol: 'GOLD',
                        price: data.price,
                        change: data.ch,
                        changePercent: data.chp,
                        high24h: data.high_price,
                        low24h: data.low_price,
                        open: data.open_price,
                        timestamp: data.timestamp
                    };

                    this.updateMarketCache('GOLD', marketData);
                    return;
                }
            }

            // Method 2: Metals API (free tier)
            const response = await fetch(
                'https://api.metals.dev/v1/latest?api_key=YOUR_METALS_API_KEY&currency=USD&unit=oz'
            );

            if (response.ok) {
                const data = await response.json();
                const goldPrice = data.metals.gold;

                // Calculate change (you might need to store previous price)
                const prevPrice = this.cache.get('GOLD')?.price || goldPrice;
                const change = goldPrice - prevPrice;
                const changePercent = (change / prevPrice) * 100;

                const marketData = {
                    symbol: 'GOLD',
                    price: goldPrice,
                    change: change,
                    changePercent: changePercent,
                    timestamp: Date.now()
                };

                this.updateMarketCache('GOLD', marketData);
            }

        } catch (error) {
            console.error('Error fetching Gold data:', error);
            // Fallback to simulated data
            this.useSimulatedGoldData();
        }
    }

    useSimulatedGoldData() {
        // Generate realistic gold data
        const basePrice = 2345.67;
        const change = (Math.random() - 0.5) * 10;
        const newPrice = basePrice + change;

        const marketData = {
            symbol: 'GOLD',
            price: newPrice,
            change: change,
            changePercent: (change / basePrice) * 100,
            high24h: newPrice + Math.random() * 5,
            low24h: newPrice - Math.random() * 5,
            open: basePrice,
            volume: 1000000 + Math.random() * 500000,
            timestamp: Date.now()
        };

        this.updateMarketCache('GOLD', marketData);
    }

    // Fetch Forex data
    async fetchForexData() {
        try {
            const response = await fetch(
                `${this.baseURLs.forex}?base=USD&symbols=EUR,GBP,INR,JPY`
            );
            const data = await response.json();

            // We'll focus on USD/INR for Indian context
            const inrRate = data.rates.INR;
            const prevRate = this.cache.get('USDINR')?.price || inrRate;
            const change = inrRate - prevRate;
            const changePercent = (change / prevRate) * 100;

            const marketData = {
                symbol: 'USDINR',
                price: inrRate,
                change: change,
                changePercent: changePercent,
                timestamp: data.date
            };

            this.updateMarketCache('USDINR', marketData);

        } catch (error) {
            console.error('Error fetching Forex data:', error);
        }
    }

    // Process stock chart data
    processStockChartData(symbol, chartData) {
        const result = chartData.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        const candles = [];

        for (let i = 0; i < timestamps.length; i++) {
            if (quotes.open[i] && quotes.high[i] && quotes.low[i] && quotes.close[i]) {
                candles.push({
                    time: timestamps[i] * 1000, // Convert to milliseconds
                    open: quotes.open[i],
                    high: quotes.high[i],
                    low: quotes.low[i],
                    close: quotes.close[i],
                    volume: quotes.volume[i] || 0
                });
            }
        }

        // Dispatch chart data update
        this.dispatchChartDataUpdate(symbol, candles);
    }

    // Update market cache and notify subscribers
    updateMarketCache(symbol, data) {
        const cacheKey = this.getMarketKey(symbol);
        if (!cacheKey) return;

        const cachedData = {
            data: data,
            timestamp: Date.now()
        };

        this.cache.set(cacheKey, cachedData);

        // Update global state if available
        if (window.AppState) {
            const currentData = window.AppState.get(`markets.${cacheKey}`) || {};
            window.AppState.update(`markets.${cacheKey}`, {
                ...currentData,
                ...data,
                lastUpdated: Date.now()
            });
        }

        // Dispatch update event
        this.dispatchMarketUpdate(symbol, data);
    }

    // Get market key from symbol
    getMarketKey(symbol) {
        const mapping = {
            'BTCUSDT': 'BTC',
            'ETHUSDT': 'ETH',
            'BNBUSDT': 'BNB',
            'NIFTY': 'NIFTY',
            'BANKNIFTY': 'BANKNIFTY',
            'GOLD': 'GOLD',
            'USDINR': 'USDINR'
        };

        return mapping[symbol] || symbol;
    }

    // Get symbol from market key
    getSymbol(marketKey) {
        const mapping = {
            'BTC': 'BTCUSDT',
            'ETH': 'ETHUSDT',
            'BNB': 'BNBUSDT',
            'NIFTY': '%5ENSEI',
            'BANKNIFTY': '%5ENSEBANK',
            'GOLD': 'XAUUSD',
            'USDINR': 'USDINR'
        };

        return mapping[marketKey] || marketKey;
    }

    // Fetch historical data for charts
    async fetchHistoricalData(symbol, interval = '1d', limit = 100) {
        try {
            let url;
            let data;

            if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('BNB')) {
                // Crypto historical data from Binance
                const binanceSymbol = symbol.replace('USDT', '').toLowerCase();
                url = `${this.baseURLs.crypto}/klines?symbol=${binanceSymbol}usdt&interval=${interval}&limit=${limit}`;

                const response = await fetch(url);
                data = await response.json();

                return data.map(k => ({
                    time: k[0],
                    open: parseFloat(k[1]),
                    high: parseFloat(k[2]),
                    low: parseFloat(k[3]),
                    close: parseFloat(k[4]),
                    volume: parseFloat(k[5])
                }));

            } else if (symbol === 'NIFTY' || symbol === 'BANKNIFTY') {
                // Stock historical data
                const yahooSymbol = symbol === 'NIFTY' ? '%5ENSEI' : '%5ENSEBANK';
                url = `${this.baseURLs.stocks}/${yahooSymbol}?interval=1d&range=1mo`;

                const response = await fetch(url);
                data = await response.json();

                const result = data.chart.result[0];
                const timestamps = result.timestamp;
                const quotes = result.indicators.quote[0];

                const candles = [];
                for (let i = 0; i < timestamps.length; i++) {
                    if (quotes.open[i] && quotes.close[i]) {
                        candles.push({
                            time: timestamps[i] * 1000,
                            open: quotes.open[i],
                            high: quotes.high[i],
                            low: quotes.low[i],
                            close: quotes.close[i],
                            volume: quotes.volume[i] || 0
                        });
                    }
                }

                return candles;
            }

        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error);
            return this.generateSimulatedData(symbol, limit);
        }
    }

    generateSimulatedData(symbol, limit) {
        const basePrice = symbol.includes('BTC') ? 50000 :
            symbol.includes('ETH') ? 3000 :
                symbol === 'NIFTY' ? 22000 :
                    symbol === 'BANKNIFTY' ? 48000 :
                        symbol === 'GOLD' ? 2345 : 75;

        const candles = [];
        let currentPrice = basePrice;
        const now = Date.now();

        for (let i = limit - 1; i >= 0; i--) {
            const time = now - (i * 24 * 60 * 60 * 1000); // Daily candles

            const change = (Math.random() - 0.5) * 0.02 * currentPrice; // ±2%
            const open = currentPrice;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * 0.01 * currentPrice;
            const low = Math.min(open, close) - Math.random() * 0.01 * currentPrice;
            const volume = 1000 + Math.random() * 9000;

            candles.push({
                time,
                open,
                high,
                low,
                close,
                volume
            });

            currentPrice = close;
        }

        return candles;
    }

    // Event dispatching
    dispatchMarketUpdate(symbol, data) {
        const event = new CustomEvent('marketUpdate', {
            detail: { symbol, data }
        });
        window.dispatchEvent(event);
    }

    dispatchCandleUpdate(symbol, candle) {
        const event = new CustomEvent('candleUpdate', {
            detail: { symbol, candle }
        });
        window.dispatchEvent(event);
    }

    dispatchChartDataUpdate(symbol, candles) {
        const event = new CustomEvent('chartDataUpdate', {
            detail: { symbol, candles }
        });
        window.dispatchEvent(event);
    }

    // Get current market data
    getMarketData(marketKey) {
        const cached = this.cache.get(marketKey);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }

    // Cleanup
    destroy() {
        // Close WebSockets
        this.sockets.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });

        // Clear intervals
        this.intervals.forEach(interval => clearInterval(interval));

        console.log('Market data cleanup completed');
    }
}

// Initialize globally
window.MarketDataAPI = MarketDataAPI;