# Product Requirements Document (PRD)
# StockPilot — Stock Market Simulator

**Version:** 1.0
**Author:** Brayden Sun
**Last Updated:** 2026-05-13
**Status:** In Progress

---

# Table of Contents

1. Product Overview
2. Problem Statement
3. Target Users
4. Goals and Objectives
5. Core User Flows
6. Feature List (MoSCoW Prioritization)
7. Game Mechanics
8. Technical Architecture
9. API Strategy (Finnhub)
10. Database Schema (Supabase)
11. State Management
12. Data Visualization Plan
13. Achievement and XP System
14. Class Leaderboard System
15. Market Events System
16. Audio System
17. News Feed Integration
18. Tutorial and Onboarding
19. UI Design Specifications
20. Screen Wireframes
21. Notification System
22. Order Types
23. Teacher Admin Dashboard
24. Settings Page
25. End-of-Simulation Results Screen
26. Social Features
27. Teacher Analytics Dashboard
28. Success Criteria
29. Required Screens and Routes
30. Out of Scope
31. Risks and Constraints
32. Performance Requirements
33. Security Considerations
34. Testing Plan
35. Deployment Plan
36. Development Roadmap
37. Definition of Done
38. Fractional Share Rounding Rules
39. Leaderboard Tie-Breaking Rules
40. Component Specifications
41. Additional Wireframes
42. Animation Specification
43. Supabase RLS Policies (SQL)
44. Supabase Edge Function — Finnhub Proxy
45. Achievement Unlock Conditions (Logic Rules)
46. Badge Artwork Descriptions
47. XP Bar Visual Behaviour
48. Market Event Copy
49. App Copy Specification
50. Simulation Speed — Technical Summary
51. Page States — Portfolio, Stocks, and Leaderboard
52. Full SQL Query Reference
53. Mock Data Specification
54. Security Threat Model
55. Component Specifications (Continued)
56. WebSocket Message Formats
57. localStorage Schema
58. Keyboard Shortcuts
59. Browser Support Matrix
60. Daily Development Schedule (4-Week Plan)

---

# 1. Product Overview

## 1.1 Product Name
**StockPilot**

## 1.2 Tagline
*Take the controls. Trade without risk.*

## 1.3 Summary
StockPilot is a gamified, web-based stock market simulator designed for students in a classroom setting. Users trade virtual currency called **PilotCoins (PC$)** using real-time stock price data from Finnhub. They build portfolios, compete on a class leaderboard, earn XP and badges, and experience realistic market mechanics — all without risking real money.

The application is built for a Computer Science class as both a school project and a personal portfolio piece. It targets beginner investors aged 13–17 and is designed to feel like a game while teaching real financial concepts through hands-on interaction.

## 1.4 Platform
- **Type:** Web application (Single Page Application)
- **Access:** Desktop browser (Chrome, Firefox, Edge, Safari)
- **Hosting:** Deployed publicly via Vercel or Netlify, also runnable locally
- **Backend:** Supabase (database + authentication)
- **Frontend:** HTML, Tailwind CSS, JavaScript (ES Modules), Vite

## 1.5 Key Differentiators
- Real-time stock data via Finnhub WebSocket streaming
- Gamified with 25 XP levels, badges, and achievement pop-ups
- Class competition with a live leaderboard
- Teacher admin panel to control and reset simulations
- Full audio experience with music and sound effects
- Sped-up market simulation (1 real minute = 1 market hour)

---

# 2. Problem Statement

## 2.1 The Core Problem
Financial illiteracy is widespread among teenagers. Most students graduate high school without knowing what a stock is, how investing works, or why compound interest matters. This knowledge gap has long-term consequences: delayed retirement savings, poor financial decisions, and a persistent cycle of economic disadvantage.

Existing tools fail this audience:
- **Real trading platforms** (Robinhood, eTrade) are designed for adults, require real money, and carry genuine financial risk
- **Educational apps** (Khan Academy, Investopedia) teach through reading and videos but offer no interactive experience
- **Other simulators** are either too simplified to be engaging, too complex for beginners, or not gamified enough to hold a teenager's attention

## 2.2 Why a Simulator Specifically
A simulator bridges the gap between theory and practice. Users learn by doing — placing real trades, watching their portfolio react to market movements, and experiencing the emotional highs and lows of investing without any real financial risk. The consequences are virtual but the lessons are real.

## 2.3 Why Gamification
Teenagers respond to progress, rewards, and competition. By adding XP, levels, badges, a class leaderboard, and sound effects, StockPilot transforms what could feel like a dry lesson into an engaging game. The goal is that students *want* to open StockPilot, not just use it because they have to.

## 2.4 What StockPilot Solves

| Problem | StockPilot Solution |
|---|---|
| Real investing is too risky for beginners | Virtual PilotCoins replace real money |
| Trading platforms are too complex | Simplified UI with progressive disclosure |
| Finance feels inaccessible to teens | Gamified interface that feels like a game |
| No engagement loop in existing tools | XP, levels, badges, and a live leaderboard |
| Classroom use requires teacher controls | Admin panel with session and reset controls |
| Students lose interest quickly | Real-time data, animations, music, and market events |

---

# 3. Target Users

## 3.1 Primary User — Students

### User Profile
- **Age:** 13–17 (secondary school / high school)
- **Context:** Using StockPilot as part of a Computer Science or Business class
- **Financial knowledge:** Little to none — may know what a stock is but cannot explain how buying one makes money
- **Tech comfort:** High — comfortable with web apps, games, and social media
- **Motivation:** Wants to learn, but needs it to feel fun and low-stakes
- **Device:** Desktop or laptop browser in a school or home setting

### User Persona — Maya Chen
Maya is 15, in Grade 10, and has heard people talk about investing on social media. She thinks it sounds complicated and worries she'd lose money. She's tech-savvy, competitive, and responds well to games with progress bars and rewards. She doesn't want a lecture — she wants to *try* something and see what happens.

**Goals:**
- Understand how stocks work by doing, not reading
- See her portfolio grow and know she's improving
- Compete with classmates without real stakes
- Feel like she's learning something actually useful

**Frustrations:**
- Financial apps feel adult and intimidating
- Too much jargon with no explanation
- No reward for progress — education feels like a chore

### Empathy Map

| | Thinks | Feels |
|---|---|---|
| | "Investing sounds complicated" | Curious but nervous |
| | "I probably need a lot of money to start" | Slightly intimidated |
| | "Maybe I could actually be good at this" | Competitive once engaged |
| | "Is this basically gambling?" | Interested if it feels safe |

| | Says | Does |
|---|---|---|
| | "How do stocks even work?" | Spends money without thinking about investing |
| | "I'd try it if it was easy" | Watches finance content but doesn't act |
| | "I don't want to lose money" | Has never placed a trade |
| | "Who's winning in our class?" | Checks leaderboards in other games |

---

## 3.2 Secondary User — Teacher / Administrator

### User Profile
- **Role:** Computer Science teacher running StockPilot as a class activity
- **Goals:** Run a structured simulation, monitor student engagement, use results as a teaching moment
- **Needs:** Ability to create sessions, set parameters, reset portfolios, view analytics, and announce results
- **Tech comfort:** Moderate — comfortable with web tools but not a developer

### Teacher Capabilities in StockPilot
- Create and configure simulation sessions per class period
- Set starting PilotCoin balance (default PC$10,000)
- Set simulation duration
- Reset individual student portfolios
- Broadcast announcements to all students
- View full analytics dashboard (logins, trades, engagement)
- Export student performance data as CSV
- Trigger end-of-simulation results screen
- Toggle leaderboard visibility

---

## 3.3 Design Implications from User Research

The following design decisions were made directly based on user research:

1. **Make it feel like a game, not a lesson** — Fast feedback loops, visual rewards, sound effects, and animations make the experience feel like playing, not studying. XP bars and level-ups borrow directly from gaming conventions.

2. **Keep everything simple and beginner-friendly** — No jargon without context. Financial terms are introduced naturally through the trading experience. The UI uses plain language and progressive disclosure — advanced features unlock as users level up.

3. **Emphasise safety and experimentation** — The app clearly communicates at every step that PilotCoins are not real money. Users are encouraged to try strategies, make mistakes, and learn from them. Portfolio resets (once per simulation) allow recovery.

4. **Drive competition gently** — The leaderboard motivates without discouraging. Students see % gain alongside total value, so a student who started cautiously can still be competitive. Social emoji reactions to leaderboard moves add a light social layer.

---

# 4. Goals and Objectives

## 4.1 Product Goals

| Goal | Measure of Success |
|---|---|
| Teach stock market basics through doing | Students can explain buy/sell, gain/loss, and portfolio after using the app |
| Create an engaging, game-like experience | Session length and return visits indicate engagement |
| Simulate realistic market conditions | Real Finnhub data, sped-up time, market events, transaction fees |
| Support classroom use at scale | Teacher dashboard functional; 30+ students usable simultaneously |
| Be demo-ready at all times | App works fully on mock data if API is unavailable |

## 4.2 Technical Goals

| Goal | Measure of Success |
|---|---|
| Demonstrate frontend skill | Clean, component-structured Vanilla JS with ES Modules and Vite |
| Demonstrate API integration | Finnhub WebSocket live data with HTTP fallback |
| Demonstrate backend integration | Supabase auth, database reads/writes, real-time subscriptions |
| Demonstrate data visualisation | Chart.js charts (line, pie, bar) updating in real time |
| Demonstrate state management | Predictable app state, no stale data bugs |

## 4.3 Project Goals

| Goal | Target |
|---|---|
| Working demo ready | Within 1 month |
| Full submission ready | Before end of school project deadline |
| Deployed publicly | GitHub + Vercel/Netlify live URL |
| Code quality | Readable, commented where non-obvious, modular |

---

# 5. Core User Flows

## Flow 1 — Sign Up (New Student)

### Description
A new student creates a StockPilot account for the first time.

### Preconditions
- Teacher has created a simulation session and shared a session code or link

### Steps
1. User navigates to StockPilot URL
2. Landing/auth screen is displayed
3. User clicks **"Create Account"**
4. User enters:
   - Display name
   - Email address
   - Password
5. User submits the form
6. Supabase Auth creates the account
7. App creates a user profile row in the database with:
   - Starting balance of PC$10,000 (or teacher-configured amount)
   - XP = 0, Level = 1 ("Rookie Pilot")
   - Portfolio empty
8. Tutorial mode launches automatically
9. After tutorial, user lands on the Dashboard

### Error States
- Email already registered → "An account with this email already exists. Log in instead."
- Password too short (< 8 characters) → "Password must be at least 8 characters."
- Display name taken within session → "That name is already taken. Choose another."
- Network error → "Could not create account. Check your connection and try again."

### Expected Result
User has an account, has completed (or skipped) the tutorial, and is on the Dashboard with PC$10,000 in their balance.

---

## Flow 2 — Log In (Returning Student)

### Description
A returning student logs back into their existing StockPilot account.

### Steps
1. User opens StockPilot
2. Login screen displayed
3. User enters email and password
4. Supabase Auth validates credentials
5. User is redirected to Dashboard
6. All portfolio, XP, and balance data loads from Supabase

### Error States
- Wrong password → "Incorrect email or password."
- Account not found → "No account found with that email. Sign up instead."
- Too many failed attempts → "Too many login attempts. Please wait 5 minutes."
- Network error → "Could not log in. Check your connection."

### Expected Result
User is on the Dashboard with their previous portfolio and balance fully restored.

---

## Flow 3 — Complete Tutorial (First-Time User)

### Description
A brand-new user is guided through a practice simulation before the real competition begins.

### Steps
1. Tutorial mode launches after sign-up
2. User is given a practice portfolio (separate from real portfolio) with PC$10,000
3. Guided overlay appears, highlighting:
   - Step 1: How to search for a stock in the Stock Browser
   - Step 2: How to read a stock's price and chart
   - Step 3: How to place a buy order
   - Step 4: How to view the portfolio and understand gain/loss
   - Step 5: How XP and achievements work
4. Each step requires the user to perform the action (not just read)
5. After all steps, a "Tutorial Complete" screen appears with:
   - Summary of what was covered
   - XP awarded for completing tutorial (50 XP)
   - Button to "Start Real Simulation"
6. Practice portfolio data is discarded
7. User is taken to the real Dashboard

### Error States
- User tries to skip tutorial on first ever login → Skip not allowed until completed once
- User closes browser mid-tutorial → Progress is saved, tutorial resumes where it left off on next login

### Expected Result
User understands the core trading flow and is ready for the real simulation.

---

## Flow 4 — Browse Stocks

### Description
User explores available stocks to find one to trade.

### Steps
1. User navigates to **/stocks** (Stock Browser)
2. Default list of popular US stocks loads (AAPL, TSLA, MSFT, AMZN, GOOGL, etc.)
3. Market status indicator shows whether the simulated market is open or closed
4. Each stock card/row displays:
   - Company logo (fetched from CDN)
   - Ticker symbol (e.g. AAPL)
   - Company name (e.g. Apple Inc.)
   - Current price in PC$
   - Daily % change (green if positive, red if negative)
   - Price change animation (green flash on increase, red flash on decrease)
5. User can:
   - **Search** by ticker or company name (debounced, 300ms delay)
   - **Filter** by sector (Tech, Healthcare, Finance, Energy, Consumer, Other)
   - **Sort** by price, % change today, or alphabetically
   - **Toggle** between table view and card grid view
6. Results paginate at 20 stocks per page
7. User clicks a stock to open the Stock Detail page

### Error States
- API unavailable → Banner: "Live prices unavailable. Showing last known data." — app switches to mock data
- No search results → "No stocks found matching '[query]'. Try a different symbol or name."
- Rate limit hit → "Market data is temporarily unavailable. Retrying in [X] seconds."

### Expected Result
User can find any stock in the available list and navigate to its detail page.

---

## Flow 5 — View Stock Detail

### Description
User views full information about a specific stock before deciding whether to trade it.

### Steps
1. User clicks a stock in the Browser
2. Stock Detail page loads at **/stocks/:symbol**
3. Page displays:
   - Company logo and name
   - Current price (live, updating via WebSocket)
   - Daily high / daily low
   - 52-week high / 52-week low
   - Market cap
   - Sector
   - Price chart with selectable timeframes: **1D / 1W / 1M**
   - Recent news headlines (from Finnhub news API, up to 5 articles)
   - Buy / Sell panel (embedded on the same page)
4. Chart updates in real time as prices stream in
5. User selects a timeframe on the chart
6. News articles display title, source, and link to full article

### Error States
- Chart data fails to load → "Chart data unavailable. Displaying current price only."
- News fails to load → News section hidden with no error shown (non-critical)
- Stock not found → "This stock could not be found. Return to browser."

### Expected Result
User has enough information to make an informed trade decision.

---

## Flow 6 — Place a Market Order (Buy)

### Description
User purchases shares of a stock at the current market price.

### Steps
1. User is on Stock Detail page
2. Buy/Sell panel is visible
3. User selects **"Buy"** tab
4. User selects order type: **Market Order**
5. User enters quantity (whole or fractional shares)
6. App displays live calculation:
   - Shares × current price = subtotal
   - 0.5% transaction fee
   - Total cost
7. If total cost exceeds available balance → warning displayed inline: "You don't have enough PilotCoins for this trade."
8. If total cost is close to (but not exceeding) balance → yellow warning: "This will use [X]% of your available balance."
9. For trades over PC$1,000, a confirmation dialog appears:
   - "You are about to buy [X] shares of [TICKER] for PC$[total]. Confirm?"
10. User confirms (or submits directly for small trades)
11. Trade executes:
    - Shares added to portfolio
    - Cash balance reduced by total cost (including fee)
    - Transaction logged in history
    - XP awarded (10 XP per trade)
12. Toast notification: "✓ Bought [X] shares of [TICKER]"
13. Achievement checked — any triggered achievements show pop-ups

### Error States
- Balance insufficient → "Insufficient PilotCoins. Reduce quantity or sell other holdings."
- Zero quantity entered → "Please enter a valid number of shares."
- Negative quantity entered → Input blocked at form level
- API price stale (no update in 60s) → Warning: "Price may be outdated. Proceed with caution."
- Network error during trade → "Trade failed. Your balance was not changed. Try again."

### Expected Result
Shares appear immediately in the portfolio, balance decreases by the correct amount including fee.

---

## Flow 7 — Place a Limit Order

### Description
User sets a target price at which they want to buy or sell a stock.

### Steps
1. User selects **"Buy"** or **"Sell"** tab on Stock Detail page
2. User selects order type: **Limit Order**
3. User enters:
   - Quantity of shares
   - Limit price (the target price to trigger the order)
4. App validates:
   - For buy limit: limit price should typically be below current price
   - For sell limit: limit price should typically be above current price
   - Warns if the limit price seems unusual (e.g. buy limit set above market)
5. User confirms the order
6. Order is saved to the database with status: **PENDING**
7. Pending orders appear in the portfolio under "Open Orders"
8. When the live price crosses the limit price, the order executes automatically
9. Trade executes as normal (shares + balance updated, XP awarded, notification sent)
10. If the simulation ends before the limit is hit → order expires automatically with notification: "Your limit order for [TICKER] expired without filling."

### Error States
- Insufficient cash reserved for a buy limit → "Insufficient PilotCoins to reserve for this order."
- Limit price is zero or negative → "Please enter a valid limit price."
- User tries to cancel a partially filled order → Cancel allowed; partial fill kept.

### Expected Result
Order sits as pending until triggered by the live price or expires at simulation end.

---

## Flow 8 — Place a Stop-Loss Order

### Description
User sets a price floor at which their shares will automatically sell to limit losses.

### Steps
1. User selects **"Sell"** tab on Stock Detail page
2. User selects order type: **Stop-Loss Order**
3. User enters:
   - Quantity of shares
   - Stop price (the price at which shares should auto-sell)
4. App validates:
   - Stop price must be below current price (it's a floor, not a ceiling)
   - User must own enough shares to cover the stop-loss quantity
5. User confirms
6. Order saved with status: **PENDING (STOP-LOSS)**
7. When live price drops to or below the stop price, order executes as a market sell
8. Notification: "Stop-loss triggered: Sold [X] shares of [TICKER] at PC$[price]"

### Error States
- Stop price set above current price → Warning: "Stop price should be below the current market price."
- User doesn't own enough shares → "You don't own enough shares to set this stop-loss."

### Expected Result
Shares auto-sell when price hits the floor, protecting the user from further losses.

---

## Flow 9 — View Portfolio

### Description
User monitors all current investments and overall account performance.

### Steps
1. User navigates to **/portfolio**
2. Portfolio page loads with:
   - **Account summary bar** at top:
     - Total portfolio value (cash + market value of holdings) in PC$
     - Available cash balance
     - Total gain/loss (PC$ amount and % vs. starting balance)
     - Today's gain/loss
   - **Holdings table:**
     - Company logo + ticker + name
     - Shares owned
     - Average cost (weighted average)
     - Current price (live, updating)
     - Market value (shares × current price)
     - Unrealized gain/loss (PC$ and %)
     - Realised gain/loss (from sold positions)
     - Quick sell button per row
   - **Portfolio diversification pie chart** (by stock weight)
   - **Net worth over time line chart** (portfolio value plotted over simulation period)
   - **Open orders section** (pending limit and stop-loss orders)
3. All prices update in real time via WebSocket
4. Gain values pulse green/red as prices move

### Error States
- No holdings yet → "Your portfolio is empty. Start trading in the Stock Browser."
- Price data unavailable → Holdings shown with last known prices, stale indicator displayed

### Expected Result
User has a complete real-time picture of their investment performance.

---

## Flow 10 — Sell Shares

### Description
User sells shares they own, converting them back to PilotCoins.

### Steps
1. User selects a stock from the portfolio or navigates to its detail page
2. User clicks **"Sell"**
3. User selects order type (Market, Limit, or Stop-Loss)
4. User enters quantity to sell (up to the number of shares owned)
5. App displays:
   - Expected proceeds (shares × current price)
   - 0.5% transaction fee
   - Net proceeds after fee
6. For sales over PC$1,000 → confirmation dialog shown
7. User confirms
8. Trade executes:
   - Shares removed from portfolio
   - Cash balance increases by net proceeds
   - Transaction logged (with realised gain/loss calculated)
   - XP awarded (10 XP per trade)
9. If all shares of a stock are sold → position removed from holdings table
10. Toast notification: "✓ Sold [X] shares of [TICKER] for PC$[proceeds]"

### Error States
- Selling more shares than owned → "You only own [X] shares of [TICKER]."
- Zero quantity entered → "Please enter a valid number of shares."
- Market closed (in real-time mode) → "The market is currently closed. Place a limit order or wait for market open."

### Expected Result
Shares are removed from portfolio, balance increases by the correct amount, realised gain/loss is logged.

---

## Flow 11 — View Leaderboard

### Description
User checks the class rankings to see how their portfolio compares to classmates.

### Steps
1. User navigates to **/leaderboard**
2. Leaderboard loads with real-time rankings
3. Each row shows:
   - Rank position (1st, 2nd, 3rd, etc.)
   - Student display name
   - Investor level title (e.g. "Market Guru")
   - Top badge icon
   - Total portfolio value (PC$)
   - % gain from starting balance
4. The current user's row is highlighted
5. If user is not in the visible top N, their row is pinned at the bottom
6. Students can toggle the leaderboard on or off for themselves
7. Emoji reaction buttons appear next to each user's row
8. Real-time updates as prices change and portfolios shift

### Error States
- No other students in session → "No other students have joined yet."
- Leaderboard hidden by teacher → "The leaderboard is currently hidden."

### Expected Result
User sees live class rankings with their own position clearly highlighted.

---

## Flow 12 — Earn an Achievement

### Description
User performs an action that triggers a badge unlock or level-up.

### Steps
1. User completes a qualifying action (e.g. first trade, 10% portfolio gain)
2. Achievement condition is checked server-side after each relevant action
3. If condition is met:
   - **Small achievement (badge):** Top-right toast notification slides in with badge icon and name: "Achievement unlocked: First Trade!"
   - **Level-up:** Full-screen animated card appears with:
     - New level number and title
     - XP progress bar filling up
     - New badge/title unlocked at this level (if any)
     - Cosmetic reward description
     - Celebration sound effect
4. Achievement is saved to user record in Supabase
5. Badge appears on user's profile and achievements page
6. Leaderboard updates to reflect new level title

### Expected Result
User receives immediate, satisfying feedback for reaching a milestone.

---

## Flow 13 — Teacher Creates a Simulation Session

### Description
Teacher sets up a new class simulation.

### Steps
1. Teacher logs in with admin credentials
2. Navigates to **/admin**
3. Clicks **"New Simulation"**
4. Configures:
   - Session name (e.g. "Period 3 — Spring Simulation")
   - Starting balance (default PC$10,000)
   - Simulation duration (start date and end date)
   - Class period / group name
5. Saves session
6. Session invite code / link is generated
7. Teacher shares the link with students
8. Students who sign up via the link are automatically added to this session

### Expected Result
Session is created. Students who join are all in the same leaderboard and compete under the same rules.

---

## Flow 14 — End-of-Simulation Results

### Description
Teacher ends the simulation and the results screen is revealed.

### Steps
1. Teacher clicks **"End Simulation"** in admin panel
2. All trading is locked immediately
3. Final portfolio values are calculated for all students
4. Results screen activates for all connected students simultaneously:
   - Countdown animation
   - Podium reveals top 3 students (1st, 2nd, 3rd place)
   - Confetti animation for the winner
   - Full final leaderboard table shows all students
   - Personal summary card for each user shows:
     - Final portfolio value
     - Total % gain or loss
     - Number of trades made
     - Best performing stock
     - Worst performing stock
     - Total XP earned
     - Badges unlocked
5. Teacher can export results as CSV from admin panel

### Expected Result
Class sees a celebratory, clear summary of the simulation results.

---

# 6. Feature List (MoSCoW Prioritization)

## 6.1 Must Have — Core Features

These features are required for the application to be functional and usable. Without them, StockPilot does not work.

| Feature | Description |
|---|---|
| User authentication | Sign up, log in, log out via Supabase Auth |
| Dashboard | Account summary with portfolio value, cash, rank, XP |
| Stock Browser | Browse 50+ stocks with real-time prices from Finnhub |
| Stock search | Search by ticker symbol or company name |
| Stock detail page | Price chart (1D/1W/1M), company stats, news, buy/sell panel |
| Market order — Buy | Purchase shares at current market price |
| Market order — Sell | Sell owned shares at current market price |
| Portfolio page | Live holdings table with unrealized/realized gain/loss |
| Balance tracking | PilotCoin (PC$) balance deducted and increased correctly |
| 0.5% transaction fee | Applied on every buy and sell, shown in transaction history |
| Weighted average cost | Correct WAVG cost basis when buying same stock multiple times |
| Fractional shares | Users can buy and sell partial shares |
| Transaction history | Log of all trades for current simulation period |
| Data persistence | All portfolio data saved to Supabase, survives page refresh |
| Supabase Auth | Email/password sign up and login |
| Password reset | Email-based password reset flow |
| Error handling | User-friendly messages for all error states |
| API fallback | Automatic switch to mock data if Finnhub is unavailable |
| Fallback banner | Notify user when live data is unavailable |

## 6.2 Should Have — Important Features

These features significantly improve the product and should be completed if time allows.

| Feature | Description |
|---|---|
| Limit orders | Set a target buy/sell price; executes when price is reached |
| Stop-loss orders | Auto-sell when price drops to a set floor |
| Real-time WebSocket prices | Live streaming price updates via Finnhub WebSocket |
| Green/red flash animations | Prices flash colour when they change |
| Portfolio pie chart | Diversification breakdown by stock weight |
| Net worth line chart | Portfolio value over simulation period |
| Class leaderboard | Real-time ranking by % gain and total portfolio value |
| XP and levelling system | 25 levels with exponential XP thresholds |
| Achievement badges | Unlockable badges with toast and pop-up notifications |
| Teacher admin panel | Create sessions, reset portfolios, broadcast announcements |
| Tutorial mode | Guided first-time walkthrough with practice portfolio |
| Toast notifications | Top-right notifications for trades, achievements, errors |
| Market status indicator | Shows whether simulated market is open/closed |
| Company logos | Fetched from CDN and displayed next to stock names |
| Sector filters | Filter stocks by Tech, Healthcare, Finance, Energy, etc. |
| Sort controls | Sort stocks by price, % change, or alphabetically |
| Table/card view toggle | Switch between list and grid view in stock browser |

## 6.3 Could Have — Nice to Have

These features add polish and depth but are lower priority.

| Feature | Description |
|---|---|
| Watchlist | Save favourite stocks for quick access |
| Random market events | Simulated flash crashes, earnings surprises, bull runs |
| News feed | Real Finnhub news headlines per stock on detail page |
| Price alerts | User-defined notification thresholds per stock |
| Emoji reactions | Leaderboard reactions (light social layer) |
| Full audio system | Background music + sound effects with separate sliders |
| End-of-simulation results screen | Podium, confetti, personal summary cards |
| Teacher analytics dashboard | Student engagement and trade metrics |
| CSV export | Teacher can download full results spreadsheet |
| Dark/light mode toggle | User can switch between themes |
| Projectable leaderboard | Read-only full-screen leaderboard for classroom display |
| Teacher CSV export | Downloadable student results |
| Multiple sessions | Teacher creates separate sessions per class period |

## 6.4 Won't Have — Out of Scope for Version 1

These features are explicitly excluded and will not be built in this version.

| Feature | Reason |
|---|---|
| Real money trading | Out of scope — educational tool only |
| Cryptocurrency trading | Too volatile and complex for a beginner tool |
| Options trading | Advanced derivative instruments — not beginner-appropriate |
| Margin trading / leverage | Overly complex and high-risk concept |
| Mobile application | Desktop-only for this version |
| Multiplayer chat / rooms | Full social features are out of scope |
| Third-party login (Google, GitHub) | Supabase email/password is sufficient |
| Push notifications (browser / email) | In-app notifications cover this use case |
| Custom stock lists by teacher | Pre-set list is sufficient |
| Portfolio backtesting | Historical what-if analysis is a v2 feature |
| AI-generated trading advice | Out of scope and misleading in an educational context |
| Banking / payment integration | No real money involved |

---

# 7. Game Mechanics

## 7.1 Virtual Currency

| Property | Value |
|---|---|
| Currency name | PilotCoins |
| Currency symbol | PC$ |
| Starting balance | PC$10,000 (configurable by teacher) |
| Reason for PC$10,000 | Large enough to buy a meaningful mix of real-price stocks while remaining relatable |

## 7.2 Trading Rules

| Mechanic | Decision | Rationale |
|---|---|---|
| Share types | Fractional shares allowed | Lets users invest in high-price stocks like Amazon or Google with limited budget |
| Minimum trade size | No minimum beyond > 0 shares | Maximum flexibility for users |
| Maximum trade size | No cap — limited only by available balance | Allows aggressive strategies for competition |
| Transaction fee | 0.5% of trade value | Applied to both buy and sell; teaches real trading costs; shown in history |
| Short selling | Not allowed | Too advanced for target audience; out of scope |
| Order types | Market, Limit, Stop-Loss | Progressive complexity: beginners use market orders, experienced users use limit/stop-loss |
| Limit order expiry | Expires at simulation end if unfilled | Simple and predictable behaviour |
| Portfolio reset | Allowed once per simulation period | Gives users one recovery option; prevents permanent frustration |
| Negative balance | Warn but allow | Adds consequence awareness without hard-blocking experimentation |

## 7.3 Simulation Time Mechanics

| Property | Value |
|---|---|
| Simulation speed | 1 real minute = 1 simulated market hour |
| Market hours | Based on NYSE (9:30am – 4:00pm EST, weekdays) but compressed |
| Full trading day duration | ~6.5 real minutes (6.5 hours × 1 min/hour) |
| Simulation period | Set by teacher (default: runs until teacher ends it) |
| Price data source | Real Finnhub WebSocket prices, not artificially generated |

**Note:** Because the simulation is sped up but uses real Finnhub prices, the price movements reflect actual market behaviour. The speed-up affects the *pacing* of the experience (how quickly a simulated "day" passes) rather than the price data itself.

## 7.4 Market Events

Random market events fire during the simulation to create teaching moments and surprise the class:

| Event Type | Effect | Frequency |
|---|---|---|
| Flash crash | Selected sector drops 5–10% suddenly | Rare (1–2 per sim) |
| Earnings surprise | Single stock spikes or drops 10–20% | Occasional |
| Bull run | Broad market rallies 2–5% | Occasional |
| Bear market signal | Broad market drops 2–4% | Occasional |
| Sector rotation | One sector rises while another falls | Regular |

Events are displayed as a **market event banner** visible to all students with a description of what happened (e.g. "BREAKING: Tech sector selloff — down 8%").

## 7.5 Competition Mechanics

| Property | Value |
|---|---|
| Competition scope | Class-wide per session (students vs. classmates) |
| Ranking metric | Both % gain AND total portfolio value shown side by side |
| Leaderboard update frequency | Real-time |
| Leaderboard visibility | Student-toggleable (each student can show/hide for themselves) |
| Badges visible on leaderboard | Yes — highest badge + investor level title shown per user |
| Privacy | Holdings are private; only total value and % gain are public |
| Reactions | Emoji reactions on leaderboard rows (light social interaction) |
| Winner announcement | Teacher triggers end-of-simulation results screen |

---

# 8. Technical Architecture

## 8.1 Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend language | HTML + CSS + JavaScript | Specified by project requirements |
| CSS framework | Tailwind CSS | Utility-first, fast to build with, pairs well with JS |
| JS module system | ES Modules (import/export) | Modern JS, clean dependency management |
| Build tool | Vite | Fast dev server and HMR, simple config, great ES Module support |
| Charts | Chart.js | Beginner-friendly, well-documented, lightweight |
| Backend / Database | Supabase | Managed PostgreSQL + Auth + real-time subscriptions, generous free tier |
| Authentication | Supabase Auth (email/password) | Built-in, secure, no custom auth required |
| Stock data API | Finnhub | Free tier with WebSocket streaming, high rate limit (60/min), news + fundamentals |
| Hosting | Vercel or Netlify | Free tier, instant deploys from GitHub, global CDN |
| Version control | Git + GitHub | Source control and deployment integration |
| Font | Space Grotesk + Orbitron | Techy/futuristic feel matching the gamified dark theme |
| Logo data | Finnhub or free logo CDN | Company logos loaded per ticker |

## 8.2 Frontend Architecture

### File Structure
```
stockpilot/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── public/
│   ├── favicon.ico
│   └── mock-data/
│       └── stocks.json          # Fallback mock stock data
├── src/
│   ├── main.js                  # App entry point, router init
│   ├── router.js                # Client-side routing
│   ├── supabase.js              # Supabase client init
│   ├── finnhub.js               # Finnhub HTTP + WebSocket client
│   ├── state/
│   │   ├── portfolio.js         # Portfolio state and calculations
│   │   ├── user.js              # User session and profile state
│   │   └── simulation.js        # Simulation settings and timer state
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Stocks.js
│   │   ├── StockDetail.js
│   │   ├── Portfolio.js
│   │   ├── Leaderboard.js
│   │   ├── Achievements.js
│   │   ├── Profile.js
│   │   ├── History.js
│   │   ├── Settings.js
│   │   ├── Admin.js
│   │   ├── Tutorial.js
│   │   ├── Auth.js
│   │   └── Results.js
│   ├── components/
│   │   ├── Navbar.js
│   │   ├── StockCard.js
│   │   ├── StockRow.js
│   │   ├── TradePanel.js
│   │   ├── PriceChart.js
│   │   ├── PortfolioTable.js
│   │   ├── LeaderboardRow.js
│   │   ├── AchievementToast.js
│   │   ├── LevelUpCard.js
│   │   ├── MarketEventBanner.js
│   │   ├── Toast.js
│   │   └── Modal.js
│   ├── utils/
│   │   ├── formatCurrency.js    # Format numbers as PC$1,234.56
│   │   ├── formatPercent.js     # Format as +2.34%
│   │   ├── calculateGain.js     # Gain/loss calculation helpers
│   │   ├── debounce.js          # Debounce utility for search
│   │   └── xpCalculator.js      # XP and level calculation logic
│   └── styles/
│       └── main.css             # Tailwind directives + custom CSS
```

## 8.3 Routing

Client-side routing handled in JavaScript without a framework.

| Route | Page | Auth Required |
|---|---|---|
| `/` | Dashboard | Yes |
| `/auth` | Login / Sign Up | No |
| `/stocks` | Stock Browser | Yes |
| `/stocks/:symbol` | Stock Detail | Yes |
| `/portfolio` | Portfolio | Yes |
| `/leaderboard` | Leaderboard | Yes |
| `/achievements` | Achievements | Yes |
| `/profile` | Profile | Yes |
| `/history` | Transaction History | Yes |
| `/settings` | Settings | Yes |
| `/admin` | Teacher Admin Panel | Yes (admin only) |
| `/tutorial` | Tutorial Mode | Yes |
| `/results` | End-of-Simulation Results | Yes |

Unauthenticated users attempting to access any protected route are redirected to `/auth`.

## 8.4 Data Flow

```
[Finnhub WebSocket]
       |
       | Real-time price stream
       v
[finnhub.js] — parses and distributes prices
       |
       ├──> [state/portfolio.js] — recalculates portfolio values
       |         |
       |         └──> [Portfolio page] — DOM updates, chart re-render
       |
       ├──> [StockCard components] — price + flash animation
       |
       └──> [Leaderboard] — triggers re-rank if portfolio value changed

[User Action: Place Trade]
       |
       v
[TradePanel.js] — validates input, calculates cost/proceeds
       |
       v
[Supabase] — writes trade to transactions table
       |
       ├──> [state/portfolio.js] — updates holdings
       |
       ├──> [xpCalculator.js] — awards XP, checks level-up
       |
       └──> [Achievement checker] — checks all achievement conditions
```

## 8.5 Supabase Integration

Supabase is used for:
- **Authentication:** Email/password sign up, login, password reset
- **Database:** All user data, portfolios, transactions, sessions, achievements
- **Real-time subscriptions:** Leaderboard rankings update across all clients when any user's portfolio changes
- **Edge Functions (if needed):** Proxying Finnhub API calls to protect the API key

## 8.6 Finnhub Integration

Finnhub provides two types of data access:

| Access Method | Used For |
|---|---|
| REST API (HTTP) | Stock search, historical chart data, company profile, news |
| WebSocket | Real-time streaming price updates for open stocks |

The Finnhub API key is stored server-side in Supabase and all requests are proxied through a Supabase Edge Function to keep the key out of client-side code.

---

# 9. API Strategy (Finnhub)

## 9.1 Why Finnhub

| Criterion | Finnhub | Why It Wins |
|---|---|---|
| Real-time data | Yes — WebSocket streaming | Only free API with true WebSocket streaming |
| Rate limit (free tier) | 60 requests/minute | Highest free limit — essential for a 30-student classroom |
| Historical data | Yes | Needed for 1D/1W/1M price charts |
| Company fundamentals | Yes | Market cap, sector, 52-week range on stock detail page |
| News feed | Yes | Per-stock news headlines on detail page |
| Ease of integration | Easy | Clean REST + WebSocket docs, beginner-friendly |
| Key security | Proxied via Supabase Edge Function | Key never exposed in client-side code |

## 9.2 Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/quote` | REST GET | Current price, open, high, low, previous close for a symbol |
| `/search` | REST GET | Search stocks by keyword or ticker |
| `/stock/profile2` | REST GET | Company name, sector, market cap, logo URL |
| `/stock/metric` | REST GET | 52-week high/low, P/E ratio (basic stats) |
| `/company-news` | REST GET | Recent news headlines per stock |
| `/stock/candle` | REST GET | Historical OHLCV data for chart rendering |
| WebSocket `wss://ws.finnhub.io` | WebSocket | Real-time trade price streaming |

### Example REST Request (proxied via Supabase Edge Function)
```
GET /functions/v1/finnhub?endpoint=quote&symbol=AAPL
```

### Example WebSocket Subscription
```js
socket.send(JSON.stringify({ type: 'subscribe', symbol: 'AAPL' }))
socket.send(JSON.stringify({ type: 'subscribe', symbol: 'TSLA' }))
```

## 9.3 WebSocket Strategy

- WebSocket connection opens when the user navigates to the Stock Browser or Stock Detail page
- Only subscribe to symbols currently visible on screen (not all 50+ at once)
- When user navigates away, unsubscribe from symbols no longer needed
- Maximum active subscriptions at any time: ~20 (visible stocks on current page)
- Incoming price tick updates the in-memory price store, triggers DOM update + flash animation
- If WebSocket connection drops: attempt reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)

