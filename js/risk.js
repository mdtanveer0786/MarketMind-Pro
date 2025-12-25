// Risk Management Module

class RiskManager {
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
        this.updateRiskCalculations();
    }

    cacheElements() {
        this.elements = {
            capitalInput: document.getElementById('capitalInput'),
            stopLossInput: document.getElementById('stopLossInput'),
            riskSlider: document.getElementById('riskSlider'),
            riskValue: document.getElementById('riskValue'),
            riskAmount: document.getElementById('riskAmount'),
            positionSize: document.getElementById('positionSize'),
            positionUnits: document.getElementById('positionUnits'),
            maxLoss: document.getElementById('maxLoss'),
            maxGain: document.getElementById('maxGain'),
            riskIndicator: document.getElementById('riskIndicator'),
            riskLevel: document.getElementById('riskLevel'),
            riskWarning: document.getElementById('riskWarning'),
            riskScore: document.getElementById('riskScore')
        };
    }

    setupEventListeners() {
        // Input changes
        if (this.elements.capitalInput) {
            this.elements.capitalInput.addEventListener('input', () => this.updateRiskCalculations());
        }

        if (this.elements.stopLossInput) {
            this.elements.stopLossInput.addEventListener('input', () => this.updateRiskCalculations());
        }

        if (this.elements.riskSlider) {
            this.elements.riskSlider.addEventListener('input', (e) => {
                this.updateRiskValue(e.target.value);
                this.updateRiskCalculations();
            });
        }

        // Prevent invalid inputs
        const inputs = [this.elements.capitalInput, this.elements.stopLossInput];
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('blur', () => this.validateInput(input));
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.validateInput(input);
                        this.updateRiskCalculations();
                    }
                });
            }
        });
    }

    setupStateSubscriptions() {
        // Subscribe to risk state changes
        this.state.subscribe('risk', (risk) => {
            this.updateUI(risk);
        });

        // Subscribe to market data for unit calculations
        this.state.subscribe('markets', () => {
            this.updatePositionUnits();
        });

        this.state.subscribe('activeMarket', () => {
            this.updatePositionUnits();
        });
    }

    loadInitialData() {
        const risk = this.state.get('risk');

        // Set initial values
        if (this.elements.capitalInput) {
            this.elements.capitalInput.value = risk.capital;
        }

        if (this.elements.stopLossInput) {
            this.elements.stopLossInput.value = risk.stopLoss;
        }

        if (this.elements.riskSlider) {
            this.elements.riskSlider.value = risk.riskPercent;
            this.updateRiskValue(risk.riskPercent);
        }
    }

    validateInput(input) {
        let value = parseFloat(input.value);

        if (isNaN(value)) {
            value = input === this.elements.capitalInput ? 10000 : 2;
        }

        // Set minimum values
        if (input === this.elements.capitalInput) {
            value = Math.max(100, value);
        } else if (input === this.elements.stopLossInput) {
            value = Math.max(0.1, Math.min(20, value));
        }

        input.value = value.toFixed(input === this.elements.capitalInput ? 0 : 1);
    }

    updateRiskValue(value) {
        if (this.elements.riskValue) {
            this.elements.riskValue.textContent = `${parseFloat(value).toFixed(1)}%`;
            this.state.update('risk.riskPercent', parseFloat(value));
        }
    }

    updateRiskCalculations() {
        const capital = parseFloat(this.elements.capitalInput ? this.elements.capitalInput.value : 10000);
        const riskPercent = parseFloat(this.elements.riskSlider ? this.elements.riskSlider.value : 1);
        const stopLoss = parseFloat(this.elements.stopLossInput ? this.elements.stopLossInput.value : 2);

        // Validate inputs
        if (isNaN(capital) || isNaN(riskPercent) || isNaN(stopLoss)) {
            return;
        }

        // Calculate risk metrics
        const riskAmount = capital * (riskPercent / 100);
        const positionSize = riskAmount / (stopLoss / 100);

        // Calculate max loss and gain (assuming 1:2 risk-reward)
        const maxLoss = -riskAmount;
        const maxGain = riskAmount * 2;

        // Calculate risk score
        const riskScore = this.calculateRiskScore(capital, riskPercent, stopLoss);

        // Update state
        this.state.update('risk', {
            capital: capital,
            riskPercent: riskPercent,
            stopLoss: stopLoss,
            riskAmount: riskAmount,
            positionSize: positionSize,
            maxLoss: maxLoss,
            maxGain: maxGain,
            riskScore: riskScore,
            warnings: this.generateWarnings(riskPercent, stopLoss, positionSize, capital)
        });
    }

    updateUI(risk) {
        // Update display values
        if (this.elements.riskAmount) {
            this.elements.riskAmount.textContent = risk.riskAmount.toFixed(2);
        }

        if (this.elements.positionSize) {
            this.elements.positionSize.textContent = `$${risk.positionSize.toFixed(2)}`;
        }

        if (this.elements.maxLoss) {
            this.elements.maxLoss.textContent = `-$${Math.abs(risk.maxLoss).toFixed(2)}`;
        }

        if (this.elements.maxGain) {
            this.elements.maxGain.textContent = `+$${risk.maxGain.toFixed(2)}`;
        }

        // Update risk indicator
        this.updateRiskIndicator(risk.riskPercent);

        // Update risk level text
        this.updateRiskLevel(risk.riskPercent);

        // Update risk score
        if (this.elements.riskScore) {
            this.elements.riskScore.textContent = risk.riskScore;
            this.updateRiskScoreClass(risk.riskScore);
        }

        // Show/hide warnings
        this.updateWarnings(risk.warnings);

        // Update position units
        this.updatePositionUnits();
    }

    updateRiskIndicator(riskPercent) {
        if (!this.elements.riskIndicator) return;

        // Calculate indicator position (0-100%)
        const indicatorPosition = Math.min(100, Math.max(0, riskPercent * 20));
        this.elements.riskIndicator.style.width = `${indicatorPosition}%`;

        // Update indicator color based on risk level
        let color;
        if (riskPercent <= 1) {
            color = '#10b981'; // Green
        } else if (riskPercent <= 2) {
            color = '#f59e0b'; // Yellow
        } else if (riskPercent <= 3) {
            color = '#f97316'; // Orange
        } else {
            color = '#ef4444'; // Red
        }

        this.elements.riskIndicator.style.backgroundColor = color;
    }

    updateRiskLevel(riskPercent) {
        if (!this.elements.riskLevel) return;

        let level, color;

        if (riskPercent <= 1) {
            level = 'Low Risk';
            color = '#10b981';
        } else if (riskPercent <= 2) {
            level = 'Moderate Risk';
            color = '#f59e0b';
        } else if (riskPercent <= 3) {
            level = 'High Risk';
            color = '#f97316';
        } else {
            level = 'Extreme Risk';
            color = '#ef4444';
        }

        this.elements.riskLevel.textContent = level;
        this.elements.riskLevel.style.color = color;
    }

    updateRiskScoreClass(score) {
        if (!this.elements.riskScore) return;

        // Remove existing classes
        this.elements.riskScore.classList.remove('low', 'medium', 'high');

        // Add appropriate class
        if (score <= 30) {
            this.elements.riskScore.classList.add('low');
        } else if (score <= 60) {
            this.elements.riskScore.classList.add('medium');
        } else {
            this.elements.riskScore.classList.add('high');
        }
    }

    updateWarnings(warnings) {
        if (!this.elements.riskWarning) return;

        if (warnings.length > 0) {
            this.elements.riskWarning.classList.remove('hidden');

            // Update warning message
            const warningText = this.elements.riskWarning.querySelector('.warning-text');
            if (warningText) {
                warningText.textContent = warnings.join('. ') + '.';
            }
        } else {
            this.elements.riskWarning.classList.add('hidden');
        }
    }

    updatePositionUnits() {
        if (!this.elements.positionUnits) return;

        const risk = this.state.get('risk');
        const market = this.state.get('activeMarket');
        const marketData = this.state.get(`markets.${market}`);

        if (!marketData || risk.positionSize <= 0) {
            this.elements.positionUnits.textContent = '0 units';
            return;
        }

        const price = marketData.price;
        const units = risk.positionSize / price;

        let unitText;
        switch (market) {
            case 'BTC':
                unitText = `${units.toFixed(4)} BTC`;
                break;
            case 'GOLD':
                unitText = `${units.toFixed(3)} oz`;
                break;
            case 'NIFTY':
            case 'BANKNIFTY':
                unitText = `${units.toFixed(0)} contracts`;
                break;
            default:
                unitText = `${units.toFixed(2)} units`;
        }

        this.elements.positionUnits.textContent = unitText;
    }

    calculateRiskScore(capital, riskPercent, stopLoss) {
        // Base score from risk percentage (0-100 scale)
        let score = riskPercent * 20; // 1% = 20 points, 5% = 100 points

        // Adjust based on stop loss
        if (stopLoss > 5) score *= 1.2; // Wider stop loss = higher risk
        if (stopLoss < 1) score *= 0.8; // Tighter stop loss = lower risk

        // Adjust based on capital size
        if (capital < 5000) score *= 1.1; // Smaller account = higher relative risk
        if (capital > 50000) score *= 0.9; // Larger account = lower relative risk

        // Cap at 100
        score = Math.min(100, Math.max(0, score));

        return Math.round(score);
    }

    generateWarnings(riskPercent, stopLoss, positionSize, capital) {
        const warnings = [];

        // Risk per trade warnings
        if (riskPercent > 2) {
            warnings.push('Risk per trade exceeds 2%');
        }

        if (riskPercent > 5) {
            warnings.push('Risk per trade is extremely high (>5%)');
        }

        // Stop loss warnings
        if (stopLoss > 10) {
            warnings.push('Stop loss is too wide (>10%) - consider tightening');
        }

        if (stopLoss < 0.5) {
            warnings.push('Stop loss is very tight (<0.5%) - may result in frequent stops');
        }

        // Position size warnings
        if (positionSize > capital * 0.5) {
            warnings.push('Position size exceeds 50% of capital - extremely high concentration risk');
        }

        if (positionSize > capital * 0.25) {
            warnings.push('Position size exceeds 25% of capital - high concentration risk');
        }

        return warnings;
    }

    // Risk management scenarios
    calculateScenarioAnalysis() {
        const risk = this.state.get('risk');
        const scenarios = [];

        // Best case scenario (take profit hit)
        scenarios.push({
            name: 'Best Case',
            description: 'Take profit level reached',
            outcome: `+$${risk.maxGain.toFixed(2)}`,
            probability: '30%',
            color: '#10b981'
        });

        // Expected scenario (stop loss hit)
        scenarios.push({
            name: 'Expected Loss',
            description: 'Stop loss level reached',
            outcome: `-$${Math.abs(risk.maxLoss).toFixed(2)}`,
            probability: '50%',
            color: '#ef4444'
        });

        // Break-even scenario
        scenarios.push({
            name: 'Break Even',
            description: 'Price returns to entry',
            outcome: '$0.00',
            probability: '20%',
            color: '#94a3b8'
        });

        return scenarios;
    }

    calculatePortfolioRisk(positions) {
        // Calculate portfolio-level risk metrics
        let totalCapital = this.state.get('risk.capital');
        let totalRisk = 0;
        let maxPositionRisk = 0;

        positions.forEach(position => {
            const positionRisk = position.size * (position.stopLoss / 100);
            totalRisk += positionRisk;
            maxPositionRisk = Math.max(maxPositionRisk, positionRisk);
        });

        const portfolioRiskPercent = (totalRisk / totalCapital) * 100;
        const concentrationRisk = (maxPositionRisk / totalRisk) * 100;

        return {
            totalRisk: totalRisk,
            portfolioRiskPercent: portfolioRiskPercent,
            concentrationRisk: concentrationRisk,
            riskPerTrade: this.state.get('risk.riskPercent'),
            numberOfPositions: positions.length,
            warnings: this.generatePortfolioWarnings(portfolioRiskPercent, concentrationRisk)
        };
    }

    generatePortfolioWarnings(portfolioRiskPercent, concentrationRisk) {
        const warnings = [];

        if (portfolioRiskPercent > 10) {
            warnings.push('Total portfolio risk exceeds 10% - consider reducing position sizes');
        }

        if (portfolioRiskPercent > 20) {
            warnings.push('Total portfolio risk is dangerously high (>20%)');
        }

        if (concentrationRisk > 50) {
            warnings.push('Single position represents over 50% of total risk - high concentration');
        }

        if (concentrationRisk > 75) {
            warnings.push('Extreme concentration risk (>75% in single position)');
        }

        return warnings;
    }

    // Risk management rules and guidelines
    getRiskRules() {
        return [
            {
                rule: '1% Rule',
                description: 'Never risk more than 1% of your capital on a single trade',
                status: this.state.get('risk.riskPercent') <= 1 ? 'compliant' : 'violated',
                impact: 'High'
            },
            {
                rule: '2% Rule',
                description: 'Never risk more than 2% of your capital on a single trade',
                status: this.state.get('risk.riskPercent') <= 2 ? 'compliant' : 'violated',
                impact: 'Medium'
            },
            {
                rule: '5% Stop Loss',
                description: 'Stop loss should not exceed 5% of entry price',
                status: this.state.get('risk.stopLoss') <= 5 ? 'compliant' : 'violated',
                impact: 'Medium'
            },
            {
                rule: 'Portfolio Risk',
                description: 'Total portfolio risk should not exceed 10%',
                status: 'checking',
                impact: 'High'
            },
            {
                rule: 'Position Size',
                description: 'No single position should exceed 25% of capital',
                status: this.state.get('risk.positionSize') <= this.state.get('risk.capital') * 0.25 ? 'compliant' : 'violated',
                impact: 'High'
            }
        ];
    }

    // Monte Carlo simulation for risk assessment
    simulateRiskScenarios(iterations = 1000) {
        const capital = this.state.get('risk.capital');
        const riskPercent = this.state.get('risk.riskPercent');
        const winRate = this.state.get('performance.winRate') / 100 || 0.6;
        const riskReward = 2; // Assuming 1:2 risk-reward

        const results = {
            finalCapital: [],
            maxDrawdown: [],
            profitableSimulations: 0,
            ruinProbability: 0
        };

        for (let i = 0; i < iterations; i++) {
            let currentCapital = capital;
            let peakCapital = capital;
            let maxDrawdown = 0;
            let consecutiveLosses = 0;
            let ruined = false;

            // Simulate 100 trades
            for (let trade = 0; trade < 100; trade++) {
                if (currentCapital <= capital * 0.2) {
                    ruined = true;
                    break;
                }

                const riskAmount = currentCapital * (riskPercent / 100);
                const isWin = Math.random() < winRate;

                if (isWin) {
                    currentCapital += riskAmount * riskReward;
                    consecutiveLosses = 0;
                } else {
                    currentCapital -= riskAmount;
                    consecutiveLosses++;
                }

                // Update peak and drawdown
                if (currentCapital > peakCapital) {
                    peakCapital = currentCapital;
                }

                const drawdown = ((peakCapital - currentCapital) / peakCapital) * 100;
                if (drawdown > maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            }

            results.finalCapital.push(currentCapital);
            results.maxDrawdown.push(maxDrawdown);

            if (currentCapital > capital) {
                results.profitableSimulations++;
            }

            if (ruined || currentCapital <= capital * 0.2) {
                results.ruinProbability++;
            }
        }

        // Calculate statistics
        results.finalCapital.sort((a, b) => a - b);
        results.maxDrawdown.sort((a, b) => a - b);

        const stats = {
            avgFinalCapital: results.finalCapital.reduce((a, b) => a + b, 0) / iterations,
            medianFinalCapital: results.finalCapital[Math.floor(iterations / 2)],
            worstFinalCapital: results.finalCapital[0],
            bestFinalCapital: results.finalCapital[iterations - 1],
            avgMaxDrawdown: results.maxDrawdown.reduce((a, b) => a + b, 0) / iterations,
            worstMaxDrawdown: results.maxDrawdown[iterations - 1],
            probabilityOfProfit: (results.profitableSimulations / iterations) * 100,
            probabilityOfRuin: (results.ruinProbability / iterations) * 100,
            confidenceIntervals: {
                low95: results.finalCapital[Math.floor(iterations * 0.025)],
                high95: results.finalCapital[Math.floor(iterations * 0.975)]
            }
        };

        return stats;
    }

    // Export risk report
    exportRiskReport() {
        const risk = this.state.get('risk');
        const scenarios = this.calculateScenarioAnalysis();
        const rules = this.getRiskRules();
        const simulation = this.simulateRiskScenarios(500); // Fewer iterations for speed

        const report = {
            timestamp: new Date().toISOString(),
            riskParameters: {
                capital: risk.capital,
                riskPerTrade: risk.riskPercent,
                stopLoss: risk.stopLoss,
                positionSize: risk.positionSize,
                riskAmount: risk.riskAmount,
                riskScore: risk.riskScore
            },
            scenarioAnalysis: scenarios,
            riskRules: rules,
            monteCarloSimulation: simulation,
            warnings: risk.warnings,
            recommendations: this.generateRiskRecommendations(risk, rules, simulation)
        };

        this.utils.exportJSON(report, `risk-report-${Date.now()}.json`);

        this.utils.createNotification(
            'success',
            'Risk Report Exported',
            'Complete risk analysis has been exported'
        );
    }

    generateRiskRecommendations(risk, rules, simulation) {
        const recommendations = [];

        // Check risk percentage
        if (risk.riskPercent > 2) {
            recommendations.push({
                priority: 'high',
                action: 'Reduce risk per trade',
                reason: `Current risk (${risk.riskPercent}%) exceeds recommended 2% maximum`,
                impact: 'Reduces probability of ruin and large drawdowns'
            });
        }

        // Check stop loss
        if (risk.stopLoss > 5) {
            recommendations.push({
                priority: 'medium',
                action: 'Tighten stop loss',
                reason: `Stop loss (${risk.stopLoss}%) is wider than recommended 5% maximum`,
                impact: 'Reduces individual trade risk and improves risk-reward ratios'
            });
        }

        // Check simulation results
        if (simulation.probabilityOfRuin > 10) {
            recommendations.push({
                priority: 'high',
                action: 'Review risk parameters',
                reason: `Probability of ruin is ${simulation.probabilityOfRuin.toFixed(1)}%`,
                impact: 'High chance of significant capital depletion'
            });
        }

        // Check rules compliance
        const violatedRules = rules.filter(rule => rule.status === 'violated');
        if (violatedRules.length > 0) {
            recommendations.push({
                priority: 'medium',
                action: 'Address rule violations',
                reason: `${violatedRules.length} risk management rules are being violated`,
                impact: 'Increases overall portfolio risk and reduces consistency'
            });
        }

        // Add positive feedback if doing well
        if (risk.riskPercent <= 1 && simulation.probabilityOfRuin < 5) {
            recommendations.push({
                priority: 'low',
                action: 'Maintain current approach',
                reason: 'Risk parameters are conservative and sustainable',
                impact: 'Continued capital preservation and steady growth'
            });
        }

        return recommendations;
    }

    // Quick risk assessment for trade entry
    quickRiskAssessment(entry, stopLoss, target, size) {
        const capital = this.state.get('risk.capital');
        const riskAmount = Math.abs(entry - stopLoss) * size;
        const riskPercent = (riskAmount / capital) * 100;

        const assessment = {
            riskAmount: riskAmount,
            riskPercent: riskPercent,
            positionSize: entry * size,
            positionSizePercent: (entry * size) / capital * 100,
            stopLossDistance: Math.abs((stopLoss - entry) / entry * 100),
            targetDistance: Math.abs((target - entry) / entry * 100),
            riskRewardRatio: Math.abs((target - entry) / (entry - stopLoss)),
            warnings: []
        };

        // Generate warnings
        if (riskPercent > 2) {
            assessment.warnings.push(`Risk per trade (${riskPercent.toFixed(1)}%) exceeds 2% limit`);
        }

        if (assessment.positionSizePercent > 25) {
            assessment.warnings.push(`Position size (${assessment.positionSizePercent.toFixed(1)}%) exceeds 25% of capital`);
        }

        if (assessment.stopLossDistance > 10) {
            assessment.warnings.push(`Stop loss (${assessment.stopLossDistance.toFixed(1)}%) is wider than 10%`);
        }

        if (assessment.riskRewardRatio < 1) {
            assessment.warnings.push(`Risk-reward ratio (1:${assessment.riskRewardRatio.toFixed(1)}) is less than 1:1`);
        }

        assessment.isAcceptable = assessment.warnings.length === 0;

        return assessment;
    }

    // Calculate optimal position size based on risk parameters
    calculateOptimalPositionSize(entry, stopLoss, maxRiskPercent = null) {
        const capital = this.state.get('risk.capital');
        const riskPercent = maxRiskPercent || this.state.get('risk.riskPercent');

        const maxRiskAmount = capital * (riskPercent / 100);
        const riskPerUnit = Math.abs(entry - stopLoss);

        if (riskPerUnit === 0) {
            return {
                optimalSize: 0,
                riskAmount: 0,
                positionValue: 0,
                message: 'Invalid stop loss - same as entry price'
            };
        }

        const optimalSize = maxRiskAmount / riskPerUnit;
        const positionValue = optimalSize * entry;

        return {
            optimalSize: optimalSize,
            riskAmount: maxRiskAmount,
            positionValue: positionValue,
            positionPercent: (positionValue / capital) * 100,
            riskPerUnit: riskPerUnit,
            message: positionValue > capital * 0.25 ?
                'Warning: Position size exceeds 25% of capital' :
                'Position size is within acceptable limits'
        };
    }
}
