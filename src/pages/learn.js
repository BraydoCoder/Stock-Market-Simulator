// learn.js — educational lessons + compound interest simulator (PRD §75)
import Chart from 'chart.js/auto'
import { pc } from '../utils/format.js'

let container    = null
let activeLesson = null

const LESSONS = [
  { slug: 'what-is-a-stock',       title: 'What is a Stock?',         category: 'Basics',   mins: 2,
    body: `A stock (also called a share or equity) represents ownership in a company. When a company wants to raise money, it can sell small pieces of itself to the public — those pieces are stocks.<br><br>If you buy one share of Apple, you own a tiny fraction of Apple Inc. You become a <strong>shareholder</strong>. If Apple grows and becomes more valuable, your share is worth more. If Apple struggles, your share is worth less.<br><br>Companies list their shares on a <strong>stock exchange</strong> (like the New York Stock Exchange or NASDAQ) so that anyone can buy and sell them easily.`,
    takeaway: 'Owning a share means owning a tiny piece of a real company. When the company does well, so do you.' },

  { slug: 'how-stocks-make-money', title: 'How Stocks Make Money',    category: 'Basics',   mins: 3,
    body: `There are two main ways a stock makes money for you:<br><br><strong>1. Price appreciation</strong> — If you buy a stock at PC$50 and it rises to PC$80, you made PC$30 per share. This is called a <em>capital gain</em>.<br><br><strong>2. Dividends</strong> — Some companies pay shareholders a small cash reward regularly (quarterly or annually) just for owning the stock. Not all companies pay dividends — fast-growing tech companies usually reinvest profits instead.`,
    takeaway: 'Stocks can earn you money through rising prices and/or regular dividend payments.' },

  { slug: 'risk-vs-reward',        title: 'Risk vs. Reward',          category: 'Basics',   mins: 2,
    body: `In investing, there is a fundamental trade-off: <strong>higher potential returns always come with higher risk</strong>.<br><br>A savings account at a bank might earn 2% per year — very safe, very predictable, but slow growth. A tech startup stock might go up 200% or lose 80% — high reward potential, high risk.<br><br>The stock market as a whole has historically returned about <strong>7–10% per year on average</strong> — but individual years can swing wildly from +30% to -40%.`,
    takeaway: 'Never risk money you cannot afford to lose. Higher returns always come with a higher chance of loss.' },

  { slug: 'what-is-a-portfolio',   title: 'What is a Portfolio?',     category: 'Basics',   mins: 2,
    body: `A portfolio is your complete collection of investments — all your stocks, bonds, cash, and other assets together.<br><br>A <strong>diversified portfolio</strong> spreads money across many different stocks and sectors. If one investment drops, the others may hold steady or rise, cushioning the blow.<br><br>A <strong>concentrated portfolio</strong> puts most of the money in just one or two stocks — higher risk, but potentially higher reward if those stocks do well.`,
    takeaway: "Don't put all your eggs in one basket. Diversification is one of the most powerful risk-reduction tools available." },

  { slug: 'buy-low-sell-high',     title: 'Buy Low, Sell High',       category: 'Strategy', mins: 3,
    body: `The most famous advice in investing sounds obvious: buy when prices are low, sell when they are high. In practice, this is incredibly hard.<br><br>When prices are falling, it <em>feels</em> scary to buy. When prices are rising, it <em>feels</em> wrong to sell. Human psychology works against you.<br><br>Many investors try to <strong>time the market</strong> — predict when prices will bottom or peak. Studies consistently show this rarely works even for professionals. A better strategy for most people is to invest consistently over time and hold through the ups and downs.`,
    takeaway: 'Trying to perfectly time the market usually backfires. Consistent investing over time beats guessing.' },

  { slug: 'diversification',       title: 'Diversification',          category: 'Strategy', mins: 3,
    body: `Diversification means spreading your investments so that no single company, sector, or asset can ruin your whole portfolio.<br><br><strong>The math behind it:</strong> If you hold just one stock and it drops 50%, you lose half your money. If you hold 10 equal positions and one drops 50%, you only lose 5% overall.<br><br>A well-diversified portfolio might include stocks from different sectors (tech, healthcare, energy, finance), different countries, and even different asset types (stocks + bonds + cash).<br><br>In StockPilot, holding 5+ stocks from different sectors earns you the "Spread the Risk" badge.`,
    takeaway: "10 stocks across 5 sectors is safer than 1 stock — even if the one stock looks amazing right now." },

  { slug: 'compound-interest',     title: 'What is Compound Interest?', category: 'Advanced', mins: 5,
    body: `Compound interest is often called the <strong>"eighth wonder of the world"</strong> (attributed to Einstein). It's the idea that your returns earn returns.<br><br><strong>Simple interest:</strong> You invest PC$1,000 at 8%. Each year you earn PC$80. After 30 years: PC$3,400.<br><br><strong>Compound interest:</strong> You invest PC$1,000 at 8%. In year one you earn PC$80. In year two you earn 8% on PC$1,080, so PC$86.40. In year three, 8% on PC$1,166.40. After 30 years: over <strong>PC$10,000</strong> — ten times your original investment.<br><br>The earlier you start, the more powerful compounding becomes. Someone who invests PC$100/month from age 15 to 65 at 8% ends up with over PC$500,000. Someone who waits until age 35 and invests the same amount ends up with roughly PC$150,000.`,
    takeaway: 'Start investing as early as possible. Time is the most powerful ingredient in compound interest.' },

  { slug: 'reading-a-chart',       title: 'Reading a Price Chart',    category: 'Trading',  mins: 4,
    body: `A price chart shows how a stock's value has changed over time. The <strong>x-axis</strong> is time (hours, days, months) and the <strong>y-axis</strong> is price.<br><br>Key things to look for:<br><br><strong>Trend:</strong> Is the line generally going up (uptrend), down (downtrend), or sideways (consolidation)?<br><br><strong>Volatility:</strong> Are the swings large (high risk) or small (more stable)?<br><br><strong>Support and resistance:</strong> Prices often bounce off the same levels repeatedly. A price that keeps bouncing up from is called a support level; one that keeps failing to break through is resistance.<br><br>In StockPilot, each stock has a 1D, 1W, and 1M chart. Try comparing a tech stock vs. a utility stock to see different volatility levels.`,
    takeaway: 'Charts show history, not the future. Use them to understand a stock\'s behavior, not to predict exactly what happens next.' },

  { slug: 'what-is-a-limit-order', title: 'What is a Limit Order?',   category: 'Trading',  mins: 2,
    body: `A <strong>limit order</strong> lets you set a specific price at which you want to buy or sell — instead of buying at whatever the market price currently is.<br><br><strong>Buy limit:</strong> "I want to buy AAPL, but only if the price drops to PC$170." Your order waits until the price reaches PC$170, then executes automatically.<br><br><strong>Sell limit:</strong> "I want to sell my AAPL if it reaches PC$220." Your order sits open until AAPL hits PC$220.<br><br>The trade-off: you get your price, but there is no guarantee the price will ever reach your target. Your order may never execute.`,
    takeaway: 'Limit orders give you price control, but no guarantee of execution.' },

  { slug: 'what-is-a-stop-loss',   title: 'What is a Stop-Loss?',     category: 'Trading',  mins: 2,
    body: `A <strong>stop-loss order</strong> automatically sells a stock if it falls to a price you set — protecting you from larger losses.<br><br>Example: You buy TSLA at PC$200. You set a stop-loss at PC$180. If TSLA drops to PC$180, it sells automatically, limiting your loss to PC$20 per share (10%).<br><br>Without a stop-loss, you might hold a falling stock hoping it recovers — and end up down 50% instead of 10%. Stop-losses enforce discipline and remove the emotional decision in the moment.`,
    takeaway: 'Stop-losses are automatic protection. Set them when you buy so you never have to make a panic decision.' },
]

