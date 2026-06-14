// learn.js — educational lessons + compound interest simulator + quiz
import Chart from 'chart.js/auto'
import { pc } from '../utils/format.js'

let container    = null
let activeLesson = null

// ── Lessons ────────────────────────────────────────────────────────────────────

const LESSONS = [
  // ── BASICS ──
  {
    slug: 'what-is-a-stock', title: 'What is a Stock?', category: 'Basics', mins: 4,
    body: `A stock (also called a share or equity) represents ownership in a company. When a company wants to raise money to grow, it can sell small pieces of itself to the public through a process called an <strong>Initial Public Offering (IPO)</strong> — those pieces are stocks.<br><br>
If you buy one share of Apple (AAPL), you own a tiny fraction of Apple Inc. You become a <strong>shareholder</strong>. As a shareholder you have certain rights: you can vote on major company decisions and, in some cases, receive a portion of the company's profits called <strong>dividends</strong>.<br><br>
Companies decide how many shares to issue (called <strong>shares outstanding</strong>). Apple, for example, has roughly 15 billion shares outstanding. If you own 1,000 shares, you own about 0.000007% of the entire company — tiny, but real ownership.<br><br>
<strong>Why do stock prices change?</strong><br>
Stock prices are set by supply and demand on a stock exchange. If more people want to buy a stock than sell it, the price rises. If more want to sell than buy, the price falls. This can happen because of earnings reports, new products, economic news, interest rate changes, or even social media sentiment.<br><br>
<strong>Common stock vs. preferred stock</strong><br>
Most regular investors buy <em>common stock</em>. Preferred stock typically pays a fixed dividend and gets paid first if the company goes bankrupt, but preferred stockholders usually don't have voting rights.`,
    takeaway: 'Owning a stock means owning a real (if tiny) piece of a company. The price reflects what the market believes the company is worth at that moment.'
  },

  {
    slug: 'what-is-a-stock-exchange', title: 'What is a Stock Exchange?', category: 'Basics', mins: 4,
    body: `A stock exchange is a marketplace where buyers and sellers meet to trade shares. Think of it like a giant regulated auction house that runs continuously on weekdays.<br><br>
<strong>The two biggest U.S. exchanges</strong><br>
• <strong>New York Stock Exchange (NYSE)</strong> — Founded in 1792, the world's largest stock exchange by market cap. It lists companies like JPMorgan, Walmart, and Exxon. Located on Wall Street in New York City.<br>
• <strong>NASDAQ</strong> — Founded in 1971 as the world's first electronic stock market. Home to most major tech companies: Apple, Microsoft, Amazon, Google, and Meta. Unlike NYSE, NASDAQ has no physical trading floor — it's entirely electronic.<br><br>
<strong>U.S. market hours</strong><br>
Monday to Friday, 9:30 AM to 4:00 PM Eastern Time. Markets are closed on federal holidays. Some brokers allow pre-market (4–9:30 AM) and after-hours (4–8 PM) trading, but these sessions have lower liquidity and wider spreads.<br><br>
<strong>Listing requirements</strong><br>
Not just any company can list on an exchange. NYSE requires companies to have at least $4 million in net worth and 400+ shareholders. These requirements protect investors from extremely unstable companies.<br><br>
<strong>Global exchanges</strong><br>
Major exchanges exist worldwide — London Stock Exchange (LSE), Tokyo Stock Exchange, Hong Kong Stock Exchange, and Shanghai Stock Exchange. Some large companies list on multiple exchanges simultaneously (a "dual listing") to attract international investors.`,
    takeaway: 'Stock exchanges are regulated, transparent marketplaces that make it easy for anyone to buy or sell ownership in public companies.'
  },

  {
    slug: 'how-stocks-make-money', title: 'How Stocks Make Money', category: 'Basics', mins: 4,
    body: `There are two main ways a stock can make you money:<br><br>
<strong>1. Capital Appreciation (Price Growth)</strong><br>
If you buy a stock at PC$50 and it rises to PC$90, you've made PC$40 per share — an 80% gain. This is called a <em>capital gain</em>. You only "realize" the gain when you actually sell. While you hold it, it's an <em>unrealized gain</em> (also called a "paper gain").<br><br>
<strong>2. Dividends</strong><br>
Some companies — especially mature, profitable ones — share a portion of profits with shareholders as dividends, usually paid quarterly. If a stock pays PC$2 per year in dividends and you own 100 shares, you receive PC$200 per year just for holding it.<br><br>
The <strong>dividend yield</strong> tells you the annual dividend as a percentage of the stock price. A stock at PC$50 paying PC$2 per year has a 4% dividend yield.<br><br>
<strong>Not all companies pay dividends</strong><br>
Fast-growing tech companies (Google, Amazon) typically reinvest all profits into growth instead of paying dividends. Established, slower-growing companies (utilities, consumer staples) often pay consistent dividends.<br><br>
<strong>Total Return = Capital Gains + Dividends</strong><br>
A stock that rises 5% in price AND pays a 3% dividend gives you a total return of roughly 8% — even if the price appreciation alone looked modest.`,
    takeaway: 'Stocks make money through rising prices and/or dividends. Total return is what actually matters, not just price movement.'
  },

  {
    slug: 'market-cap', title: 'Market Capitalization', category: 'Basics', mins: 3,
    body: `Market capitalization (market cap) is the total market value of a company's outstanding shares:<br><br>
<strong>Market Cap = Share Price × Shares Outstanding</strong><br><br>
If a company has 100 million shares and each costs PC$50, its market cap is PC$5 billion.<br><br>
<strong>Market cap categories</strong><br>
• <strong>Mega-cap:</strong> Over $200B. The most stable, globally recognized companies (Apple, Microsoft, Amazon).<br>
• <strong>Large-cap:</strong> $10B–$200B. Established industry leaders; generally stable, often pay dividends.<br>
• <strong>Mid-cap:</strong> $2B–$10B. Growing companies with higher potential returns but more risk than large-caps.<br>
• <strong>Small-cap:</strong> $300M–$2B. Smaller companies with high growth potential and higher risk.<br>
• <strong>Micro-cap/Nano-cap:</strong> Under $300M. Very speculative, easy to manipulate, hard to sell quickly.<br><br>
<strong>Why it matters</strong><br>
Large-cap stocks tend to be less volatile and more stable (but slower growing). Small-cap stocks can grow much faster but can also crash harder. Many investors spread money across multiple cap sizes for balance.<br><br>
<strong>Market cap ≠ true company value</strong><br>
Market cap reflects what the <em>market</em> currently thinks a company is worth — not necessarily its intrinsic value. A company with PC$1B in revenue might have a PC$10B market cap if investors believe it will grow dramatically.`,
    takeaway: 'Market cap tells you how "big" a company is in the market\'s eyes. Larger companies are generally safer; smaller companies offer more growth potential with more risk.'
  },

  {
    slug: 'bull-and-bear', title: 'Bull & Bear Markets', category: 'Basics', mins: 3,
    body: `You'll often hear financial news describe markets as "bull" or "bear." These terms describe the overall direction of the market over an extended period.<br><br>
<strong>Bull Market 🐂</strong><br>
A period of rising stock prices — typically defined as a 20%+ rise from a recent low, lasting at least 2 months. Bull markets are associated with economic growth, low unemployment, rising corporate profits, and investor optimism. The longest U.S. bull market ran from 2009 to 2020 — over 11 years.<br><br>
<strong>Bear Market 🐻</strong><br>
A period of declining stock prices — typically a 20%+ drop from a recent high. Bear markets are associated with economic slowdowns, recessions, rising unemployment, and investor fear. They're painful but normal — the average bear market lasts about 9–14 months.<br><br>
<strong>Market corrections</strong><br>
A correction is a drop of 10–19.9% from a recent high. Corrections happen roughly every 1–2 years and are actually healthy — they prevent markets from becoming dangerously overvalued. Unlike bear markets, corrections are often short-lived.<br><br>
<strong>The key insight</strong><br>
Bull markets always follow bear markets — historically without exception. Those who panic-sell during bear markets lock in permanent losses and miss the recovery. Staying invested through turbulence is historically the winning strategy.`,
    takeaway: 'Bull markets rise, bear markets fall. Both are temporary. Long-term investors who stay the course through bear markets always benefit from the eventual recovery.'
  },

  {
    slug: 'risk-vs-reward', title: 'Risk vs. Reward', category: 'Basics', mins: 4,
    body: `In investing, there is a fundamental trade-off: <strong>higher potential returns always come with higher risk</strong>.<br><br>
<strong>The risk spectrum</strong><br>
• <strong>Cash (savings account):</strong> 1–5% return. Near-zero risk of loss but barely keeps up with inflation.<br>
• <strong>Government bonds:</strong> 3–5% return. Very safe — backed by the government. But low returns.<br>
• <strong>Corporate bonds:</strong> 4–7% return. Slightly riskier since companies can go bankrupt.<br>
• <strong>Large-cap stocks:</strong> 7–12% average annual return historically. Significant volatility — can drop 30–50% in a bad year.<br>
• <strong>Small-cap stocks:</strong> 10–15% average return but far more volatile. Individual companies can go to zero.<br>
• <strong>Speculative assets (crypto, meme stocks):</strong> Can rise 1000% or drop 90% in a year. Extreme risk, extreme potential reward.<br><br>
<strong>Understanding volatility</strong><br>
Volatility measures how much a stock's price swings. A volatile stock might gain or lose 5% in a single day. A stable stock might move less than 0.5% in a day. Higher volatility = more uncertainty = more risk of loss AND more chance of big gains.<br><br>
<strong>Risk tolerance</strong><br>
Your personal risk tolerance depends on: How old are you? (younger investors can take more risk and have more time to recover.) What's the money for? (money needed in 2 years should be invested conservatively.) Can you emotionally handle watching your portfolio drop 40%?`,
    takeaway: 'Never invest money you can\'t afford to lose. Match your investment risk to your time horizon and emotional tolerance.'
  },

  {
    slug: 'what-is-a-portfolio', title: 'What is a Portfolio?', category: 'Basics', mins: 3,
    body: `A portfolio is your complete collection of investments — every stock, bond, cash, and other asset you own combined into one view.<br><br>
<strong>Asset allocation</strong><br>
How you divide money among different investment types is called asset allocation. A common rule of thumb: subtract your age from 110 to get your stock percentage. A 20-year-old might hold 90% stocks / 10% bonds; a 60-year-old might hold 50/50.<br><br>
<strong>Diversification within stocks</strong><br>
A well-diversified stock portfolio spreads across multiple <em>sectors</em> — technology, healthcare, finance, consumer goods, energy, utilities, etc. If one sector struggles (say energy during an oil price crash), others may hold steady or rise.<br><br>
<strong>Key portfolio metrics</strong><br>
• <strong>Total value:</strong> Cash + market value of all holdings<br>
• <strong>Cost basis:</strong> How much you originally paid for your holdings<br>
• <strong>Unrealized P&L:</strong> Current value minus cost basis (profit/loss on paper)<br>
• <strong>Realized P&L:</strong> Gains/losses from positions you've already sold<br><br>
<strong>Rebalancing</strong><br>
Over time, some investments grow faster than others, shifting your allocation away from your target. Rebalancing means periodically selling what's grown too large and buying more of what's shrunk to restore your target allocation.`,
    takeaway: 'Your portfolio is the big picture of your financial position. Track total value, diversification, and overall P&L — not just individual stocks.'
  },

  // ── STRATEGY ──
  {
    slug: 'buy-low-sell-high', title: 'Buy Low, Sell High', category: 'Strategy', mins: 4,
    body: `The most famous advice in investing sounds obvious: buy when prices are low, sell when they are high. In practice, this is incredibly difficult — even for Wall Street professionals.<br><br>
<strong>Why it's so hard</strong><br>
When prices are falling, every news headline is scary. It <em>feels</em> like the stock will keep falling forever. Our instinct is to sell and stop the pain. But that's often exactly the wrong time to sell.<br><br>
When prices are rising, everything looks great. Our instinct is to buy more. But buying at the top means you'll eventually be selling to the next buyer at a lower price.<br><br>
<strong>The psychology problem</strong><br>
Behavioral economists have found that losses feel roughly <em>twice as painful</em> as equivalent gains feel good — this is called <strong>loss aversion</strong>. This bias causes investors to hold losing stocks too long (hoping to break even) and sell winning stocks too early (locking in gains before they disappear).<br><br>
<strong>Market timing rarely works</strong><br>
Studies consistently show that even professional fund managers fail to consistently time the market. Missing just the 10 best trading days in any 20-year period dramatically reduces your total returns. The best days often come during bear markets — right when most people have given up.<br><br>
<strong>A better approach</strong><br>
Don't try to time the market. Instead: invest consistently regardless of conditions (dollar-cost averaging), hold for the long term (5+ years), and only sell when your investment thesis has fundamentally changed — not because the price fell.`,
    takeaway: 'Trying to perfectly time the market almost always backfires. Consistent long-term investing beats guessing peaks and valleys every time.'
  },

  {
    slug: 'diversification', title: 'Diversification', category: 'Strategy', mins: 4,
    body: `Diversification means spreading your investments so that no single company, sector, or asset class can devastate your entire portfolio. It's the closest thing to a "free lunch" in investing — you reduce risk without necessarily giving up returns.<br><br>
<strong>The math behind it</strong><br>
If you hold just 1 stock and it drops 80% (which happens even to "safe" stocks), you lose 80% of your money. If you hold 20 equal-weighted stocks and one drops 80%, you lose only 4% of your total portfolio. That's the power of diversification.<br><br>
<strong>Correlation matters</strong><br>
Diversification works best when your investments don't move together. Holding 10 tech stocks isn't truly diversified — they tend to rise and fall together. True diversification means holding assets that respond differently to the same economic conditions: tech, healthcare, utilities, international stocks, bonds, real estate, etc.<br><br>
<strong>How many stocks is enough?</strong><br>
Research suggests owning 15–20 stocks across different sectors eliminates most "stock-specific" risk. Beyond 30 stocks, the marginal benefit diminishes — at that point you'd be better served by a low-cost index fund.<br><br>
<strong>Over-diversification</strong><br>
Yes, you can own too many investments. If you own 200 individual stocks, you'll essentially match the market — but you'll be doing the work that an index fund could do automatically at much lower cost.`,
    takeaway: 'Own 15–20 stocks across different sectors and you\'ve eliminated most avoidable risk. True diversification means owning things that react differently to the same economic event.'
  },

  {
    slug: 'dollar-cost-averaging', title: 'Dollar-Cost Averaging', category: 'Strategy', mins: 3,
    body: `Dollar-cost averaging (DCA) is one of the simplest and most effective investing strategies: invest a fixed amount at regular intervals, regardless of the current stock price.<br><br>
<strong>How it works</strong><br>
Instead of investing PC$1,200 all at once, you invest PC$100 every month for 12 months. In months when the price is high, your PC$100 buys fewer shares. When the price is low, it buys more. Over time this averages out your cost per share.<br><br>
<strong>Example</strong><br>
Month 1: Stock at PC$50 → buy 2.00 shares<br>
Month 2: Stock at PC$40 → buy 2.50 shares<br>
Month 3: Stock at PC$25 → buy 4.00 shares<br>
Month 4: Stock at PC$50 → buy 2.00 shares<br>
After 4 months: 10.5 shares for PC$400 = average cost <strong>PC$38.10</strong> per share<br>
If you'd bought all at month 1: 8 shares at PC$50.00 per share<br><br>
<strong>DCA removes emotional decision-making</strong><br>
You don't have to decide "is this a good time to buy?" You invest on schedule — through bull markets, bear markets, and everything in between. This prevents timing mistakes like investing everything at market peaks.<br><br>
<strong>DCA and 401(k)s</strong><br>
If you contribute to a 401(k) every paycheck, you're already practicing DCA without knowing it. It's one of the reasons consistent 401(k) contributors build wealth over time.`,
    takeaway: 'DCA removes the pressure of picking the "perfect" time to invest. Consistency beats perfect timing almost every time.'
  },

  {
    slug: 'value-vs-growth', title: 'Value vs. Growth Investing', category: 'Strategy', mins: 4,
    body: `Two major investing philosophies are <strong>value investing</strong> and <strong>growth investing</strong>. Understanding both helps you find your own style.<br><br>
<strong>Value Investing 🔍</strong><br>
Value investors hunt for stocks trading <em>below</em> what they believe the company is truly worth — looking for bargains. The theory: markets sometimes misprices companies due to short-term fears, and patient investors profit when the market corrects.<br>
Focus: low P/E ratio, low price-to-book ratio, strong cash flow, reliable dividends. Prefer stable, boring businesses.<br>
Famous practitioners: Warren Buffett, Benjamin Graham, Charlie Munger.<br><br>
<strong>Growth Investing 🚀</strong><br>
Growth investors focus on companies expected to grow much faster than average — even if the stock looks "expensive" by traditional metrics. They're betting on the future, not the present.<br>
Growth stocks often have high P/E ratios (or no profits at all yet), and rarely pay dividends.<br>
Famous practitioners: Cathie Wood, Peter Lynch. Classic examples: Amazon, Netflix, Tesla in their early public years.<br><br>
<strong>Key differences</strong><br>
• Value: "This stock is cheap relative to what it earns" → lower risk, steadier returns<br>
• Growth: "This company will be massive in 5 years" → higher risk, potentially massive returns<br><br>
<strong>Which is better?</strong><br>
Historically, value investing has outperformed growth over very long periods, but growth dominated the 2010s. Many investors blend both styles, adjusting mix based on market conditions.`,
    takeaway: 'Value investing finds bargains; growth investing bets on the future. Neither is universally better — your choice depends on your risk tolerance and time horizon.'
  },

  {
    slug: 'etfs-and-index-funds', title: 'ETFs & Index Funds', category: 'Strategy', mins: 4,
    body: `Index funds and ETFs are often the best investment for most people — and many professionals agree they outperform most active management over the long run.<br><br>
<strong>What is a Market Index?</strong><br>
A market index tracks a list of stocks chosen to represent a market. The S&P 500 tracks the 500 largest U.S. companies. The Dow Jones (DJIA) tracks 30 large companies. NASDAQ Composite tracks all stocks on NASDAQ.<br><br>
<strong>Index Funds</strong><br>
An index fund buys all (or most) stocks in an index. Instead of a manager picking stocks, it simply mirrors the index:<br>
✓ Very low fees (expense ratios of 0.03%–0.20% vs. 1%–2% for active funds)<br>
✓ Instant diversification<br>
✓ Performance that consistently matches the market<br><br>
<strong>ETFs (Exchange-Traded Funds)</strong><br>
ETFs are like index funds but trade on exchanges like individual stocks — you can buy and sell throughout the day. Popular ETFs: <strong>SPY</strong> (S&P 500), <strong>QQQ</strong> (NASDAQ 100), <strong>VTI</strong> (total U.S. market).<br><br>
<strong>The power of low fees</strong><br>
A 1% difference in annual fees sounds tiny — but over 30 years, a 1% higher fee eats roughly 25% of your final portfolio value. This is why Warren Buffett himself recommends most people simply buy low-cost index funds.<br><br>
<strong>The evidence</strong><br>
Over 15+ years, more than 85% of actively managed U.S. large-cap funds underperform their benchmark index after fees.`,
    takeaway: 'Index funds and ETFs give you instant diversification at the lowest possible cost. Over 15+ years, they beat most actively managed funds.'
  },

  // ── TRADING ──
  {
    slug: 'reading-a-chart', title: 'Reading a Price Chart', category: 'Trading', mins: 5,
    body: `A price chart shows how a stock's value has changed over time. The x-axis is time; the y-axis is price. Learning to read charts is the foundation of <em>technical analysis</em>.<br><br>
<strong>Line charts</strong><br>
The simplest type — connects closing prices over time. Good for seeing the overall trend but loses intraday detail.<br><br>
<strong>Candlestick charts</strong><br>
The most popular chart type. Each "candle" represents one time period:<br>
• The <strong>body</strong> shows the range between open and close price<br>
• The <strong>wick/shadow</strong> (thin lines) shows the high and low for the period<br>
• <strong>Green candle:</strong> Close was higher than open (price rose)<br>
• <strong>Red candle:</strong> Close was lower than open (price fell)<br><br>
<strong>Key technical concepts</strong><br>
• <strong>Trend:</strong> Is price generally going up (uptrend), down (downtrend), or sideways (consolidation)?<br>
• <strong>Support level:</strong> A price point where buying has historically pushed the price back up — a "floor."<br>
• <strong>Resistance level:</strong> A price point where selling has historically pushed the price back down — a "ceiling."<br>
• <strong>Volume:</strong> Number of shares traded. High volume on a price move means more conviction.<br><br>
<strong>Moving averages</strong><br>
A moving average smooths out noise by showing the average closing price over N days. The 50-day and 200-day MAs are widely followed. When the 50-day crosses above the 200-day, it's called a "golden cross" — often seen as a bullish signal.`,
    takeaway: 'Charts show history, not the future. Use them to understand trend, support/resistance, and volume — not to predict exact prices.'
  },

  {
    slug: 'what-is-a-limit-order', title: 'Market & Limit Orders', category: 'Trading', mins: 3,
    body: `Orders are instructions you give your broker to buy or sell shares. The two most fundamental types are market orders and limit orders.<br><br>
<strong>Market Order</strong><br>
Executes immediately at the best available price. You get your shares right away — but you don't control the exact price. For highly liquid stocks (Apple, Microsoft), the price is very close to the displayed price. For thin stocks, you might pay significantly more.<br><br>
<strong>Limit Order</strong><br>
Lets you set the exact price at which you're willing to buy or sell.<br>
• <strong>Buy limit:</strong> "Buy AAPL only if the price drops to PC$175 or lower." Your order waits. If AAPL never drops that far, the order expires.<br>
• <strong>Sell limit:</strong> "Sell my AAPL at PC$220 or higher." Your order waits until AAPL hits PC$220.<br><br>
<strong>When to use each</strong><br>
• Market order: When you must execute immediately and a few cents don't matter<br>
• Limit order: When you have a target price, or when trading less liquid stocks where slippage is a risk<br><br>
<strong>Bid-ask spread</strong><br>
Every stock has two prices at any moment: the "bid" (what buyers will pay) and the "ask" (what sellers want). A market buy fills at the ask; a market sell fills at the bid. The difference (the spread) is the cost of immediate execution — tight on liquid stocks, wide on illiquid ones.`,
    takeaway: 'Market orders guarantee execution; limit orders guarantee price. For most trades, limit orders protect you from unexpected price moves.'
  },

  {
    slug: 'what-is-a-stop-loss', title: 'What is a Stop-Loss?', category: 'Trading', mins: 3,
    body: `A stop-loss order automatically sells your shares if the price drops to a level you specify, limiting your downside on any single trade.<br><br>
<strong>How it works</strong><br>
You buy TSLA at PC$200. You set a stop-loss at PC$175 (12.5% below your purchase price). If TSLA drops to PC$175, your shares are sold automatically — limiting your loss to PC$25 per share. Without it, TSLA could drop to PC$80 while you sleep.<br><br>
<strong>Why stop-losses matter psychologically</strong><br>
Without one, you face an emotional decision in real time: "Should I sell now or wait for recovery?" Fear and hope cloud judgment. Stop-losses automate the rational decision you made <em>before</em> emotions kicked in.<br><br>
<strong>Types of stop orders</strong><br>
• <strong>Stop-market:</strong> When triggered, becomes a market order. Guaranteed to execute but not at a specific price.<br>
• <strong>Stop-limit:</strong> When triggered, becomes a limit order. Won't execute if the stock gaps down past your limit price.<br><br>
<strong>Trailing stop-loss</strong><br>
A trailing stop automatically adjusts upward as the stock rises. Set a 10% trailing stop on a stock at PC$100: stop starts at PC$90. Stock rises to PC$120: stop moves to PC$108. This locks in profits as the stock rises while still protecting against reversals.<br><br>
<strong>Setting the right level</strong><br>
Set stop-losses wide enough to avoid normal price noise — typically 8–15% below purchase price. Too tight, and normal daily volatility will trigger an unnecessary sell.`,
    takeaway: 'Stop-losses enforce discipline and protect against catastrophic losses. Set them when you\'re thinking clearly — not while watching the price fall in real time.'
  },

  {
    slug: 'volume-and-liquidity', title: 'Volume & Liquidity', category: 'Trading', mins: 3,
    body: `Volume and liquidity are two overlooked concepts that profoundly affect your ability to trade efficiently and safely.<br><br>
<strong>Volume</strong><br>
Volume is the number of shares traded during a given period. High volume means lots of activity; low volume means few trades.<br><br>
<strong>Why volume matters</strong><br>
• A price move on high volume is more trustworthy — it represents strong conviction<br>
• A price move on low volume might be temporary or easy to reverse<br>
• Volume spikes often signal major news events (earnings, acquisitions, regulatory decisions)<br>
• A stock rising on declining volume is often a warning signal that the move lacks conviction<br><br>
<strong>Liquidity</strong><br>
Liquidity measures how easily you can buy or sell a stock without significantly moving its price. Apple trades hundreds of millions of shares daily — you can buy or sell 1,000 shares instantly without affecting the price.<br><br>
An illiquid stock (trading 5,000 shares per day) is dangerous: your selling alone could push the price down significantly, and you might have to wait days to exit a position.<br><br>
<strong>Bid-ask spread and liquidity</strong><br>
Liquid stocks have very tight spreads (fractions of a cent). Illiquid stocks have wide spreads — a bid of PC$5.00 and ask of PC$5.50 means you immediately lose 10% just by buying and trying to sell.<br><br>
<strong>Practical rule</strong><br>
For most beginners, stick to stocks with average daily volume above 1 million shares.`,
    takeaway: 'High volume confirms price moves. High liquidity means you can enter and exit positions without moving the price against yourself.'
  },

  {
    slug: 'short-selling', title: 'Short Selling', category: 'Trading', mins: 4,
    body: `Most investors buy stocks hoping prices will rise. Short sellers do the opposite — they profit when prices fall.<br><br>
<strong>How it works</strong><br>
1. Borrow shares from your broker (at current price, say PC$100)<br>
2. Immediately sell those borrowed shares<br>
3. Wait for the price to fall (say to PC$70)<br>
4. Buy the shares back at PC$70 and return them to the broker<br>
5. Profit: PC$100 − PC$70 = PC$30 per share (minus borrowing costs)<br><br>
<strong>The risk is theoretically unlimited</strong><br>
If you buy a stock at PC$50, the maximum loss is PC$50 (if it goes to zero). But if you short a stock at PC$50 and it rises to PC$200, you've lost PC$150 per share — 300% of your original position. There is no cap on how high a stock can rise.<br><br>
<strong>Short squeezes</strong><br>
If a heavily shorted stock starts rising rapidly, short sellers rush to buy shares to cut their losses. This buying pressure pushes prices even higher, forcing more short sellers to buy — creating a feedback loop called a <strong>short squeeze</strong>.<br>
The most famous recent example: GameStop (GME) in January 2021, when Reddit retail traders coordinated to squeeze hedge fund short sellers, sending GME from PC$20 to over PC$480 in days.<br><br>
<strong>Short selling serves important market functions</strong><br>
Short sellers help markets by: exposing fraudulent companies (short sellers exposed Enron and Wirecard), providing liquidity, and preventing extreme bubble valuations.`,
    takeaway: 'Short selling lets you profit when stocks fall — but losses are theoretically unlimited. It\'s an advanced strategy not suitable for most beginners.'
  },

  {
    slug: 'candlestick-patterns', title: 'Candlestick Patterns', category: 'Trading', mins: 4,
    body: `Candlestick charts originated in 18th-century Japan to track rice prices. Beyond basic candles, traders look for <em>patterns</em> formed by multiple candles that may signal future price movement.<br><br>
<strong>Single-candle patterns</strong><br>
• <strong>Doji:</strong> Open and close are at nearly the same price — the candle has almost no body, just wicks. Signals indecision between buyers and sellers. Often a reversal warning when it appears at the end of a trend.<br>
• <strong>Hammer:</strong> Small body at the top with a very long lower wick. Appears in downtrends and suggests sellers pushed prices down intraday but buyers recovered strongly — potential bottom signal.<br>
• <strong>Shooting Star:</strong> Small body at the bottom with a long upper wick. Appears in uptrends — buyers pushed prices up but sellers rejected those levels. Potential top signal.<br><br>
<strong>Multi-candle patterns</strong><br>
• <strong>Bullish Engulfing:</strong> A large green candle that completely engulfs the previous red candle. Appears at the bottom of a downtrend — potential reversal signal.<br>
• <strong>Bearish Engulfing:</strong> A large red candle that engulfs the previous green candle. Appears at the top of an uptrend — potential reversal down.<br>
• <strong>Three White Soldiers:</strong> Three consecutive large green candles — strong bullish momentum.<br>
• <strong>Three Black Crows:</strong> Three consecutive large red candles — strong bearish momentum.<br><br>
<strong>Important caveat</strong><br>
Patterns fail often and should never be used as the sole reason to buy or sell. Always confirm with volume and overall trend context.`,
    takeaway: 'Candlestick patterns show the ongoing battle between buyers and sellers. They\'re useful clues — always confirm with volume and context before acting.'
  },

  // ── ADVANCED ──
  {
    slug: 'compound-interest', title: 'What is Compound Interest?', category: 'Advanced', mins: 5,
    body: `Compound interest is often called the <strong>"eighth wonder of the world"</strong> — a phrase attributed to Einstein. It means your returns earn returns on top of themselves, creating exponential growth.<br><br>
<strong>Simple vs. compound interest</strong><br>
• <strong>Simple interest:</strong> Invest PC$1,000 at 8%/year. Each year you earn PC$80. After 30 years: PC$3,400.<br>
• <strong>Compound interest:</strong> Invest PC$1,000 at 8%/year. Year 1: earn PC$80 → total PC$1,080. Year 2: earn 8% of PC$1,080 = PC$86.40 → total PC$1,166.40. After 30 years: over <strong>PC$10,063</strong> — more than 10× your original investment.<br><br>
<strong>The formula</strong><br>
A = P × (1 + r)^t, where P = principal, r = annual rate, t = years<br><br>
<strong>The Rule of 72</strong><br>
Divide 72 by your annual return to estimate how many years until your money doubles. At 8%: 72 ÷ 8 = 9 years. At 6%: 12 years. At 12%: 6 years.<br><br>
<strong>Why time matters so much</strong><br>
• PC$1,000 at 8% for 10 years → PC$2,159<br>
• PC$1,000 at 8% for 20 years → PC$4,661<br>
• PC$1,000 at 8% for 30 years → PC$10,063<br>
• PC$1,000 at 8% for 40 years → PC$21,725<br><br>
Each decade roughly doubles the final amount again. Someone who starts investing at 18 vs. 28 could end up with hundreds of thousands of dollars more at retirement — even investing the same total amount.`,
    takeaway: 'Start investing as early as possible. Time is the most powerful ingredient in compound growth. A decade of delay can cost you more than all your contributions combined.'
  },

  {
    slug: 'pe-ratio', title: 'The P/E Ratio', category: 'Advanced', mins: 4,
    body: `The Price-to-Earnings ratio (P/E ratio) is one of the most widely used tools for valuing stocks. It tells you how much investors are willing to pay for each dollar of a company's earnings.<br><br>
<strong>Formula</strong><br>
P/E Ratio = Stock Price ÷ Earnings Per Share (EPS)<br><br>
If Apple trades at PC$180 and earned PC$6 per share last year, its P/E ratio is 30. Investors are paying 30× Apple's annual earnings.<br><br>
<strong>What P/E signals</strong><br>
• <strong>High P/E (50–100+):</strong> Investors expect strong future growth. They're paying a premium for anticipated earnings expansion.<br>
• <strong>Low P/E (8–12):</strong> Stock may be cheap relative to earnings — possibly a value opportunity, or reflecting real problems.<br>
• <strong>S&P 500 historical average:</strong> Around 15–20 P/E<br><br>
<strong>Comparing P/E ratios</strong><br>
P/E is most useful for comparing companies within the same industry. A tech company at P/E 40 might be perfectly reasonable; a utility at P/E 40 would be very expensive. Never compare P/E across different sectors without context.<br><br>
<strong>Forward vs. Trailing P/E</strong><br>
• <strong>Trailing P/E:</strong> Uses actual earnings from the last 12 months (backward-looking)<br>
• <strong>Forward P/E:</strong> Uses analyst estimates of future earnings (forward-looking; more speculative)<br><br>
<strong>Limitations</strong><br>
P/E can be misleading: no earnings = no P/E (many growth companies). Earnings can be manipulated through accounting choices. Always use P/E alongside other metrics like price-to-book, price-to-sales, and EV/EBITDA.`,
    takeaway: 'P/E tells you what the market pays for each dollar of earnings. Compare P/E ratios within the same industry and combine with other metrics for a complete picture.'
  },

  {
    slug: 'understanding-earnings', title: 'Understanding Earnings Reports', category: 'Advanced', mins: 4,
    body: `Every public company must file a quarterly earnings report — one of the most important events that move stock prices. Understanding how to read them gives you a real edge.<br><br>
<strong>When they happen</strong><br>
U.S. companies report 4 times per year, roughly 3–4 weeks after each quarter ends. The busiest "earnings season" is January–February (Q4) and April–May (Q1). Most reports are released after market close or before market open.<br><br>
<strong>Key metrics to watch</strong><br>
• <strong>Revenue (top line):</strong> Total sales. Is the business actually growing?<br>
• <strong>Earnings Per Share (EPS):</strong> Net profit divided by shares outstanding. The most-watched number.<br>
• <strong>Gross margin:</strong> (Revenue − Cost of Goods) ÷ Revenue. Efficiency of production.<br>
• <strong>Forward guidance:</strong> What management expects next quarter/year. Often more important than current results.<br><br>
<strong>Beat vs. Miss</strong><br>
Before earnings, analysts publish forecasts (the "consensus estimate"):<br>
• <strong>Beat:</strong> Company earned more than expected → stock usually rises<br>
• <strong>Miss:</strong> Earned less than expected → stock usually falls<br>
• <strong>In-line:</strong> Results matched → minimal move<br><br>
<strong>The "sell the news" effect</strong><br>
Sometimes a company reports great earnings and the stock still falls. This happens when results were already "priced in" — everyone expected great numbers, so there's no positive surprise. If expectations were extremely high, even a good report can disappoint.<br><br>
<strong>After-hours volatility</strong><br>
Since most earnings release outside market hours, stocks often gap dramatically up or down when regular trading resumes. This is why holding stocks through earnings can be risky.`,
    takeaway: 'Watch for beats vs. misses AND forward guidance — the future outlook often matters more than what already happened. Past results with weak guidance can still tank a stock.'
  },

  {
    slug: 'inflation-and-returns', title: 'Inflation & Real Returns', category: 'Advanced', mins: 3,
    body: `Inflation is the gradual increase in prices over time. It's the silent force that erodes the purchasing power of money held in cash — and a key reason why investing is necessary, not just optional.<br><br>
<strong>What inflation means for cash</strong><br>
If inflation is 3% per year and you keep PC$10,000 in cash, after 10 years it can only buy what PC$7,374 could buy today. Your balance didn't change, but your purchasing power did.<br><br>
<strong>Nominal vs. real returns</strong><br>
• <strong>Nominal return:</strong> The raw percentage gain on your investment<br>
• <strong>Real return:</strong> Your nominal return minus inflation<br><br>
If your savings account earns 1% but inflation is 3%, your real return is −2%. You're losing purchasing power even though your account balance grows.<br><br>
<strong>The inflation benchmark</strong><br>
To build wealth, you must earn returns that beat inflation. U.S. inflation averages ~2–3% per year historically. To beat it comfortably, you need investments returning 5%+. The S&P 500 has returned ~10% nominally (~7% after inflation) over the long run.<br><br>
<strong>How inflation affects different investments</strong><br>
• Cash and bonds: Hurt badly by inflation (fixed returns lose value)<br>
• Energy and commodities: Often benefit (prices rise with inflation)<br>
• Real estate: Generally a good inflation hedge<br>
• Growth stocks: Can struggle (future earnings worth less in real terms)<br>
• Dividend stocks with pricing power: Generally resilient`,
    takeaway: 'Inflation is the reason you can\'t just leave money in a savings account. Your investments must grow faster than inflation or you\'re actually losing purchasing power.'
  },
]

