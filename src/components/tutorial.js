// tutorial.js — 7-step guided tutorial overlay (PRD §Section 74)
import { updateSettings, awardXP, unlockBadge, getState } from '../state/store.js'
import { toast } from './toast.js'
import { checkAchievements } from '../utils/achievements.js'

const STEPS = [
  {
    target: '#nav-balance',
    title: 'Your Starting Balance',
    desc: 'You start with PC$10,000 in PilotCoins. This is your virtual currency — use it to buy stocks and grow your portfolio.',
  },
  {
    target: '#nav-xp-bar',
    title: 'Investor Level & XP',
    desc: 'Every trade earns XP. Fill this bar to level up and unlock new titles — from Rookie Pilot all the way to Pilot Grandmaster.',
  },
  {
    target: '[data-nav="#stocks"]',
    title: 'Browse Stocks',
    desc: 'Click here to open the Stock Browser. You can search and filter 37 real stocks across 7 sectors and place trades.',
  },
  {
    target: '[data-nav="#portfolio"]',
    title: 'Your Portfolio',
    desc: 'This is where you track everything you own — current value, gains, losses, and your full transaction history.',
  },
  {
    target: '[data-nav="#achievements"]',
    title: 'Achievements',
    desc: 'Earn badges by hitting milestones: your first trade, diversifying across sectors, reaching profit targets, and more.',
  },
  {
    target: '[data-nav="#leaderboard"]',
    title: 'Leaderboard',
    desc: 'Compete with your class! Rankings update based on total portfolio value. Can you reach the top?',
  },
  {
    target: '#navbar',
    title: 'You\'re Ready!',
    desc: 'That\'s everything you need to know. Go make your first trade and start climbing the leaderboard. Good luck, Pilot!',
  },
]

let currentStep = 0
let overlay = null
let spotlight = null

export function startTutorial() {
  currentStep = 0
  buildOverlay()
  showStep(0)
}

function buildOverlay() {
  if (overlay) overlay.remove()

  overlay = document.createElement('div')
  overlay.id = 'tutorial-overlay'
  overlay.className = 'fixed inset-0 z-[400] pointer-events-none'
  overlay.innerHTML = `
    <!-- Dark backdrop with a cutout hole for the spotlight -->
    <div id="tutorial-backdrop" class="absolute inset-0" style="background:rgba(0,0,0,0.7)"></div>

    <!-- Tooltip bubble -->
    <div id="tutorial-tooltip"
      class="pointer-events-auto absolute bg-surface border border-accent-primary/50 rounded-2xl p-5 shadow-2xl w-72 transition-all duration-300">
      <button id="tutorial-skip" class="absolute top-3 right-3 text-text-muted hover:text-text-primary text-xs${getState().settings.tutorialDone ? '' : ' hidden'}">Skip ✕</button>
      <div id="tutorial-step-label" class="text-[10px] text-accent-secondary uppercase tracking-widest mb-1"></div>
      <div id="tutorial-title" class="font-semibold text-text-primary mb-2"></div>
      <div id="tutorial-desc" class="text-sm text-text-muted leading-relaxed mb-4"></div>
      <!-- Dot indicators -->
      <div class="flex gap-1.5 mb-4">
        ${STEPS.map((_, i) => `<div class="dot w-1.5 h-1.5 rounded-full bg-border transition-colors" data-dot="${i}"></div>`).join('')}
      </div>
      <div class="flex gap-2">
        <button id="tutorial-back" class="px-3 py-1.5 rounded-lg border border-border text-xs text-text-muted hover:text-text-primary transition-colors">Back</button>
        <button id="tutorial-next" class="flex-1 px-3 py-1.5 rounded-lg bg-accent-primary text-bg text-xs font-semibold hover:bg-accent-primary/90 transition-colors">Next →</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)

  overlay.querySelector('#tutorial-skip')?.addEventListener('click', endTutorial)
  overlay.querySelector('#tutorial-back')?.addEventListener('click', () => {
    if (currentStep > 0) showStep(currentStep - 1)
  })
  overlay.querySelector('#tutorial-next')?.addEventListener('click', () => {
    if (currentStep < STEPS.length - 1) showStep(currentStep + 1)
    else completeTutorial()
  })
}

function showStep(index) {
  currentStep = index
  const step = STEPS[index]
  const tooltip = document.getElementById('tutorial-tooltip')
  if (!tooltip) return

  document.getElementById('tutorial-step-label').textContent = `Step ${index + 1} of ${STEPS.length}`
  document.getElementById('tutorial-title').textContent = step.title
  document.getElementById('tutorial-desc').textContent = step.desc
  document.getElementById('tutorial-back').style.visibility = index === 0 ? 'hidden' : 'visible'
  document.getElementById('tutorial-next').textContent = index === STEPS.length - 1 ? 'Start Trading!' : 'Next →'

  // Update dots
  overlay.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('bg-accent-primary', i === index)
    d.classList.toggle('bg-border', i !== index)
  })

  // Position tooltip near the target element
  const target = document.querySelector(step.target)
  if (target) {
    const rect = target.getBoundingClientRect()
    const tipW = 288, tipH = 220
    let top  = rect.bottom + 12
    let left = rect.left

    if (top + tipH > window.innerHeight) top = rect.top - tipH - 12
    if (left + tipW > window.innerWidth) left = window.innerWidth - tipW - 16
    if (left < 8) left = 8

    tooltip.style.top  = top  + 'px'
    tooltip.style.left = left + 'px'
  } else {
    // Center fallback
    tooltip.style.top  = '50%'
    tooltip.style.left = '50%'
    tooltip.style.transform = 'translate(-50%, -50%)'
  }
}

function completeTutorial() {
  endTutorial()
  updateSettings({ tutorialDone: true })
  awardXP(100)
  unlockBadge('tutorial_done')
  checkAchievements()
  toast('Tutorial complete! +100 XP earned', 'success', 4000)
}

function endTutorial() {
  overlay?.remove()
  overlay = null
}
