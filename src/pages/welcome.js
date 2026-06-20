// welcome.js — Landing page for unauthenticated visitors

let container = null

export function mountWelcome(el, onStart, onGuest) {
  container = el
  render(onStart, onGuest)
}

export function unmountWelcome() {
  container = null
}

function render(onStart, onGuest) {
  if (!container) return

  container.innerHTML = `
    <div class="fixed inset-0 z-[200] bg-bg overflow-y-auto">
      <div class="min-h-full flex flex-col">

        <!-- Hero -->
        <div class="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">

          <!-- Logo mark -->
          <div class="mb-4">
            <span class="text-5xl sm:text-6xl font-display font-bold text-accent-primary tracking-widest">STOCKPILOT</span>
          </div>
          <p class="text-base text-accent-secondary font-medium tracking-widest uppercase mb-8">The gamified stock market simulator</p>

          <!-- Headline -->
          <h1 class="text-3xl sm:text-5xl font-display font-bold text-text-primary mb-5 leading-tight max-w-2xl">
            Take the controls.<br/>Trade without risk.
          </h1>
          <p class="text-base sm:text-lg text-text-muted max-w-lg mb-12 leading-relaxed">
            Build a virtual portfolio, compete with your class on the leaderboard,
            and learn real investing skills — all with PC$50,000 of play money.
          </p>

          <!-- CTA buttons -->
          <button id="welcome-start"
            class="px-12 py-4 rounded-2xl bg-accent-primary text-bg text-xl font-bold
                   hover:bg-accent-primary/90 transition-all duration-150
                   hover:scale-105 active:scale-95
                   shadow-2xl shadow-accent-primary/30">
            Get Started
          </button>

          <p class="mt-4 text-xs text-text-muted">Already have an account? Click Get Started to log in.</p>

          <button id="welcome-guest"
            class="mt-3 text-sm text-text-muted hover:text-text-primary transition-colors underline underline-offset-4">
            Continue as Guest
          </button>
          <p class="text-[11px] text-text-muted/60 mt-1">No account needed · progress saved in your browser</p>

          <!-- Feature cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-20 max-w-2xl w-full text-left">
            ${card('SIM', 'Live Market Simulation', 'Prices move in real time. Buy low, sell high, and watch your portfolio grow.')}
            ${card('XP', 'Compete & Earn XP', 'Climb the class leaderboard, unlock achievements, and level up your rank.')}
            ${card('EDU', 'Learn While You Play', 'Guided lessons on diversification, risk management, and compound interest.')}
          </div>

        </div>

        <!-- Footer -->
        <footer class="py-6 text-center text-xs text-text-muted border-t border-border">
          StockPilot &mdash; For educational use only. Not financial advice.
        </footer>

      </div>
    </div>
  `

  container.querySelector('#welcome-start')?.addEventListener('click', onStart)
  container.querySelector('#welcome-guest')?.addEventListener('click', () => onGuest?.())
}

function card(icon, title, desc) {
  return `
    <div class="bg-surface border border-border rounded-2xl p-5">
      <div class="text-3xl mb-3">${icon}</div>
      <div class="font-semibold text-text-primary text-sm mb-1">${title}</div>
      <div class="text-xs text-text-muted leading-relaxed">${desc}</div>
    </div>
  `
}
