# MarketMind Pro™ - Real Market Data Dashboard

![MarketMind Pro](https://img.shields.io/badge/MarketMind-Pro-brightgreen)
![Version](https://img.shields.io/badge/version-2.1-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![No Frameworks](https://img.shields.io/badge/No-Frameworks-red)

A **professional-grade trading dashboard** with **real-time market data**, built entirely with vanilla HTML, CSS, and JavaScript. No frameworks, no libraries - just pure frontend engineering.

## 🚀 Live Demo
[Try Live Demo](https://your-demo-link.com) 

## ✨ Features

### 📊 **Real Market Data**
- **Live Crypto Prices**: BTC, ETH, BNB with real-time updates
- **Indian Indices**: NIFTY 50 and BANKNIFTY live data
- **Gold/Silver**: Real precious metals prices
- **Forex Rates**: USD/INR and other currency pairs
- **WebSocket Support**: Real-time price streaming

### 📈 **Professional Charting**
- **TradingView Lightweight Charts** integration
- **Real-time candle updates**
- **Technical Indicators**: RSI, MA, Bollinger Bands, MACD
- **Drawing Tools**: Support/Resistance lines, trend lines
- **Multiple Timeframes**: 1m to 1D
- **Export Charts** as PNG images

### 🎯 **Core Modules**
1. **Multi-Market Dashboard** - Live market overview
2. **Advanced Charting Engine** - Professional charts
3. **Strategy Builder** - Backtesting simulation
4. **Trading Journal** - Complete trade tracking
5. **Risk Management** - Position sizing calculator

### 📱 **Modern Features**
- **PWA Support**: Install as native app
- **Offline Functionality**: Works without internet
- **Dark/Light Mode**: Professional themes
- **Keyboard Shortcuts**: Full keyboard navigation
- **Responsive Design**: Mobile, tablet, desktop
- **Export Capabilities**: JSON/CSV export

## 🛠️ Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Grid, Flexbox, Custom Properties
- **Vanilla JavaScript** - ES6+, Modules, Classes
- **Canvas/SVG** - Custom chart rendering
- **LocalStorage** - Data persistence
- **WebSocket** - Real-time updates
- **Service Workers** - PWA capabilities

**No frameworks, no dependencies!** (Except Font Awesome icons)

## 📁 Project Structure

```
/marketmind-pro/
├── index.html                  # Main entry point
├── css/
│   ├── variables.css          # CSS custom properties
│   ├── layout.css            # Layout and grid system
│   ├── components.css        # Component styles
│   ├── themes.css           # Theme definitions
│   └── real-charts.css      # Real charts styling (NEW)
├── js/
│   ├── app.js               # Main application controller
│   ├── state.js             # State management
│   ├── utils.js             # Utility functions
│   ├── api.js              # Real market data API (NEW)
│   ├── real-charts.js      # Professional charts (NEW)
│   ├── dashboard.js        # Market dashboard
│   ├── charts.js           # Canvas backup charts
│   ├── strategy.js         # Strategy builder
│   ├── journal.js          # Trading journal
│   └── risk.js             # Risk management
├── manifest.json           # PWA manifest (NEW)
├── sw.js                  # Service worker (NEW)
├── assets/
│   └── icons/            # PWA icons
└── README.md             # This file
```

## 🚀 Quick Start

### Option 1: One-Click Setup (Recommended)

1. **Download the complete project:**
```bash
git clone https://github.com/yourusername/marketmind-pro.git
cd marketmind-pro
```

2. **Get free API keys:**
   - [Alpha Vantage](https://www.alphavantage.co/support/#api-key) - For stocks
   - [GoldAPI](https://www.goldapi.io/) - For gold/silver (optional)
   - [ExchangeRate-API](https://www.exchangerate-api.com/) - For forex (optional)

3. **Update API keys in `js/api.js`:**
```javascript
// Line 15-17 update with your keys
this.apiKeys = {
    alphaVantage: 'YOUR_ALPHA_VANTAGE_KEY',
    goldapi: 'YOUR_GOLDAPI_KEY',
    exchangeRate: 'YOUR_EXCHANGERATE_KEY'
};
```

4. **Run the application:**
```bash
# Using Python
python3 -m http.server 8000

# OR using Node.js
npx serve .

# Then open: http://localhost:8000
```

### Option 2: Manual Setup

If you're starting from scratch:

1. **Create folder structure:**
```bash
mkdir marketmind-pro
cd marketmind-pro
mkdir -p css js assets/icons
```

2. **Copy all files from this repository**

3. **Get API keys and update `js/api.js`**

4. **Open `index.html` in browser**

## 🔧 Configuration

### API Keys Setup

| Service | Purpose | Free Tier | Link |
|---------|---------|-----------|------|
| **Alpha Vantage** | Stock/Index data | 5 calls/min, 500/day | [Get Key](https://www.alphavantage.co) |
| **Binance API** | Crypto data | No key needed | [Docs](https://binance-docs.github.io) |
| **GoldAPI** | Gold/Silver prices | 100 req/month | [Get Key](https://www.goldapi.io) |
| **Yahoo Finance** | Stock data | No key needed | [Docs](https://www.yahoofinanceapi.com) |

### Environment Setup

For development, enable CORS:

```javascript
// Chrome extension: Install "Allow CORS"
// OR use local proxy
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
```

## 🎮 Usage Guide

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `1-4` | Switch market tabs |
| `C` | Focus chart |
| `J` | Open journal |
| `A` | Add trade |
| `B` | Run backtest |
| `T` | Toggle theme |
| `H` | Show shortcuts |
| `ESC` | Close modals |

### Adding Real Market Data
1. Click on any market tab (BTC, GOLD, NIFTY, etc.)
2. Real data will load automatically
3. Charts update in real-time via WebSocket

### Using Professional Charts
1. **Zoom**: Mouse wheel or `+`/`-` keys
2. **Pan**: Click and drag or arrow keys
3. **Drawing**: Click "S/R" button to draw lines
4. **Indicators**: Select from dropdown menu
5. **Timeframes**: Click 1m, 5m, 15m, etc.

### Exporting Data
- **Chart**: Click export button to save as PNG
- **Trades**: Export journal as JSON/CSV
- **Strategy**: Save backtest results
- **Risk Report**: Export complete analysis

## 📱 PWA Installation

1. **Chrome/Edge:**
   - Open the dashboard
   - Click "Install" icon in address bar
   - Click "Install MarketMind Pro"

2. **Safari:**
   - Tap Share button
   - Tap "Add to Home Screen"
   - Name it "MarketMind Pro"

3. **Android Chrome:**
   - Tap menu (three dots)
   - Tap "Add to Home screen"
   - Confirm installation

## 🧪 Testing

### Local Development
```bash
# Start local server
python3 -m http.server 8000

# Test in browser
open http://localhost:8000

# Check console for errors
# Press F12 → Console tab
```

### API Testing
Check if APIs are working:
```javascript
// Test Binance API
fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
  .then(res => res.json())
  .then(data => console.log('BTC Price:', data.lastPrice));

// Test Yahoo Finance
fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1m')
  .then(res => res.json())
  .then(data => console.log('NIFTY Data:', data));
```

### Offline Testing
1. Install the PWA
2. Turn off internet
3. Open the app
4. Should work with cached data

## 🔍 Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **CORS errors** | Install "Allow CORS" Chrome extension |
| **API rate limit** | Wait 1 minute or use backup APIs |
| **Charts not loading** | Check internet, reload page |
| **No real-time data** | Check WebSocket connection |
| **PWA not installing** | Clear browser cache, retry |

### Debug Mode
Enable debug logging in `js/api.js`:
```javascript
constructor() {
    this.debug = true; // Set to true
    if (this.debug) console.log('API Initializing...');
}
```

## 🚀 Deployment

### Static Hosting (Free Options)
1. **GitHub Pages:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/marketmind-pro.git
git push -u origin main
```
Enable GitHub Pages in repository settings.

2. **Netlify:**
   - Drag & drop folder to Netlify
   - Automatic deployment

3. **Vercel:**
```bash
npm i -g vercel
vercel
```

### Production Configuration
```nginx
# NGINX configuration
server {
    listen 80;
    server_name marketmind.example.com;
    
    root /var/www/marketmind-pro;
    index index.html;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| Load Time | < 2 seconds |
| Bundle Size | ~200KB (uncompressed) |
| Memory Usage | < 50MB |
| Frame Rate | 60fps (charts) |
| API Response Time | < 300ms |

## 🔒 Security Notes

1. **API Keys**: Never commit real keys to public repos
2. **LocalStorage**: Encrypt sensitive data if needed
3. **CORS**: Configure properly in production
4. **HTTPS**: Always use in production

For production, consider:
- Using backend proxy for API calls
- Implementing rate limiting
- Adding authentication for journal data

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines
- Use vanilla JavaScript only
- Follow existing code structure
- Add comments for complex logic
- Test on mobile and desktop
- Update documentation

## 📚 Learning Resources

- [Binance API Documentation](https://binance-docs.github.io/apidocs/)
- [TradingView Charting Library](https://www.tradingview.com/lightweight-charts/)
- [Alpha Vantage API Docs](https://www.alphavantage.co/documentation/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## 🎥 Video Tutorial

[Watch Setup Tutorial](https://youtube.com/your-tutorial-link)

### Steps Covered:
1. Project setup and structure
2. Getting free API keys
3. Integrating real market data
4. Setting up professional charts
5. Testing and deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**This is a demonstration project for educational purposes only.**

- Not financial advice
- Use at your own risk
- Real trading involves risk of loss
- Always do your own research
- Check with financial advisor

## 🙏 Acknowledgments

- [Binance](https://binance.com) for crypto API
- [TradingView](https://tradingview.com) for charting library
- [Alpha Vantage](https://alphavantage.co) for stock data
- [Font Awesome](https://fontawesome.com) for icons
- All contributors and testers

## 📞 Support

Having issues? Here's how to get help:

1. **Check the [Troubleshooting](#troubleshooting) section**
2. **Open an [Issue](https://github.com/yourusername/marketmind-pro/issues)**
3. **Email**: support@marketmindpro.com
4. **Discord**: [Join our community](https://discord.gg/your-invite-link)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=mdtanveer0786/marketmind-pro&type=Date)](https://github.com/mdtanveer0786/MarketMind-Pro)

---

<div align="center">
  
### Built with ❤️ for traders and developers

[![Twitter](https://img.shields.io/twitter/follow/marketmindpro?style=social)](https://twitter.com/marketmindpro)
[![YouTube](https://img.shields.io/youtube/channel/subscribers/UCyourchannel?style=social)](https://youtube.com/c/marketmindpro)
[![Discord](https://img.shields.io/discord/your-server-id?style=social)](https://discord.gg/your-invite-link)

**If you find this project useful, please give it a ⭐ on GitHub!**

</div>

## 🔄 Update Log

### v2.1 (Current)
- Added real market data integration
- Professional TradingView charts
- WebSocket support for real-time updates
- PWA installation capabilities
- Multiple API fallback systems

### v2.0
- Complete trading dashboard
- All core modules implemented
- Responsive design
- Dark/light themes
- LocalStorage persistence

### v1.0
- Initial release
- Basic charting engine
- Strategy builder
- Trading journal
- Risk management panel

---

**Happy Trading! 📈🚀**

*Note: Market data may have delays. Not suitable for live trading without additional verification.*