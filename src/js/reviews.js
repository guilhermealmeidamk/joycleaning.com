// ── Google Business Reviews ───────────────────────────────────────────────────
// Enable "Places API (New)" in Google Cloud Console (not "Maps JavaScript API").
// Restrict key to HTTP referrers: joycleaning.com/* (add localhost/* for dev).
const PLACE_ID    = 'ChIJA2zRAy37BGoLRnQJY721hg'
const MAPS_API_KEY = 'AIzaSyDrs1PQy0drxxQg2Y_b1nULc-GhGyHp3FQ'
const CACHE_KEY    = 'joy_reviews_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function stars(rating) {
  return Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating)
    const half   = !filled && i < rating
    return `<svg class="w-4 h-4 ${filled || half ? 'text-amber' : 'text-ink/20'}" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 0 0 .95.69h4.4c.96 0 1.36 1.23.58 1.8l-3.56 2.58a1 1 0 0 0-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 0 0-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 0 0-.36-1.12L1.69 9.6c-.78-.57-.38-1.8.58-1.8h4.4a1 1 0 0 0 .95-.69L9.05 2.93Z"/>
    </svg>`
  }).join('')
}

function timeAgo(unixSeconds) {
  const diff = Date.now() / 1000 - unixSeconds
  if (diff < 2592000)  return 'This month'
  if (diff < 7776000)  return `${Math.floor(diff / 2592000)} months ago`
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`
  const y = Math.floor(diff / 31536000)
  return y === 1 ? '1 year ago' : `${y} years ago`
}

function reviewCard(r) {
  const initial = (r.authorAttribution?.displayName || 'A')[0].toUpperCase()
  const name    = r.authorAttribution?.displayName || 'Anonymous'
  const text    = r.text?.text || ''
  const photo   = r.authorAttribution?.photoURI
  const time    = r.publishTime ? timeAgo(new Date(r.publishTime).getTime() / 1000) : ''

  return `
    <article class="bg-white rounded-2xl p-6 border border-black/5 shadow-sm flex flex-col gap-4">
      <div class="flex items-center gap-3">
        ${photo
          ? `<img src="${photo}" alt="${name}" class="w-10 h-10 rounded-full object-cover">`
          : `<span class="w-10 h-10 rounded-full bg-teal/20 text-teal font-bold grid place-items-center text-sm">${initial}</span>`
        }
        <div class="min-w-0">
          <p class="font-semibold text-ink text-sm truncate">${name}</p>
          <p class="text-xs text-ink/40">${time}</p>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
             alt="Google" class="ml-auto h-4 opacity-60 shrink-0">
      </div>
      <div class="flex gap-0.5">${stars(r.rating || 5)}</div>
      ${text ? `<p class="text-ink/70 text-sm leading-relaxed line-clamp-5">${text}</p>` : ''}
    </article>`
}

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(CACHE_KEY); return null }
    return data
  } catch { return null }
}

function setCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })) } catch {}
}

async function fetchFromGoogle() {
  const fields = 'displayName,rating,userRatingCount,reviews,googleMapsUri'
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${PLACE_ID}?key=${MAPS_API_KEY}`,
    { headers: { 'X-Goog-FieldMask': fields } }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }
  const place = await res.json()
  const data = {
    rating:          place.rating,
    userRatingCount: place.userRatingCount,
    googleMapsURI:   place.googleMapsUri,
    reviews: (place.reviews || [])
      .filter(r => r.rating >= 4)
      .sort((a, b) => b.rating !== a.rating ? b.rating - a.rating
        : new Date(b.publishTime) - new Date(a.publishTime))
      .map(r => ({
        rating:      r.rating,
        text:        r.text?.text || '',
        publishTime: r.publishTime,
        name:        r.authorAttribution?.displayName || 'Anonymous',
        photo:       r.authorAttribution?.photoUri || null,
      })),
  }
  setCache(data)
  return data
}

export async function initReviews() {
  const grid     = document.getElementById('reviews-grid')
  const loading  = document.getElementById('reviews-loading')
  const summary  = document.getElementById('google-rating-summary')
  const ratingEl = document.getElementById('rating-number')
  const starsEl  = document.getElementById('rating-stars')
  const countEl  = document.getElementById('rating-count')

  if (!grid) return

  try {
    const data = getCached() || await fetchFromGoogle()

    if (ratingEl && data.rating) {
      ratingEl.textContent = data.rating.toFixed(1)
      starsEl.innerHTML    = stars(data.rating)
      countEl.textContent  = `${data.userRatingCount?.toLocaleString() || ''} reviews on Google`
      summary.classList.remove('hidden')
    }

    if (!data.reviews.length) { loading.textContent = 'No reviews yet.'; return }

    grid.innerHTML = data.reviews.map(r => reviewCard({
      rating:            r.rating,
      text:              { text: r.text },
      publishTime:       r.publishTime,
      authorAttribution: { displayName: r.name, photoURI: r.photo },
    })).join('')

    loading.classList.add('hidden')
    grid.classList.remove('hidden')

    const link = document.getElementById('google-reviews-link')
    if (link && data.googleMapsURI) link.href = data.googleMapsURI

  } catch (err) {
    console.error('Google Reviews error:', err)
    loading.textContent = `Error: ${err?.message || err}`
  }
}