// ── Quiz questions ─────────────────────────────────────────────────────────────

const QUIZ = [
  { q: 'What does owning a stock represent?', choices: ['A loan you gave to a company', 'Ownership of a small piece of a company', 'A government-backed savings bond', 'A guaranteed return on investment'], correct: 1, exp: 'Owning a stock makes you a shareholder — you own a tiny but real fraction of the company.' },
  { q: 'Which of the following is NOT a way stocks can make money?', choices: ['Capital appreciation (price rising)', 'Dividend payments', 'Guaranteed annual interest', 'Total return combining both'], correct: 2, exp: 'Stocks offer capital gains and dividends, but unlike savings accounts, there is no guaranteed interest. All returns depend on company performance.' },
  { q: 'A "bear market" is conventionally defined as a decline of at least:', choices: ['5% from a recent high', '10% from a recent high', '20% from a recent high', '50% from a recent high'], correct: 2, exp: 'A bear market is a 20%+ drop from a recent peak. A 10% drop is called a "correction."' },
  { q: 'What is market capitalization?', choices: ['A company\'s annual revenue', 'Share price multiplied by shares outstanding', 'The total amount a company has borrowed', 'A company\'s cash on hand'], correct: 1, exp: 'Market cap = Share Price × Shares Outstanding. It measures the total market value of a company.' },
  { q: 'What is Dollar-Cost Averaging (DCA)?', choices: ['Investing a lump sum at the lowest possible price', 'Investing a fixed amount at regular intervals regardless of price', 'Only buying stocks 50% below their all-time high', 'Averaging your buy and sell prices together'], correct: 1, exp: 'DCA means investing a fixed amount (e.g., $100/month) on a regular schedule. This averages your cost over time and removes the pressure of timing the market.' },
  { q: 'The P/E ratio stands for:', choices: ['Price-to-Earnings ratio', 'Profit-to-Equity ratio', 'Performance-to-Expectation ratio', 'Percentage-to-Earnings ratio'], correct: 0, exp: 'P/E = Stock Price ÷ Earnings Per Share. It shows how much investors pay for each dollar of a company\'s earnings.' },
  { q: 'What is the main risk of short selling?', choices: ['You can only lose your initial investment', 'Losses are capped at 50%', 'Losses are theoretically unlimited', 'You pay double taxes on gains'], correct: 2, exp: 'When you short at $50, you profit if it falls — but if it rises to $200, you lose $150 per share. Since stocks can rise indefinitely, short seller losses are unlimited.' },
  { q: 'Which investment type typically has the LOWEST risk and lowest return?', choices: ['Small-cap stocks', 'Cryptocurrency', 'Government bonds and cash', 'Emerging market stocks'], correct: 2, exp: 'Cash and government bonds are the safest but earn the least. Higher-risk assets (stocks, crypto) offer higher potential returns.' },
  { q: 'Compound interest means:', choices: ['Your interest payments are added to principal and then earn interest themselves', 'You receive interest payments twice a year', 'Your interest rate compounds higher each year', 'Interest is calculated only on your original investment'], correct: 0, exp: 'Compound interest means your earnings earn earnings. Over time this creates exponential growth rather than linear growth.' },
  { q: 'A truly diversified portfolio typically includes:', choices: ['All your money in one "safe" stock', 'Many stocks from a single hot sector', 'Stocks spread across multiple sectors and asset types', 'Only government bonds since they never lose value'], correct: 2, exp: 'True diversification means spreading across sectors (tech, healthcare, energy, etc.) and asset types so one bad sector doesn\'t devastate your entire portfolio.' },
  { q: 'What does a limit order guarantee?', choices: ['You will definitely buy the stock', 'The stock will be bought at your specified price or better', 'Your order will execute within 24 hours', 'The stock price will stay at your limit price'], correct: 1, exp: 'A limit order guarantees the PRICE (you won\'t pay more than specified), but not execution — if the stock never reaches your limit, the order won\'t fill.' },
  { q: 'The "Rule of 72" helps you calculate:', choices: ['How many stocks to own for diversification', 'How long until your investment doubles at a given return rate', 'The maximum loss to take before selling', 'Your annual tax burden on investments'], correct: 1, exp: 'Divide 72 by your annual return rate to estimate years to double. At 8%, money doubles every 9 years (72 ÷ 8 = 9).' },
  { q: 'Which type of company is MOST likely to pay regular dividends?', choices: ['Early-stage startup with no profits', 'Fast-growing tech company reinvesting all profits', 'Established utility company with stable earnings', 'A company that just had its IPO'], correct: 2, exp: 'Mature companies with steady, predictable profits (utilities, consumer staples) commonly pay dividends. High-growth companies reinvest profits to fuel expansion.' },
  { q: 'What does "volume" measure in stock trading?', choices: ['The market capitalization of a stock', 'The number of shares traded during a given period', 'The daily price range of a stock', 'How many shareholders a company has'], correct: 1, exp: 'Volume = number of shares traded in a period. High volume on a price move suggests strong conviction; low-volume moves are less reliable.' },
  { q: 'When a company\'s earnings "beat expectations," it means:', choices: ['The stock price automatically rises 10%', 'The company earned more than analysts predicted', 'The company beat its competitors this quarter', 'Revenue was higher than the previous quarter'], correct: 1, exp: 'Beating expectations means actual results exceeded Wall Street analysts\' forecasts. This usually (but not always) causes the stock price to rise.' },
]

