// ── Header: shadow on scroll ──────────────────────────────────────────────────
const header = document.getElementById('site-header')
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('shadow-md', window.scrollY > 10)
  })
}

// ── Mobile menu toggle ────────────────────────────────────────────────────────
const menuBtn    = document.getElementById('menu-btn')
const mobileMenu = document.getElementById('mobile-menu')
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'))
}

// ── Estimate form (Web3Forms) ─────────────────────────────────────────────────
const estimateForm = document.getElementById('estimate-form')
if (estimateForm) {
  const status    = document.getElementById('form-status')
  const submitBtn = document.getElementById('submit-btn')

  estimateForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    submitBtn.textContent = 'Sending…'
    submitBtn.disabled    = true
    status.classList.add('hidden')

    try {
      const res  = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(Object.fromEntries(new FormData(estimateForm))),
      })
      const json = await res.json()

      if (json.success) {
        estimateForm.reset()
        status.textContent = '✅ Thank you! We received your request and will reach out shortly.'
        status.className   = 'text-center text-sm font-medium text-tealdk'
      } else {
        throw new Error(json.message || 'Error')
      }
    } catch {
      status.textContent = '⚠️ Something went wrong. Please call us at (770) 837-6997.'
      status.className   = 'text-center text-sm font-medium text-red-500'
    } finally {
      status.classList.remove('hidden')
      submitBtn.textContent = 'Get my free estimate'
      submitBtn.disabled    = false
    }
  })
}

// ── Reviews Carousel ─────────────────────────────────────────────────────────
const carouselViewport = document.getElementById('carousel-viewport')
if (carouselViewport) {
  const track   = document.getElementById('carousel-track')
  const btnPrev = document.getElementById('carousel-prev')
  const btnNext = document.getElementById('carousel-next')
  const dotsEl  = document.getElementById('carousel-dots')
  const cards   = [...track.children]
  let current   = 0

  const perView = () => window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
  const maxStep = () => cards.length - perView()

  function setWidths() {
    const n = perView(), gap = 20
    const cw = Math.floor((carouselViewport.offsetWidth - gap * (n - 1)) / n)
    cards.forEach(c => { c.style.width = `${cw}px`; c.style.flexShrink = '0' })
  }

  function buildDots() {
    dotsEl.innerHTML = Array.from({ length: maxStep() + 1 }, (_, i) =>
      `<button data-i="${i}" aria-label="Review ${i + 1}" class="h-2 rounded-full transition-all duration-300 ${i === 0 ? 'w-5 bg-teal' : 'w-2 bg-teal/30'}"></button>`
    ).join('')
    dotsEl.querySelectorAll('button').forEach(d =>
      d.addEventListener('click', () => goTo(+d.dataset.i))
    )
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxStep()))
    track.style.transition = 'transform 0.35s ease'
    track.style.transform  = `translateX(-${current * (cards[0].offsetWidth + 20)}px)`
    dotsEl.querySelectorAll('button').forEach((d, i) => {
      d.className = `h-2 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-teal' : 'w-2 bg-teal/30'}`
    })
    btnPrev.disabled = current === 0
    btnNext.disabled = current >= maxStep()
  }

  function init() { setWidths(); buildDots(); goTo(0) }

  btnPrev.addEventListener('click', () => goTo(current - 1))
  btnNext.addEventListener('click', () => goTo(current + 1))

  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => { setWidths(); buildDots(); goTo(Math.min(current, maxStep())) }, 150)
  })

  // touch swipe
  let touchX = 0
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX }, { passive: true })
  track.addEventListener('touchend',   e => {
    const diff = touchX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1)
  })

  init()
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
document.querySelectorAll('[data-faq-btn]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item    = btn.closest('[data-faq-item]')
    const content = item.querySelector('[data-faq-content]')
    const icon    = btn.querySelector('[data-faq-icon]')
    const isOpen  = !content.classList.contains('hidden')

    // close all
    document.querySelectorAll('[data-faq-item]').forEach((el) => {
      el.querySelector('[data-faq-content]').classList.add('hidden')
      el.querySelector('[data-faq-icon]').style.transform = 'rotate(0deg)'
    })

    if (!isOpen) {
      content.classList.remove('hidden')
      icon.style.transform = 'rotate(45deg)'
    }
  })
})
