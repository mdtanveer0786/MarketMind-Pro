// Utility Functions for MarketMind Pro

class Utils {
    // Format price with appropriate decimal places
    static formatPrice(price) {
        if (price >= 1000) {
            return '$' + price.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        } else if (price >= 1) {
            return '$' + price.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 4 
            });
        } else {
            return '$' + price.toFixed(8).replace(/\.?0+$/, '');
        }
    }

    // Format percentage
    static formatPercent(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    }

    // Format large numbers (volume, market cap)
    static formatLargeNumber(num) {
        if (num >= 1e9) {
            return `$${(num / 1e9).toFixed(1)}B`;
        } else if (num >= 1e6) {
            return `$${(num / 1e6).toFixed(1)}M`;
        } else if (num >= 1e3) {
            return `$${(num / 1e3).toFixed(1)}K`;
        }
        return `$${num.toFixed(0)}`;
    }

    // Generate random number in range
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Generate random integer in range
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Simulate network delay
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Save to localStorage with timestamp
    static saveToStorage(key, data) {
        const item = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    // Load from localStorage with expiry check
    static loadFromStorage(key, expiryHours = 24) {
        const item = localStorage.getItem(key);
        if (!item) return null;

        try {
            const parsed = JSON.parse(item);
            const expiryTime = expiryHours * 60 * 60 * 1000;
            
            if (Date.now() - parsed.timestamp > expiryTime) {
                localStorage.removeItem(key);
                return null;
            }
            
            return parsed.data;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Validate email
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Format date
    static formatDate(date, format = 'short') {
        const d = new Date(date);
        switch (format) {
            case 'short':
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            case 'medium':
                return d.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                });
            case 'long':
                return d.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                });
            case 'time':
                return d.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            case 'datetime':
                return `${this.formatDate(d, 'short')} ${this.formatDate(d, 'time')}`;
            default:
                return d.toLocaleDateString();
        }
    }

    // Calculate percentage change
    static calculateChange(oldValue, newValue) {
        return ((newValue - oldValue) / oldValue) * 100;
    }

    // Calculate risk score
    static calculateRiskScore(capital, riskPercent, stopLoss) {
        const baseScore = (riskPercent * 100) / stopLoss;
        let score = Math.min(100, Math.max(0, baseScore));
        
        // Adjust based on capital size
        if (capital > 50000) score *= 0.9;
        if (capital > 100000) score *= 0.8;
        
        return Math.round(score);
    }

    // Create notification
    static createNotification(type, title, message, duration = 5000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                ${this.getNotificationIcon(type)}
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;

        container.appendChild(notification);

        // Auto remove after duration
        const autoRemove = setTimeout(() => {
            notification.remove();
        }, duration);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.remove();
        });

        return notification;
    }

    static getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ⓘ'
        };
        return icons[type] || 'ⓘ';
    }

    // Export data as JSON
    static exportJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    // Export data as CSV
    static exportCSV(data, filename) {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, filename);
    }

    // Download blob
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Parse query parameters
    static getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    // Update query parameters
    static updateQueryParams(params) {
        const url = new URL(window.location);
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        });
        window.history.replaceState({}, '', url);
    }

    // Calculate moving average
    static calculateMA(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
            } else {
                const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
                result.push(sum / period);
            }
        }
        return result;
    }

    // Calculate RSI
    static calculateRSI(data, period = 14) {
        const changes = [];
        for (let i = 1; i < data.length; i++) {
            changes.push(data[i] - data[i - 1]);
        }

        const gains = changes.map(change => change > 0 ? change : 0);
        const losses = changes.map(change => change < 0 ? -change : 0);

        const avgGain = this.calculateMA(gains, period);
        const avgLoss = this.calculateMA(losses, period);

        const rsi = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period) {
                rsi.push(null);
            } else {
                const rs = avgGain[i] / avgLoss[i];
                rsi.push(100 - (100 / (1 + rs)));
            }
        }

        return rsi;
    }

    // Generate random candlestick data
    static generateCandleData(count, basePrice, volatility) {
        const data = [];
        let currentPrice = basePrice;
        const now = new Date();

        for (let i = count - 1; i >= 0; i--) {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() - i * 5);

            const open = currentPrice;
            const change = (Math.random() - 0.5) * 2 * volatility * open;
            const close = open + change;
            const high = Math.max(open, close) + Math.random() * volatility * open * 0.5;
            const low = Math.min(open, close) - Math.random() * volatility * open * 0.5;
            const volume = Math.random() * 1000 + 500;

            data.push({
                time,
                open,
                high,
                low,
                close,
                volume
            });

            currentPrice = close;
        }

        return data;
    }

    // Calculate support and resistance levels
    static calculateSupportResistance(data, lookback = 20) {
        const highs = [];
        const lows = [];
        
        for (let i = lookback; i < data.length - lookback; i++) {
            const slice = data.slice(i - lookback, i + lookback + 1);
            const currentHigh = data[i].high;
            const currentLow = data[i].low;
            
            if (currentHigh === Math.max(...slice.map(d => d.high))) {
                highs.push(currentHigh);
            }
            
            if (currentLow === Math.min(...slice.map(d => d.low))) {
                lows.push(currentLow);
            }
        }
        
        return {
            resistance: [...new Set(highs)].sort((a, b) => b - a).slice(0, 5),
            support: [...new Set(lows)].sort((a, b) => a - b).slice(0, 5)
        };
    }

    // Calculate Fibonacci retracement levels
    static calculateFibonacci(high, low) {
        const diff = high - low;
        return {
            level0: high,
            level236: high - diff * 0.236,
            level382: high - diff * 0.382,
            level500: high - diff * 0.5,
            level618: high - diff * 0.618,
            level786: high - diff * 0.786,
            level100: low
        };
    }

    // Validate trade data
    static validateTrade(trade) {
        const errors = [];
        
        if (!trade.market) errors.push('Market is required');
        if (!trade.entry || trade.entry <= 0) errors.push('Valid entry price is required');
        if (!trade.size || trade.size <= 0) errors.push('Valid position size is required');
        if (trade.stopLoss && trade.stopLoss >= trade.entry) {
            errors.push('Stop loss must be below entry price for long positions');
        }
        if (trade.takeProfit && trade.takeProfit <= trade.entry) {
            errors.push('Take profit must be above entry price for long positions');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Calculate position size
    static calculatePositionSize(capital, riskPercent, entry, stopLoss) {
        const riskAmount = capital * (riskPercent / 100);
        const riskPerUnit = Math.abs(entry - stopLoss);
        const positionSize = riskAmount / riskPerUnit;
        return {
            size: positionSize,
            riskAmount,
            maxLoss: -riskAmount,
            maxGain: riskAmount * 2 // Assuming 1:2 risk-reward
        };
    }

    // Format time duration
    static formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    }

    // Get market color based on change
    static getMarketColor(change) {
        return change >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    }

    // Animate value change
    static animateValue(element, start, end, duration) {
        if (start === end) return;

        const range = end - start;
        const startTime = performance.now();
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = start + (range * progress);
            
            if (element.tagName === 'INPUT') {
                element.value = value.toFixed(2);
            } else {
                element.textContent = Utils.formatPrice(value);
            }
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }
}

// Make Utils available globally
window.Utils = Utils;