// ── App state ──────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Basics', 'Strategy', 'Trading', 'Advanced']

let activeCategory = 'All'
let ciChartInst    = null

let quizActive   = false
let quizIdx      = 0
let quizScore    = 0
let quizDone     = false
let quizSelected = null
let quizAnswered = false

export function mountLearn(el) {
  container      = el
  activeLesson   = null
  activeCategory = 'All'
  quizActive     = false
  quizIdx        = 0
  quizScore      = 0
  quizDone       = false
  quizSelected   = null
  quizAnswered   = false
  renderList()
}

export function unmountLearn() {
  destroyCI()
  container    = null
  activeLesson = null
}

function destroyCI() {
  if (ciChartInst) { ciChartInst.destroy(); ciChartInst = null }
}

// ── List view ─────────────────────────────────────────────────────────────────

function renderList() {
  if (!container) return
  const filtered = activeCategory === 'All' ? LESSONS : LESSONS.filter(l => l.category === activeCategory)

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">

      <div>
        <h1 class="text-2xl font-display font-bold text-text-primary">Learn</h1>
        <p class="text-sm text-text-muted mt-1">Build your financial knowledge — ${LESSONS.length} lessons available</p>
      </div>

      <!-- Category filter -->
      <div class="flex gap-2 flex-wrap">
        ${CATEGORIES.map(c => `
          <button data-cat="${c}" class="cat-btn px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
            ${activeCategory === c ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary'}">
            ${c}
          </button>
        `).join('')}
      </div>

      <!-- Lesson cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${filtered.map(l => `
          <button data-lesson="${l.slug}"
            class="lesson-card text-left bg-surface border border-border rounded-2xl p-5 hover:border-accent-primary/50 hover:bg-surface-elevated transition-all group">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full border
                ${l.category === 'Basics'   ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' :
                  l.category === 'Strategy' ? 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary' :
                  l.category === 'Trading'  ? 'bg-gain/10 border-gain/30 text-gain' :
                  'bg-warning/10 border-warning/30 text-warning'}">
                ${l.category}
              </span>
              <span class="text-[10px] text-text-muted">${l.mins} min</span>
            </div>
            <h3 class="font-semibold text-text-primary mb-1 group-hover:text-accent-primary transition-colors">${l.title}</h3>
            <p class="text-[11px] text-text-muted line-clamp-2">${l.body.replace(/<[^>]+>/g, '').slice(0, 90)}…</p>
          </button>
        `).join('')}

        <!-- Compound Interest Simulator card -->
        ${activeCategory === 'All' || activeCategory === 'Advanced' ? `
          <button data-lesson="__simulator__"
            class="lesson-card text-left bg-surface border border-accent-secondary/30 rounded-2xl p-5 hover:border-accent-secondary/60 hover:bg-surface-elevated transition-all group">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary">Advanced</span>
              <span class="text-[10px] text-text-muted">Interactive</span>
            </div>
            <h3 class="font-semibold text-text-primary mb-1 group-hover:text-accent-secondary transition-colors">Compound Interest Simulator</h3>
            <p class="text-[11px] text-text-muted">Enter any amount, rate, and time horizon — see compounding vs. simple interest visualized side by side.</p>
          </button>
        ` : ''}

        <!-- Quiz card -->
        ${activeCategory === 'All' ? `
          <button data-lesson="__quiz__"
            class="lesson-card text-left bg-surface border border-gain/30 rounded-2xl p-5 hover:border-gain/60 hover:bg-surface-elevated transition-all group">
            <div class="flex items-start justify-between mb-3">
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-gain/10 border-gain/30 text-gain">Quiz</span>
              <span class="text-[10px] text-text-muted">${QUIZ.length} questions</span>
            </div>
            <h3 class="font-semibold text-text-primary mb-1 group-hover:text-gain transition-colors">Test Your Knowledge 🎯</h3>
            <p class="text-[11px] text-text-muted">Multi-choice quiz covering all topics. See how much you've learned!</p>
          </button>
        ` : ''}
      </div>

    </div>
  `

  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => { activeCategory = btn.dataset.cat; renderList() })
  })
  container.querySelectorAll('.lesson-card').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lesson === '__simulator__') { renderSimulator(); return }
      if (btn.dataset.lesson === '__quiz__')      { startQuiz(); return }
      activeLesson = btn.dataset.lesson
      renderLesson()
    })
  })
}

// ── Lesson detail ─────────────────────────────────────────────────────────────

function renderLesson() {
  if (!container) return
  const l    = LESSONS.find(x => x.slug === activeLesson)
  if (!l) { renderList(); return }
  const idx  = LESSONS.indexOf(l)
  const prev = LESSONS[idx - 1]
  const next = LESSONS[idx + 1]

  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">

      <button id="back-to-learn" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Learn
      </button>

      <div class="flex items-center justify-between">
        <span class="text-[10px] font-medium px-2.5 py-1 rounded-full border
          ${l.category === 'Basics'   ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' :
            l.category === 'Strategy' ? 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary' :
            l.category === 'Trading'  ? 'bg-gain/10 border-gain/30 text-gain' :
            'bg-warning/10 border-warning/30 text-warning'}">
          ${l.category}
        </span>
        <span class="text-xs text-text-muted">${l.mins} min read</span>
      </div>

      <h1 class="text-2xl font-display font-bold text-text-primary">${l.title}</h1>

      <div class="text-sm text-text-secondary leading-relaxed space-y-4">
        ${l.body.split('<br><br>').map(p => `<p>${p}</p>`).join('')}
      </div>

      <!-- Key takeaway -->
      <div class="rounded-xl border border-accent-primary/30 bg-accent-primary/5 px-5 py-4">
        <div class="text-[10px] text-accent-primary font-bold uppercase tracking-wide mb-1">Key Takeaway</div>
        <p class="text-sm text-text-primary leading-relaxed">${l.takeaway}</p>
      </div>

      <!-- Quiz CTA -->
      <div class="rounded-xl border border-gain/20 bg-gain/5 px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <div class="text-xs font-semibold text-gain mb-0.5">Ready to test your knowledge?</div>
          <div class="text-[11px] text-text-muted">Take the full quiz covering all ${QUIZ.length} topics.</div>
        </div>
        <button id="goto-quiz"
          class="shrink-0 px-4 py-2 rounded-lg bg-gain/15 border border-gain/30 text-gain text-xs font-bold hover:bg-gain/25 transition-colors">
          Take Quiz
        </button>
      </div>

      <!-- Prev / Next -->
      <div class="flex justify-between pt-2">
        ${prev ? `<button data-nav="${prev.slug}" class="nav-btn text-sm text-text-muted hover:text-text-primary transition-colors">← ${prev.title}</button>` : '<div></div>'}
        ${next ? `<button data-nav="${next.slug}" class="nav-btn text-sm text-text-muted hover:text-text-primary transition-colors">${next.title} →</button>` : '<div></div>'}
      </div>

    </div>
  `

  container.querySelector('#back-to-learn')?.addEventListener('click', () => { activeLesson = null; renderList() })
  container.querySelector('#goto-quiz')?.addEventListener('click', () => startQuiz())
  container.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => { activeLesson = btn.dataset.nav; renderLesson() })
  })
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function startQuiz() {
  quizActive   = true
  quizIdx      = 0
  quizScore    = 0
  quizDone     = false
  quizSelected = null
  quizAnswered = false
  renderQuiz()
}

