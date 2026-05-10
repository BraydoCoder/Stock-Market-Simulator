# Stock Market Simulator — Research Notes

## Core Concepts

| Concept | Summary | Simulator Application |
|---|---|---|
| **Stock & Share** | A stock = ownership in a company; a share = one unit of that ownership | Buy/hold shares of different companies |
| **Price Changes** | Supply & demand: more buyers → price rises, more sellers → price falls | Prices update continuously based on simulated market activity |
| **Portfolio & Diversification** | A portfolio is all your investments; diversification spreads risk across stocks | Portfolio screen with concentration warnings |
| **Gain/Loss** | `(Current Price − Purchase Price) × Shares` | Real-time profit/loss per stock |
| **Realized vs. Unrealized Gain** | Realized = sold for profit; Unrealized = paper gain, not yet sold | Both values displayed; realized locked in after selling |
| **Risk vs. Reward** | Higher risk = higher potential reward (and loss) | Volatility/risk indicators per stock |
| **Compound Interest** | Returns on original investment *and* accumulated gains — "the eighth wonder of the world" | Long-term growth visible when profits are reinvested |
| **Market Index** | Tracks a group of major companies (e.g. S&P 500, Dow Jones) to measure overall market health | Benchmark to compare player performance |

**Real Stock Reference Prices**
- Apple (AAPL): ~$180–$200
- Tesla (TSLA): ~$170–$220
- Disney (DIS): ~$90–$120

---

## API Comparison

| Feature | Finnhub | Twelve Data | FMP | Polygon.io | EODHD |
|---|---|---|---|---|---|
| Free Tier | Yes | Yes | Yes | Yes | Yes |
| Real-Time Data | Yes (WebSocket) | Limited/delayed | Limited | Delayed | Limited |
| Historical Data | Yes | 30+ years | Yes | Yes | 30+ years |
| Rate Limit | High (60/min) | Medium (800/day) | Medium (250/day) | Low (5/min) | Medium (~1000/day) |
| Ease of Setup | Easy | Easy | Easy | Moderate | Moderate |
| Docs Quality | Good | Beginner-friendly | Good | Excellent | Good |
| Best For | Real-time apps | Indicators + global data | Company fundamentals | Pro trading | Long-term history |

**Recommendation: Finnhub** — highest free rate limit, only free API with WebSocket streaming, includes historical data, news, and fundamentals. Best balance for a multi-user classroom simulator.

---

## Target Users

**Primary Group: Teens (13–17)**

Teens have the most to gain from early financial education but typically have zero investing experience. A low-stakes, engaging simulator lets them build confidence without real financial risk.

### User Persona — Maya Chen
- **Age/Context:** 15, Grade 10; middle-income household; earns money through babysitting
- **Knowledge:** Understands saving/spending; recognizes major brands but doesn't connect stocks to wealth-building
- **Motivation:** Wants financial independence; influenced by social media discussions about investing
- **Barriers:** Finds investing confusing and intimidating; worried it's "not for people like her"

### Empathy Map

| | Thinks | Feels |
|---|---|---|
| | "Investing sounds complicated." | Curious but unsure |
| | "I probably need a lot of money to start." | Slightly intimidated |
| | "Only adults understand this stuff." | Not confident in financial knowledge |
| | May compare it to gambling | Interested if it feels fun and safe |

| | Says | Does |
|---|---|---|
| | "How do stocks even work?" | Spends on clothes, food, entertainment |
| | "Can you actually make money from this?" | Saves occasionally but without a plan |
| | "I'd try it if it was easy." | Watches money content but doesn't act |
| | "I don't want to lose money." | Has never invested |

### Design Implications
- **Gamify it** — fast feedback, visuals, and rewards so it feels like playing, not studying
- **Keep it simple** — plain language, no jargon, gradual concept introduction
- **Emphasize safety** — clearly communicate the simulator is risk-free and encourage experimentation