const CATEGORIES = ['All', 'Basics', 'Strategy', 'Trading', 'Advanced']

let activeCategory = 'All'
let ciChartInst    = null

export function mountLearn(el) {
  container = el
  activeLesson = null
  activeCategory = 'All'
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
        <p class="text-sm text-text-muted mt-1">Build your financial knowledge</p>
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
                ${l.category === 'Basics' ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' :
                  l.category === 'Strategy' ? 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary' :
                  l.category === 'Trading' ? 'bg-gain/10 border-gain/30 text-gain' :
                  'bg-warning/10 border-warning/30 text-warning'}">
                ${l.category}
              </span>
              <span class="text-[10px] text-text-muted">${l.mins} min</span>
            </div>
            <h3 class="font-semibold text-text-primary mb-1 group-hover:text-accent-primary transition-colors">${l.title}</h3>
            <p class="text-[11px] text-text-muted line-clamp-2">${l.body.replace(/<[^>]+>/g, '').slice(0, 80)}…</p>
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
      </div>

    </div>
  `

  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => { activeCategory = btn.dataset.cat; renderList() })
  })
  container.querySelectorAll('.lesson-card').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.lesson === '__simulator__') { renderSimulator(); return }
      activeLesson = btn.dataset.lesson
      renderLesson()
    })
  })
}

// ── Lesson detail ─────────────────────────────────────────────────────────────

function renderLesson() {
  if (!container) return
  const l   = LESSONS.find(x => x.slug === activeLesson)
  if (!l) { renderList(); return }
  const idx = LESSONS.indexOf(l)
  const prev = LESSONS[idx - 1]
  const next = LESSONS[idx + 1]

  container.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">

      <button id="back-to-learn" class="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors">
        ← Back to Learn
      </button>

      <div class="flex items-center justify-between">
        <span class="text-[10px] font-medium px-2.5 py-1 rounded-full border
          ${l.category === 'Basics' ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary' :
            l.category === 'Strategy' ? 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary' :
            l.category === 'Trading' ? 'bg-gain/10 border-gain/30 text-gain' :
            'bg-warning/10 border-warning/30 text-warning'}">
          ${l.category}
        </span>
        <span class="text-xs text-text-muted">${l.mins} min read</span>
      </div>

      <h1 class="text-2xl font-display font-bold text-text-primary">${l.title}</h1>

      <div class="prose-custom text-sm text-text-secondary leading-relaxed space-y-3">
        ${l.body.split('<br><br>').map(p => `<p>${p}</p>`).join('')}
      </div>

      <!-- Key takeaway box -->
      <div class="rounded-xl border border-accent-primary/30 bg-accent-primary/5 px-5 py-4">
        <div class="text-[10px] text-accent-primary font-bold uppercase tracking-wide mb-1">Key Takeaway</div>
        <p class="text-sm text-text-primary leading-relaxed">${l.takeaway}</p>
      </div>

      <!-- Prev / Next -->
      <div class="flex justify-between pt-2">
        ${prev ? `<button data-nav="${prev.slug}" class="nav-btn text-sm text-text-muted hover:text-text-primary transition-colors">← ${prev.title}</button>` : '<div></div>'}
        ${next ? `<button data-nav="${next.slug}" class="nav-btn text-sm text-text-muted hover:text-text-primary transition-colors">${next.title} →</button>` : '<div></div>'}
      </div>

    </div>
  `

  container.querySelector('#back-to-learn')?.addEventListener('click', () => { activeLesson = null; renderList() })
  container.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => { activeLesson = btn.dataset.nav; renderLesson() })
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
  const r  = rate / 100
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

  const r = rate / 100
  const labels   = Array.from({ length: years + 1 }, (_, i) => `Yr ${i}`)
  const compound = labels.map((_, i) => Math.round(principal * Math.pow(1 + r, i) * 100) / 100)
  const simple   = labels.map((_, i) => Math.round(principal * (1 + r * i) * 100) / 100)

  ciChartInst = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Compound Interest',
          data: compound,
          borderColor: '#00D4AA',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: true,
          backgroundColor: '#00D4AA18',
          tension: 0.3,
        },
        {
          label: 'Simple Interest',
          data: simple,
          borderColor: '#6366F1',
          borderWidth: 2,
          borderDash: [5, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
        x: {
          ticks: { color: '#6B7280', maxTicksLimit: 8, maxRotation: 0 },
          grid: { color: '#1F293744' },
        },
        y: {
          ticks: { color: '#6B7280', callback: v => pc(v) },
          grid: { color: '#1F293744' },
          position: 'right',
        },
      },
    },
  })
}