function renderQuiz() {
  if (!container) return

  if (quizDone) {
    const pct   = Math.round((quizScore / QUIZ.length) * 100)
    const grade = pct >= 90 ? 'Outstanding!' : pct >= 70 ? 'Well Done!' : pct >= 50 ? 'Keep Studying!' : 'Keep At It!'

    container.innerHTML = `
      <div class="max-w-xl mx-auto px-4 py-6 space-y-6">
        <button id="back-to-learn" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
          ← Back to Learn
        </button>
        <div class="bg-surface border border-border rounded-2xl p-8 text-center space-y-4">
          <div class="text-5xl mb-2">${pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '📖' : '💪'}</div>
          <h1 class="text-2xl font-display font-bold text-text-primary">${grade}</h1>
          <p class="text-text-muted text-sm">You scored</p>
          <div class="text-5xl font-bold font-mono ${pct >= 70 ? 'text-gain' : pct >= 50 ? 'text-warning' : 'text-loss'}">${pct}%</div>
          <p class="text-sm text-text-muted">${quizScore} of ${QUIZ.length} correct</p>
          <div class="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden">
            <div class="h-full rounded-full ${pct >= 70 ? 'bg-gain' : pct >= 50 ? 'bg-warning' : 'bg-loss'}"
              style="width:${pct}%"></div>
          </div>
          <div class="flex justify-center gap-3 pt-2">
            <button id="quiz-retry"
              class="px-5 py-2.5 rounded-xl bg-accent-primary text-bg font-bold text-sm hover:bg-accent-primary/90 transition-colors">
              Retry Quiz
            </button>
            <button id="quiz-back"
              class="px-5 py-2.5 rounded-xl bg-surface-elevated border border-border text-text-secondary text-sm hover:text-text-primary transition-colors">
              Back to Lessons
            </button>
          </div>
        </div>

        ${pct < 70 ? `
          <div class="bg-surface border border-accent-primary/20 rounded-2xl p-5">
            <div class="text-xs font-bold text-accent-primary uppercase tracking-wide mb-3">Suggested review</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${LESSONS.slice(0, 8).map(l => `
                <button data-lesson="${l.slug}" class="review-btn text-left text-xs px-3 py-2 bg-surface-elevated rounded-lg text-text-muted hover:text-text-primary transition-colors">
                  ${l.title}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `
    container.querySelector('#back-to-learn')?.addEventListener('click', () => { quizActive = false; renderList() })
    container.querySelector('#quiz-retry')?.addEventListener('click', () => startQuiz())
    container.querySelector('#quiz-back')?.addEventListener('click', () => { quizActive = false; renderList() })
    container.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', () => { quizActive = false; activeLesson = btn.dataset.lesson; renderLesson() })
    })
    return
  }

  const q           = QUIZ[quizIdx]
  const progressPct = (quizIdx / QUIZ.length) * 100

  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-6 space-y-5">
      <button id="back-to-learn" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Learn
      </button>

      <!-- Progress -->
      <div>
        <div class="flex justify-between text-xs text-text-muted mb-2">
          <span>Question ${quizIdx + 1} of ${QUIZ.length}</span>
          <span class="${quizScore > 0 ? 'text-gain' : ''}">${quizScore} correct</span>
        </div>
        <div class="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
          <div class="h-full bg-accent-primary rounded-full transition-all duration-500" style="width:${progressPct}%"></div>
        </div>
      </div>

      <!-- Question card -->
      <div class="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <h2 class="text-base font-semibold text-text-primary leading-relaxed">${q.q}</h2>

        <!-- Choices -->
        <div class="space-y-2">
          ${q.choices.map((c, i) => {
            let cls = 'border-border text-text-secondary hover:border-accent-primary hover:bg-surface-elevated cursor-pointer'
            if (quizAnswered) {
              if (i === q.correct)                            cls = 'border-gain bg-gain/10 text-gain cursor-default'
              else if (i === quizSelected && i !== q.correct) cls = 'border-loss bg-loss/10 text-loss cursor-default'
              else                                            cls = 'border-border/40 text-text-muted opacity-50 cursor-default'
            }
            const circle = quizAnswered && i === q.correct
              ? 'border-gain bg-gain/20 text-gain'
              : quizAnswered && i === quizSelected && i !== q.correct
              ? 'border-loss bg-loss/20 text-loss'
              : 'border-current bg-surface text-text-muted'
            const label = quizAnswered && i === q.correct ? '✓' : quizAnswered && i === quizSelected && i !== q.correct ? '✗' : String.fromCharCode(65 + i)
            return `
              <button data-choice="${i}" ${quizAnswered ? 'disabled' : ''}
                class="quiz-choice w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${cls}">
                <span class="flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-bold ${circle}">
                  ${label}
                </span>
                <span class="text-sm">${c}</span>
              </button>
            `
          }).join('')}
        </div>

        <!-- Explanation -->
        ${quizAnswered ? `
          <div class="rounded-xl border px-4 py-3 ${quizSelected === q.correct ? 'border-gain/30 bg-gain/5' : 'border-loss/30 bg-loss/5'}">
            <div class="text-xs font-bold mb-1 ${quizSelected === q.correct ? 'text-gain' : 'text-loss'}">
              ${quizSelected === q.correct ? '✓ Correct!' : '✗ Not quite —'}
            </div>
            <p class="text-sm text-text-secondary leading-relaxed">${q.exp}</p>
          </div>
          <button id="quiz-next"
            class="w-full py-3 rounded-xl bg-accent-primary text-bg font-bold text-sm hover:bg-accent-primary/90 transition-colors">
            ${quizIdx < QUIZ.length - 1 ? 'Next Question →' : 'See Results 🎯'}
          </button>
        ` : ''}
      </div>
    </div>
  `

  container.querySelector('#back-to-learn')?.addEventListener('click', () => { quizActive = false; renderList() })

  container.querySelectorAll('.quiz-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (quizAnswered) return
      quizSelected = Number(btn.dataset.choice)
      quizAnswered = true
      if (quizSelected === QUIZ[quizIdx].correct) quizScore++
      renderQuiz()
    })
  })

  container.querySelector('#quiz-next')?.addEventListener('click', () => {
    if (quizIdx < QUIZ.length - 1) {
      quizIdx++
      quizSelected = null
      quizAnswered = false
      renderQuiz()
    } else {
      quizDone = true
      renderQuiz()
    }
  })
}

// ── Compound Interest Simulator ───────────────────────────────────────────────

function renderSimulator() {
  if (!container) return
  destroyCI()

  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">

      <button id="back-to-learn" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Learn
      </button>

      <div>
        <h1 class="text-2xl font-display font-bold text-text-primary">Compound Interest Simulator</h1>
        <p class="text-sm text-text-muted mt-1">See how your money grows — and why starting early matters so much.</p>
      </div>

      <!-- Inputs -->
      <div class="bg-surface border border-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Starting Amount (PC$)</label>
          <input id="ci-principal" type="number" value="1000" min="1" max="1000000"
            class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
        </div>
        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Annual Return (%)</label>
          <input id="ci-rate" type="number" value="8" min="0.1" max="100" step="0.1"
            class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
        </div>
        <div>
          <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Years</label>
          <input id="ci-years" type="number" value="30" min="1" max="100"
            class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors" />
        </div>
      </div>

      <!-- Results -->
      <div class="grid grid-cols-3 gap-4" id="ci-results">
        ${ciResultCards(1000, 8, 30)}
      </div>

      <!-- Chart -->
      <div class="bg-surface border border-border rounded-2xl p-5">
        <h2 class="font-semibold text-text-primary mb-4">Growth Over Time</h2>
        <div class="relative h-64">
          <canvas id="ci-chart"></canvas>
        </div>
        <div class="flex items-center gap-6 mt-3 text-xs text-text-muted">
          <div class="flex items-center gap-1.5"><span class="w-3 h-0.5 bg-accent-primary inline-block"></span> Compound</div>
          <div class="flex items-center gap-1.5"><span class="w-3 h-0.5 bg-accent-secondary inline-block rounded"></span> Simple</div>
        </div>
      </div>

      <!-- Real-world note -->
      <div class="rounded-xl border border-gain/20 bg-gain/5 px-5 py-4">
        <div class="text-xs font-bold text-gain uppercase tracking-wide mb-1">Real-World Example</div>
        <p class="text-sm text-text-secondary leading-relaxed">
          If you invested PC$100 per month at 8% annual return from age 15 to 65, you would have over <strong class="text-text-primary">PC$500,000</strong> — even though you only contributed PC$60,000 yourself. The other PC$440,000 comes entirely from compounding.
        </p>
      </div>

    </div>
  `

  container.querySelector('#back-to-learn')?.addEventListener('click', () => renderList())

  setTimeout(() => buildCIChart(1000, 8, 30), 50)

  const inputs = ['ci-principal', 'ci-rate', 'ci-years']
  inputs.forEach(id => {
    container.querySelector(`#${id}`)?.addEventListener('input', updateSimulator)
  })
}