## 9.4 Caching Strategy

| Data Type | Cache Location | Cache Duration | Reason |
|---|---|---|---|
| Stock quote (current price) | In-memory | Until next WebSocket tick | Always fresh from WS |
| Historical candle data (chart) | In-memory per session | 5 minutes | Charts don't need second-by-second history |
| Company profile (name, sector, logo) | Supabase DB | 24 hours | Changes rarely |
| News headlines | In-memory per session | 10 minutes | News refreshes periodically |
| Search results | In-memory | 60 seconds | Prevent repeated search API calls |

## 9.5 Rate Limit Protection

With 30 students and a 60 req/min limit on the free tier, all Finnhub calls are proxied through a single Supabase Edge Function. This means all students share one API key and one rate limit pool.

**Mitigation strategies:**

| Strategy | Implementation |
|---|---|
| Shared backend proxy | All API calls go through Supabase Edge Function, not direct from browser |
| In-memory cache | Repeated requests for the same data within cache TTL return cached result |
| WebSocket for prices | Replaces polling — one subscription feeds all connected clients |
| Debounced search | 300ms debounce on search input prevents keystroke-per-request |
| Lazy chart loading | Historical data only fetched when user opens a stock detail page |
| Queue + retry | If rate limit is hit, requests are queued and retried after 1 second |

## 9.6 Fallback Strategy

If the Finnhub API is unavailable or the rate limit is exceeded:

1. App detects failure (HTTP 429 or network error)
2. Banner appears at top of page: *"Live market data is temporarily unavailable. Showing last known prices."*
3. Last known prices (cached in memory) are displayed with a stale indicator (⚠ icon next to each price)
4. If no cached data exists, the app loads `public/mock-data/stocks.json` — a pre-built dataset of realistic fake prices
5. All trading features remain functional using mock prices
6. Trades made during fallback are still recorded normally
7. When API recovers, app reconnects automatically and banner disappears

## 9.7 Default Stock List

The following tickers are pre-loaded as the default stock list:

**Technology:** AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA, AMD, INTC, ORCL
**Healthcare:** JNJ, PFE, UNH, ABBV, MRK
**Finance:** JPM, BAC, GS, V, MA
**Consumer:** WMT, TGT, MCD, SBUX, NKE, DIS
**Energy:** XOM, CVX, COP
**Industrials:** BA, CAT, GE
**Telecom:** T, VZ

Total: 37 default tickers. Users can search for any additional Finnhub-supported symbol beyond this list.

---

# 10. Database Schema (Supabase)

## 10.1 Overview

All persistent data is stored in Supabase (PostgreSQL). The schema is designed to support:
- Multi-session classroom use (multiple classes running simultaneously)
- Per-user portfolios and transaction history
- Real-time leaderboard updates via Supabase subscriptions
- Teacher admin controls
- Achievement and XP tracking

## 10.2 Tables

### `users`
Stores user profile information, linked to Supabase Auth.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Matches Supabase Auth user ID |
| `display_name` | TEXT | Chosen by user at sign-up, changeable in settings |
| `email` | TEXT | From Supabase Auth |
| `role` | TEXT | `'student'` or `'teacher'` |
| `xp` | INTEGER | Total XP earned, default 0 |
| `level` | INTEGER | Derived from XP, default 1 |
| `level_title` | TEXT | e.g. `'Rookie Pilot'`, updated on level-up |
| `created_at` | TIMESTAMP | Account creation date |
| `last_login` | TIMESTAMP | Last login timestamp |

---

### `sessions`
Represents a single classroom simulation created by a teacher.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Unique session ID |
| `teacher_id` | UUID (FK → users.id) | Teacher who created this session |
| `name` | TEXT | e.g. `'Period 3 — Spring Simulation'` |
| `starting_balance` | DECIMAL | Default 10000.00 |
| `start_date` | TIMESTAMP | When simulation opens for trading |
| `end_date` | TIMESTAMP | When simulation closes (NULL = teacher-ended) |
| `status` | TEXT | `'active'`, `'ended'`, `'pending'` |
| `invite_code` | TEXT | Unique code students use to join |
| `created_at` | TIMESTAMP | |

---

### `session_members`
Links students to a specific session.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `session_id` | UUID (FK → sessions.id) | |
| `user_id` | UUID (FK → users.id) | |
| `cash_balance` | DECIMAL | Current available PilotCoins |
| `starting_balance` | DECIMAL | Starting balance at session join |
| `portfolio_value` | DECIMAL | Cached total value (cash + holdings), updated on price change |
| `percent_gain` | DECIMAL | `(portfolio_value - starting_balance) / starting_balance * 100` |
| `reset_used` | BOOLEAN | Whether the user has used their one portfolio reset |
| `joined_at` | TIMESTAMP | |

---

### `holdings`
Tracks current stock positions for each user in a session.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `session_member_id` | UUID (FK → session_members.id) | |
| `symbol` | TEXT | Ticker symbol e.g. `'AAPL'` |
| `shares` | DECIMAL | Number of shares owned (supports fractional) |
| `avg_cost` | DECIMAL | Weighted average cost per share |
| `updated_at` | TIMESTAMP | Last updated when shares bought/sold |

---

### `transactions`
Full log of every trade executed.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `session_member_id` | UUID (FK → session_members.id) | |
| `symbol` | TEXT | Ticker |
| `type` | TEXT | `'buy'` or `'sell'` |
| `order_type` | TEXT | `'market'`, `'limit'`, `'stop_loss'` |
| `shares` | DECIMAL | Number of shares traded |
| `price` | DECIMAL | Price per share at execution |
| `fee` | DECIMAL | 0.5% transaction fee amount |
| `total` | DECIMAL | Total cost or proceeds (shares × price ± fee) |
| `realized_gain` | DECIMAL | Profit/loss on sell trades (NULL for buys) |
| `executed_at` | TIMESTAMP | When the trade was executed |

---

### `orders`
Pending limit and stop-loss orders waiting to be triggered.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `session_member_id` | UUID (FK → session_members.id) | |
| `symbol` | TEXT | |
| `type` | TEXT | `'buy'` or `'sell'` |
| `order_type` | TEXT | `'limit'` or `'stop_loss'` |
| `shares` | DECIMAL | |
| `limit_price` | DECIMAL | Target price to trigger the order |
| `status` | TEXT | `'pending'`, `'filled'`, `'expired'`, `'cancelled'` |
| `created_at` | TIMESTAMP | |
| `filled_at` | TIMESTAMP | NULL until filled |

---

### `achievements`
Master list of all available achievements and badges.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT (PK) | e.g. `'first_trade'`, `'ten_percent_gain'` |
| `name` | TEXT | Display name e.g. `'First Trade'` |
| `description` | TEXT | How to earn it |
| `badge_icon` | TEXT | Icon identifier or emoji |
| `xp_reward` | INTEGER | XP awarded on unlock |
| `is_hidden` | BOOLEAN | Hidden/secret achievements |

---

### `user_achievements`
Tracks which achievements each user has unlocked.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id) | |
| `achievement_id` | TEXT (FK → achievements.id) | |
| `unlocked_at` | TIMESTAMP | |

---

### `announcements`
Teacher broadcast messages visible to all students in a session.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `session_id` | UUID (FK → sessions.id) | |
| `teacher_id` | UUID (FK → users.id) | |
| `message` | TEXT | The announcement text |
| `created_at` | TIMESTAMP | |
| `expires_at` | TIMESTAMP | When to stop showing the announcement |

---

### `market_events`
Log of random market events fired during a simulation.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `session_id` | UUID (FK → sessions.id) | |
| `event_type` | TEXT | `'flash_crash'`, `'bull_run'`, `'earnings_surprise'`, etc. |
| `description` | TEXT | Human-readable event description |
| `affected_symbol` | TEXT | NULL for broad events, ticker for single-stock events |
| `price_impact` | DECIMAL | Percentage impact on affected stock(s) |
| `fired_at` | TIMESTAMP | |

---

### `price_alerts`
User-defined price notification thresholds.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users.id) | |
| `symbol` | TEXT | |
| `alert_type` | TEXT | `'above'` or `'below'` |
| `threshold_price` | DECIMAL | Price that triggers the alert |
| `triggered` | BOOLEAN | Whether the alert has fired |
| `created_at` | TIMESTAMP | |

---

## 10.3 Real-Time Subscriptions

Supabase real-time is enabled on:

| Table | Event | Used For |
|---|---|---|
| `session_members` | UPDATE | Leaderboard re-ranks when any student's portfolio value changes |
| `announcements` | INSERT | Students see teacher broadcasts instantly |
| `market_events` | INSERT | Market event banner appears for all students simultaneously |
| `orders` | UPDATE | Order status updates (filled, expired) reach the placing user |

---

# 11. State Management

## 11.1 Approach

StockPilot uses a **module-based state store** pattern in plain JavaScript. No external state library is used. Each state module exports a reactive state object and update functions. Components import from these modules directly.

This keeps the architecture simple and framework-free while maintaining a single source of truth for each domain.

## 11.2 State Modules

### `state/user.js`
```js
// Stores the authenticated user's profile and session data
export const userState = {
  id: null,
  displayName: null,
  email: null,
  role: null,           // 'student' | 'teacher'
  xp: 0,
  level: 1,
  levelTitle: 'Rookie Pilot',
  achievements: [],
  sessionMemberId: null,
  cashBalance: 0,
  startingBalance: 0,
}
```

### `state/portfolio.js`
```js
// Stores the user's current holdings and calculated values
export const portfolioState = {
  holdings: [],         // Array of { symbol, shares, avgCost, currentPrice, marketValue, unrealizedGain }
  openOrders: [],       // Pending limit and stop-loss orders
  totalMarketValue: 0,  // Sum of all holdings at current prices
  totalPortfolioValue: 0, // cash + totalMarketValue
  totalGainLoss: 0,     // totalPortfolioValue - startingBalance
  totalGainLossPct: 0,  // as a percentage
  todayGainLoss: 0,     // change since last session snapshot
  realizedGainLoss: 0,  // sum of all closed position profits/losses
}
```

### `state/simulation.js`
```js
// Stores simulation settings and current market state
export const simulationState = {
  sessionId: null,
  sessionName: null,
  startDate: null,
  endDate: null,
  status: 'active',     // 'active' | 'ended' | 'pending'
  startingBalance: 10000,
  marketOpen: true,
  currentSimTime: null, // The current simulated market time
  activeEvents: [],     // Currently visible market event banners
}
```

### `state/prices.js`
```js
// In-memory price store updated by WebSocket ticks
export const priceStore = new Map()
// priceStore.get('AAPL') → { price: 189.52, change: +1.24, changePct: +0.66, timestamp: ... }
```

## 11.3 State Update Flow

1. WebSocket receives price tick for symbol `X`
2. `prices.js` `updatePrice(symbol, data)` is called
3. `portfolio.js` `recalculate()` is triggered — updates `marketValue` for any holding of symbol `X`
4. `portfolioState.totalPortfolioValue` is recalculated
5. Supabase `session_members` row is updated with new `portfolio_value` and `percent_gain`
6. Supabase real-time subscription fires on all other clients → leaderboard re-renders

## 11.4 Persistence Strategy

| Data | Where Stored | Sync Frequency |
|---|---|---|
| User profile, XP, level | Supabase `users` | On login, on XP change |
| Portfolio holdings | Supabase `holdings` | After every trade |
| Cash balance | Supabase `session_members` | After every trade |
| Transaction history | Supabase `transactions` | After every trade (append only) |
| Pending orders | Supabase `orders` | On create, on status change |
| Price data | In-memory only | Never persisted |
| Achievements unlocked | Supabase `user_achievements` | On unlock |
| Price alerts | Supabase `price_alerts` | On create/delete |
| Settings (theme, audio) | Browser localStorage | On change |

---

# 12. Data Visualization Plan

## 12.1 Charts Overview

All charts are built with **Chart.js**. Charts are responsive, interactive (hover tooltips), and update in real time where applicable.

| Chart | Type | Location | Updates |
|---|---|---|---|
| Stock price history | Line chart | Stock Detail page | On timeframe change |
| Portfolio net worth over time | Line chart | Portfolio page | Periodically (every sim "day") |
| Portfolio diversification | Pie/doughnut chart | Portfolio page | After each trade |
| Gain/loss per holding | Horizontal bar chart | Portfolio page | Real-time |
| Leaderboard value comparison | Bar chart | Leaderboard page | Real-time |

## 12.2 Stock Price Chart (Line Chart)

- **Location:** Stock Detail page (`/stocks/:symbol`)
- **Data:** OHLCV candles from Finnhub `/stock/candle`
- **Timeframes:** 1D (intraday), 1W (7 days), 1M (30 days)
- **X-axis:** Time (formatted as HH:mm for 1D, Mon/Tue for 1W, Jan 15 for 1M)
- **Y-axis:** Price in PC$
- **Color:** Green line if current price > open price, red line if below
- **Fill:** Subtle gradient fill below the line matching the line colour
- **Tooltip:** Shows exact price, time, volume on hover
- **Behaviour:** Switches dataset when user selects a different timeframe tab

## 12.3 Portfolio Net Worth Chart (Line Chart)

- **Location:** Portfolio page (`/portfolio`)
- **Data:** Snapshot of `portfolio_value` stored once per simulated market day
- **X-axis:** Simulation day number or date
- **Y-axis:** Total portfolio value in PC$
- **Reference line:** Dashed horizontal line at the starting balance (PC$10,000)
- **Color:** Green if current value is above starting balance, red if below
- **Tooltip:** Date + portfolio value on hover

## 12.4 Portfolio Diversification Chart (Doughnut Chart)

- **Location:** Portfolio page (`/portfolio`)
- **Data:** Each holding as a % of total portfolio market value
- **Labels:** Ticker symbols
- **Colors:** Distinct colour per stock (auto-generated from a fixed palette)
- **Centre text:** Total portfolio value in PC$
- **Tooltip:** "[TICKER]: PC$[value] ([X]%)" on hover
- **Behaviour:** Updates immediately after any buy or sell

## 12.5 Gain/Loss per Holding (Horizontal Bar Chart)

- **Location:** Portfolio page, below the holdings table
- **Data:** Unrealized gain/loss % per held stock
- **Bars:** Green for positive, red for negative
- **X-axis:** Percentage gain/loss
- **Y-axis:** Stock tickers
- **Sorted:** Biggest winner at top, biggest loser at bottom
- **Tooltip:** "PC$[gain/loss] ([X]%) on hover

## 12.6 Chart Design Principles

All charts follow these rules to keep them readable for teen users:

| Principle | Implementation |
|---|---|
| Minimal clutter | No gridlines on mobile-style layouts; light gridlines on desktop |
| Colour-coded gain/loss | Green = up, Red = down, consistent everywhere in the app |
| Hover-only details | Exact numbers shown in tooltips, not crowding the chart |
| Smooth animations | `animation.duration: 400ms` on Chart.js updates |
| Responsive | All charts resize on window resize |
| No jargon on axes | "Portfolio Value (PC$)" not "NAV" or "AUM" |

---

# 13. Achievement and XP System

## 13.1 System Overview

StockPilot uses a dual-layered progression system:
- **XP (Experience Points):** Earned through trading actions. Accumulates to unlock levels.
- **Badges:** Unlocked by reaching specific milestones. Displayed on profile and leaderboard.
- **Levels:** 25 investor levels with exponential XP thresholds. Purely cosmetic — unlock a title and badge colour.

## 13.2 XP Economy

### Actions That Earn XP

| Action | XP Awarded |
|---|---|
| Complete the tutorial | 50 XP |
| Place first trade (any) | 25 XP |
| Each subsequent buy trade | 10 XP |
| Each subsequent sell trade | 10 XP |
| Portfolio reaches +5% gain | 75 XP |
| Portfolio reaches +10% gain | 150 XP |
| Portfolio reaches +25% gain | 300 XP |
| Portfolio reaches +50% gain | 500 XP |
| Portfolio reaches +100% gain (double up) | 1000 XP |
| First limit order placed | 30 XP |
| First stop-loss order placed | 30 XP |
| First time holding 5 different stocks | 50 XP |
| First time holding 10 different stocks | 100 XP |
| Unlock any badge | 20 XP bonus |

### XP Does NOT Decrease
XP is never removed. Losing portfolio value does not reduce XP. Progress is permanent.

## 13.3 Level Thresholds (Exponential Curve)

Each level requires more XP than the last. The formula is approximately:
`XP required for level N = 100 × (1.35 ^ (N-1))`

| Level | Title | XP Required (cumulative) |
|---|---|---|
| 1 | Rookie Pilot | 0 |
| 2 | Junior Trader | 100 |
| 3 | Market Watcher | 235 |
| 4 | Stock Spotter | 417 |
| 5 | Trade Starter | 663 |
| 6 | Chart Reader | 995 |
| 7 | Portfolio Builder | 1443 |
| 8 | Risk Taker | 2048 |
| 9 | Sector Scout | 2865 |
| 10 | Bull Believer | 3968 |
| 11 | Bear Survivor | 5456 |
| 12 | Momentum Rider | 7465 |
| 13 | Dividend Chaser | 10178 |
| 14 | Value Hunter | 13840 |
| 15 | Swing Trader | 18784 |
| 16 | Day Trader | 25458 |
| 17 | Portfolio Pro | 34468 |
| 18 | Market Analyst | 46632 |
| 19 | Hedge Seeker | 63053 |
| 20 | Alpha Chaser | 85221 |
| 21 | Wall Street Cadet | 115148 |
| 22 | Financial Hawk | 155450 |
| 23 | Market Veteran | 209857 |
| 24 | Stock Legend | 283306 |
| 25 | Market Guru | 382463 |

## 13.4 Badge List

### Standard Badges (Visible from Start)

