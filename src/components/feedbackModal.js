import { supabase } from '../lib/supabase.js'
import { getSession } from '../utils/auth.js'
import { toast } from './toast.js'

export function openFeedbackModal() {
  removeFeedbackModal()

  const overlay = document.createElement('div')
  overlay.id = 'feedback-overlay'
  overlay.className = 'fixed inset-0 z-[500] flex items-center justify-center p-4'
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="feedback-backdrop"></div>
    <div class="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-display font-bold text-text-primary text-lg">Send Feedback</h2>
        <button id="feedback-close" class="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-xs font-bold">X</button>
      </div>

      <div>
        <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Type</label>
        <div class="flex gap-2">
          ${['Bug', 'Suggestion', 'Other'].map((type, i) => `
            <button data-ftype="${type}"
              class="ftype-btn flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${i === 0 ? 'bg-accent-primary text-bg border-accent-primary' : 'bg-surface-elevated border-border text-text-secondary hover:border-accent-primary/40'}">
              ${type}
            </button>
          `).join('')}
        </div>
      </div>

      <div>
        <label class="text-xs text-text-muted uppercase tracking-wide mb-1.5 block">Message</label>
        <textarea id="feedback-message" rows="4" maxlength="1000"
          placeholder="Describe the bug, idea, or anything else..."
          class="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"></textarea>
        <div class="text-right text-[10px] text-text-muted mt-0.5"><span id="feedback-char">0</span>/1000</div>
      </div>

      <button id="feedback-submit"
        class="w-full py-2.5 rounded-xl bg-accent-primary text-bg text-sm font-semibold hover:bg-accent-primary/90 transition-colors">
        Submit
      </button>
    </div>
  `

  document.body.appendChild(overlay)

  let selectedType = 'Bug'

  overlay.querySelectorAll('.ftype-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedType = btn.dataset.ftype
      overlay.querySelectorAll('.ftype-btn').forEach(b => {
        const active = b.dataset.ftype === selectedType
        b.className = `ftype-btn flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          active ? 'bg-accent-primary text-bg border-accent-primary'
                 : 'bg-surface-elevated border-border text-text-secondary hover:border-accent-primary/40'
        }`
      })
    })
  })

  const textarea = overlay.querySelector('#feedback-message')
  const charCount = overlay.querySelector('#feedback-char')
  textarea.addEventListener('input', () => {
    charCount.textContent = textarea.value.length
  })

  overlay.querySelector('#feedback-close').addEventListener('click', removeFeedbackModal)
  overlay.querySelector('#feedback-backdrop').addEventListener('click', removeFeedbackModal)

  overlay.querySelector('#feedback-submit').addEventListener('click', async () => {
    const message = textarea.value.trim()
    if (!message) { toast('Please write a message first', 'error'); return }

    const btn = overlay.querySelector('#feedback-submit')
    btn.disabled = true
    btn.textContent = 'Sending…'

    try {
      if (supabase) {
        const session = await getSession()
        await supabase.from('feedback').insert({
          user_id: session?.user?.id ?? null,
          type: selectedType,
          message,
        })
      }
    } catch (_) {
      // Silently ignore — feedback table may not exist yet
    }

    removeFeedbackModal()
    toast('Thanks for your feedback!', 'success')
  })

  setTimeout(() => textarea.focus(), 50)
}

function removeFeedbackModal() {
  document.getElementById('feedback-overlay')?.remove()
}