function updateSimulator() {
  if (!container) return
  const principal = Math.max(1, parseFloat(container.querySelector('#ci-principal')?.value) || 1000)
  const rate      = Math.max(0.1, parseFloat(container.querySelector('#ci-rate')?.value) || 8)
  const years     = Math.max(1, Math.min(100, parseInt(container.querySelector('#ci-years')?.value) || 30))

  const resultsEl = container.querySelector('#ci-results')
  if (resultsEl) resultsEl.innerHTML = ciResultCards(principal, rate, years)

  destroyCI()
  setTimeout(() => buildCIChart(principal, rate, years), 0)
}

function ciResultCards(principal, rate, years) {
  const r        = rate / 100
  const compound = principal * Math.pow(1 + r, years)
  const simple   = principal * (1 + r * years)
  const diff     = compound - simple

  return `
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Compound Final</div>
      <div class="text-xl font-bold font-mono text-accent-primary">${pc(compound)}</div>
    </div>
    <div class="bg-surface border border-border rounded-2xl p-4">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Simple Final</div>
      <div class="text-xl font-bold font-mono text-text-primary">${pc(simple)}</div>
    </div>
    <div class="bg-surface border border-gain/30 rounded-2xl p-4">
      <div class="text-xs text-text-muted uppercase tracking-wide mb-1">Compounding Bonus</div>
      <div class="text-xl font-bold font-mono text-gain">+${pc(diff)}</div>
    </div>
  `
}