| Badge ID | Name | Description | XP Bonus |
|---|---|---|---|
| `first_trade` | First Trade | Place your first trade | 20 XP |
| `first_sell` | First Exit | Sell a stock for the first time | 20 XP |
| `first_profit` | In the Green | Sell a stock for a profit | 25 XP |
| `first_loss` | Lesson Learned | Sell a stock at a loss | 15 XP |
| `diversified_5` | Spread the Risk | Hold 5 different stocks at once | 30 XP |
| `diversified_10` | Portfolio Pro | Hold 10 different stocks at once | 50 XP |
| `gain_5pct` | Up 5% | Portfolio gains 5% | 40 XP |
| `gain_10pct` | Double Digits | Portfolio gains 10% | 75 XP |
| `gain_25pct` | Quarter Up | Portfolio gains 25% | 150 XP |
| `gain_50pct` | Half a Million Mindset | Portfolio gains 50% | 250 XP |
| `gain_100pct` | Doubled Up | Portfolio value doubles | 500 XP |
| `limit_order` | Precision Trader | Place your first limit order | 30 XP |
| `stop_loss` | Risk Manager | Place your first stop-loss order | 30 XP |
| `10_trades` | Active Trader | Execute 10 total trades | 50 XP |
| `50_trades` | Market Regular | Execute 50 total trades | 100 XP |
| `tech_investor` | Tech Bull | Hold 3 tech stocks simultaneously | 30 XP |
| `all_sectors` | Sector Diversifier | Hold at least 1 stock from 5 different sectors | 75 XP |
| `survive_crash` | Crash Survivor | Hold through a market event without panic selling | 50 XP |
| `top_3` | Podium Finisher | Finish the simulation in the top 3 | 200 XP |
| `rank_1` | Champion Investor | Finish the simulation in 1st place | 500 XP |
| `tutorial_done` | Cleared for Takeoff | Complete the tutorial | 25 XP |
| `level_10` | Hitting Altitude | Reach Level 10 | 100 XP |
| `level_25` | Market Guru Status | Reach Level 25 | 1000 XP |

### Hidden/Secret Badges (Not Visible Until Unlocked)

| Badge ID | Name | Trigger |
|---|---|---|
| `night_owl` | Night Owl | Log in between midnight and 5am (sim time) |
| `paper_hands` | Paper Hands | Sell every stock within 1 simulated hour of buying |
| `diamond_hands` | Diamond Hands | Hold a stock through a 15%+ drop without selling |
| `all_in` | All In | Spend 95%+ of balance on a single trade |
| `perfect_timing` | Market Psychic | Buy a stock within 1 sim-hour of a bull run starting |
| `big_spender` | Big Spender | Execute a single trade worth over PC$5,000 |

## 13.5 Level-Up Cosmetic Rewards

When a user levels up, they receive a cosmetic reward. These do not affect gameplay.

| Level Range | Cosmetic Reward Type |
|---|---|
| 1–5 | New investor title |
| 6–10 | Profile badge colour upgrade (silver border) |
| 11–15 | Profile badge colour upgrade (gold border) |
| 16–20 | Animated profile border effect |
| 21–24 | Custom level badge icon |
| 25 | Unique "Market Guru" crown icon + animated leaderboard name effect |

## 13.6 Notification Behaviour

| Trigger | Notification Type |
|---|---|
| Badge unlocked (standard) | Top-right toast: icon + badge name + XP bonus |
| Level up | Full-screen animated card: new level, title, XP bar fill animation |
| Secret badge unlocked | Full-screen card with "Secret Achievement Unlocked!" header |
| XP gained (any action) | Small floating +XP text that fades near the action button |

---

# 14. Class Leaderboard System

## 14.1 Overview

The leaderboard tracks all students within a session and ranks them by financial performance. It updates in real time as prices change and portfolio values shift.

## 14.2 Leaderboard Columns

| Column | Description |
|---|---|
| Rank | Numeric position (1st, 2nd, 3rd, etc.) |
| Display Name | Student's chosen name |
| Level Title | Current investor level title (e.g. "Market Analyst") |
| Top Badge | Highest-tier badge icon earned |
| Total Portfolio Value | Cash + market value of all holdings in PC$ |
| % Gain | `(current value − starting balance) / starting balance × 100` |
| Reactions | Emoji reaction buttons (👍 🚀 😮 😬) |

## 14.3 Real-Time Updates

Leaderboard rankings are powered by Supabase real-time subscriptions on the `session_members` table. When any student's `portfolio_value` column is updated, all connected clients receive the change and re-render the leaderboard row.

**Update path:**
1. Price tick received via WebSocket
2. Portfolio value recalculated in `state/portfolio.js`
3. Supabase `session_members` row updated
4. Real-time subscription fires on all clients
5. Leaderboard row re-renders with smooth transition

## 14.4 User's Own Row

- The current user's row is always highlighted with a distinct background
- If the current user is outside the visible top N, their row is pinned at the bottom of the table with a separator ("Your position: #12")
- Rank change indicators show ▲ or ▼ with how many positions changed since last render

## 14.5 Visibility Toggle

Each student can toggle the leaderboard visibility for themselves:
- **On (default):** Full leaderboard visible with all rankings
- **Off:** Leaderboard hidden; user sees only their own stats

This allows students who find the competition stressful to focus on their own performance. The toggle is saved in localStorage per user.

## 14.6 Teacher Controls

The teacher can:
- **Hide the leaderboard for all students** (e.g. during a surprise reveal)
- **Re-show the leaderboard** at any time
- **Trigger the end-of-simulation results screen** which replaces the leaderboard with the final podium

## 14.7 Emoji Reactions

Each leaderboard row has a compact emoji reaction bar. Students can react to any row (including their own) once per session. Reactions are stored in Supabase and shown as counts next to each emoji.

Available reactions: 👍 🚀 😮 😬 🔥

Reactions are lightweight social feedback only — they do not affect rankings or XP.

## 14.8 Multiple Sessions

Teachers can run multiple simultaneous sessions (e.g. Period 1 and Period 3 have separate simulations). Each session has its own:
- Leaderboard
- Starting balance setting
- Simulation start/end dates
- Student roster

Students are members of one session at a time (the one they joined via invite code).

---

# 15. Market Events System

## 15.1 Purpose

Random market events fire during a simulation to:
- Create surprise moments that force students to react
- Teach that real markets have unexpected shocks
- Keep the simulation exciting beyond just watching prices drift

## 15.2 Event Types

| Event Type | Description | Affected Scope | Price Impact |
|---|---|---|---|
| Flash Crash | A sudden broad market selloff | All stocks | −5% to −10% |
| Bull Run | A broad market surge | All stocks | +3% to +7% |
| Sector Selloff | A specific sector drops sharply | One sector | −8% to −15% |
| Sector Rally | A specific sector surges | One sector | +5% to +12% |
| Earnings Surprise (Beat) | A company reports better-than-expected results | Single stock | +10% to +25% |
| Earnings Surprise (Miss) | A company reports worse-than-expected results | Single stock | −10% to −20% |
| Analyst Upgrade | A stock is upgraded to "Strong Buy" | Single stock | +5% to +10% |
| Analyst Downgrade | A stock is downgraded to "Sell" | Single stock | −5% to −10% |
| Bear Market Signal | Broad pessimism signal | All stocks | −2% to −5% |
| Market Recovery | Rebound after a crash | All stocks | +2% to +5% |

## 15.3 Event Frequency

Events are random but rate-limited to prevent chaos:

| Rule | Value |
|---|---|
| Minimum gap between any two events | 10 simulated market hours |
| Maximum events per simulated day | 2 |
| Flash Crash frequency | At most once per full simulation |
| Bull Run frequency | At most twice per full simulation |
| Single-stock events | Up to 3 per simulated day across all stocks |

## 15.4 Event Display

When an event fires, a **Market Event Banner** appears at the top of every page simultaneously for all students in the session (via Supabase real-time):

```
⚡ MARKET EVENT: Tech Sector Selloff
Concerns over rising interest rates have triggered a broad tech selloff.
NASDAQ-listed tech stocks are down 9% in early trading.
[Dismiss]
```

The banner:
- Appears on all pages except the tutorial
- Stays visible for 60 seconds or until dismissed by the user
- Uses a bold yellow/amber colour to stand out from normal UI
- Plays an alert sound effect if audio is enabled

## 15.5 Price Impact Application

When an event fires:
1. The event is written to the `market_events` table in Supabase
2. The frontend applies the price multiplier to all affected symbols in the in-memory `priceStore`
3. Affected stock cards flash red or green to show the impact
4. Portfolio values recalculate immediately
5. The event is logged in the `market_events` table for the teacher's analytics dashboard

## 15.6 Educational Value

After each market event, a small **"What happened?"** card is accessible from the banner:
- One-sentence explanation of the real-world phenomenon being simulated
- Example: *"A flash crash happens when a rapid wave of automated selling causes prices to fall sharply in minutes. They are usually short-lived."*

---

# 16. Audio System

## 16.1 Overview

StockPilot features a full audio system with background music and sound effects. All audio is controlled from the Settings page with separate sliders for music volume and effects volume.

## 16.2 Background Music

| Track | When It Plays |
|---|---|
| Main theme (upbeat, electronic) | Dashboard and Stock Browser |
| Tense market theme | During a flash crash or major selloff event |
| Victory theme (short loop) | End-of-simulation results screen |
| Calm ambient | Portfolio page and History page |
| Tutorial theme | Tutorial mode |

Music fades smoothly between tracks on page navigation (0.5s crossfade).

## 16.3 Sound Effects

| Sound Effect | Trigger |
|---|---|
| Cash register / coin sound | Successful buy order |
| Whoosh / sell sound | Successful sell order |
| Level-up chime (ascending) | User levels up |
| Badge unlock pop | Standard badge unlocked |
| Achievement fanfare | Rare / secret badge unlocked |
| Alert ping | Price alert triggered |
| Market event alarm | Market event banner appears |
| Error buzz | Failed trade (insufficient balance, invalid input) |
| Confirmation click | Trade confirmation dialog confirmed |
| Notification ding | Toast notification appears |
| Confetti boom | End-of-simulation winner reveal |

## 16.4 Audio Controls

Accessible from the Settings page (`/settings`) and also from a compact audio control in the navbar:

| Control | Type | Default |
|---|---|---|
| Music volume | Slider (0–100%) | 40% |
| Sound effects volume | Slider (0–100%) | 70% |
| Mute all (quick toggle) | Toggle button in navbar | Unmuted |

Settings are saved to browser `localStorage` so preferences persist between sessions.

## 16.5 Audio Implementation Notes

- All audio files are loaded as `<audio>` elements or via the Web Audio API
- Audio only starts playing after the first user interaction (browser autoplay policy)
- Audio files are compressed (MP3, ~96kbps) to minimise load time
- A single AudioManager module handles all playback, fading, and volume control

---

# 17. News Feed Integration

## 17.1 Overview

Each stock detail page includes a live news feed pulling real headlines from the Finnhub `/company-news` endpoint. This adds context to price movements and makes the simulator feel connected to the real world.

## 17.2 News Display

Location: Stock Detail page (`/stocks/:symbol`), below the price chart

Each news item shows:
- **Headline** (truncated to 2 lines)
- **Source name** (e.g. Reuters, Bloomberg, CNBC)
- **Time ago** (e.g. "2 hours ago")
- **Clickable** — opens full article in a new tab

Up to **5 most recent articles** are shown per stock.

## 17.3 Fetch Strategy

| Property | Value |
|---|---|
| Endpoint | `GET /company-news?symbol={ticker}&from={date}&to={date}` |
| Fetch trigger | When user opens the Stock Detail page |
| Cache duration | 10 minutes in-memory |
| Fallback if no news | Section is hidden silently — no error shown |
| Date range | Last 7 calendar days |

## 17.4 News Section Design

```
[ LATEST NEWS ]
─────────────────────────────────────────────────────
📰  Apple reports record Q2 revenue, beats estimates   Reuters · 2 hours ago
📰  iPhone 17 supply concerns weigh on AAPL outlook    CNBC · 5 hours ago
📰  Warren Buffett increases Apple stake to 6.2%       Bloomberg · 1 day ago
```

If news fails to load, the section disappears entirely — it is non-critical and should never block the trading flow.

---

# 18. Tutorial and Onboarding

## 18.1 Purpose

The tutorial ensures that every first-time user understands the core mechanics before entering the real simulation. It uses a **separate practice portfolio** so users can experiment without affecting their actual balance.

## 18.2 Tutorial Structure

The tutorial is split into 5 guided steps. Each step requires the user to perform the actual action — not just read about it.

### Step 1 — Find a Stock
- Guided overlay highlights the search bar
- Instruction: *"Search for Apple — type AAPL in the search bar."*
- User must type and select AAPL to proceed
- Tooltip explains what a ticker symbol is

### Step 2 — Read the Stock Detail
- User is taken to the AAPL detail page
- Overlay highlights: current price, daily change, chart
- Instruction: *"This is where you'll find everything about a stock before you trade it."*
- User clicks "Got it" to continue

### Step 3 — Place Your First Buy Order
- Overlay highlights the Buy/Sell panel
- Instruction: *"Buy 2 shares of Apple using your practice balance."*
- User enters 2 in the quantity field and clicks Buy
- After execution, XP animation plays (+25 XP)
- Tooltip explains: shares, price, fee, total cost

### Step 4 — Check Your Portfolio
- User is navigated to the Portfolio page
- Overlay highlights their new holding
- Instruction: *"This is your portfolio. It shows everything you own and how much it's worth."*
- Tooltip explains: unrealized gain/loss, average cost, market value

### Step 5 — Learn About XP and Achievements
- User is taken to the Achievements page
- Overlay highlights their first unlocked badge (First Trade)
- Instruction: *"You earned your first badge! Complete achievements to level up and earn new titles."*
- XP bar animation shows progress toward Level 2

### Tutorial Complete
- "Tutorial Complete" screen with summary:
  - Checklist of what was covered
  - Total XP earned: 50 XP
  - Badge unlocked: "Cleared for Takeoff"
  - Button: "Start Real Simulation"
- Practice portfolio data is discarded
- User lands on Dashboard with real PC$10,000 balance

## 18.3 Tutorial Rules

| Rule | Behaviour |
|---|---|
| First login | Tutorial launches automatically, cannot be skipped |
| Subsequent logins | Tutorial can be replayed from Settings → "Replay Tutorial" |
| Mid-tutorial browser close | Progress saved; tutorial resumes from last completed step |
| Practice portfolio | Entirely separate from real portfolio; discarded after tutorial |
| XP from tutorial | Counts toward the real account (50 XP awarded on completion) |

## 18.4 In-App Help

Beyond the tutorial, contextual help is available throughout the app:

| Feature | Description |
|---|---|
| FAQ page (`/help`) | Dedicated page with common questions and answers |
| Term tooltips | Hover over any financial term (e.g. "Unrealized Gain") to see a plain-language definition |
| Trade confirmation dialog | Shows a breakdown of the order before executing |
| Error messages | All errors use plain language with a suggested action |

## 18.5 FAQ Topics

The FAQ page covers:

1. What are PilotCoins?
2. How do I buy a stock?
3. What is a limit order?
4. What is a stop-loss?
5. What does unrealized gain mean?
6. How is the leaderboard ranked?
7. How do I earn XP and badges?
8. Can I reset my portfolio?
9. What happens when the simulation ends?
10. Why is my live price different from what I see on Google?

---

# 19. UI Design Specifications

## 19.1 Visual Theme

StockPilot uses a **gamified dark theme** — dark background with neon/vibrant accents. It should feel like a high-energy trading game, not a dry financial tool. References: Discord's dark sidebar feel crossed with a modern trading dashboard energy.

Default: Dark mode. Users can toggle to light mode from Settings.

## 19.2 Colour Palette

### Dark Mode (Default)

| Role | Colour | Hex |
|---|---|---|
| Background (primary) | Deep navy/black | `#0D0F14` |
| Background (surface) | Dark card background | `#161B26` |
| Background (elevated) | Slightly lighter card | `#1E2535` |
| Border / divider | Subtle outline | `#2A3245` |
| Accent (primary) | Electric blue | `#3B82F6` |
| Accent (secondary) | Vivid purple | `#8B5CF6` |
| Gain / positive | Neon green | `#22C55E` |
| Loss / negative | Vivid red | `#EF4444` |
| Warning | Amber | `#F59E0B` |
| Text (primary) | Near-white | `#F1F5F9` |
| Text (secondary) | Muted grey | `#94A3B8` |
| Text (disabled) | Dim grey | `#475569` |
| XP bar fill | Gradient: blue → purple | `#3B82F6` → `#8B5CF6` |

### Light Mode

| Role | Colour | Hex |
|---|---|---|
| Background (primary) | Off-white | `#F8FAFC` |
| Background (surface) | White | `#FFFFFF` |
| Background (elevated) | Light grey | `#F1F5F9` |
| Border / divider | Light border | `#E2E8F0` |
| Accent (primary) | Blue | `#2563EB` |
| Gain / positive | Green | `#16A34A` |
| Loss / negative | Red | `#DC2626` |
| Text (primary) | Dark slate | `#0F172A` |
| Text (secondary) | Slate | `#64748B` |

## 19.3 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| App logo / hero headings | Orbitron | 700 (Bold) | 24–36px |
| Page headings (H1) | Space Grotesk | 700 | 28px |
| Section headings (H2) | Space Grotesk | 600 | 20px |
| Body text | Space Grotesk | 400 | 14–16px |
| Numbers / prices | Space Grotesk | 600 | 14–18px (monospaced tabular) |
| Labels / captions | Space Grotesk | 400 | 12px |
| Badges / tags | Space Grotesk | 600 | 11px uppercase |

Both fonts are loaded from Google Fonts. Fallback: `system-ui, sans-serif`.

## 19.4 Component Styles

### Buttons

| Variant | Style |
|---|---|
| Primary (Buy) | Solid green background, white text, rounded-lg, hover darken |
| Destructive (Sell) | Solid red background, white text, rounded-lg, hover darken |
| Secondary | Dark surface background, accent border, accent text |
| Ghost | Transparent, accent text, hover surface background |
| Disabled | Dimmed, cursor-not-allowed |

All buttons have a 150ms transition on hover and a press/active scale(0.97) effect.

### Cards

- Background: `surface` colour
- Border: 1px `border` colour
- Border radius: `rounded-xl` (12px)
- Padding: 16–24px
- Hover: subtle border glow in accent colour on interactive cards

### Inputs

- Background: `elevated` colour
- Border: 1px `border` colour, focus ring in accent colour
- Border radius: `rounded-lg` (8px)
- Placeholder: secondary text colour
- Error state: red border + red helper text below

### Tables

- Header row: slightly elevated background, secondary text, uppercase labels
- Body rows: alternating subtle shade on hover
- Borders: horizontal dividers only (no vertical lines)
- Numbers: right-aligned, monospaced

## 19.5 Animations and Transitions

| Element | Animation | Duration |
|---|---|---|
| Page transitions | Fade in/out | 200ms |
| Price flash (increase) | Background flashes `#22C55E` → transparent | 600ms |
| Price flash (decrease) | Background flashes `#EF4444` → transparent | 600ms |
| Toast notification slide-in | Slides in from right, fades out | 300ms in / 300ms out |
| Level-up card | Scales up from centre, backdrop blur | 400ms |
| Achievement badge pop | Bounces in from bottom-right | 350ms |
| XP bar fill | Smooth width transition | 800ms ease-out |
| Chart updates | Chart.js animation duration 400ms | 400ms |
| Leaderboard re-rank | Row slides to new position | 500ms |
| Confetti (results screen) | Canvas confetti burst | 3 seconds |
| Loading spinner | Continuous rotation | Infinite |
| Card hover glow | Border colour transition | 150ms |

## 19.6 Navigation Bar

The top navigation bar is persistent across all authenticated pages.

**Left side:** StockPilot logo (Orbitron font) + app name

**Centre links:** Dashboard | Stocks | Portfolio | Leaderboard | Achievements

**Right side:**
- Market status pill (🟢 Market Open / 🔴 Market Closed)
- Audio mute toggle button
- Notification bell (count badge for unread)
- User avatar / display name → dropdown with Profile, Settings, Log Out

On scroll: navbar gains a subtle backdrop blur and border-bottom.

## 19.7 Responsive Behaviour

Desktop-only design. Minimum supported width: 1024px. The app does not have a mobile layout. If accessed on a screen narrower than 1024px, a banner appears: *"StockPilot works best on a desktop browser. Some features may not display correctly on smaller screens."*

---

# 20. Screen Wireframes

Text-based wireframes for each major screen. All wireframes represent the dark theme desktop layout.

