// help.js — FAQ and quick reference
export function mountHelp(el) {
  el.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">

      <h1 class="text-2xl font-display font-bold text-text-primary">Help & FAQ</h1>

      ${section('Getting Started', [
        q('What is StockPilot?',
          'StockPilot is a gamified stock market simulator. You start with PC$10,000 (PilotCoins) and trade real-company stocks using live or simulated prices. Your goal is to grow your portfolio and climb the class leaderboard.'),
        q('How do I join my class?',
          'Ask your teacher for the 6-digit join code. On the Dashboard, enter it in the "Join a Class" box and click Join.'),
        q('What are PilotCoins (PC$)?',
          'PilotCoins are the virtual currency used in StockPilot. They are not real money. PC$1 = $1 for the purposes of this simulation.'),
      ])}

      ${section('Trading', [
        q('How do I buy a stock?',
          'Go to Stocks, click on any stock to open its detail page, then click the Buy button. Enter the number of shares (or a dollar amount), choose Market or Limit order, and confirm.'),
        q('What is a market order vs a limit order?',
          'A market order executes immediately at the current price. A limit order only executes when the stock reaches your specified price — useful for getting a better deal.'),
        q('What is a stop-loss order?',
          'A stop-loss automatically sells a stock if its price falls to or below a level you set. It protects you from large losses on a position.'),
        q('What is the 0.5% fee?',
          'Every trade has a small 0.5% transaction fee deducted from your balance. This mimics real brokerage costs and encourages thoughtful trading rather than constant in-and-out.'),
        q('Can I buy fractional shares?',
          'Yes. You can buy partial shares — for example 0.5 shares of NVDA. This lets you invest in expensive stocks even with a limited balance.'),
        q('Why did my limit order not fill?',
          'Limit and stop-loss orders are checked on every price tick (every few seconds). If the price has not reached your target, the order stays pending. You can view pending orders in the Portfolio page.'),
      ])}

      ${section('Portfolio & P&L', [
        q('What is "Unrealized P&L"?',
          'Unrealized P&L is the profit or loss on shares you still own. It shows how much you would make or lose if you sold right now. It becomes "Realized" when you actually sell.'),
        q('What is "Average Cost"?',
          'If you buy the same stock multiple times at different prices, your average cost is the weighted average price per share across all your buys.'),
        q('What does "Today\'s Gain" mean on the dashboard?',
          'Today\'s Gain shows how your total portfolio value has changed since the start of the current trading session, based on price movements today.'),
      ])}

      ${section('XP, Levels & Achievements', [
        q('How do I earn XP?',
          'You earn XP by trading, hitting portfolio milestones, and unlocking achievements. XP is permanent — it never decreases.'),
        q('What do levels unlock?',
          'Each level gives you a new investor title (shown on your profile and the leaderboard). Reach level 25 to become a Pilot Grandmaster.'),
        q('How do I find hidden achievements?',
          'Secret badges show as "???" on the Achievements page. They have special unlock conditions — experiment with your trading behavior to discover them.'),
      ])}

      ${section('Leaderboard', [
        q('Why is the leaderboard not updating?',
          'The leaderboard updates in real-time via Supabase. If it appears stuck, check your internet connection or wait a few seconds and it should refresh automatically.'),
        q('What do the reaction buttons do?',
          'You can send one of five emoji reactions to any classmate\'s row. Your reaction is shown to everyone and updates live. Tap it again to remove it.'),
        q('What is the "Project view"?',
          'Project view opens a full-screen leaderboard optimised for displaying on a projector or classroom screen. It shows names, values, and P&L bars at large size.'),
      ])}

      ${section('Settings & Account', [
        q('How do I change my display name?',
          'Go to Settings > Profile and update the Display Name field, then click Save.'),
        q('How do I change my password?',
          'Go to Settings > Profile and click "Change Password". Enter your new password and confirm.'),
        q('What does "Reset Portfolio" do?',
          'Reset Portfolio wipes all your holdings and transaction history and restores your balance to PC$10,000. This cannot be undone.'),
        q('How do I switch between dark and light mode?',
          'Go to Settings > Appearance and click Light or Dark.'),
      ])}

      ${section('For Teachers', [
        q('How do I create a class session?',
          'Go to the Teacher Panel (accessible from the navigation menu). Click "New Session", enter a name and starting balance, then click Create. Students join using the 6-digit code shown.'),
        q('How do I end a session?',
          'In the Teacher Panel, open your session and click the "Ended" status button. All students are automatically redirected to the Results screen.'),
        q('How do I export results to a spreadsheet?',
          'In the session detail view, click "Export CSV" above the participant list. A CSV file with final rankings, values, P&L, and XP will download immediately.'),
        q('What are Market Events?',
          'Market Events let you broadcast a surprise to all students — a news headline that optionally applies a price multiplier to selected stocks. Use them to create teaching moments about market reactions.'),
      ])}

    </div>
  `
}

export function unmountHelp() {}

function section(title, items) {
  return `
    <section class="bg-surface border border-border rounded-2xl overflow-hidden">
      <div class="px-5 py-4 border-b border-border bg-surface-elevated/50">
        <h2 class="font-semibold text-text-primary">${title}</h2>
      </div>
      <div class="divide-y divide-border">
        ${items.join('')}
      </div>
    </section>
  `
}

function q(question, answer) {
  return `
    <details class="group px-5 py-4 cursor-pointer">
      <summary class="flex items-center justify-between text-sm font-medium text-text-primary list-none">
        ${question}
        <span class="text-text-muted text-xs ml-3 shrink-0 group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <p class="mt-2 text-sm text-text-secondary leading-relaxed">${answer}</p>
    </details>
  `
}