function buildCIChart(principal, rate, years) {
  const canvas = container?.querySelector('#ci-chart')
  if (!canvas) return

  const r        = rate / 100
  const labels   = Array.from({ length: years + 1 }, (_, i) => `Yr ${i}`)
  const compound = labels.map((_, i) => Math.round(principal * Math.pow(1 + r, i) * 100) / 100)
  const simple   = labels.map((_, i) => Math.round(principal * (1 + r * i) * 100) / 100)

  ciChartInst = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Compound Interest', data: compound, borderColor: '#00D4AA', borderWidth: 2.5, pointRadius: 0, fill: true, backgroundColor: '#00D4AA18', tension: 0.3 },
        { label: 'Simple Interest',   data: simple,   borderColor: '#6366F1', borderWidth: 2,   borderDash: [5, 4], pointRadius: 0, fill: false, tension: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 400 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${pc(ctx.raw)}` },
          backgroundColor: '#111827', borderColor: '#1F2937', borderWidth: 1,
          titleColor: '#9CA3AF', bodyColor: '#F9FAFB',
        },
      },
      scales: {
        x: { ticks: { color: '#6B7280', maxTicksLimit: 8, maxRotation: 0 }, grid: { color: '#1F293744' } },
        y: { ticks: { color: '#6B7280', callback: v => pc(v) }, grid: { color: '#1F293744' }, position: 'right' },
      },
    },
  })
}