## 20.1 Auth Screen (`/auth`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    ✈  STOCKPILOT                                    │
│              Take the controls. Trade without risk.                 │
│                                                                     │
│         ┌────────────────────────────────────────────┐             │
│         │  ●  Log In      ○  Sign Up                 │  [tabs]     │
│         ├────────────────────────────────────────────┤             │
│         │  Email address                             │             │
│         │  [_______________________________________] │             │
│         │  Password                                  │             │
│         │  [_______________________________________] │             │
│         │                          Forgot password?  │             │
│         │  [          Log In          ]              │             │
│         └────────────────────────────────────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 20.2 Dashboard (`/`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | Dashboard  Stocks  Portfolio  Leaderboard  Badges │  🟢 Open  🔔  [Maya ▾]
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Good morning, Maya.  Level 7 — Portfolio Builder                   │
│  ████████████████░░░░░░  1,443 / 2,048 XP to Level 8               │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ PORTFOLIO VALUE  │  │  TODAY'S CHANGE  │  │  LEADERBOARD     │  │
│  │  PC$12,847.33    │  │  +PC$234.11      │  │  RANK: #3 / 28   │  │
│  │  +28.47%  ▲      │  │  +1.85%  ▲      │  │  ▲ 1 position    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────┐  ┌────────────────────────┐  │
│  │  RECENT TRANSACTIONS             │  │  ACHIEVEMENTS          │  │
│  │  ─────────────────────────────── │  │  ──────────────────    │  │
│  │  ▲ Bought 5 AAPL   PC$942.50    │  │  🏅 First Trade        │  │
│  │  ▼ Sold  3 TSLA    PC$612.00    │  │  🏅 Up 10%             │  │
│  │  ▲ Bought 2 NVDA   PC$178.40    │  │  🔒 ???  (hidden)      │  │
│  │  [View full history →]           │  │  [View all badges →]   │  │
│  └──────────────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 20.3 Stock Browser (`/stocks`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | Dashboard  [Stocks]  Portfolio  Leaderboard  ...  │  🟢 Open
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STOCK BROWSER                                        🟢 Market Open │
│                                                                     │
│  [🔍 Search by name or ticker...        ]   [⊞ Cards] [☰ Table]   │
│                                                                     │
│  Sector: [All ▾]   Sort by: [% Change ▾]                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  LOGO  AAPL   Apple Inc.              PC$189.52   +1.24%  ▲  │  │
│  │  LOGO  TSLA   Tesla, Inc.             PC$214.80   -2.31%  ▼  │  │
│  │  LOGO  MSFT   Microsoft Corp.         PC$378.90   +0.87%  ▲  │  │
│  │  LOGO  NVDA   NVIDIA Corporation      PC$875.40   +3.42%  ▲  │  │
│  │  LOGO  AMZN   Amazon.com, Inc.        PC$182.10   -0.55%  ▼  │  │
│  │  LOGO  GOOGL  Alphabet Inc.           PC$165.30   +0.33%  ▲  │  │
│  │  LOGO  META   Meta Platforms, Inc.    PC$492.60   +1.88%  ▲  │  │
│  │  LOGO  JPM    JPMorgan Chase          PC$196.40   -0.12%  ▼  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                  [ < ]  Page 1 of 3  [ > ]                         │
└─────────────────────────────────────────────────────────────────────┘
```

## 20.4 Stock Detail (`/stocks/AAPL`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | ← Back to Stocks                    🟢 Market Open │
├────────────────────────────────────────┬────────────────────────────┤
│                                        │  TRADE                     │
│  🍎 AAPL  Apple Inc.      TECH         │  ─────────────────────     │
│  PC$189.52  +PC$2.34  +1.25%  ▲        │  [Buy]     [Sell]          │
│                                        │                            │
│  ┌──────────────────────────────────┐  │  Order Type:               │
│  │      [1D]  [1W]  [1M]           │  │  ● Market  ○ Limit  ○ SL   │
│  │  190 ┤    ╭────────╮            │  │                            │
│  │  188 ┤───╯          ╰──╮        │  │  Quantity:                 │
│  │  186 ┤                  ╰───    │  │  [_________]  shares       │
│  │      └──────────────────────    │  │                            │
│  └──────────────────────────────┘  │  │  Estimated cost:           │
│                                        │  PC$379.04 + PC$1.90 fee   │
│  Market Cap: $2.89T                    │  Total: PC$380.94          │
│  52W High: $199.62  Low: $164.08       │                            │
│  Sector: Technology                    │  Balance: PC$9,619.06      │
│                                        │                            │
│  LATEST NEWS                           │  [    Confirm Buy    ]     │
│  ──────────────────────────────────    │                            │
│  📰 Apple beats Q2 estimates · 2h      └────────────────────────────┤
│  📰 iPhone supply chain update · 5h                                 │
│  📰 Buffett increases AAPL stake · 1d                               │
└─────────────────────────────────────────────────────────────────────┘
```

## 20.5 Portfolio (`/portfolio`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | Dashboard  Stocks  [Portfolio]  Leaderboard  ...  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │
│  │ TOTAL VALUE │ │  CASH       │ │  TOTAL GAIN │ │ TODAY       │  │
│  │ PC$12,847   │ │ PC$4,210    │ │ +PC$2,847   │ │ +PC$234     │  │
│  │             │ │             │ │ +28.47%     │ │ +1.85%      │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │
│                                                                     │
│  HOLDINGS                                                           │
│  ──────────────────────────────────────────────────────────────    │
│  LOGO  Symbol  Shares  Avg Cost  Price     Value     Gain    %      │
│  ────  ──────  ──────  ────────  ────────  ────────  ──────  ──    │
│  🍎   AAPL    10      $185.20   $189.52   $1,895    +$43    +2.3%  │
│  ⚡   TSLA    5       $220.00   $214.80   $1,074    -$26    -2.4%  │
│  💚   NVDA    2       $860.00   $875.40   $1,751    +$30    +1.8%  │
│                                              [Quick Sell ▾]        │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐    │
│  │   DIVERSIFICATION        │  │   NET WORTH OVER TIME        │    │
│  │      [Pie Chart]         │  │      [Line Chart]            │    │
│  │  AAPL 22% ██             │  │  PC$13k ┤    ╭──────         │    │
│  │  TSLA 13% █              │  │  PC$10k ┤────╯               │    │
│  │  NVDA 20% ██             │  │         └──────────────────   │    │
│  └──────────────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## 20.6 Leaderboard (`/leaderboard`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | Dashboard  Stocks  Portfolio  [Leaderboard]  ...  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CLASS LEADERBOARD — Period 3 Spring Sim          [Hide for me]     │
│  Last updated: just now                                             │
│                                                                     │
│  # │ Name           │ Level           │ Badge │ Value     │ Gain   │
│  ──┼─────────────── ┼─────────────────┼───────┼───────────┼──────  │
│  1 │ 🥇 Jordan K.   │ Market Analyst  │  🏆   │ PC$15,420 │ +54.2% │
│  2 │ 🥈 Alex P.     │ Swing Trader    │  💎   │ PC$13,910 │ +39.1% │
│  3 │ 🥉 Maya C. ★  │ Portfolio Pro   │  🏅   │ PC$12,847 │ +28.5% │
│  4 │    Sam L.      │ Bull Believer   │  ⭐   │ PC$11,230 │ +12.3% │
│  5 │    Taylor R.   │ Chart Reader    │  🔵   │ PC$10,845 │ +8.5%  │
│  ──┴────────────────┴─────────────────┴───────┴───────────┴──────  │
│  [👍 12] [🚀 8] [😮 5] [🔥 3]  (reactions on Jordan's row)         │
│                                                                     │
│  ★ = your row                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 20.7 Achievements (`/achievements`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | Dashboard  Stocks  Portfolio  Leaderboard [Badges]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ACHIEVEMENTS                                                       │
│  Level 7 — Portfolio Builder  │  ████████████████░░  1443/2048 XP  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  🏅  First Trade          Unlocked ✓   "Place your first   │    │
│  │                                         trade"             │    │
│  │  🏅  In the Green         Unlocked ✓   "Sell a stock for   │    │
│  │                                         a profit"          │    │
│  │  🔒  Double Digits        Locked        "Portfolio gains    │    │
│  │                                         10%"               │    │
│  │  🔒  Precision Trader     Locked        "Place a limit      │    │
│  │                                         order"             │    │
│  │  ❓  ???                  Hidden        Discover this       │    │
│  │                                         secret badge       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  12 / 29 badges unlocked                                           │
└─────────────────────────────────────────────────────────────────────┘
```

## 20.8 Settings (`/settings`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  |  ← Back                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SETTINGS                                                           │
│                                                                     │
│  Display Name                                                       │
│  [Maya Chen_______________________________]  [Save]                 │
│                                                                     │
│  Theme                                                              │
│  ● Dark   ○ Light                                                   │
│                                                                     │
│  Audio                                                              │
│  Music Volume     [━━━━━━━━━━░░░░]  40%                            │
│  Effects Volume   [━━━━━━━━━━━━░░]  70%                            │
│                                                                     │
│  Price Alerts                                                       │
│  AAPL  Alert when price goes above  PC$195.00   [Edit] [Delete]     │
│  TSLA  Alert when price goes below  PC$200.00   [Edit] [Delete]     │
│  [+ Add new alert]                                                  │
│                                                                     │
│  ─────────────────────────────────────────────────────────         │
│  [Replay Tutorial]          [Reset Portfolio (1 use remaining)]     │
│  [Delete Account]                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 21. Notification System

## 21.1 Notification Types

StockPilot has four distinct notification channels:

| Type | Trigger | Display |
|---|---|---|
| Trade toast | Successful buy or sell | Top-right toast, 4 seconds |
| Error toast | Failed trade, invalid input, API error | Top-right toast (red), 5 seconds |
| Achievement toast | Standard badge unlocked | Top-right toast with badge icon, 5 seconds |
| Level-up card | User reaches a new XP level | Full-screen overlay card |
| Price alert toast | User-defined price threshold crossed | Top-right toast (amber), 6 seconds |
| Market event banner | Random market event fires | Full-width banner at page top, 60 seconds |
| Teacher announcement | Teacher broadcasts a message | Full-width banner (purple), until dismissed |
| Order filled toast | Pending limit/stop-loss order executes | Top-right toast, 5 seconds |

## 21.2 Toast Notification Design

```
┌──────────────────────────────────────────┐
│  ✓  Bought 5 shares of AAPL             │  ← Success (green left border)
│     PC$947.60 total · 10 XP earned +    │
│                                    [✕]  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  ✕  Insufficient PilotCoins             │  ← Error (red left border)
│     Reduce quantity or sell holdings.   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  🏅  Achievement Unlocked!              │  ← Achievement (gold left border)
│     "First Trade" · +20 XP             │
└──────────────────────────────────────────┘
```

- Toasts stack vertically if multiple fire at once (max 3 visible)
- Each toast slides in from the right (300ms) and fades out after its duration
- User can dismiss early by clicking the ✕ button

## 21.3 Level-Up Card Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ★  LEVEL UP!  ★                                  │
│                                                                     │
│                         LEVEL 8                                     │
│                     Risk Taker                                      │
│                                                                     │
│              [  ████████████████████  ]                             │
│                   2,048 XP reached                                  │
│                                                                     │
│           New cosmetic unlocked: Gold badge border                  │
│                                                                     │
│                    [ Keep Trading ]                                 │
└─────────────────────────────────────────────────────────────────────┘
```

Backdrop is blurred. Card animates in with scale(0.8)→scale(1) over 400ms. Level-up sound effect plays.

## 21.4 Notification Bell

The navbar notification bell shows a count badge of unread notifications. Clicking it opens a dropdown of recent notifications (last 10), each with a timestamp and a link to the relevant page.

---

# 22. Order Types

## 22.1 Market Order

- **Definition:** Buy or sell shares immediately at the best available current price
- **When to use:** When the user wants to execute a trade right now without conditions
- **Price used:** The most recent price from the Finnhub price store
- **Execution:** Immediate upon confirmation
- **Best for:** Beginners — simple and predictable
- **Limitation:** Price may differ slightly from what was displayed if there is a short delay between viewing and confirming

### Market Order Validation Rules

| Check | Condition | Error |
|---|---|---|
| Sufficient balance (buy) | `shares × price × 1.005 ≤ cash_balance` (warning if exceeded) | "You don't have enough PilotCoins" |
| Sufficient shares (sell) | `shares ≤ owned_shares` | "You only own X shares" |
| Positive quantity | `shares > 0` | "Enter a valid quantity" |
| Market open | Simulation is in active state | "Market is currently closed" |

## 22.2 Limit Order

- **Definition:** An order that only executes if the price reaches a specified target
- **Buy limit:** Executes when price drops TO or BELOW the limit price
- **Sell limit:** Executes when price rises TO or ABOVE the limit price
- **When to use:** When a user wants to buy cheaper or sell at a target profit
- **Storage:** Saved as a pending order in Supabase `orders` table
- **Expiry:** Automatically cancelled and marked `expired` when simulation ends

### Limit Order Price Check Logic

Every time a new price tick arrives for a symbol via WebSocket:

1. Query all `PENDING` limit orders for that symbol
2. For buy limits: if `new_price <= limit_price` → execute as market order
3. For sell limits: if `new_price >= limit_price` → execute as market order
4. On execution: update order status to `filled`, create a `transactions` record, update holdings and balance

### Limit Order Validation Rules

| Check | Condition |
|---|---|
| Buy limit price | Should be at or below current price (warn if above, don't block) |
| Sell limit price | Should be at or above current price (warn if below, don't block) |
| Sufficient balance | Cash must cover the full potential buy cost (reserved at order creation) |
| Sufficient shares | Must own enough shares for a sell limit |

## 22.3 Stop-Loss Order

- **Definition:** A protective sell order that triggers when price falls to a specified floor
- **Purpose:** Limits downside losses automatically — "if this stock falls to X, sell it for me"
- **Execution trigger:** When live price drops TO or BELOW the stop price → executes as a market sell
- **When to use:** To protect against large losses without having to watch prices constantly
- **Important note:** Execution price may be slightly below the stop price in a fast-moving market (slippage)

### Stop-Loss Validation Rules

| Check | Condition | Error |
|---|---|---|
| Stop price below current | `stop_price < current_price` | "Stop price should be below the current market price" |
| Sufficient shares | User must own enough shares | "You don't own enough shares" |
| Duplicate stop-loss | Only one active stop-loss per symbol per user | "You already have a stop-loss for this stock. Cancel it first." |

## 22.4 Open Orders Panel

All pending limit and stop-loss orders are visible in the Portfolio page under **"Open Orders"**:

```
OPEN ORDERS
─────────────────────────────────────────────────────────────────────
Type       Symbol   Shares   Target Price   Status    Created
─────────────────────────────────────────────────────────────────────
Buy Limit  TSLA     3        PC$198.00      Pending   Today 9:14am
Stop-Loss  AAPL     5        PC$180.00      Pending   Today 8:52am
                                                       [Cancel]
```

---

# 23. Teacher Admin Dashboard

## 23.1 Access

The admin panel is accessible at `/admin`. Only users with `role = 'teacher'` in Supabase can access this route. Attempting to visit `/admin` as a student redirects to the Dashboard.

## 23.2 Admin Panel Sections

### Session Management

| Control | Description |
|---|---|
| Create new session | Name, starting balance, start/end dates, class period |
| View active sessions | List of all sessions with student count and status |
| End simulation | Locks all trading and triggers results screen for all students |
| Pause simulation | Temporarily freezes trading (prices still update, trades blocked) |
| Invite code / link | Copy-able link to share with students |

### Student Management

| Control | Description |
|---|---|
| View all students | Table of all session members with portfolio stats |
| Reset a student's portfolio | Returns them to starting balance (uses their one reset) |
| Force-reset a student | Admin override — resets even if student used their reset |
| Remove a student | Remove from session (their account still exists) |

### Announcements

| Control | Description |
|---|---|
| Send announcement | Text input → broadcasts banner to all connected students |
| View past announcements | Log of all sent announcements with timestamps |
| Set announcement expiry | How long the banner stays visible (default 5 minutes) |

### Market Events (Manual)

| Control | Description |
|---|---|
| Trigger market event | Teacher can manually fire any event type as a teaching moment |
| View event history | Log of all events that have fired in this session |

### Analytics

| Control | Description |
|---|---|
| Student engagement table | Login count, trade count, session time per student |
| Most traded stocks | Which tickers are being traded most across the class |
| Portfolio value distribution | Chart showing spread of student portfolio values |
| Export CSV | Download full results spreadsheet |

## 23.3 Admin Dashboard Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  ADMIN PANEL                         [Back to App]    │
├────────────────┬────────────────────────────────────────────────────┤
│  SESSIONS      │  Period 3 — Spring Simulation                      │
│  ──────────    │  ─────────────────────────────────────────────     │
│  Period 3  ●   │  Status: 🟢 Active   Students: 28   Day 12/30      │
│  Period 1  ○   │                                                    │
│                │  [⏸ Pause]  [⏹ End Simulation]  [📋 Copy Link]    │
│  [+ New]       │                                                    │
│                │  STUDENT LEADERBOARD                               │
│  TOOLS         │  # │ Name      │ Value    │ Gain  │ Trades │ Resets│
│  ──────────    │  1 │ Jordan K. │ PC$15,420│ +54%  │  23    │  0    │
│  📢 Broadcast  │  2 │ Alex P.   │ PC$13,910│ +39%  │  17    │  0    │
│  ⚡ Event      │  3 │ Maya C.   │ PC$12,847│ +28%  │  19    │  0    │
│  📊 Analytics  │                           [Reset] [Remove]         │
│  📥 Export CSV │                                                    │
└────────────────┴────────────────────────────────────────────────────┘
```

---

# 24. Settings Page

## 24.1 Settings Sections

The settings page (`/settings`) contains four sections:

### Profile
- **Display name:** Text input, saved to Supabase `users.display_name` on save
- **Email:** Read-only display (managed via Supabase Auth)
- **Change password:** Link to Supabase Auth password reset flow

### Appearance
- **Theme toggle:** Dark (default) / Light — saved to localStorage

### Audio
- **Music volume slider:** 0–100%, saved to localStorage
- **Effects volume slider:** 0–100%, saved to localStorage

### Price Alerts
- Table of all active price alerts
- Each row: Symbol | Type (above/below) | Threshold | [Edit] [Delete]
- [+ Add new alert] button opens a modal:
  - Stock symbol input (with search)
  - Alert type: "Notify me when price goes above / below"
  - Threshold price input
  - [Save Alert]

### Danger Zone
- **Replay Tutorial:** Relaunches tutorial mode (practice portfolio only)
- **Reset Portfolio:** Available once per simulation; requires confirmation dialog
- **Delete Account:** Permanently deletes account and all data; requires typing "DELETE" to confirm

---

# 25. End-of-Simulation Results Screen

## 25.1 Trigger

When the teacher clicks "End Simulation" in the admin panel:

1. All open orders are cancelled and marked `expired`
2. All trading is immediately locked (buy/sell buttons disabled)
3. A Supabase real-time event is pushed to all connected students
4. All students are redirected to `/results`

## 25.2 Results Screen Flow

The results screen plays out in a theatrical sequence:

**Phase 1 — Countdown (3 seconds)**
- Dark screen with animated countdown: 3... 2... 1...
- Tense music builds

**Phase 2 — Podium Reveal (5 seconds)**
- 3rd place student card slides in from left
- 2nd place student card slides in from right
- 1st place student card drops from top with confetti burst
- Victory fanfare sound effect
- Each card shows: name, level title, final portfolio value, % gain

**Phase 3 — Full Leaderboard**
- Full final rankings table fades in below the podium
- All students ranked with final stats

**Phase 4 — Personal Summary Card**
- Each student sees their own summary card:

```
┌────────────────────────────────────────────┐
│   YOUR SIMULATION SUMMARY                  │
│                                            │
│   Maya Chen  ·  Level 7 — Portfolio Builder│
│                                            │
│   Final Value:    PC$12,847   +28.47%      │
│   Cash Remaining: PC$4,210                 │
│   Total Trades:   19                       │
│   Best Stock:     NVDA  +18.3%             │
│   Worst Stock:    TSLA  -8.2%              │
│   Total XP Earned: 1,443 XP               │
│   Badges Unlocked: 12 / 29                 │
│   Final Rank:     #3 out of 28             │
│                                            │
│   [View Full History]  [Return to App]     │
└────────────────────────────────────────────┘
```

## 25.3 Post-Simulation State

After the simulation ends:
- Students can still browse their portfolio and history in read-only mode
- Trading is permanently locked for this session
- Leaderboard remains visible in its final state
- Teacher can start a new session for the next simulation round

---

# 26. Social Features

## 26.1 Scope

StockPilot includes a minimal social layer. The goal is to add just enough interaction to make the class simulation feel alive — not to build a full social network.

## 26.2 Emoji Reactions

Emoji reactions are the only social interaction between students.

- Each leaderboard row has a compact reaction bar
- Available reactions: 👍 🚀 😮 😬 🔥
- Each student can react to any row **once per session** (one reaction type per row)
- Reactions are visible to all students as counts (e.g. "🚀 8")
- Reactions are stored in Supabase and update in real time via subscriptions
- Reactions do not affect XP, rankings, or any gameplay mechanic

## 26.3 What Is Explicitly Not Included

- No comments or text messages between students
- No direct messaging
- No ability to view another student's full portfolio or trade history
- No sharing or copying of trades
- No profile follows or friend lists

Privacy of holdings is strict: students can only see each other's total value and % gain on the leaderboard — never the specific stocks held or trades made.

---

# 27. Teacher Analytics Dashboard

## 27.1 Purpose

The analytics dashboard gives the teacher insight into how students are engaging with the simulation, which can inform class discussion and grading.

## 27.2 Available Metrics

### Per-Student Table

| Metric | Description |
|---|---|
| Display name | Student's chosen name |
| Login count | Number of times they've logged in during the simulation |
| Total trades | Number of buy + sell trades executed |
| Last active | Timestamp of their most recent action |
| Portfolio value | Current total value |
| % gain | Performance relative to starting balance |
| Badges unlocked | Count of achievements earned |
| XP total | Total experience points accumulated |
| Reset used | Whether they used their portfolio reset |

### Class-Wide Charts

| Chart | Description |
|---|---|
| Portfolio value distribution | Histogram showing spread of student values (who's winning by how much) |
| Most traded stocks | Bar chart of top 10 most-traded tickers across the class |
| Trade volume over time | Line chart of total trades per simulated day |
| Average % gain over time | Class average performance plotted over the simulation |

## 27.3 CSV Export Format

When the teacher clicks "Export CSV", a file is downloaded with the following columns:

```
display_name, email, final_value, starting_balance, pct_gain, total_trades,
badges_unlocked, xp_total, login_count, last_active, reset_used, final_rank
```

One row per student. Sorted by final rank.

---

# 28. Success Criteria

The product is considered complete and ready for demo when all of the following are true:

## 28.1 Authentication

- [ ] New users can create an account with email and password
- [ ] Returning users can log in and all data is restored
- [ ] Password reset email is sent and works correctly
- [ ] Teacher accounts can access `/admin`, student accounts cannot
- [ ] Unauthenticated users are redirected to `/auth`

## 28.2 Core Trading

- [ ] Users can browse 37+ default stocks with live prices
- [ ] Users can search for any Finnhub-supported stock by ticker or name
- [ ] Market orders (buy and sell) execute correctly
- [ ] Limit orders save as pending and auto-execute when price is reached
- [ ] Stop-loss orders save as pending and auto-execute when price drops to floor
- [ ] 0.5% transaction fee is applied to every trade and shown in history
- [ ] Fractional shares can be bought and sold
- [ ] Weighted average cost updates correctly on repeated purchases
- [ ] Portfolio resets once correctly and is blocked on second attempt

## 28.3 Portfolio & Calculations

- [ ] Holdings table shows correct shares, avg cost, current price, market value
- [ ] Unrealized gain/loss is accurate and updates in real time
- [ ] Realized gain/loss is recorded correctly on every sell
- [ ] Total portfolio value = cash + sum of all holding market values
- [ ] % gain = (current value − starting balance) / starting balance × 100
- [ ] Net worth chart plots correctly over the simulation period
- [ ] Diversification pie chart reflects current holdings accurately

## 28.4 Real-Time Data

- [ ] Finnhub WebSocket connects and streams live price ticks
- [ ] Stock prices update in the browser without page refresh
- [ ] Green/red flash animation triggers on price changes
- [ ] WebSocket reconnects automatically after disconnection
- [ ] Fallback to mock data activates when API is unavailable
- [ ] Fallback banner appears and disappears correctly

## 28.5 Leaderboard

- [ ] All students in session appear on the leaderboard
- [ ] Rankings update in real time as portfolio values change
- [ ] Both total value and % gain are shown
- [ ] Current user's row is highlighted
- [ ] User pinned at bottom if outside visible top N
- [ ] Rank change indicators (▲▼) display correctly
- [ ] Emoji reactions save and display correctly
- [ ] Leaderboard toggle (show/hide) works per user

## 28.6 Achievements & XP

- [ ] XP is awarded correctly for each qualifying action
- [ ] Level thresholds are correct — user levels up at the right XP value
- [ ] Level title updates on level-up
- [ ] All 23 standard badges unlock on correct conditions
- [ ] All 6 secret badges unlock on correct conditions
- [ ] Achievement toast fires for standard badges
- [ ] Level-up card fires on level-up
- [ ] Achievements page shows locked/unlocked state correctly
- [ ] Secret badges show as "???" until unlocked

## 28.7 Teacher Admin

- [ ] Teacher can create a session with custom name, balance, and dates
- [ ] Invite link works — students joining via link are added to the session
- [ ] Teacher can reset an individual student's portfolio
- [ ] Teacher can broadcast an announcement visible to all students
- [ ] Teacher can manually trigger a market event
- [ ] Teacher can end the simulation and trigger the results screen
- [ ] Teacher can export results as CSV

## 28.8 Tutorial

- [ ] Tutorial launches automatically on first login
- [ ] Cannot be skipped on first run
- [ ] All 5 steps require the user to perform the action
- [ ] Practice portfolio is discarded after tutorial
- [ ] 50 XP and "Cleared for Takeoff" badge are awarded on completion
- [ ] Tutorial can be replayed from Settings

## 28.9 Audio

- [ ] Background music plays on app load (after first interaction)
- [ ] Sound effects play on trade execution, level-up, badge unlock
- [ ] Music and effects volume sliders work and persist
- [ ] Mute toggle in navbar works instantly

## 28.10 General

- [ ] App functions fully using mock data when API is unavailable
- [ ] All error states display user-friendly messages
- [ ] Page transitions are smooth (fade in/out)
- [ ] App loads in under 3 seconds on a standard connection
- [ ] Works correctly in Chrome, Firefox, Edge, and Safari
- [ ] No console errors in normal usage flows

---

# 29. Required Screens and Routes

## 29.1 Full Route List

| Route | Page Name | Auth | Role |
|---|---|---|---|
| `/auth` | Login / Sign Up | No | Any |
| `/` | Dashboard | Yes | Student |
| `/stocks` | Stock Browser | Yes | Student |
| `/stocks/:symbol` | Stock Detail | Yes | Student |
| `/portfolio` | Portfolio | Yes | Student |
| `/leaderboard` | Leaderboard | Yes | Student |
| `/achievements` | Achievements | Yes | Student |
| `/profile` | Profile | Yes | Student |
| `/history` | Transaction History | Yes | Student |
| `/settings` | Settings | Yes | Student |
| `/tutorial` | Tutorial Mode | Yes | Student |
| `/results` | End-of-Simulation Results | Yes | Student |
| `/admin` | Teacher Admin Panel | Yes | Teacher only |
| `/help` | FAQ / Help | Yes | Any |

## 29.2 Navigation Availability

| Page | In Navbar | Accessible Via |
|---|---|---|
| Dashboard | Yes | Navbar link |
| Stock Browser | Yes | Navbar link |
| Portfolio | Yes | Navbar link |
| Leaderboard | Yes | Navbar link |
| Achievements | Yes | Navbar link |
| Profile | No | User avatar dropdown |
| Settings | No | User avatar dropdown |
| Transaction History | No | Portfolio page link / Profile page |
| Admin | No | Direct URL (teacher only) |
| Tutorial | No | Settings page / auto-launch |
| Results | No | Triggered by teacher |
| Help / FAQ | No | Settings page footer link |

---

# 30. Out of Scope

The following features are explicitly excluded from Version 1 of StockPilot. They may be considered for future versions.

## 30.1 Trading Features Not Included

| Feature | Reason for Exclusion |
|---|---|
| Real money trading | Educational tool only — no real financial transactions |
| Cryptocurrency trading | Too volatile and complex; outside beginner scope |
| Options / derivatives trading | Advanced financial instruments not appropriate for MVP |
| Margin trading / leverage | Introduces complex risk mechanics out of scope |
| Short selling | Too advanced for the target audience |
| Dividend reinvestment (DRIP) | Adds complexity without core educational value |
| IPO participation | Niche feature, complex to simulate accurately |
| Pre/after-market trading | Market hours simulation is sufficient for MVP |
| Portfolio backtesting | Historical what-if analysis is a v2 feature |

## 30.2 Platform Features Not Included

| Feature | Reason for Exclusion |
|---|---|
| Mobile application | Desktop web only for this version |
| Native iOS / Android app | Out of scope; web is sufficient |
| Browser push notifications | In-app toasts cover this use case |
| Email notifications | Not needed for a classroom tool |
| Third-party login (Google, GitHub) | Supabase email/password is sufficient |
| Multiplayer rooms / chat | Full social features are out of scope |
| Student-to-student messaging | Privacy and scope concerns |
| AI trading advice or hints | Out of scope and potentially misleading |
| Automated trading bots | Too advanced and gameable |
| Custom stock lists by teacher | Pre-set list is sufficient for MVP |
| Instructor-created quizzes | Educational content excluded per spec |
| Financial literacy lessons | Focus is the simulator, not reading material |
| International stocks (non-US) | Default list is US only; search can access others |

## 30.3 Technical Features Not Included

| Feature | Reason for Exclusion |
|---|---|
| Service worker / offline mode | Always-online requirement per spec |
| Native mobile app | Desktop web only |
| Server-side rendering (SSR) | Client-side SPA is sufficient |
| Multi-language / i18n | English only for this version |
| Accessibility (WCAG AA full compliance) | Keyboard nav and contrast only |
| Automated end-to-end testing | Unit tests + manual QA only |
| Custom domain | Default Vercel/Netlify URL is fine |
| Analytics tracking (Google Analytics etc.) | Teacher analytics dashboard covers needs |

---

# 31. Risks and Constraints

## 31.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Finnhub API downtime | Medium | High | Automatic fallback to mock data; banner informs users |
| Finnhub rate limit hit (60/min shared across class) | Medium | Medium | All requests proxied through Supabase Edge Function with in-memory cache and request queue |
| Supabase free tier limits (500MB DB, 50k MAU) | Low | Medium | Data is lean; a 30-student class generates minimal storage |
| WebSocket connection instability | Medium | Medium | Exponential backoff reconnect logic; fallback to HTTP polling |
| Price staleness during fallback | Medium | Low | Stale indicator shown on affected prices; trades still allowed |
| Browser incompatibility | Low | Low | Test in Chrome, Firefox, Edge, Safari; use standard Web APIs only |
| Vite build issues on deployment | Low | Medium | Test production build locally before deploying |
| Supabase real-time subscription lag | Low | Low | Acceptable for leaderboard; not used for trade execution |

## 31.2 Project Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep beyond deadline | High | High | Strict MoSCoW prioritisation; Must Have features first |
| Underestimating Supabase integration complexity | Medium | Medium | Build auth and DB connection first before UI |
| Chart.js complexity (real-time updates) | Medium | Low | Use Chart.js update() method; well-documented pattern |
| Achievement system bugs (wrong trigger conditions) | Medium | Medium | Unit test all achievement condition checks independently |
| Audio licensing issues | Low | Low | Use royalty-free or self-created audio files only |

## 31.3 Constraints

| Constraint | Detail |
|---|---|
| Timeline | Working demo required within 1 month |
| Solo developer | All code written by one person |
| No budget | All services must be on free tiers (Supabase, Vercel, Finnhub) |
| Desktop only | No mobile layout required |
| No backend framework | Supabase Edge Functions for server logic only |
| API key security | Key must never appear in client-side source code |

---

# 32. Performance Requirements

## 32.1 Load Time Targets

| Metric | Target |
|---|---|
| Initial page load (first visit) | Under 3 seconds on a standard broadband connection |
| Subsequent page navigations (SPA routing) | Under 200ms |
| Stock browser initial data load | Under 1.5 seconds |
| Chart render after timeframe change | Under 500ms |
| Trade execution (from confirm click to UI update) | Under 1 second |
| Leaderboard re-render on price change | Under 300ms |

## 32.2 Performance Techniques

| Technique | Implementation |
|---|---|
| Vite code splitting | Each page is a separate chunk, loaded on demand |
| Image optimisation | Company logos served from CDN, lazy-loaded |
| In-memory price cache | No redundant API calls for prices seen recently |
| Debounced search | 300ms delay on search input prevents excessive API calls |
| Virtual DOM-lite updates | Only update the specific DOM nodes that changed (no full re-renders) |
| Chart.js lazy load | Chart.js only imported on pages that use charts |
| Tailwind CSS purge | Production build removes unused CSS classes |
| WebSocket over polling | One persistent connection vs. repeated HTTP requests |

## 32.3 Concurrent Users

The app is designed for classroom use: up to 30 simultaneous students plus 1 teacher.

- Supabase free tier supports up to 50,000 monthly active users — more than sufficient
- All Finnhub calls are proxied through one Edge Function — one shared rate limit pool
- Supabase real-time supports up to 200 concurrent connections on the free tier — sufficient for a class

---

# 33. Security Considerations

## 33.1 API Key Protection

The Finnhub API key is never stored or referenced in client-side JavaScript. All Finnhub requests are proxied through a Supabase Edge Function. The key is stored as a Supabase secret environment variable, accessible only to the Edge Function at runtime.

## 33.2 Authentication Security

Supabase Auth handles all authentication. This includes:
- Password hashing (bcrypt via Supabase)
- JWT-based session tokens
- Automatic token refresh
- Email verification (optional, can be enabled)
- Rate limiting on login attempts (Supabase default: 6 attempts per hour per IP)

## 33.3 Row-Level Security (RLS)

Supabase Row-Level Security policies ensure users can only read and write their own data:

| Table | Policy |
|---|---|
| `users` | Users can read/update their own row only |
| `session_members` | Users can read/update their own session member row only |
| `holdings` | Users can read/update holdings linked to their session member ID only |
| `transactions` | Users can read their own transactions; insert only (no update/delete) |
| `orders` | Users can read/update/delete their own orders only |
| `user_achievements` | Users can read their own achievements; insert only |
| `price_alerts` | Users can CRUD their own alerts only |
| `sessions` | All authenticated users can read; only teachers can insert/update |
| `announcements` | All authenticated users can read; only teachers can insert |
| `market_events` | All authenticated users can read; only teachers can insert |

## 33.4 Input Sanitisation

- All user text inputs (display name, announcement text) are sanitised before saving to Supabase
- Supabase parameterised queries prevent SQL injection
- Numeric inputs (quantity, limit price) are validated as positive numbers before processing
- No user-supplied HTML is rendered — all values are inserted as text content, not innerHTML

## 33.5 Admin Route Protection

The `/admin` route checks the user's `role` field from Supabase on every load. If `role !== 'teacher'`, the user is immediately redirected to `/`. This check happens client-side and is reinforced by RLS policies on the database so a student cannot perform teacher actions even via direct API calls.

---

# 34. Testing Plan

## 34.1 Testing Approach

StockPilot uses two testing layers:
- **Unit tests (Jest):** For all calculation and business logic functions
- **Manual QA:** For all user-facing flows, UI states, and edge cases

## 34.2 Unit Test Coverage

All functions in `src/utils/` and `src/state/` should have unit tests.

### Calculation Tests

| Function | Test Cases |
|---|---|
| `calculateGain(avgCost, currentPrice, shares)` | Positive gain, negative gain, zero gain, fractional shares |
| `calculateGainPct(avgCost, currentPrice)` | Standard cases, edge case: avgCost = 0 |
| `calculateTradeCost(shares, price, feePct)` | Buy cost with fee, sell proceeds after fee |
| `calculateWAVG(existingShares, existingAvg, newShares, newPrice)` | First purchase, second purchase same price, second purchase different price |
| `calculateTotalPortfolioValue(cash, holdings, prices)` | Empty portfolio, single holding, multiple holdings |
| `calculatePercentGain(currentValue, startingBalance)` | Gain, loss, no change |

### XP and Level Tests

| Function | Test Cases |
|---|---|
| `getXpThreshold(level)` | All 25 levels return correct cumulative XP |
| `getLevelFromXp(xp)` | XP at threshold, XP between thresholds, XP above max level |
| `getLevelTitle(level)` | All 25 levels return correct title string |
| `calculateXpReward(action)` | All defined action types return correct XP |

### Achievement Condition Tests

| Achievement | Test Case |
|---|---|
| `first_trade` | Triggers on first transaction insert, not on second |
| `gain_10pct` | Triggers when portfolioGainPct crosses 10%, not before |
| `diversified_5` | Triggers when holdingsCount reaches 5, not at 4 |
| `survive_crash` | Triggers only if user held through a market event without selling |

### Order Logic Tests

| Scenario | Expected Behaviour |
|---|---|
| Buy limit: price drops to limit | Order executes |
| Buy limit: price stays above limit | Order stays pending |
| Sell limit: price rises to limit | Order executes |
| Stop-loss: price drops to stop | Order executes as market sell |
| Simulation ends with pending orders | Orders expire, status = 'expired' |

## 34.3 Manual QA Test Checklist

### Authentication Flow
- [ ] Sign up with valid email and password
- [ ] Sign up with duplicate email → error shown
- [ ] Sign up with short password → error shown
- [ ] Log in with correct credentials
- [ ] Log in with wrong password → error shown
- [ ] Password reset email received and link works
- [ ] Logging out clears session and redirects to `/auth`

### Trading Flow
- [ ] Buy 1 share of a stock — portfolio updates, balance decreases
- [ ] Buy fractional shares (0.5) — portfolio shows correct decimal
- [ ] Buy same stock twice — WAVG cost updates correctly
- [ ] Attempt buy with insufficient balance — warning shown, trade blocked
- [ ] Sell all shares of a stock — position removed from portfolio
- [ ] Sell partial shares — remaining shares shown correctly
- [ ] Place limit order — appears in Open Orders
- [ ] Limit order fills when price is reached — toast notification shown
- [ ] Place stop-loss — appears in Open Orders
- [ ] Stop-loss triggers when price drops — sells correctly
- [ ] All orders expire at simulation end

### Portfolio Accuracy
- [ ] Unrealized gain = (current price − avg cost) × shares
- [ ] Total value = cash + sum(shares × price) for all holdings
- [ ] % gain = (total value − starting balance) / starting balance × 100
- [ ] Realized gain recorded correctly on sell
- [ ] Pie chart updates after each trade
- [ ] Net worth chart records correctly over time

### API Fallback
- [ ] Disable network → fallback banner appears
- [ ] All trading still works on mock prices
- [ ] Restore network → banner disappears, live prices resume

### Achievement System
- [ ] First trade badge unlocks immediately after first trade
- [ ] XP counter increments correctly
- [ ] Level-up card appears at correct XP threshold
- [ ] Achievement page shows correct locked/unlocked state

### Teacher Admin
- [ ] Create session → invite link generated
- [ ] Student joins via link → appears in session
- [ ] Reset student portfolio → balance returns to starting value
- [ ] Broadcast announcement → all students see banner
- [ ] End simulation → all students redirected to results screen
- [ ] CSV export downloads correctly

---

# 35. Deployment Plan

## 35.1 Hosting

| Service | Purpose |
|---|---|
| Vercel or Netlify | Frontend hosting (auto-deploy from GitHub main branch) |
| Supabase | Backend database, authentication, edge functions, real-time |
| GitHub | Source control and CI/CD trigger |
| Google Fonts | Space Grotesk and Orbitron font delivery |
| Logo CDN | Company logos per stock ticker |

## 35.2 Environments

| Environment | Branch | URL | Purpose |
|---|---|---|---|
| Development | `dev` or `feature/*` | `localhost:5173` (Vite) | Active development |
| Preview | Pull requests | Auto-generated preview URL | Review before merging |
| Production | `main` | `stockpilot.vercel.app` (or custom) | Live demo and submission |

## 35.3 Environment Variables

All secrets are stored as environment variables, never in source code:

| Variable | Where Stored | Used By |
|---|---|---|
| `SUPABASE_URL` | Vercel env vars | Frontend Supabase client |
| `SUPABASE_ANON_KEY` | Vercel env vars | Frontend Supabase client |
| `FINNHUB_API_KEY` | Supabase secret | Supabase Edge Function only |

The Finnhub API key is **never** in the frontend environment variables.

## 35.4 Deployment Steps

1. Push code to `main` branch on GitHub
2. Vercel auto-detects the push and triggers a build
3. Vite builds the production bundle (`npm run build`)
4. Vercel deploys the `/dist` folder to the CDN
5. Supabase Edge Functions are deployed separately via `supabase functions deploy`
6. Verify the live URL works, check console for errors

## 35.5 Local Development Setup

For anyone running StockPilot locally:

```bash
# 1. Clone the repo
git clone https://github.com/BraydoCoder/StockPilot.git
cd StockPilot

# 2. Install dependencies
npm install

# 3. Create .env.local with Supabase keys
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. Start the dev server
npm run dev

# 5. Open http://localhost:5173
```

---

# 36. Development Roadmap

## 36.1 Phase 1 — Foundation (Week 1)

Goal: Working auth, database, and a single page rendering live stock data.

| Task | Priority |
|---|---|
| Set up Vite project with Tailwind CSS and ES Modules | Must |
| Configure Supabase project (database + auth) | Must |
| Build auth page (sign up, log in, forgot password) | Must |
| Create all Supabase tables with RLS policies | Must |
| Build Supabase Edge Function to proxy Finnhub REST calls | Must |
| Build Finnhub WebSocket client module | Must |
| Build basic Stock Browser page with live prices | Must |
| Build client-side router | Must |
| Build Navbar component | Must |

## 36.2 Phase 2 — Core Trading (Week 2)

Goal: Full buy/sell flow with portfolio tracking working end-to-end.

| Task | Priority |
|---|---|
| Stock Detail page with Chart.js price chart | Must |
| Buy/Sell panel with market order execution | Must |
| Portfolio page with holdings table | Must |
| Balance tracking and fee calculation | Must |
| Transaction history page | Must |
| Weighted average cost calculation | Must |
| Unrealized and realized gain/loss display | Must |
| Toast notification system | Must |
| Error handling for all trade states | Must |
| API fallback with mock data and banner | Must |

## 36.3 Phase 3 — Gamification (Week 3)

Goal: XP, achievements, leaderboard, and teacher admin working.

| Task | Priority |
|---|---|
| XP system and level calculation | Must |
| All 23 standard achievement conditions | Must |
| Achievement toast and level-up card animations | Must |
| Achievements page | Must |
| Class leaderboard with real-time Supabase subscriptions | Must |
| Emoji reactions on leaderboard | Should |
| Teacher admin panel (sessions, resets, announcements) | Must |
| Market events system | Should |
| Portfolio pie chart and net worth chart | Should |
| Limit orders and stop-loss orders | Should |

## 36.4 Phase 4 — Polish and Demo Prep (Week 4)

Goal: Audio, tutorial, animations, settings, results screen, and deployment.

| Task | Priority |
|---|---|
| Audio system (music + SFX + sliders) | Should |
| Tutorial mode with practice portfolio | Must |
| Page transition animations | Should |
| Price flash animations on WebSocket ticks | Must |
| End-of-simulation results screen with confetti | Should |
| Settings page (theme, audio, alerts, display name) | Must |
| Dark/light mode toggle | Could |
| Profile page | Should |
| Secret achievement conditions | Could |
| 6 secret badges | Could |
| FAQ / Help page | Should |
| Unit tests for all calculation functions | Should |
| Manual QA full checklist | Must |
| Production deployment to Vercel | Must |
| Final README with setup instructions | Must |

---

# 37. Definition of Done

StockPilot Version 1 is **complete** when:

## Core Functionality
- All Must Have features from Section 6 are functional and bug-free
- All 14 core user flows from Section 5 work without errors
- All portfolio calculations are mathematically verified against the unit test suite

## Data and Persistence
- All user data (portfolio, XP, achievements, balance, history) persists across browser sessions via Supabase
- Data is correctly scoped per user — no user can read or modify another user's data
- RLS policies are active on all tables

## Real-Time Features
- Finnhub WebSocket connects and streams live prices
- Leaderboard updates across all clients via Supabase subscriptions
- Market event banners appear simultaneously for all students
- Teacher announcements appear instantly for all students

## Reliability
- Application functions fully on mock data if Finnhub is unavailable
- WebSocket reconnects automatically after drop
- All error states display clear, actionable messages
- No unhandled JavaScript errors in normal usage flows

## Gamification
- XP awards correctly for all qualifying actions
- All 25 levels unlock at correct exponential XP thresholds
- All 23 standard badges trigger on correct conditions
- At least 3 of 6 secret badges are implemented
- Level-up card and achievement toast animations work

## Teacher Features
- Teacher can create a session and share an invite link
- Students joining via link are placed in the correct session
- Teacher can reset portfolios, broadcast announcements, and end the simulation
- End-of-simulation results screen activates correctly for all connected students
- CSV export downloads with correct data

## Quality
- App loads in under 3 seconds on a standard connection
- Works correctly in Chrome, Firefox, Edge, and Safari
- All unit tests pass (`npm test`)
- Manual QA checklist from Section 34 is fully checked off
- No hardcoded API keys in source code
- Code is committed to GitHub with a clean history
- Application is deployed to a live public URL and accessible without setup

---

---

# 38. Fractional Share Rounding Rules

## 38.1 Precision Standard

All share quantities are stored and calculated to **6 decimal places** (e.g. `2.500000`). This precision is sufficient for fractional shares of even the highest-priced stocks while avoiding floating-point drift over many operations.

All currency values (prices, balances, fees, totals) are stored and calculated to **2 decimal places**, rounded using standard half-up rounding (e.g. `$1.255` rounds to `$1.26`).

## 38.2 Buy Order Rounding

When a user enters a fractional quantity to buy:

| Step | Rule |
|---|---|
| Quantity input | Accepted to 6 decimal places. Values beyond 6 decimals are truncated at input |
| Price used | Most recent WebSocket price, to 2 decimal places |
| Subtotal | `shares × price`, rounded to 2 decimal places |
| Fee | `subtotal × 0.005`, rounded up to nearest cent (always favours the house) |
| Total cost | `subtotal + fee`, rounded to 2 decimal places |
| Balance deduction | Exact total cost deducted — no additional rounding |

**Example:**
- Buy 1.5 shares of AAPL at PC$189.52
- Subtotal: `1.5 × 189.52 = 284.28`
- Fee: `284.28 × 0.005 = 1.4214 → rounds up to 1.43`
- Total: `284.28 + 1.43 = 285.71`
- Balance decreases by exactly PC$285.71

## 38.3 Sell Order Rounding

| Step | Rule |
|---|---|
| Quantity input | Cannot exceed owned shares to 6 decimal places. Input truncated to 6 decimal places |
| Proceeds | `shares × price`, rounded to 2 decimal places |
| Fee | `proceeds × 0.005`, rounded up to nearest cent |
| Net proceeds | `proceeds − fee`, rounded to 2 decimal places |
| Balance addition | Exact net proceeds added |

## 38.4 Weighted Average Cost Rounding

After a new buy order, the new WAVG is calculated as:

```
new_avg = ((existing_shares × existing_avg) + (new_shares × new_price))
          ÷ (existing_shares + new_shares)
```

Result is stored to **6 decimal places**. This prevents rounding errors from accumulating across many purchases.

## 38.5 Gain/Loss Display Rounding

| Value | Display Format |
|---|---|
| Dollar gain/loss | Rounded to 2 decimal places, shown with sign: `+PC$234.50` or `-PC$12.30` |
| Percentage gain/loss | Rounded to 2 decimal places: `+12.34%` or `-3.21%` |
| Portfolio total value | Rounded to 2 decimal places |
| Price per share | Shown to 2 decimal places |

## 38.6 Minimum Trade Value

There is no minimum trade value enforced in code. However, the 0.5% fee means very small trades are economically inefficient — a user buying PC$1.00 worth of a stock pays PC$0.01 in fees (1%). This is intentional: it teaches that frequent small trades are costly.

---

# 39. Leaderboard Tie-Breaking Rules

## 39.1 Primary Sort

The leaderboard is sorted **descending by total portfolio value** (cash + market value of all holdings).

When the display shows "% gain", that column is calculated and shown alongside total value but is **not** used as the primary sort key. Rank is determined by total portfolio value only.

## 39.2 Tie-Breaking Hierarchy

When two or more students have identical total portfolio values (to 2 decimal places), the following rules apply in order:

| Priority | Tiebreaker | Rationale |
|---|---|---|
| 1 | Higher % gain | Same value but started with less → proportionally better performance |
| 2 | Fewer total trades | Achieved the same result with less activity → more efficient strategy |
| 3 | Earlier join time (`joined_at`) | Earlier participant is ranked higher as a tiebreak of last resort |

## 39.3 Display of Tied Ranks

When two students are genuinely tied after all tiebreakers (extremely unlikely):

- Both are shown at the same rank number (e.g. both show `#4`)
- The next student is shown at rank `#6` (not `#5`), preserving ordinal integrity
- A small "=" symbol appears next to both tied rows

## 39.4 Real-Time Rank Changes

Rank changes are calculated on every leaderboard re-render. The previous rank (before the last price tick) is stored in component state. On re-render:

- If new rank < previous rank → show `▲ N` in green (moved up N positions)
- If new rank > previous rank → show `▼ N` in red (moved down N positions)
- If rank unchanged → no indicator shown

Rank change indicators reset to blank every 30 seconds to avoid cluttering the UI with stale indicators.

---

# 40. Component Specifications

## 40.1 Navbar

**File:** `src/components/Navbar.js`

**Props:** None (reads from `userState` and `simulationState` directly)

**States:**
- `scrolled` (boolean) — true when page is scrolled > 20px, adds backdrop blur and border-bottom

**DOM Structure:**
```html
<nav class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6
            bg-[#0D0F14]/80 border-b border-[#2A3245]/0
            transition-all duration-200
            [&.scrolled]:backdrop-blur-md [&.scrolled]:border-[#2A3245]">

  <!-- Logo -->
  <a href="/" class="font-orbitron font-bold text-xl text-white mr-8">
    ✈ StockPilot
  </a>

  <!-- Nav Links -->
  <div class="flex items-center gap-1 flex-1">
    <a href="/" class="nav-link">Dashboard</a>
    <a href="/stocks" class="nav-link">Stocks</a>
    <a href="/portfolio" class="nav-link">Portfolio</a>
    <a href="/leaderboard" class="nav-link">Leaderboard</a>
    <a href="/achievements" class="nav-link">Achievements</a>
  </div>

  <!-- Right Side -->
  <div class="flex items-center gap-3">
    <!-- Market Status -->
    <span class="market-status-pill">🟢 Market Open</span>

    <!-- Audio Mute Toggle -->
    <button class="icon-btn" id="audio-toggle">🔊</button>

    <!-- Notification Bell -->
    <button class="icon-btn relative" id="notif-bell">
      🔔
      <span class="notif-badge">3</span>
    </button>

    <!-- User Dropdown Trigger -->
    <button class="flex items-center gap-2 user-dropdown-trigger">
      <div class="avatar">M</div>
      <span class="text-sm text-slate-300">Maya</span>
      <span class="text-slate-500">▾</span>
    </button>
  </div>
</nav>
```

**CSS Classes (custom):**
```css
.nav-link {
  @apply px-3 py-2 rounded-lg text-sm font-medium text-slate-400
         hover:text-white hover:bg-white/5 transition-colors duration-150;
}
.nav-link.active {
  @apply text-white bg-white/10;
}
.market-status-pill {
  @apply px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400
         border border-green-500/20;
}
.icon-btn {
  @apply p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5
         transition-colors duration-150;
}
.notif-badge {
  @apply absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500
         text-white text-[10px] font-bold flex items-center justify-center;
}
.avatar {
  @apply w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
         flex items-center justify-center text-white text-sm font-bold;
}
```

---

## 40.2 StockCard (Card View)

**File:** `src/components/StockCard.js`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `symbol` | string | Ticker symbol (e.g. `'AAPL'`) |
| `name` | string | Company name |
| `price` | number | Current price |
| `change` | number | Dollar change today |
| `changePct` | number | Percentage change today |
| `logoUrl` | string | URL of company logo image |
| `onClick` | function | Called when card is clicked |

**States:**
- `flashClass` — `'flash-green'` | `'flash-red'` | `''` — set for 600ms on each price update

**DOM Structure:**
```html
<div class="stock-card [flashClass]" onclick="props.onClick()">
  <div class="flex items-center gap-3 mb-3">
    <img src="{logoUrl}" class="w-8 h-8 rounded-md object-contain bg-white/5 p-0.5" />
    <div>
      <div class="text-white font-semibold text-sm">{symbol}</div>
      <div class="text-slate-500 text-xs truncate max-w-[120px]">{name}</div>
    </div>
  </div>
  <div class="text-white font-bold text-lg tabular-nums">PC${price}</div>
  <div class="change-badge [gain|loss]">
    {change >= 0 ? '▲' : '▼'} {changePct}%
  </div>
</div>
```

**CSS Classes:**
```css
.stock-card {
  @apply bg-[#161B26] border border-[#2A3245] rounded-xl p-4 cursor-pointer
         hover:border-blue-500/40 hover:bg-[#1a2030] transition-all duration-150;
}
.flash-green { animation: flash-green 600ms ease-out; }
.flash-red   { animation: flash-red 600ms ease-out; }
.change-badge {
  @apply mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full;
}
.change-badge.gain { @apply bg-green-500/15 text-green-400; }
.change-badge.loss { @apply bg-red-500/15 text-red-400; }

@keyframes flash-green {
  0%   { background-color: rgba(34,197,94,0.25); }
  100% { background-color: transparent; }
}
@keyframes flash-red {
  0%   { background-color: rgba(239,68,68,0.25); }
  100% { background-color: transparent; }
}
```

---

## 40.3 StockRow (Table View)

**File:** `src/components/StockRow.js`

**Props:** Same as `StockCard` plus `rank` (optional number for ranked lists)

**DOM Structure:**
```html
<tr class="stock-row" onclick="props.onClick()">
  <td class="pl-4 py-3">
    <div class="flex items-center gap-3">
      <img src="{logoUrl}" class="w-6 h-6 rounded object-contain" />
      <span class="font-semibold text-white text-sm">{symbol}</span>
      <span class="text-slate-500 text-xs hidden lg:block">{name}</span>
    </div>
  </td>
  <td class="text-right pr-4 font-semibold tabular-nums text-white">PC${price}</td>
  <td class="text-right pr-4">
    <span class="change-badge [gain|loss]">{change >= 0 ? '▲' : '▼'} {changePct}%</span>
  </td>
</tr>
```

**CSS:**
```css
.stock-row {
  @apply border-b border-[#2A3245] cursor-pointer
         hover:bg-white/[0.03] transition-colors duration-100;
}
```

---

## 40.4 TradePanel

**File:** `src/components/TradePanel.js`

The most complex component in the app. Handles all three order types with live cost calculation.

**Props:**
| Prop | Type | Description |
|---|---|---|
| `symbol` | string | Ticker being traded |
| `currentPrice` | number | Live current price |
| `ownedShares` | number | Shares the user currently owns (0 if none) |
| `cashBalance` | number | User's available cash |
| `onTradeComplete` | function | Callback after successful trade |

**States:**
| State | Type | Default | Description |
|---|---|---|---|
| `side` | `'buy'`\|`'sell'` | `'buy'` | Which tab is active |
| `orderType` | `'market'`\|`'limit'`\|`'stop_loss'` | `'market'` | Selected order type |
| `quantity` | string | `''` | Raw input value |
| `limitPrice` | string | `''` | Limit/stop price input value |
| `isSubmitting` | boolean | `false` | True while trade is being processed |
| `error` | string\|null | `null` | Inline error message |
| `warning` | string\|null | `null` | Non-blocking warning message |

**Computed Values (derived from state):**
- `quantityNum` — `parseFloat(quantity) || 0`
- `priceUsed` — `orderType === 'market' ? currentPrice : parseFloat(limitPrice) || 0`
- `subtotal` — `quantityNum × priceUsed`
- `fee` — `Math.ceil(subtotal × 0.005 × 100) / 100`
- `total` — `subtotal + fee` (buy) or `subtotal − fee` (sell)
- `canAfford` — `total <= cashBalance` (buy only)
- `hasEnoughShares` — `quantityNum <= ownedShares` (sell only)
- `showConfirmDialog` — `total > 1000`

**DOM Structure:**
```html
<div class="trade-panel">
  <!-- Side Toggle -->
  <div class="flex rounded-lg overflow-hidden mb-4 border border-[#2A3245]">
    <button class="trade-tab [active if side=buy]"  onclick="setSide('buy')">Buy</button>
    <button class="trade-tab [active if side=sell]" onclick="setSide('sell')">Sell</button>
  </div>

  <!-- Order Type -->
  <div class="mb-4">
    <label class="field-label">Order Type</label>
    <div class="flex gap-2">
      <button class="order-type-btn [active]" onclick="setOrderType('market')">Market</button>
      <button class="order-type-btn"          onclick="setOrderType('limit')">Limit</button>
      <button class="order-type-btn"          onclick="setOrderType('stop_loss')">Stop-Loss</button>
    </div>
  </div>

  <!-- Quantity Input -->
  <div class="mb-3">
    <label class="field-label">Quantity (shares)</label>
    <input type="number" min="0" step="0.000001"
           class="trade-input" placeholder="0.00"
           value="{quantity}" oninput="setQuantity(e.target.value)" />
  </div>

  <!-- Limit/Stop Price Input (conditionally shown) -->
  {if orderType !== 'market'}
  <div class="mb-3">
    <label class="field-label">{orderType === 'limit' ? 'Limit Price' : 'Stop Price'} (PC$)</label>
    <input type="number" min="0" step="0.01"
           class="trade-input" placeholder="0.00"
           value="{limitPrice}" oninput="setLimitPrice(e.target.value)" />
  </div>
  {/if}

  <!-- Cost Breakdown -->
  <div class="cost-breakdown">
    <div class="cost-row"><span>Subtotal</span><span>PC${subtotal}</span></div>
    <div class="cost-row text-slate-500"><span>Fee (0.5%)</span><span>PC${fee}</span></div>
    <div class="cost-row font-bold border-t border-[#2A3245] pt-2 mt-2">
      <span>{side === 'buy' ? 'Total Cost' : 'Net Proceeds'}</span>
      <span class="{canAfford || side==='sell' ? 'text-white' : 'text-red-400'}">PC${total}</span>
    </div>
    <div class="cost-row text-slate-500 text-xs">
      <span>Balance after</span>
      <span>{side === 'buy' ? cashBalance - total : cashBalance + total}</span>
    </div>
  </div>

  <!-- Warning / Error -->
  {if warning} <div class="inline-warning">{warning}</div> {/if}
  {if error}   <div class="inline-error">{error}</div>   {/if}

  <!-- Submit Button -->
  <button class="submit-btn [buy|sell] [disabled if !valid or isSubmitting]"
          onclick="handleSubmit()">
    {isSubmitting ? 'Processing...' : (side === 'buy' ? 'Buy' : 'Sell')}
  </button>
</div>
```

**CSS:**
```css
.trade-panel    { @apply bg-[#161B26] border border-[#2A3245] rounded-xl p-5; }
.trade-tab      { @apply flex-1 py-2 text-sm font-semibold text-slate-400
                         transition-colors duration-150; }
.trade-tab.active.buy  { @apply bg-green-500/20 text-green-400; }
.trade-tab.active.sell { @apply bg-red-500/20 text-red-400; }
.order-type-btn { @apply px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400
                         border border-[#2A3245] hover:border-blue-500/50
                         transition-all duration-150; }
.order-type-btn.active { @apply border-blue-500 text-blue-400 bg-blue-500/10; }
.field-label    { @apply block text-xs font-semibold text-slate-500 uppercase
                         tracking-wider mb-1.5; }
.trade-input    { @apply w-full bg-[#1E2535] border border-[#2A3245] rounded-lg
                         px-3 py-2.5 text-white text-sm tabular-nums
                         focus:outline-none focus:border-blue-500
                         transition-colors duration-150; }
.cost-breakdown { @apply bg-[#0D0F14] rounded-lg p-3 mb-4 space-y-1; }
.cost-row       { @apply flex justify-between text-sm; }
.inline-warning { @apply text-amber-400 text-xs mb-3 flex items-center gap-1; }
.inline-error   { @apply text-red-400 text-xs mb-3 flex items-center gap-1; }
.submit-btn     { @apply w-full py-3 rounded-xl font-bold text-white
                         transition-all duration-150 active:scale-[0.97]; }
.submit-btn.buy  { @apply bg-green-500 hover:bg-green-400 disabled:bg-green-500/30; }
.submit-btn.sell { @apply bg-red-500 hover:bg-red-400 disabled:bg-red-500/30; }
```

---

## 40.5 PriceChart

**File:** `src/components/PriceChart.js`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `symbol` | string | Ticker symbol |
| `timeframe` | `'1D'`\|`'1W'`\|`'1M'` | Active timeframe |
| `onTimeframeChange` | function | Called with new timeframe when user switches |

**States:**
- `chartData` — array of `{ t: timestamp, c: closePrice }` from Finnhub candles
- `isLoading` — boolean
- `error` — string | null

**Behaviour:**
- On mount and on `timeframe` change: fetch candle data from Finnhub proxy
- If data fetched successfully: render Chart.js line chart
- If fetch fails: show error state with last known data if available
- Chart colour is green if `chartData[last].c >= chartData[0].c`, else red
- Gradient fill uses the same colour at 20% opacity fading to transparent

**Chart.js Config:**
```js
{
  type: 'line',
  data: {
    labels: chartData.map(d => formatLabel(d.t, timeframe)),
    datasets: [{
      data: chartData.map(d => d.c),
      borderColor: isUp ? '#22C55E' : '#EF4444',
      borderWidth: 2,
      fill: true,
      backgroundColor: gradient,  // canvas gradient
      pointRadius: 0,
      tension: 0.3,
    }]
  },
  options: {
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: { label: v => `PC$${v.parsed.y.toFixed(2)}` }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', maxTicksLimit: 6 } },
      y: { grid: { color: '#1E2535' }, ticks: { color: '#475569',
               callback: v => `PC$${v}` } }
    }
  }
}
```

---

## 40.6 Toast

**File:** `src/components/Toast.js`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `type` | `'success'`\|`'error'`\|`'warning'`\|`'achievement'` | Visual variant |
| `message` | string | Primary message line |
| `subtext` | string (optional) | Secondary line (e.g. XP earned) |
| `duration` | number | Milliseconds before auto-dismiss (default 4000) |
| `onDismiss` | function | Called when toast is dismissed |

**DOM Structure:**
```html
<div class="toast toast-{type}" role="alert">
  <div class="toast-icon">{icon by type}</div>
  <div class="toast-content">
    <div class="toast-message">{message}</div>
    {if subtext} <div class="toast-subtext">{subtext}</div> {/if}
  </div>
  <button class="toast-close" onclick="onDismiss()">✕</button>
</div>
```

**CSS:**
```css
.toast {
  @apply flex items-start gap-3 p-4 rounded-xl shadow-2xl
         border bg-[#161B26] min-w-[280px] max-w-[360px]
         animate-slide-in-right;
}
.toast-success     { @apply border-green-500/40; }
.toast-error       { @apply border-red-500/40; }
.toast-warning     { @apply border-amber-500/40; }
.toast-achievement { @apply border-yellow-400/40 bg-gradient-to-r from-[#161B26] to-yellow-950/30; }
.toast-message  { @apply text-sm font-semibold text-white; }
.toast-subtext  { @apply text-xs text-slate-400 mt-0.5; }
.toast-close    { @apply ml-auto text-slate-500 hover:text-white text-xs p-1; }

@keyframes slide-in-right {
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

---

## 40.7 LevelUpCard

**File:** `src/components/LevelUpCard.js`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `newLevel` | number | The level just reached |
| `title` | string | New level title |
| `cosmeticReward` | string | Description of cosmetic unlocked |
| `xpTotal` | number | User's new total XP |
| `xpThreshold` | number | XP required for the next level |
| `onDismiss` | function | Called when user clicks "Keep Trading" |

**DOM Structure:**
```html
<div class="level-up-overlay" onclick="onDismiss()">
  <div class="level-up-card" onclick="stopPropagation">
    <div class="level-up-stars">★ LEVEL UP! ★</div>
    <div class="level-number">LEVEL {newLevel}</div>
    <div class="level-title">{title}</div>
    <div class="xp-bar-container">
      <div class="xp-bar-fill" style="width: 0%" data-target="{fillPct}%"></div>
    </div>
    <div class="xp-label">{xpTotal.toLocaleString()} XP</div>
    <div class="cosmetic-reward">🎨 {cosmeticReward}</div>
    <button class="dismiss-btn" onclick="onDismiss()">Keep Trading</button>
  </div>
</div>
```

The XP bar animates from 0% to the current fill percentage over 800ms on mount (ease-out).

---

# 42. Animation Specification

Every animation in StockPilot is defined here with exact duration, easing, and trigger condition. No animation should be added that isn't in this list.

## 42.1 Page Transitions

| Transition | Trigger | Duration | Easing | CSS |
|---|---|---|---|---|
| Page fade-in | Route change (new page mounts) | 200ms | `ease-out` | `opacity: 0 → 1` |
| Page fade-out | Route change (old page unmounts) | 150ms | `ease-in` | `opacity: 1 → 0` |

Implementation: Before routing, apply fade-out to `#app-content`, swap content, then apply fade-in.

## 42.2 Price Flash Animations

| Flash | Trigger | Duration | Easing | Keyframes |
|---|---|---|---|---|
| Green flash | Price increases (new > previous) | 600ms | `ease-out` | Background `rgba(34,197,94,0.25)` → `transparent` |
| Red flash | Price decreases (new < previous) | 600ms | `ease-out` | Background `rgba(239,68,68,0.25)` → `transparent` |

Applies to: individual `StockCard`, `StockRow`, price display in `TradePanel`, portfolio row prices.

## 42.3 Toast Notifications

| Phase | Duration | Easing | CSS |
|---|---|---|---|
| Slide in | 300ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) | `translateX(110%) → translateX(0)` + `opacity 0 → 1` |
| Visible | User-defined duration (4000–6000ms) | — | Static |
| Fade out | 300ms | `ease-in` | `opacity 1 → 0` + `translateX(0) → translateX(110%)` |

## 42.4 Level-Up Card

| Phase | Duration | Easing | CSS |
|---|---|---|---|
| Backdrop fade in | 300ms | `ease-out` | `opacity: 0 → 1`, `backdrop-blur: 0 → 8px` |
| Card scale in | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `scale(0.8) → scale(1)` + `opacity 0 → 1` |
| Stars pulse | 1200ms | `ease-in-out`, repeating | `scale(1) → scale(1.1) → scale(1)` |
| XP bar fill | 800ms | `ease-out` | `width: 0% → target%` (delayed 400ms after card appears) |
| Dismiss (card) | 200ms | `ease-in` | `scale(1) → scale(0.9)` + `opacity 1 → 0` |
| Dismiss (backdrop) | 200ms | `ease-in` | `opacity 1 → 0` |

## 42.5 Achievement Toast (Badge Unlock)

| Phase | Duration | Easing | CSS |
|---|---|---|---|
| Badge icon bounce | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `scale(0) → scale(1)` |
| +XP float | 600ms | `ease-out` | Small `+10 XP` text floats up 20px and fades out near the action button |

## 42.6 Leaderboard Re-rank

| Element | Duration | Easing | CSS |
|---|---|---|---|
| Row position change | 500ms | `ease-in-out` | `translateY()` transition using FLIP animation technique |
| Rank change indicator (▲▼) | 300ms fade-in | `ease-out` | `opacity 0 → 1` |
| Value number update | 200ms | `ease-out` | Number fades: `opacity 0.5 → 1` |

## 42.7 End-of-Simulation Sequence

| Phase | Start Time | Duration | Element | Animation |
|---|---|---|---|---|
| Countdown 3 | 0ms | 800ms | "3" | Scales up from `scale(0.5)`, fades out |
| Countdown 2 | 900ms | 800ms | "2" | Same |
| Countdown 1 | 1800ms | 800ms | "1" | Same |
| 3rd place slide-in | 2700ms | 600ms | 3rd place card | Slides from left (`translateX(-100%) → 0`) |
| 2nd place slide-in | 3400ms | 600ms | 2nd place card | Slides from right (`translateX(100%) → 0`) |
| 1st place drop | 4200ms | 800ms | 1st place card | Drops from top (`translateY(-100%) → 0`) with bounce |
| Confetti burst | 4200ms | 3000ms | Canvas confetti | Full-screen particle burst |
| Leaderboard table | 5500ms | 400ms | Full table | Fade in from below |
| Personal card | 6200ms | 400ms | Summary card | Fade + scale in |

## 42.8 XP Bar (Navbar / Dashboard)

| Trigger | Duration | Easing | Behaviour |
|---|---|---|---|
| XP earned (small amount) | 600ms | `ease-out` | Bar width transitions to new fill percentage |
| XP earned (level threshold crossed) | Bar fills to 100% over 600ms, then level-up card fires, then bar resets to new fill % over 400ms | `ease-out` | See §42.4 for level-up card timing |

## 42.9 Chart Animations

| Chart | On Load | On Data Update | Duration |
|---|---|---|---|
| Stock price line chart | Lines draw from left to right | Re-render with new dataset | 400ms |
| Net worth line chart | Same left-to-right draw | Append new data point and scroll | 400ms |
| Portfolio pie chart | Slices expand from centre | Resize slices proportionally | 400ms |
| Gain/loss bar chart | Bars grow from zero | Resize bars | 400ms |

All Chart.js animations use `animation: { duration: 400, easing: 'easeOutQuart' }`.

## 42.10 Miscellaneous

| Element | Trigger | Duration | CSS |
|---|---|---|---|
| Market event banner slide-in | Event fires | 400ms `ease-out` | `translateY(-100%) → translateY(0)` |
| Market event banner slide-out | Dismissed | 300ms `ease-in` | Reverses |
| Card hover glow | Mouse enter | 150ms | Border colour transitions to `blue-500/40` |
| Button press | Mouse down | 100ms | `scale(1) → scale(0.97)` |
| Button release | Mouse up | 100ms | `scale(0.97) → scale(1)` |
| Modal backdrop | Modal opens | 200ms | `opacity 0 → 1`, `backdrop-blur 0 → 4px` |
| Notification bell badge | New notification | 300ms | Badge pops in with `scale(0) → scale(1)` spring |

---

# 41. Additional Wireframes

## 41.1 Profile Page (`/profile`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | Dashboard  Stocks  Portfolio  Leaderboard  Badges │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [M]  Maya Chen                  Portfolio Builder — Lv. 7  │   │
│  │       Period 3 Spring Simulation                            │   │
│  │                                                             │   │
│  │  XP:  ████████████████░░░░  1,443 / 2,048  (to Level 8)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │
│  │ TOTAL GAIN  │  │ TOTAL TRADES│  │ BADGES      │  │ RANK     │  │
│  │ +28.47%     │  │    19       │  │  12 / 29    │  │  #3 / 28 │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │
│                                                                     │
│  RECENT BADGES                                                      │
│  ──────────────────────────────────────────────────────────────    │
│  🏅 First Trade       🏅 In the Green      🏅 Up 5%               │
│                                              [View all badges →]   │
│                                                                     │
│  RECENT TRANSACTIONS                                                │
│  ──────────────────────────────────────────────────────────────    │
│  ▲ Bought 5 AAPL  PC$947.60   Today 10:14am                        │
│  ▼ Sold   3 TSLA  PC$639.00   Today 9:52am                         │
│  ▲ Bought 2 NVDA  PC$175.40   Yesterday 3:31pm                     │
│                                          [View full history →]     │
└─────────────────────────────────────────────────────────────────────┘
```

## 41.2 Transaction History (`/history`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  | ← Back                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TRANSACTION HISTORY                                                │
│  Period 3 Spring Simulation                                         │
│                                                                     │
│  Sort by: [Date ▾]  [Trade Value ▾]                                 │
│                                                                     │
│  Date/Time       Type  Symbol  Shares  Price     Fee    Total       │
│  ─────────────  ─────  ──────  ──────  ────────  ─────  ─────────  │
│  Today 10:14am  BUY    AAPL    5.00    PC$189.52 PC$4.74 PC$952.34 │
│  Today 9:52am   SELL   TSLA    3.00    PC$213.00 PC$3.20 PC$635.80 │
│                                                        Gain: +PC$21 │
│  Yest. 3:31pm   BUY    NVDA    2.00    PC$877.20 PC$8.77 PC$763.17 │
│  Yest. 9:05am   BUY    TSLA    3.00    PC$221.10 PC$3.32 PC$666.62 │
│  ─────────────  ─────  ──────  ──────  ────────  ─────  ─────────  │
│                                                                     │
│  19 trades total  |  PC$38.42 total fees paid                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 41.3 Admin Panel — Analytics Tab

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  ADMIN  | [Sessions] [Students] [Analytics] [Events] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ANALYTICS — Period 3 Spring Simulation                             │
│                                        [📥 Export CSV]             │
│                                                                     │
│  ┌──────────────────────────────────┐  ┌────────────────────────┐  │
│  │  PORTFOLIO VALUE DISTRIBUTION    │  │  TRADE VOLUME / DAY    │  │
│  │                                  │  │                        │  │
│  │  ████  5 students  $12k–$15k     │  │  40 ┤  ██             │  │
│  │  ████  8 students  $10k–$12k     │  │  20 ┤ ████ ██         │  │
│  │  ████  9 students  $8k–$10k      │  │   0 └────────────────  │  │
│  │  ████  6 students  <$8k          │  │     Day1  Day5  Day10  │  │
│  └──────────────────────────────────┘  └────────────────────────┘  │
│                                                                     │
│  MOST TRADED STOCKS                                                 │
│  AAPL ████████████████████ 47 trades                               │
│  TSLA ████████████░░░░░░░░ 31 trades                               │
│  NVDA ████████░░░░░░░░░░░░ 22 trades                               │
│                                                                     │
│  STUDENT ENGAGEMENT TABLE                                           │
│  Name       │ Logins │ Trades │ Last Active │ XP    │ Resets Used  │
│  ────────── ┼ ────── ┼ ────── ┼ ─────────── ┼ ───── ┼ ──────────  │
│  Jordan K.  │   12   │   23   │  2 min ago  │ 2,100 │    No       │
│  Alex P.    │    9   │   17   │  5 min ago  │ 1,650 │    No       │
└─────────────────────────────────────────────────────────────────────┘
```

## 41.4 Tutorial — Step 3 (Place a Buy Order)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ✈ StockPilot  TUTORIAL MODE  (Practice Portfolio)   Step 3 of 5   │
├────────────────────────────────────────┬────────────────────────────┤
│                                        │ ╔══════════════════════╗   │
│  🍎 AAPL  Apple Inc.      TECH         │ ║  STEP 3 OF 5         ║   │
│  PC$189.52  +1.25%  ▲                  │ ║  Place a Buy Order   ║   │
│                                        │ ║                      ║   │
│  [Price chart]                         │ ║  Buy 2 shares of     ║   │
│                                        │ ║  Apple using your    ║   │
│                                        │ ║  practice balance.   ║   │
│                                        │ ╚══════════════════════╝   │
│                                        │                            │
│                                        │  ↓ Trade panel below       │
│                                        │  ┌──────────────────────┐  │
│                                        │  │ [Buy] | Sell         │  │
│                                        │  │ Quantity: [2_______] │  │
│                                        │  │ Total: PC$380.94     │  │
│                                        │  │ [  Confirm Buy  ]  ← highlight │
│                                        │  └──────────────────────┘  │
└────────────────────────────────────────┴────────────────────────────┘
```

---

# 43. Supabase RLS Policies (SQL)

Every table in Supabase has Row Level Security enabled. Below are the exact policies for each table.

## 43.1 `users`

```sql
-- Users can read their own row
CREATE POLICY "users_select_own"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own row (display_name, last_login only)
CREATE POLICY "users_update_own"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

## 43.2 `sessions`

```sql
-- Any authenticated user can read sessions
CREATE POLICY "sessions_select_authenticated"
ON sessions FOR SELECT
USING (auth.role() = 'authenticated');

-- Only teachers can create sessions
CREATE POLICY "sessions_insert_teacher"
ON sessions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'teacher'
  )
);

-- Only the session's teacher can update it
CREATE POLICY "sessions_update_own_teacher"
ON sessions FOR UPDATE
USING (teacher_id = auth.uid());
```

## 43.3 `session_members`

```sql
-- Users can read their own membership row
CREATE POLICY "session_members_select_own"
ON session_members FOR SELECT
USING (user_id = auth.uid());

-- Teachers can read all members of their sessions
CREATE POLICY "session_members_select_teacher"
ON session_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_members.session_id
    AND sessions.teacher_id = auth.uid()
  )
);

-- Users can update their own row; teachers can update any row in their session
CREATE POLICY "session_members_update_own"
ON session_members FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "session_members_update_teacher"
ON session_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_members.session_id
    AND sessions.teacher_id = auth.uid()
  )
);

-- Users can insert their own membership
CREATE POLICY "session_members_insert_own"
ON session_members FOR INSERT
WITH CHECK (user_id = auth.uid());
```

## 43.4 `holdings`

```sql
-- Helper: checks the session_member belongs to the requesting user
CREATE POLICY "holdings_all_own"
ON holdings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM session_members sm
    WHERE sm.id = holdings.session_member_id
    AND sm.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_members sm
    WHERE sm.id = holdings.session_member_id
    AND sm.user_id = auth.uid()
  )
);
```

## 43.5 `transactions`

```sql
-- Users read their own; teachers read all in their session
CREATE POLICY "transactions_select_own"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_members sm
    WHERE sm.id = transactions.session_member_id
    AND sm.user_id = auth.uid()
  )
);

CREATE POLICY "transactions_select_teacher"
ON transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_members sm
    JOIN sessions s ON s.id = sm.session_id
    WHERE sm.id = transactions.session_member_id
    AND s.teacher_id = auth.uid()
  )
);

-- Insert only (no update or delete on transaction history)
CREATE POLICY "transactions_insert_own"
ON transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM session_members sm
    WHERE sm.id = transactions.session_member_id
    AND sm.user_id = auth.uid()
  )
);
```

## 43.6 `orders`, `user_achievements`, `price_alerts`

```sql
-- Orders: users fully manage their own
CREATE POLICY "orders_all_own" ON orders FOR ALL
USING (EXISTS (SELECT 1 FROM session_members sm WHERE sm.id = orders.session_member_id AND sm.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM session_members sm WHERE sm.id = orders.session_member_id AND sm.user_id = auth.uid()));

-- Achievements: select + insert own only (no update/delete)
CREATE POLICY "achievements_select_own" ON user_achievements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "achievements_insert_own" ON user_achievements FOR INSERT WITH CHECK (user_id = auth.uid());

-- Price alerts: full CRUD own only
CREATE POLICY "price_alerts_all_own" ON price_alerts FOR ALL
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

## 43.7 `announcements` and `market_events`

```sql
-- Session members can read; only teachers can insert
CREATE POLICY "announcements_select_members" ON announcements FOR SELECT
USING (EXISTS (SELECT 1 FROM session_members sm WHERE sm.session_id = announcements.session_id AND sm.user_id = auth.uid()));

CREATE POLICY "announcements_insert_teacher" ON announcements FOR INSERT
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "market_events_select_members" ON market_events FOR SELECT
USING (EXISTS (SELECT 1 FROM session_members sm WHERE sm.session_id = market_events.session_id AND sm.user_id = auth.uid()));

CREATE POLICY "market_events_insert_teacher" ON market_events FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM sessions s WHERE s.id = market_events.session_id AND s.teacher_id = auth.uid()));
```

---

# 44. Supabase Edge Function — Finnhub Proxy

## 44.1 Purpose

The Edge Function is a secure proxy between the frontend and Finnhub. It keeps the API key out of client-side code, applies in-memory caching, and handles rate limits gracefully.

**File:** `supabase/functions/finnhub/index.ts`

## 44.2 Supported Endpoints

| `endpoint` param | Finnhub URL | Cache TTL |
|---|---|---|
| `quote` | `/quote?symbol=` | 10 seconds |
| `search` | `/search?q=` | 60 seconds |
| `profile` | `/stock/profile2?symbol=` | 24 hours |
| `candle` | `/stock/candle` | 5 minutes |
| `news` | `/company-news` | 10 minutes |
| `metric` | `/stock/metric?symbol=&metric=all` | 1 hour |

## 44.3 Function Logic

```ts
import { serve } from 'https://deno.land/std/http/server.ts'

const FINNHUB_KEY  = Deno.env.get('FINNHUB_API_KEY')
const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const cache        = new Map<string, { data: unknown; expiresAt: number }>()
const TTL: Record<string, number> = {
  quote: 10_000, search: 60_000, profile: 86_400_000,
  candle: 300_000, news: 600_000, metric: 3_600_000,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey' }
  })

  if (!req.headers.get('Authorization'))
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const url      = new URL(req.url)
  const endpoint = url.searchParams.get('endpoint') ?? ''
  const symbol   = url.searchParams.get('symbol') ?? ''
  const query    = url.searchParams.get('q') ?? ''
  const res      = url.searchParams.get('resolution') ?? 'D'
  const from     = url.searchParams.get('from') ?? ''
  const to       = url.searchParams.get('to') ?? ''

  if (!TTL[endpoint])
    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), { status: 400 })

  const cacheKey = `${endpoint}:${symbol}:${query}:${res}:${from}:${to}`
  const cached   = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now())
    return new Response(JSON.stringify(cached.data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    })

  const urls: Record<string, string> = {
    quote:   `${FINNHUB_BASE}/quote?symbol=${symbol}`,
    search:  `${FINNHUB_BASE}/search?q=${query}`,
    profile: `${FINNHUB_BASE}/stock/profile2?symbol=${symbol}`,
    candle:  `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=${res}&from=${from}&to=${to}`,
    news:    `${FINNHUB_BASE}/company-news?symbol=${symbol}&from=${from}&to=${to}`,
    metric:  `${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all`,
  }

  try {
    const resp = await fetch(`${urls[endpoint]}&token=${FINNHUB_KEY}`)
    if (resp.status === 429) {
      if (cached) return new Response(JSON.stringify(cached.data), {
        headers: { 'X-Cache': 'STALE', 'X-Rate-Limited': 'true' }
      })
      return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 })
    }
    if (!resp.ok)
      return new Response(JSON.stringify({ error: 'upstream_error' }), { status: 502 })

    const data = await resp.json()
    cache.set(cacheKey, { data, expiresAt: Date.now() + TTL[endpoint] })
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'network_error' }), { status: 503 })
  }
})
```

## 44.4 WebSocket (Direct from Frontend)

The Finnhub WebSocket connects directly from the browser — Edge Functions cannot hold persistent WebSocket connections. A separate `VITE_FINNHUB_WS_KEY` env var (the public free-tier key) is used only for this connection.

```js
const socket = new WebSocket(`wss://ws.finnhub.io?token=${import.meta.env.VITE_FINNHUB_WS_KEY}`)
socket.onmessage = (e) => {
  const msg = JSON.parse(e.data)
  if (msg.type === 'trade') msg.data.forEach(t => updatePrice(t.s, t.p))
}
```

---

# 45. Achievement Unlock Conditions (Logic Rules)

Exact boolean conditions checked after each relevant action.

## 45.1 Standard Achievements

| Badge ID | Condition |
|---|---|
| `tutorial_done` | `user.tutorialCompleted === true` — on tutorial completion |
| `first_trade` | `transactionCount === 1` — after first trade insert |
| `first_sell` | `sellTransactionCount === 1` — first sell only |
| `first_profit` | `transaction.realized_gain > 0` — on any sell |
| `first_loss` | `transaction.realized_gain < 0` — on any sell |
| `diversified_5` | `distinctHeldSymbols >= 5` — after every buy |
| `diversified_10` | `distinctHeldSymbols >= 10` |
| `gain_5pct` | `portfolioGainPct >= 5.0` — after every price update |
| `gain_10pct` | `portfolioGainPct >= 10.0` |
| `gain_25pct` | `portfolioGainPct >= 25.0` |
| `gain_50pct` | `portfolioGainPct >= 50.0` |
| `gain_100pct` | `portfolioGainPct >= 100.0` |
| `limit_order` | `limitOrderCount === 1` — on first limit order |
| `stop_loss` | `stopLossCount === 1` — on first stop-loss |
| `10_trades` | `transactionCount >= 10` |
| `50_trades` | `transactionCount >= 50` |
| `tech_investor` | `COUNT(holdings WHERE sector='Technology') >= 3` |
| `all_sectors` | `COUNT(DISTINCT sector of held stocks) >= 5` |
| `survive_crash` | Flash crash fired AND user had holdings AND no sells in 5 sim-minutes after |
| `top_3` | `finalRank <= 3` — on simulation end |
| `rank_1` | `finalRank === 1` — on simulation end |
| `level_10` | `user.level >= 10` — after XP update |
| `level_25` | `user.level >= 25` |

## 45.2 Secret Achievement Conditions

| Badge ID | Condition |
|---|---|
| `night_owl` | Trade executed when `simHour >= 22 OR simHour < 5` |
| `paper_hands` | Sell of a stock occurs within 2 sim-hours of the matching buy |
| `diamond_hands` | Stock dropped ≥ 15% from user's avg cost, still held, no sell of that symbol |
| `all_in` | `tradeCost / cashBalanceBefore >= 0.95` |
| `perfect_timing` | Buy executed within 1 sim-hour before a bull/earnings-beat event on that symbol |
| `big_spender` | `tradeCost > 5000` on a single trade |

## 45.3 De-duplication

All checks first verify the achievement hasn't already been awarded:

```js
async function tryAward(userId, achievementId) {
  const { data } = await supabase.from('user_achievements')
    .select('id').eq('user_id', userId).eq('achievement_id', achievementId).single()
  if (data) return  // already unlocked
  await awardAchievement(userId, achievementId)
}
```

---

# 46. Badge Artwork Descriptions

| Badge ID | Visual Description |
|---|---|
| `tutorial_done` | Small rocket launching upward with a star trail, electric blue |
| `first_trade` | Two hands shaking over a coin, gold and white |
| `first_sell` | Upward arrow exiting through a door, green arrow |
| `first_profit` | Seedling sprouting from a coin, green plant on gold coin |
| `first_loss` | Cracked coin, silver/grey — styled as a "lesson learned" medal |
| `diversified_5` | Five coloured circles in a loose cluster, each a different colour |
| `diversified_10` | Ten dots forming a constellation pattern |
| `gain_5pct` | Rising bar chart, neon green bars |
| `gain_10pct` | Taller rising bars with "10%" label in bold |
| `gain_25pct` | Gold trophy with "25" engraved, purple base |
| `gain_50pct` | Rocket at 45° ascending steeply, flames at base |
| `gain_100pct` | One coin doubling into two with a spark between them |
| `limit_order` | Crosshair/target with a price label at the centre line |
| `stop_loss` | Shield with a downward arrow stopped by the face of the shield |
| `10_trades` | Bold "10" with small trade arrows around it |
| `50_trades` | Bold gold "50" |
| `tech_investor` | Blue circuit board chip icon |
| `all_sectors` | Pie chart divided into 5 equal differently-coloured sections |
| `survive_crash` | Figure standing firm while lightning falls around it |
| `top_3` | Three-step podium, top step in gold |
| `rank_1` | Gold "#1" medal with ribbon |
| `level_10` | Upward staircase with "10" at the top, silver |
| `level_25` | Gold crown with "25" centred inside |
| `night_owl` | Cartoon owl with glasses sitting on a moon crescent |
| `paper_hands` | Two open palms releasing paper confetti |
| `diamond_hands` | Two fists with diamond gems on knuckles, blue/cyan |
| `all_in` | Poker chip with "ALL IN", red and gold |
| `perfect_timing` | Clock with a lightning bolt at the exact correct moment |
| `big_spender` | Oversized shiny PC$ coin with "5000" denomination |

---

# 47. XP Bar Visual Behaviour

## 47.1 Locations

The XP bar appears in four places: Dashboard (full width), Navbar (compact, hover reveal), Profile page (full width), Level-up card (large animated).

## 47.2 Fill Calculation

```js
function xpBarFill(currentXP, level) {
  const thisLevelXP = getXpThreshold(level)
  const nextLevelXP = getXpThreshold(level + 1)
  return Math.min(((currentXP - thisLevelXP) / (nextLevelXP - thisLevelXP)) * 100, 100)
}
```

## 47.3 Normal XP Gain

- Bar width transitions from old fill % to new fill % — 600ms, `ease-out`
- A floating `+[X] XP` text appears near the triggering action, floats up 20px and fades out over 600ms

## 47.4 Level-Up Sequence

1. Bar fills from current position to 100% over proportional duration
2. 100ms white flash on the full bar
3. Level-up card fires (see §42.4 for timing)
4. On card dismiss: bar resets instantly to 0%, then animates to new fill % over 400ms

## 47.5 Max Level

At Level 25, bar is permanently full and static. Label reads "Max Level — Market Guru".

---

# 48. Market Event Copy

## 48.1 All Event Banners and Explanations

**Flash Crash**
Banner: `⚡ MARKET EVENT: Flash Crash — A sudden wave of automated selling has triggered a market-wide selloff. Prices are falling sharply across all sectors.`
Explanation: "A flash crash is a very rapid price decline caused by automated algorithms reacting to each other. They are usually short-lived and prices often recover quickly."

**Bull Run**
Banner: `🚀 MARKET EVENT: Bull Run — Positive economic news has sparked broad buying. Most stocks are surging.`
Explanation: "A bull run happens when investor confidence is high and many people buy at the same time, pushing prices up across the board."

**Sector Selloff — Technology**
Banner: `📉 MARKET EVENT: Tech Sector Selloff — Concerns over rising interest rates are hitting tech stocks hard. Technology companies are down sharply.`
Explanation: "When interest rates rise, growth companies like tech firms become less attractive because future profits are worth less today. This causes tech stocks to sell off."

**Sector Rally — Healthcare**
Banner: `📈 MARKET EVENT: Healthcare Rally — A major drug approval has boosted confidence in the sector. Healthcare stocks are surging.`
Explanation: "Sector rallies happen when good news for one company lifts sentiment for the whole industry. Even unrelated companies can rise on the wave of enthusiasm."

**Earnings Beat**
Banner: `🎯 MARKET EVENT: Earnings Beat — [COMPANY] just reported results far above expectations. The stock is surging.`
Explanation: "Beating earnings means a company made more profit than analysts predicted. Investors reward this with higher stock prices."

**Earnings Miss**
Banner: `⚠️ MARKET EVENT: Earnings Miss — [COMPANY] reported disappointing results. The stock is selling off.`
Explanation: "An earnings miss means the company made less profit than predicted. Investors often sell even if the company is still profitable."

**Analyst Upgrade**
Banner: `⭐ MARKET EVENT: Analyst Upgrade — [COMPANY] upgraded to 'Strong Buy' by a major bank. Stock is moving higher.`

**Analyst Downgrade**
Banner: `🔻 MARKET EVENT: Analyst Downgrade — [COMPANY] downgraded to 'Sell'. Stock is under pressure.`

**Bear Market Signal**
Banner: `🐻 MARKET EVENT: Bear Market Signal — Weak economic data has turned sentiment negative. Broad selling pressure across most stocks.`
Explanation: "A bear market signal means more investors are choosing to sell than buy. This can be triggered by bad economic news, rising inflation, or general fear."

**Market Recovery**
Banner: `🌅 MARKET EVENT: Market Recovery — Markets are bouncing back after recent losses. Bargain hunters are buying the dip.`
Explanation: "'Buying the dip' means purchasing stocks after a price drop, betting they'll recover. When enough investors do this at once, it creates a rebound."

---

# 49. App Copy Specification

## 49.1 Auth Page

| Element | Copy |
|---|---|
| Page title | "StockPilot" |
| Tagline | "Take the controls. Trade without risk." |
| Email placeholder | "you@example.com" |
| Password placeholder | "••••••••" |
| Display name placeholder | "e.g. Maya C." |
| Login button | "Log In" |
| Sign up button | "Create Account" |
| Forgot password | "Forgot password?" |
| Switch to sign up | "Don't have an account? Sign up" |
| Switch to login | "Already have an account? Log in" |
| Error: wrong password | "Incorrect email or password." |
| Error: email taken | "An account with this email already exists." |
| Error: weak password | "Password must be at least 8 characters." |
| Error: network | "Could not connect. Check your internet connection." |

## 49.2 Stock Browser

| Element | Copy |
|---|---|
| Search placeholder | "Search by name or ticker..." |
| No results | "No stocks found matching '[query]'. Try a different symbol or name." |
| Market open pill | "🟢 Market Open" |
| Market closed pill | "🔴 Market Closed" |
| API fallback banner | "⚠ Live prices unavailable. Showing last known data." |
| Stale price indicator | "⚠ Stale" |
| Loading | "Loading stocks..." |

## 49.3 Trade Panel

| Element | Copy |
|---|---|
| Buy button | "Buy [TICKER]" |
| Sell button | "Sell [TICKER]" |
| Processing | "Processing..." |
| Warning: 95%+ balance | "This trade uses most of your available PilotCoins." |
| Warning: negative balance | "This trade will put your balance below zero." |
| Error: insufficient funds | "Insufficient PilotCoins. Reduce quantity or sell other holdings." |
| Error: not enough shares | "You only own [X] shares of [TICKER]." |
| Error: zero quantity | "Please enter a valid number of shares." |
| Error: market closed | "The market is currently closed." |
| Error: trade failed | "Trade failed. Your balance was not changed. Please try again." |
| Confirm title | "Confirm [Buy/Sell] Order" |
| Confirm body | "You are about to [buy/sell] [X] shares of [TICKER] for PC$[total]." |

## 49.4 Portfolio Page

| Element | Copy |
|---|---|
| Holdings empty | "Your portfolio is empty. Start trading in the Stock Browser." |
| Empty CTA | "Browse Stocks →" |
| Open orders empty | "No pending orders." |
| Stale banner | "⚠ Live prices unavailable. Calculations may not reflect current market values." |

## 49.5 Toast Messages

| Trigger | Message | Subtext |
|---|---|---|
| Buy success | "Bought [X] shares of [TICKER]" | "PC$[total] · +10 XP" |
| Sell success | "Sold [X] shares of [TICKER]" | "PC$[proceeds] net · +10 XP" |
| Limit placed | "Limit order set for [TICKER]" | "Executes at PC$[limit]" |
| Stop-loss placed | "Stop-loss set for [TICKER]" | "Sells at PC$[stop]" |
| Limit filled | "Limit order filled — [TICKER]" | "[X] shares at PC$[price]" |
| Stop triggered | "Stop-loss triggered — [TICKER]" | "Sold [X] shares at PC$[price]" |
| Order expired | "Order expired — [TICKER]" | "Limit order not filled before simulation ended." |
| Price alert | "Price alert — [TICKER]" | "Price is now [above/below] PC$[threshold]" |
| Achievement | "Achievement Unlocked!" | "[Badge Name] · +[X] XP" |
| Portfolio reset | "Portfolio reset." | "Balance returned to PC$[X]." |
| API down | "Live prices unavailable." | "Showing last known data. Will reconnect automatically." |
| API restored | "Live prices restored." | "Real-time data is back." |

---

# 50. Simulation Speed — Technical Summary

The simulation runs at **1 real minute = 1 simulated market hour**. A full NYSE trading day (6.5 hours) takes 6.5 real minutes.

A `simulationClock` module advances `simCurrentTime` by 1 simulated minute every real second. `isMarketOpen` is true when `simCurrentTime` falls between 9:30am and 4:00pm on a simulated weekday.

Market orders are blocked when `isMarketOpen === false`. Limit and stop-loss orders remain active at all times. Prices still stream from Finnhub regardless of simulated market hours — the speed-up affects only the pacing of the experience, not the underlying price data.

---

# 51. Page States — Portfolio, Stocks, and Leaderboard

## 51.1 Portfolio Page States

**Loading:** Skeleton shimmer blocks replace all values. Holdings table shows 3 skeleton rows. Charts show grey placeholder rectangles with spinner.

**Empty (No Holdings):**
```
Your portfolio is empty.
Start trading to see your holdings here.
[ Browse Stocks → ]
```

**Error (Data Failed):** "Could not load portfolio data. Please refresh the page." with a Refresh button.

**Stale Prices:** Yellow banner: "⚠ Live prices unavailable. Calculations may not reflect current market values." Each price shows `⚠ Stale` badge.

## 51.2 Stock Browser Page States

**Loading:** Search bar functional immediately. 20 skeleton stock rows shown. Sort/filter controls disabled.

**No Search Results:**
```
No stocks found matching "[query]".
Try a different symbol or company name.
[ Clear search ]
```

**API Full Failure:**
```
⚠ Live market data is unavailable.
Showing demo data for practice trading.
[ Retry connection ]
```

## 51.3 Leaderboard Page States

**Loading:** Page heading visible. 5 skeleton rows with shimmer.

**Only One Student:**
```
No other students have joined this session yet.
Share the invite link!
```

**Hidden by Teacher:**
```
🔒 The leaderboard is currently hidden.
Check back soon.
```

**Hidden by Student:**
```
Leaderboard is hidden.   [ Show Leaderboard ]
```

**Simulation Ended:** Rankings frozen. Banner: "This simulation has ended. These are the final standings." All values show final figures.

---

---

# 52. Full SQL Query Reference

Every database query StockPilot executes, with an explanation of what it does and why it's written that way.

## 52.1 Authentication Queries (handled by Supabase Auth — no manual SQL)

Supabase Auth manages sign-up, login, and password reset automatically. After a user signs up, a trigger creates their `users` row:

```sql
-- Trigger: auto-create users row on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, xp, level, level_title)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Student'),
    'student',
    0,
    1,
    'Rookie Pilot'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 52.2 Session Queries

### Create a new simulation session (teacher)
```sql
INSERT INTO sessions (id, teacher_id, name, starting_balance, start_date, end_date, status, invite_code)
VALUES (
  gen_random_uuid(),
  $teacher_id,
  $session_name,
  $starting_balance,
  $start_date,
  $end_date,
  'active',
  $invite_code   -- 8-char random alphanumeric generated client-side
)
RETURNING id, invite_code;
```

### Look up session by invite code (student joining)
```sql
SELECT id, name, starting_balance, status
FROM sessions
WHERE invite_code = $invite_code
  AND status = 'active';
-- Returns null if code is invalid or session has ended
```

### Join a session (create session_member row)
```sql
INSERT INTO session_members (id, session_id, user_id, cash_balance, starting_balance, portfolio_value, percent_gain, reset_used)
VALUES (
  gen_random_uuid(),
  $session_id,
  $user_id,
  $starting_balance,   -- copied from sessions.starting_balance
  $starting_balance,
  $starting_balance,   -- initial portfolio_value = all cash, no holdings
  0.00,
  FALSE
)
RETURNING id;
```

### End a simulation (teacher)
```sql
UPDATE sessions
SET status = 'ended', end_date = NOW()
WHERE id = $session_id
  AND teacher_id = $teacher_id;

-- Also expire all pending orders for this session
UPDATE orders
SET status = 'expired'
WHERE status = 'pending'
  AND session_member_id IN (
    SELECT id FROM session_members WHERE session_id = $session_id
  );
```

## 52.3 Trade Queries

### Execute a buy (market order) — runs as a transaction
```sql
BEGIN;

-- 1. Deduct cash from session_member
UPDATE session_members
SET cash_balance = cash_balance - $total_cost
WHERE id = $session_member_id
  AND cash_balance >= $total_cost;  -- optimistic lock: fails if balance changed

-- If 0 rows affected, ROLLBACK (race condition — another trade just ran)

-- 2. Upsert holding (insert or update shares + WAVG cost)
INSERT INTO holdings (id, session_member_id, symbol, shares, avg_cost)
VALUES (gen_random_uuid(), $session_member_id, $symbol, $shares, $price)
ON CONFLICT (session_member_id, symbol)
DO UPDATE SET
  avg_cost = (
    (holdings.shares * holdings.avg_cost + EXCLUDED.shares * EXCLUDED.avg_cost)
    / (holdings.shares + EXCLUDED.shares)
  ),
  shares = holdings.shares + EXCLUDED.shares,
  updated_at = NOW();

-- 3. Log transaction
INSERT INTO transactions (id, session_member_id, symbol, type, order_type, shares, price, fee, total, executed_at)
VALUES (
  gen_random_uuid(), $session_member_id, $symbol, 'buy', 'market',
  $shares, $price, $fee, $total_cost, NOW()
);

COMMIT;
```

### Execute a sell (market order)
```sql
BEGIN;

-- 1. Add net proceeds to balance
UPDATE session_members
SET cash_balance = cash_balance + $net_proceeds
WHERE id = $session_member_id;

-- 2. Calculate realized gain before updating holding
-- realized_gain = (sell_price - avg_cost) * shares_sold
-- (computed client-side, passed in as $realized_gain)

-- 3. Reduce or remove holding
UPDATE holdings
SET shares = shares - $shares_sold,
    updated_at = NOW()
WHERE session_member_id = $session_member_id
  AND symbol = $symbol;

-- Remove holding row if shares reach zero
DELETE FROM holdings
WHERE session_member_id = $session_member_id
  AND symbol = $symbol
  AND shares <= 0.000001;  -- epsilon for floating point safety

-- 4. Log transaction with realized gain
INSERT INTO transactions (id, session_member_id, symbol, type, order_type, shares, price, fee, total, realized_gain, executed_at)
VALUES (
  gen_random_uuid(), $session_member_id, $symbol, 'sell', 'market',
  $shares_sold, $sell_price, $fee, $net_proceeds, $realized_gain, NOW()
);

COMMIT;
```

### Place a limit or stop-loss order
```sql
INSERT INTO orders (id, session_member_id, symbol, type, order_type, shares, limit_price, status, created_at)
VALUES (
  gen_random_uuid(),
  $session_member_id,
  $symbol,
  $side,          -- 'buy' or 'sell'
  $order_type,    -- 'limit' or 'stop_loss'
  $shares,
  $limit_price,
  'pending',
  NOW()
)
RETURNING id;
```

### Cancel a pending order
```sql
UPDATE orders
SET status = 'cancelled'
WHERE id = $order_id
  AND session_member_id = $session_member_id
  AND status = 'pending';
```

### Check and execute pending orders on price tick
```sql
-- Called every time a new price arrives for $symbol
-- Fetch all matching pending orders
SELECT o.*, sm.cash_balance, h.shares AS owned_shares, h.avg_cost
FROM orders o
JOIN session_members sm ON sm.id = o.session_member_id
LEFT JOIN holdings h ON h.session_member_id = o.session_member_id AND h.symbol = o.symbol
WHERE o.symbol = $symbol
  AND o.status = 'pending'
  AND (
    -- Buy limit: price dropped to or below limit
    (o.type = 'buy'  AND o.order_type = 'limit'     AND $current_price <= o.limit_price)
    OR
    -- Sell limit: price rose to or above limit
    (o.type = 'sell' AND o.order_type = 'limit'     AND $current_price >= o.limit_price)
    OR
    -- Stop-loss: price dropped to or below stop
    (o.type = 'sell' AND o.order_type = 'stop_loss' AND $current_price <= o.limit_price)
  );
-- For each row returned: execute as market order, then set status = 'filled', filled_at = NOW()
```

## 52.4 Portfolio Queries

### Load full portfolio for a user in a session
```sql
SELECT
  h.symbol,
  h.shares,
  h.avg_cost,
  sm.cash_balance,
  sm.portfolio_value,
  sm.percent_gain,
  sm.starting_balance
FROM holdings h
JOIN session_members sm ON sm.id = h.session_member_id
WHERE sm.user_id = $user_id
  AND sm.session_id = $session_id
ORDER BY h.symbol;
```

### Update portfolio value after price change
```sql
-- Called client-side after recalculating total value
UPDATE session_members
SET
  portfolio_value = $new_total_value,
  percent_gain    = (($new_total_value - starting_balance) / starting_balance) * 100
WHERE id = $session_member_id;
```

### Portfolio reset (student uses their one reset)
```sql
BEGIN;

-- Delete all holdings
DELETE FROM holdings WHERE session_member_id = $session_member_id;

-- Cancel all pending orders
UPDATE orders SET status = 'cancelled'
WHERE session_member_id = $session_member_id AND status = 'pending';

-- Restore balance and mark reset as used
UPDATE session_members
SET cash_balance    = starting_balance,
    portfolio_value = starting_balance,
    percent_gain    = 0.00,
    reset_used      = TRUE
WHERE id = $session_member_id
  AND reset_used = FALSE;  -- only succeeds once

COMMIT;
```

## 52.5 Leaderboard Query

### Fetch full leaderboard for a session (with tiebreakers)
```sql
SELECT
  sm.id,
  sm.user_id,
  u.display_name,
  u.level,
  u.level_title,
  sm.portfolio_value,
  sm.percent_gain,
  COUNT(t.id) AS total_trades,
  sm.joined_at,
  RANK() OVER (
    ORDER BY
      sm.portfolio_value DESC,
      sm.percent_gain DESC,
      COUNT(t.id) ASC,
      sm.joined_at ASC
  ) AS rank
FROM session_members sm
JOIN users u ON u.id = sm.user_id
LEFT JOIN transactions t ON t.session_member_id = sm.id
WHERE sm.session_id = $session_id
GROUP BY sm.id, sm.user_id, u.display_name, u.level, u.level_title,
         sm.portfolio_value, sm.percent_gain, sm.joined_at
ORDER BY rank ASC;
```

**Why RANK() OVER?** PostgreSQL's window function `RANK()` applies tiebreakers in order without requiring a subquery. The `ORDER BY` clause inside `OVER()` matches the tiebreaker hierarchy from Section 39: portfolio value → % gain → fewer trades → earlier join.

## 52.6 Transaction History Queries

### Load transaction history for current simulation
```sql
SELECT
  t.id,
  t.symbol,
  t.type,
  t.order_type,
  t.shares,
  t.price,
  t.fee,
  t.total,
  t.realized_gain,
  t.executed_at
FROM transactions t
WHERE t.session_member_id = $session_member_id
ORDER BY t.executed_at DESC;
-- All trades for this simulation period; reset on new simulation
```

### Sorted by trade value (largest first)
```sql
SELECT * FROM transactions
WHERE session_member_id = $session_member_id
ORDER BY total DESC;
```

### Transaction summary stats (for profile page)
```sql
SELECT
  COUNT(*)                                         AS total_trades,
  COUNT(*) FILTER (WHERE type = 'buy')             AS buy_count,
  COUNT(*) FILTER (WHERE type = 'sell')            AS sell_count,
  SUM(fee)                                         AS total_fees_paid,
  SUM(realized_gain) FILTER (WHERE type = 'sell') AS total_realized_gain
FROM transactions
WHERE session_member_id = $session_member_id;
```

## 52.7 Achievement Queries

### Load all achievements with unlock status for a user
```sql
SELECT
  a.id,
  a.name,
  a.description,
  a.badge_icon,
  a.xp_reward,
  a.is_hidden,
  ua.unlocked_at
FROM achievements a
LEFT JOIN user_achievements ua
  ON ua.achievement_id = a.id
  AND ua.user_id = $user_id
ORDER BY ua.unlocked_at ASC NULLS LAST, a.id;
-- Unlocked achievements first (sorted by unlock time), then locked ones
```

### Unlock an achievement and award XP (runs as transaction)
```sql
BEGIN;

-- Insert achievement record
INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
VALUES (gen_random_uuid(), $user_id, $achievement_id, NOW())
ON CONFLICT (user_id, achievement_id) DO NOTHING;
-- ON CONFLICT prevents double-awarding if race condition occurs

-- Add XP to user
UPDATE users
SET xp = xp + $xp_reward
WHERE id = $user_id;

-- Recalculate level (done client-side using getLevelFromXp(), then:)
UPDATE users
SET level = $new_level, level_title = $new_title
WHERE id = $user_id AND level < $new_level;
-- Only updates if level actually increased

COMMIT;
```

## 52.8 Price Alert Queries

### Create a price alert
```sql
INSERT INTO price_alerts (id, user_id, symbol, alert_type, threshold_price, triggered)
VALUES (gen_random_uuid(), $user_id, $symbol, $alert_type, $threshold_price, FALSE)
RETURNING id;
```

### Check alerts on price tick
```sql
SELECT id, user_id, symbol, alert_type, threshold_price
FROM price_alerts
WHERE symbol = $symbol
  AND triggered = FALSE
  AND (
    (alert_type = 'above' AND $current_price >= threshold_price)
    OR
    (alert_type = 'below' AND $current_price <= threshold_price)
  );
-- For each result: fire notification, then mark as triggered
```

### Mark alert as triggered
```sql
UPDATE price_alerts
SET triggered = TRUE
WHERE id = $alert_id;
```

## 52.9 Teacher Analytics Queries

### Per-student engagement summary
```sql
SELECT
  u.display_name,
  u.email,
  u.xp,
  u.level,
  sm.portfolio_value,
  sm.percent_gain,
  sm.reset_used,
  COUNT(t.id)                 AS total_trades,
  MAX(t.executed_at)          AS last_trade_at,
  COUNT(ua.id)                AS badges_unlocked
FROM session_members sm
JOIN users u ON u.id = sm.user_id
LEFT JOIN transactions t ON t.session_member_id = sm.id
LEFT JOIN user_achievements ua ON ua.user_id = sm.user_id
WHERE sm.session_id = $session_id
GROUP BY u.display_name, u.email, u.xp, u.level,
         sm.portfolio_value, sm.percent_gain, sm.reset_used
ORDER BY sm.portfolio_value DESC;
```

### Most traded stocks across the class
```sql
SELECT
  symbol,
  COUNT(*)        AS trade_count,
  SUM(shares)     AS total_shares_traded,
  SUM(total)      AS total_volume
FROM transactions t
JOIN session_members sm ON sm.id = t.session_member_id
WHERE sm.session_id = $session_id
GROUP BY symbol
ORDER BY trade_count DESC
LIMIT 10;
```

### Trade volume per simulated day
```sql
SELECT
  DATE_TRUNC('day', executed_at) AS trade_day,
  COUNT(*)                        AS trades_count
FROM transactions t
JOIN session_members sm ON sm.id = t.session_member_id
WHERE sm.session_id = $session_id
GROUP BY trade_day
ORDER BY trade_day ASC;
```

---

# 53. Mock Data Specification

The fallback dataset stored at `public/mock-data/stocks.json`. Used when Finnhub is unavailable.

## 53.1 File Structure

```json
{
  "generated_at": "2026-05-13T00:00:00Z",
  "stocks": [ ...37 stock objects... ]
}
```

## 53.2 Stock Object Schema

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "price": 189.52,
  "change": 2.34,
  "changePct": 1.25,
  "open": 187.18,
  "high": 190.41,
  "low": 186.95,
  "prevClose": 187.18,
  "week52High": 199.62,
  "week52Low": 164.08,
  "marketCap": "2.89T",
  "logoUrl": "https://logo.clearbit.com/apple.com",
  "candles": {
    "1D": [ { "t": 1715587800, "o": 187.18, "h": 190.41, "l": 186.95, "c": 189.52, "v": 52341200 }, "..." ],
    "1W": [ "...7 daily candles..." ],
    "1M": [ "...30 daily candles..." ]
  }
}
```

## 53.3 All 37 Default Stocks (Mock Prices)

| Symbol | Name | Sector | Mock Price | Change | Change% |
|---|---|---|---|---|---|
| AAPL | Apple Inc. | Technology | 189.52 | +2.34 | +1.25% |
| MSFT | Microsoft Corp. | Technology | 378.90 | +3.28 | +0.87% |
| GOOGL | Alphabet Inc. | Technology | 165.30 | +0.54 | +0.33% |
| AMZN | Amazon.com Inc. | Technology | 182.10 | -1.00 | -0.55% |
| META | Meta Platforms | Technology | 492.60 | +9.11 | +1.88% |
| NVDA | NVIDIA Corp. | Technology | 875.40 | +29.02 | +3.42% |
| TSLA | Tesla Inc. | Technology | 214.80 | -5.08 | -2.31% |
| AMD | Advanced Micro Devices | Technology | 162.30 | +4.87 | +3.09% |
| INTC | Intel Corp. | Technology | 31.40 | -0.62 | -1.94% |
| ORCL | Oracle Corp. | Technology | 122.50 | +1.10 | +0.91% |
| JNJ | Johnson & Johnson | Healthcare | 152.80 | -0.90 | -0.59% |
| PFE | Pfizer Inc. | Healthcare | 27.60 | +0.34 | +1.25% |
| UNH | UnitedHealth Group | Healthcare | 492.10 | +5.70 | +1.17% |
| ABBV | AbbVie Inc. | Healthcare | 163.40 | -1.20 | -0.73% |
| MRK | Merck & Co. | Healthcare | 128.90 | +0.88 | +0.69% |
| JPM | JPMorgan Chase | Finance | 196.40 | -0.24 | -0.12% |
| BAC | Bank of America | Finance | 39.20 | +0.48 | +1.24% |
| GS | Goldman Sachs | Finance | 445.60 | -3.20 | -0.71% |
| V | Visa Inc. | Finance | 278.90 | +2.10 | +0.76% |
| MA | Mastercard Inc. | Finance | 462.30 | +3.80 | +0.83% |
| WMT | Walmart Inc. | Consumer | 67.40 | +0.54 | +0.81% |
| TGT | Target Corp. | Consumer | 155.20 | -1.80 | -1.15% |
| MCD | McDonald's Corp. | Consumer | 289.50 | +1.20 | +0.42% |
| SBUX | Starbucks Corp. | Consumer | 79.80 | -0.90 | -1.12% |
| NKE | Nike Inc. | Consumer | 94.60 | +0.70 | +0.74% |
| DIS | Walt Disney Co. | Consumer | 112.30 | +1.50 | +1.35% |
| XOM | Exxon Mobil | Energy | 114.20 | +0.80 | +0.71% |
| CVX | Chevron Corp. | Energy | 158.70 | -1.10 | -0.69% |
| COP | ConocoPhillips | Energy | 119.40 | +2.30 | +1.97% |
| BA | Boeing Co. | Industrials | 188.90 | -2.40 | -1.26% |
| CAT | Caterpillar Inc. | Industrials | 362.10 | +4.50 | +1.26% |
| GE | GE Aerospace | Industrials | 162.80 | +1.90 | +1.18% |
| T | AT&T Inc. | Telecom | 18.20 | -0.10 | -0.55% |
| VZ | Verizon Communications | Telecom | 41.30 | +0.20 | +0.49% |
| NFLX | Netflix Inc. | Technology | 628.40 | +8.90 | +1.44% |
| PYPL | PayPal Holdings | Finance | 62.10 | -0.80 | -1.27% |
| UBER | Uber Technologies | Technology | 72.40 | +1.30 | +1.83% |

---

# 54. Security Threat Model

## 54.1 XSS (Cross-Site Scripting)

**Threat:** An attacker injects malicious JavaScript into the app that runs in other users' browsers — stealing session tokens, redirecting users, or defacing the UI.

**Attack vectors in StockPilot:**
- User-supplied display names rendered in the leaderboard and announcements
- Teacher-supplied announcement text rendered for all students
- Stock news headlines pulled from Finnhub and displayed

**Mitigations:**

| Location | Mitigation |
|---|---|
| All user text rendered in DOM | Always inserted via `textContent` or `innerText`, never `innerHTML`. Never use `element.innerHTML = userInput` |
| News headlines from Finnhub | Rendered as `textContent` only — links open via `window.open(url, '_blank')` with the raw URL, never rendered as HTML |
| Announcement text | Sanitised on the client before display using a whitelist approach (plain text only, no HTML tags allowed) |
| Supabase data | Supabase returns JSON strings — they are never eval'd or inserted as HTML |

**CSP Header:** Add a Content Security Policy via Vercel's `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://ws.finnhub.io https://finnhub.io;" }
      ]
    }
  ]
}
```

---

## 54.2 CSRF (Cross-Site Request Forgery)

**Threat:** A malicious site tricks an authenticated user's browser into making requests to StockPilot (e.g. placing trades, resetting portfolio).

**Why StockPilot is largely protected:**
- All state-changing operations go through Supabase's REST API, which requires a valid `Authorization: Bearer <JWT>` header
- Browsers do not automatically send custom headers on cross-origin requests (CORS blocks this)
- The JWT is stored in memory (Supabase's `localStorage`-based session), not in a cookie — so `SameSite` is irrelevant, and there is no cookie to forge

**Residual risk:** None significant for this use case. The JWT itself cannot be stolen via CSRF.

---

## 54.3 SQL Injection

**Threat:** Attacker crafts input that alters the SQL query being executed.

**Why StockPilot is protected:**
- All database access goes through Supabase's PostgREST API or the Supabase JS client
- Both use **parameterised queries** internally — user input is never concatenated into SQL strings
- No raw SQL is constructed on the client side; even the Edge Function uses Deno's `fetch` to hit the Finnhub REST API, not a database

**No manual SQL construction anywhere in the frontend codebase.**

---

## 54.4 Authentication Bypass

**Threat:** Attacker accesses protected routes or data without a valid session.

**Mitigations:**

| Layer | Protection |
|---|---|
| Client-side routing | `router.js` checks `supabase.auth.getSession()` before rendering any protected route. Redirect to `/auth` if no session |
| Supabase RLS | Every table has row-level security. Even if a user bypasses client routing and calls Supabase directly (e.g. via Postman), they can only see their own data |
| Admin route | `/admin` checks `user.role === 'teacher'` client-side AND RLS policies block all teacher-only writes for non-teachers at the database level |
| JWT expiry | Supabase JWTs expire after 1 hour; the client uses `onAuthStateChange` to automatically refresh the token silently |
| Brute force | Supabase Auth applies a default rate limit of 6 login attempts per hour per IP |

---

## 54.5 Insecure Direct Object Reference (IDOR)

**Threat:** User A modifies their request to act on User B's data (e.g. cancel User B's order, reset User B's portfolio).

**Protection:** All Supabase RLS policies are defined in §43. Every `UPDATE` and `DELETE` policy includes a check that the `user_id` or `teacher_id` matches `auth.uid()`. A student cannot modify another student's holdings, orders, or balance even by crafting a direct Supabase API call with their own valid JWT.

---

## 54.6 API Key Exposure

**Threat:** The Finnhub API key is visible in client-side JavaScript and can be stolen and abused.

**Mitigation:** The key is stored as a Supabase Edge Function secret (`FINNHUB_API_KEY`) and never referenced in the frontend bundle. The only exception is `VITE_FINNHUB_WS_KEY` used for the WebSocket — this is the free-tier public key and its exposure is acceptable for a school project (the key has no billing implications and Finnhub's free tier is already rate-limited).

For production hardening: proxy the WebSocket through a self-hosted WebSocket relay server.

---

## 54.7 Denial of Service (Rate Limit Abuse)

**Threat:** A student (or attacker) floods the Edge Function with requests, exhausting the Finnhub rate limit for everyone in the class.

**Mitigations:**
- Edge Function caches responses — repeated identical requests return cached data without hitting Finnhub
- Supabase Edge Functions have built-in rate limiting per IP
- Client-side debouncing (300ms on search) prevents rapid-fire requests
- WebSocket subscriptions are managed per-page (not a flood of subscriptions)

---

## 54.8 Data Privacy

**Threat:** Student financial data (portfolio, trade history) is visible to other students.

**Protection:**
- Holdings and transaction history are private — only readable by the owning student and their teacher (via RLS)
- The leaderboard exposes only: display name, level title, total portfolio value, and % gain — no individual stock holdings or trade details
- Teachers are trusted actors in this school context

---

# 55. Component Specifications (Continued)

## 55.1 PortfolioTable

**File:** `src/components/PortfolioTable.js`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `holdings` | array | Array of holding objects from `portfolioState.holdings` |
| `onQuickSell` | function | Called with `symbol` when Quick Sell is clicked |
| `isLoading` | boolean | Shows skeleton rows when true |
| `stale` | boolean | Shows stale price indicator on each row |

**States:**
- `sortKey` — which column is sorted (`'symbol'`, `'value'`, `'gain'`, `'gainPct'`)
- `sortDir` — `'asc'` or `'desc'`
- `expandedRow` — symbol of expanded row (shows extra detail inline) or `null`

**DOM Structure:**
```html
<div class="portfolio-table-wrapper">
  <table class="portfolio-table">
    <thead>
      <tr>
        <th class="sortable" onclick="sort('symbol')">Symbol</th>
        <th>Shares</th>
        <th>Avg Cost</th>
        <th class="sortable" onclick="sort('price')">Price</th>
        <th class="sortable" onclick="sort('value')">Value</th>
        <th class="sortable" onclick="sort('gainPct')">Unrealized G/L</th>
        <th></th>  <!-- Quick sell button -->
      </tr>
    </thead>
    <tbody>
      <!-- Skeleton rows when isLoading -->
      <!-- Holding rows -->
      <tr class="holding-row [expanded]" onclick="toggleExpand(symbol)">
        <td>
          <div class="flex items-center gap-2">
            <img src="{logoUrl}" class="w-6 h-6" />
            <span class="font-semibold text-white">{symbol}</span>
          </div>
        </td>
        <td class="tabular-nums">{shares}</td>
        <td class="tabular-nums text-slate-400">PC${avgCost}</td>
        <td class="tabular-nums [flash class]">
          PC${price}
          {if stale} <span class="stale-badge">⚠</span> {/if}
        </td>
        <td class="tabular-nums font-semibold">PC${marketValue}</td>
        <td>
          <span class="gain-badge [gain|loss]">
            {gainPct >= 0 ? '+' : ''}{gainPct}%
            <span class="text-xs">(PC${gainDollar})</span>
          </span>
        </td>
        <td>
          <button class="quick-sell-btn" onclick="stopPropagation(); onQuickSell(symbol)">
            Sell
          </button>
        </td>
      </tr>
      <!-- Expanded row detail (conditionally rendered) -->
      {if expandedRow === symbol}
      <tr class="expanded-detail-row">
        <td colspan="7">
          <div class="expanded-content">
            <span>Realized G/L: PC${realizedGain}</span>
            <span>Sector: {sector}</span>
            <span>Held since: {firstPurchaseDate}</span>
          </div>
        </td>
      </tr>
      {/if}
    </tbody>
  </table>
</div>
```

**CSS:**
```css
.portfolio-table-wrapper { @apply overflow-x-auto rounded-xl border border-[#2A3245]; }
.portfolio-table         { @apply w-full text-sm; }
.portfolio-table thead tr { @apply bg-[#1E2535]; }
.portfolio-table th       { @apply px-4 py-3 text-left text-xs font-semibold
                                   uppercase tracking-wider text-slate-500; }
.portfolio-table th.sortable { @apply cursor-pointer hover:text-white transition-colors; }
.holding-row   { @apply border-b border-[#2A3245] cursor-pointer
                        hover:bg-white/[0.02] transition-colors; }
.holding-row td { @apply px-4 py-3; }
.stale-badge   { @apply text-amber-400 text-xs ml-1; }
.quick-sell-btn { @apply px-3 py-1 rounded-lg text-xs font-semibold
                         text-red-400 border border-red-500/30
                         hover:bg-red-500/10 transition-colors; }
.gain-badge.gain { @apply text-green-400; }
.gain-badge.loss { @apply text-red-400; }
.expanded-detail-row { @apply bg-[#0D0F14]; }
.expanded-content    { @apply px-4 py-3 flex gap-8 text-sm text-slate-400; }
```

---

## 55.2 LeaderboardRow

**File:** `src/components/LeaderboardRow.js`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `rank` | number | Current rank position |
| `prevRank` | number | Previous rank (for change indicator) |
| `displayName` | string | Student's display name |
| `levelTitle` | string | e.g. "Market Analyst" |
| `badgeIcon` | string | Emoji or icon identifier for top badge |
| `portfolioValue` | number | Total portfolio value |
| `percentGain` | number | % gain from starting balance |
| `isCurrentUser` | boolean | Highlights this row if true |
| `reactions` | object | `{ '👍': 12, '🚀': 8, '😮': 5, '😬': 2, '🔥': 3 }` |
| `userReaction` | string | Which emoji the current user reacted with, or null |
| `onReact` | function | Called with emoji when user reacts |

**Rank Change Indicator Logic:**
```js
const rankChange = prevRank - rank  // positive = moved up, negative = moved down
const indicator  = rankChange > 0 ? `▲ ${rankChange}`
                 : rankChange < 0 ? `▼ ${Math.abs(rankChange)}`
                 : ''
const indicatorClass = rankChange > 0 ? 'text-green-400'
                     : rankChange < 0 ? 'text-red-400'
                     : ''
```

**DOM Structure:**
```html
<tr class="lb-row [isCurrentUser ? 'lb-row-self' : '']">
  <td class="lb-rank">
    {rank <= 3
      ? ['🥇','🥈','🥉'][rank-1]
      : rank}
    {if rankChange !== 0}
      <span class="rank-change {indicatorClass}">{indicator}</span>
    {/if}
  </td>
  <td class="lb-name">
    <div class="flex items-center gap-2">
      <span class="badge-icon">{badgeIcon}</span>
      <div>
        <div class="text-white font-semibold">
          {displayName}
          {if isCurrentUser} <span class="text-blue-400 text-xs">★ You</span> {/if}
        </div>
        <div class="text-slate-500 text-xs">{levelTitle}</div>
      </div>
    </div>
  </td>
  <td class="lb-value tabular-nums font-semibold text-white">PC${portfolioValue}</td>
  <td class="lb-gain">
    <span class="{percentGain >= 0 ? 'text-green-400' : 'text-red-400'} font-semibold">
      {percentGain >= 0 ? '+' : ''}{percentGain}%
    </span>
  </td>
  <td class="lb-reactions">
    {['👍','🚀','😮','😬','🔥'].map(emoji =>
      <button
        class="reaction-btn {userReaction === emoji ? 'reacted' : ''}"
        onclick="onReact(emoji)">
        {emoji} <span class="reaction-count">{reactions[emoji] || 0}</span>
      </button>
    )}
  </td>
</tr>
```

**CSS:**
```css
.lb-row      { @apply border-b border-[#2A3245] transition-colors; }
.lb-row-self { @apply bg-blue-500/5 border-blue-500/20; }
.lb-rank     { @apply px-4 py-3 text-center font-bold text-white w-16; }
.lb-name     { @apply px-4 py-3; }
.lb-value    { @apply px-4 py-3 text-right; }
.lb-gain     { @apply px-4 py-3 text-right; }
.lb-reactions { @apply px-4 py-3; }
.rank-change { @apply text-xs font-normal ml-1; }
.reaction-btn { @apply px-1.5 py-0.5 rounded text-xs hover:bg-white/5
                        transition-colors flex items-center gap-0.5; }
.reaction-btn.reacted { @apply bg-white/10 ring-1 ring-white/20; }
.reaction-count { @apply text-slate-500; }
```

---

## 55.3 Modal

**File:** `src/components/Modal.js`

A generic reusable modal used for trade confirmations, portfolio reset confirmation, account deletion, and add price alert.

**Props:**
| Prop | Type | Description |
|---|---|---|
| `isOpen` | boolean | Controls visibility |
| `title` | string | Modal heading |
| `onClose` | function | Called on backdrop click or ✕ button |
| `children` | HTML/nodes | Modal body content |
| `footer` | HTML/nodes | Optional footer with action buttons |
| `size` | `'sm'`\|`'md'`\|`'lg'` | Width variant (default `'md'`) |

**DOM Structure:**
```html
{if isOpen}
<div class="modal-backdrop" onclick="onClose()">
  <div class="modal-box modal-{size}" onclick="stopPropagation()">
    <div class="modal-header">
      <h2 class="modal-title">{title}</h2>
      <button class="modal-close" onclick="onClose()">✕</button>
    </div>
    <div class="modal-body">
      {children}
    </div>
    {if footer}
    <div class="modal-footer">
      {footer}
    </div>
    {/if}
  </div>
</div>
{/if}
```

**CSS:**
```css
.modal-backdrop { @apply fixed inset-0 z-50 flex items-center justify-center
                         bg-black/70 backdrop-blur-sm animate-fade-in; }
.modal-box      { @apply bg-[#161B26] border border-[#2A3245] rounded-2xl
                         shadow-2xl w-full mx-4 animate-scale-in; }
.modal-sm       { @apply max-w-sm; }
.modal-md       { @apply max-w-md; }
.modal-lg       { @apply max-w-lg; }
.modal-header   { @apply flex items-center justify-between px-6 pt-6 pb-4
                         border-b border-[#2A3245]; }
.modal-title    { @apply font-semibold text-white text-lg; }
.modal-close    { @apply text-slate-500 hover:text-white transition-colors p-1; }
.modal-body     { @apply px-6 py-5; }
.modal-footer   { @apply px-6 pb-6 pt-4 flex justify-end gap-3
                         border-t border-[#2A3245]; }
```

---

## 55.4 MarketEventBanner

**File:** `src/components/MarketEventBanner.js`

**Props:**
| Prop | Type | Description |
|---|---|---|
| `event` | object | `{ type, description, explanation }` |
| `onDismiss` | function | Called when user clicks Dismiss |

**States:**
- `showExplanation` — boolean, toggles the "What happened?" explanation card
- `timeRemaining` — countdown in seconds until auto-dismiss (starts at 60)

**DOM Structure:**
```html
<div class="event-banner event-{type}" role="alert">
  <div class="event-icon">{iconByType}</div>
  <div class="event-content">
    <div class="event-title">MARKET EVENT: {eventName}</div>
    <div class="event-description">{description}</div>
    {if showExplanation}
    <div class="event-explanation">
      <span class="text-slate-400 text-xs">💡 What happened?</span>
      <p class="text-sm text-slate-300 mt-1">{explanation}</p>
    </div>
    {/if}
  </div>
  <div class="event-actions">
    <button class="event-explain-btn" onclick="toggleExplanation()">
      {showExplanation ? 'Hide' : 'What happened?'}
    </button>
    <button class="event-dismiss-btn" onclick="onDismiss()">
      Dismiss ({timeRemaining}s)
    </button>
  </div>
</div>
```

**CSS:**
```css
.event-banner {
  @apply w-full px-6 py-4 flex items-start gap-4
         border-b animate-slide-down;
}
.event-banner.flash_crash    { @apply bg-red-900/30    border-red-500/40; }
.event-banner.bull_run       { @apply bg-green-900/20  border-green-500/40; }
.event-banner.earnings_beat  { @apply bg-blue-900/20   border-blue-500/40; }
.event-banner.earnings_miss  { @apply bg-red-900/20    border-red-500/30; }
.event-banner.sector_selloff { @apply bg-orange-900/20 border-orange-500/40; }
.event-banner.sector_rally   { @apply bg-emerald-900/20 border-emerald-500/40; }
.event-title    { @apply font-bold text-white text-sm uppercase tracking-wide; }
.event-description { @apply text-slate-300 text-sm mt-0.5; }
.event-explanation { @apply mt-2 p-3 bg-black/20 rounded-lg; }
.event-explain-btn { @apply text-xs text-blue-400 hover:text-blue-300 underline; }
.event-dismiss-btn { @apply text-xs text-slate-400 hover:text-white ml-3; }

@keyframes slide-down {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
```

---

# 56. WebSocket Message Formats

## 56.1 Subscription Messages (Client → Finnhub)

### Subscribe to a symbol
```json
{ "type": "subscribe", "symbol": "AAPL" }
```

### Unsubscribe from a symbol
```json
{ "type": "unsubscribe", "symbol": "AAPL" }
```

Multiple subscriptions are sent as individual messages — one per symbol.

## 56.2 Incoming Messages (Finnhub → Client)

### Trade tick (price update)
```json
{
  "type": "trade",
  "data": [
    {
      "s": "AAPL",
      "p": 189.67,
      "t": 1715589234567,
      "v": 1200,
      "c": null
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `s` | string | Ticker symbol |
| `p` | number | Last trade price |
| `t` | number | Unix timestamp in milliseconds |
| `v` | number | Volume of this trade |
| `c` | array/null | Trade conditions (usually null for stocks) |

One message can contain multiple ticks in the `data` array. StockPilot processes all of them in a single loop.

### Ping (keep-alive from Finnhub)
```json
{ "type": "ping" }
```

StockPilot does not need to respond to pings — they are sent by Finnhub to keep the connection alive.

### Error message
```json
{ "type": "error", "msg": "Invalid token." }
```

On error: log to console, set `webSocketError = true`, show the API fallback banner, switch to mock data.

## 56.3 StockPilot's Internal Price Store Update

When a trade tick arrives for symbol `s` with price `p`:

```js
function handleTick(symbol, price) {
  const prev = priceStore.get(symbol)
  if (!prev) return  // symbol not in our list, ignore

  const change    = price - prev.prevClose
  const changePct = (change / prev.prevClose) * 100
  const direction = price > prev.price ? 'up' : price < prev.price ? 'down' : 'flat'

  priceStore.set(symbol, { ...prev, price, change, changePct, direction, updatedAt: Date.now() })

  // Notify all subscribers (stock cards, trade panel, portfolio rows)
  priceEventBus.emit(symbol, { price, change, changePct, direction })
}
```

## 56.4 Reconnect Logic

```js
let reconnectDelay = 1000  // ms

function scheduleReconnect(onTick) {
  console.log(`[WS] Reconnecting in ${reconnectDelay}ms...`)
  setTimeout(() => {
    createPriceSocket(onTick)
    reconnectDelay = Math.min(reconnectDelay * 2, 30_000)  // exponential backoff, max 30s
  }, reconnectDelay)
}

// Reset delay on successful connection
socket.onopen = () => {
  reconnectDelay = 1000
  // Re-subscribe to all currently visible symbols
  activeSubscriptions.forEach(sym => socket.send(JSON.stringify({ type: 'subscribe', symbol: sym })))
}
```

---

# 57. localStorage Schema

Everything stored in `localStorage` is settings-only. All portfolio and account data lives in Supabase.

## 57.1 All Keys

| Key | Type | Default | Description |
|---|---|---|---|
| `sp_theme` | `'dark'`\|`'light'` | `'dark'` | User's selected colour theme |
| `sp_music_vol` | number (0–1) | `0.4` | Music volume as a decimal |
| `sp_sfx_vol` | number (0–1) | `0.7` | Sound effects volume |
| `sp_muted` | boolean | `false` | Global mute state |
| `sp_lb_hidden` | boolean | `false` | Whether this student has hidden the leaderboard |
| `sp_stock_view` | `'table'`\|`'cards'` | `'table'` | Preferred stock browser view mode |
| `sp_sort_key` | string | `'changePct'` | Last used sort key in stock browser |
| `sp_sort_dir` | `'asc'`\|`'desc'` | `'desc'` | Last used sort direction |
| `sp_sector_filter` | string | `'all'` | Last used sector filter |
| `sp_tutorial_done` | boolean | `false` | Whether the tutorial has been completed (also stored in Supabase, mirrored here for instant check on load) |
| `sp_notif_count` | number | `0` | Unread notification count shown on bell |
| `sp_price_cache` | JSON string | `'{}'` | Last known prices (used for stale display during fallback) |
| `sp_price_cache_ts` | number | `0` | Timestamp when price cache was last written |

## 57.2 localStorage Limits

Browser `localStorage` has a ~5MB limit per origin. StockPilot's usage is minimal:

| Key | Estimated Size |
|---|---|
| All settings (theme, vol, etc.) | < 200 bytes |
| Price cache (37 stocks) | ~4KB |
| **Total** | **< 5KB** |

Well within the limit. No risk of `QuotaExceededError`.

## 57.3 Reading and Writing

All localStorage access is centralised in `src/utils/storage.js`:

```js
export const storage = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key)
      return val !== null ? JSON.parse(val) : fallback
    } catch { return fallback }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)) }
    catch (e) { console.warn('[storage] Failed to write', key, e) }
  },
  remove: (key) => localStorage.removeItem(key),
}
```

Wrapping in try/catch prevents crashes if `localStorage` is unavailable (e.g. private browsing mode in some browsers) or if the stored value is malformed JSON.

---

# 58. Keyboard Shortcuts

## 58.1 Global Shortcuts (Active on All Pages)

| Shortcut | Action |
|---|---|
| `G then D` | Navigate to Dashboard (`/`) |
| `G then S` | Navigate to Stock Browser (`/stocks`) |
| `G then P` | Navigate to Portfolio (`/portfolio`) |
| `G then L` | Navigate to Leaderboard (`/leaderboard`) |
| `G then A` | Navigate to Achievements (`/achievements`) |
| `M` | Toggle mute/unmute audio |
| `Escape` | Close any open modal or dialog |
| `?` | Show keyboard shortcut reference overlay |

## 58.2 Stock Browser Shortcuts

| Shortcut | Action |
|---|---|
| `/` | Focus the search input |
| `Arrow Right` | Next page of stocks |
| `Arrow Left` | Previous page of stocks |
| `T` | Toggle between table and card view |

## 58.3 Stock Detail / Trade Panel Shortcuts

| Shortcut | Action |
|---|---|
| `B` | Switch Trade Panel to Buy tab |
| `S` | Switch Trade Panel to Sell tab |
| `Enter` | Submit trade (when quantity field is focused) |

## 58.4 Portfolio Shortcuts

| Shortcut | Action |
|---|---|
| `Arrow Up / Down` | Navigate between holding rows |
| `Enter` | Expand the selected holding row |

## 58.5 Implementation Notes

- Shortcuts are registered in a global `keyboardManager.js` module using `document.addEventListener('keydown', ...)`
- Shortcuts are disabled when any `input`, `textarea`, or `select` element has focus (to avoid conflicting with typing)
- The `G then X` navigation shortcuts use a two-key chord: pressing `G` starts a 1000ms window during which the second key is expected
- The shortcut overlay (`?`) lists all shortcuts in a modal

---

# 59. Browser Support Matrix

## 59.1 Supported Browsers

| Browser | Version | Support Level | Notes |
|---|---|---|---|
| Chrome | 110+ | Full | Primary development target |
| Firefox | 110+ | Full | |
| Edge | 110+ | Full | Chromium-based |
| Safari | 16+ | Full | WebSocket + ES Modules work correctly |
| Chrome (mobile) | Latest | Partial | Renders but not optimised for mobile |
| Safari (iOS) | Latest | Partial | Renders but not optimised for mobile |

## 59.2 Required Browser Features

| Feature | Chrome 110 | Firefox 110 | Edge 110 | Safari 16 |
|---|---|---|---|---|
| ES Modules (import/export) | ✅ | ✅ | ✅ | ✅ |
| WebSocket API | ✅ | ✅ | ✅ | ✅ |
| CSS Grid + Flexbox | ✅ | ✅ | ✅ | ✅ |
| CSS Custom Properties | ✅ | ✅ | ✅ | ✅ |
| `localStorage` | ✅ | ✅ | ✅ | ✅ |
| `fetch` API | ✅ | ✅ | ✅ | ✅ |
| `crypto.randomUUID()` | ✅ | ✅ | ✅ | ✅ |
| Canvas API (Chart.js) | ✅ | ✅ | ✅ | ✅ |
| Web Audio API | ✅ | ✅ | ✅ | ✅ (with user interaction) |
| CSS `backdrop-filter` | ✅ | ✅ | ✅ | ✅ |
| CSS animations | ✅ | ✅ | ✅ | ✅ |
| `ResizeObserver` | ✅ | ✅ | ✅ | ✅ |

## 59.3 Known Browser-Specific Issues

| Browser | Issue | Workaround |
|---|---|---|
| Safari | Web Audio API requires a user interaction before playing any sound | Audio manager initialises on first click/tap anywhere on the page |
| Safari | `backdrop-filter` can cause performance issues with many blurred elements | Limit backdrop blur usage to navbar and modals only |
| Firefox | `crypto.randomUUID()` available from v92 | Already in the supported range (110+) |
| All | `localStorage` unavailable in private/incognito mode in some configurations | `storage.js` wraps all calls in try/catch with graceful fallback |

## 59.4 Unsupported Environments

| Environment | Status | Reason |
|---|---|---|
| Internet Explorer (any version) | Not supported | No ES Modules, no modern CSS |
| Chrome < 80 | Not supported | No ES Modules |
| Opera Mini | Not supported | No WebSocket |
| Node.js (server-side) | Not applicable | Client-side browser app only |

---

# 60. Daily Development Schedule (4-Week Plan)

Estimated hours are based on a solo developer working 3–5 hours per day after school.

## 60.1 Week 1 — Foundation

**Goal:** Auth working, Supabase connected, single page showing live stock data.

### Day 1 (Monday) — 3h
| Task | Hours |
|---|---|
| Set up Vite project, install Tailwind CSS, configure `vite.config.js` and `tailwind.config.js` | 1h |
| Set up Google Fonts (Space Grotesk + Orbitron), base CSS variables | 0.5h |
| Create folder structure (`pages/`, `components/`, `utils/`, `state/`) | 0.5h |
| Create `supabase.js` — initialise Supabase client with env vars | 0.5h |
| Create Supabase project, run schema SQL for all 10 tables | 0.5h |

### Day 2 (Tuesday) — 4h
| Task | Hours |
|---|---|
| Create all Supabase RLS policies (Section 43) | 1h |
| Set up `auth.users` trigger to auto-create `users` row | 0.5h |
| Build Auth page (`/auth`) — login and sign-up tabs, form validation | 2h |
| Test sign-up and login flow end to end | 0.5h |

### Day 3 (Wednesday) — 4h
| Task | Hours |
|---|---|
| Build client-side router (`router.js`) — parse URL, render correct page, auth guard | 2h |
| Build Navbar component (static, no live data yet) | 1h |
| Build Dashboard page shell (layout, placeholder cards) | 1h |

### Day 4 (Thursday) — 4h
| Task | Hours |
|---|---|
| Deploy Supabase Edge Function for Finnhub proxy (Section 44) | 1.5h |
| Build `finnhub.js` — `fetchQuote()`, `fetchSearch()`, `fetchProfile()` using Edge Function | 1.5h |
| Test API calls: quote, search, profile all working | 1h |

### Day 5 (Friday) — 3h
| Task | Hours |
|---|---|
| Build Stock Browser page — static layout, fetch and render 37 default stocks | 2h |
| Add search debounce (300ms), sector filter, sort controls | 1h |

### Day 6 (Saturday) — 5h
| Task | Hours |
|---|---|
| Build Finnhub WebSocket client (`createPriceSocket()`) | 1h |
| Integrate WebSocket into Stock Browser — prices update live, flash animations work | 2h |
| Build `state/prices.js` — in-memory price store, event bus | 1h |
| Build StockCard and StockRow components with flash CSS | 1h |

### Day 7 (Sunday) — 3h
| Task | Hours |
|---|---|
| Build table/card view toggle | 0.5h |
| Add pagination (20 per page) | 1h |
| Test Stock Browser end to end — live prices, search, filter, sort, pagination | 1.5h |

**Week 1 total: ~26 hours**

---

## 60.2 Week 2 — Core Trading

**Goal:** Full buy/sell flow and portfolio page working end to end.

### Day 8 (Monday) — 4h
| Task | Hours |
|---|---|
| Build Stock Detail page layout | 1h |
| Build PriceChart component — fetch candles from Finnhub, render Chart.js line chart | 2h |
| Add 1D/1W/1M timeframe tabs, chart colour based on direction | 1h |

### Day 9 (Tuesday) — 4h
| Task | Hours |
|---|---|
| Build TradePanel component — Buy/Sell tabs, market order, quantity input, live cost calculation | 3h |
| Connect TradePanel to `state/user.js` for balance check | 1h |

### Day 10 (Wednesday) — 5h
| Task | Hours |
|---|---|
| Implement buy trade execution — Supabase transaction query (Section 52.3) | 2h |
| Implement sell trade execution — Supabase transaction query | 2h |
| Build Toast notification system | 1h |

### Day 11 (Thursday) — 4h
| Task | Hours |
|---|---|
| Build Portfolio page layout and account summary bar | 1h |
| Build PortfolioTable component | 2h |
| Connect portfolio to live WebSocket prices — values update in real time | 1h |

### Day 12 (Friday) — 4h
| Task | Hours |
|---|---|
| Build Portfolio pie chart (Chart.js doughnut) | 1h |
| Build Net worth line chart | 1h |
| Implement `state/portfolio.js` — recalculate on every price tick, update Supabase | 2h |

### Day 13 (Saturday) — 4h
| Task | Hours |
|---|---|
| Build Transaction History page | 1.5h |
| Build open orders panel on Portfolio page | 1h |
| Implement API fallback — detect failure, load mock data, show banner | 1.5h |

### Day 14 (Sunday) — 3h
| Task | Hours |
|---|---|
| Test full trade cycle: buy → portfolio updates → sell → realised gain logged | 2h |
| Fix bugs found in testing | 1h |

**Week 2 total: ~28 hours**

---

## 60.3 Week 3 — Gamification and Competition

**Goal:** XP, achievements, leaderboard, teacher admin, limit orders.

### Day 15 (Monday) — 4h
| Task | Hours |
|---|---|
| Implement XP system: `xpCalculator.js`, award XP on trade, level-up detection | 2h |
| Build LevelUpCard component with animation | 1h |
| Build AchievementToast component | 1h |

### Day 16 (Tuesday) — 4h
| Task | Hours |
|---|---|
| Implement all 23 standard achievement conditions (Section 45) | 3h |
| Test achievement triggers — first trade, gain milestones, diversification | 1h |

### Day 17 (Wednesday) — 4h
| Task | Hours |
|---|---|
| Build Achievements page — all badges with lock/unlock state | 2h |
| Build XP bar component used on Dashboard and Profile | 1h |
| Update Navbar to show XP bar on hover | 1h |

### Day 18 (Thursday) — 4h
| Task | Hours |
|---|---|
| Build Leaderboard page — fetch all session members, RANK() SQL query | 2h |
| Add Supabase real-time subscription on `session_members` — live rank updates | 1.5h |
| Add emoji reactions (insert/read from Supabase) | 0.5h |

### Day 19 (Friday) — 4h
| Task | Hours |
|---|---|
| Build Teacher Admin panel — Sessions, Students, Announcements tabs | 3h |
| Implement teacher portfolio reset query | 1h |

### Day 20 (Saturday) — 5h
| Task | Hours |
|---|---|
| Implement limit orders — TradePanel limit order tab, save to `orders` table | 2h |
| Implement stop-loss orders | 1h |
| Implement order execution on price tick (check + fill logic) | 2h |

### Day 21 (Sunday) — 3h
| Task | Hours |
|---|---|
| Implement market events system — random event scheduler, event banner, Supabase insert | 3h |

**Week 3 total: ~28 hours**

---

## 60.4 Week 4 — Polish and Demo Prep

**Goal:** Audio, tutorial, settings, results screen, deployment, testing.

### Day 22 (Monday) — 4h
| Task | Hours |
|---|---|
| Build audio system — AudioManager module, background music tracks, sound effects | 2h |
| Build Settings page — audio sliders, theme toggle, display name, price alerts | 2h |

### Day 23 (Tuesday) — 4h
| Task | Hours |
|---|---|
| Build Tutorial mode — practice portfolio, 5-step guided overlay | 3h |
| Connect tutorial completion to XP and badge award | 1h |

### Day 24 (Wednesday) — 3h
| Task | Hours |
|---|---|
| Build Profile page | 1.5h |
| Implement page fade transitions | 0.5h |
| Implement dark/light mode toggle (Tailwind `dark:` classes) | 1h |

### Day 25 (Thursday) — 4h
| Task | Hours |
|---|---|
| Build End-of-Simulation Results screen — countdown, podium, confetti, personal summary card | 3h |
| Connect teacher "End Simulation" button to results screen trigger | 1h |

### Day 26 (Friday) — 4h
| Task | Hours |
|---|---|
| Implement 4–6 secret achievement conditions | 2h |
| Build FAQ/Help page | 1h |
| Build keyboard shortcut system + `?` overlay | 1h |

### Day 27 (Saturday) — 5h
| Task | Hours |
|---|---|
| Write unit tests for all calculation functions (Section 34.2) | 3h |
| Run full manual QA checklist (Section 34.3) | 2h |

### Day 28 (Sunday) — 4h
| Task | Hours |
|---|---|
| Fix bugs found during QA | 2h |
| Deploy to Vercel — set env vars, run production build, verify live URL | 1h |
| Write README with setup instructions | 1h |

**Week 4 total: ~28 hours**

**Grand total: ~110 hours over 28 days**

---

*End of StockPilot Product Requirements Document v1.0*
*Total sections: 60 | Author: Brayden Sun | Last updated: 2026-05-13*


