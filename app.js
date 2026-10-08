const API_KEY = '56717531-69c94562dda0982e9b5c8b8af';
const API = 'https://pixabay.com/api/';
const state = { q: 'nature', image_type: 'photo', orientation: 'all', order: 'popular', category: '', page: 1, per_page: 24, totalHits: 0 };

const $ = (s) => document.querySelector(s);
const grid = $('#grid'), statusEl = $('#status'), moreBtn = $('#moreBtn'), resultInfo = $('#resultInfo');

function buildUrl() {
  const p = new URLSearchParams({
    key: API_KEY, q: state.q || 'nature',
    image_type: state.image_type === 'all' ? 'all' : state.image_type,
    order: state.order, page: state.page, per_page: state.per_page,
    safesearch: 'true',
  });
  if (state.orientation !== 'all') p.set('orientation', state.orientation);
  if (state.category) p.set('category', state.category);
  return `${API}?${p.toString()}`;
}

async function load(append = false) {
  statusEl.textContent = append ? 'Loading more…' : 'Loading…';
  moreBtn.hidden = true;
  try {
    const res = await fetch(buildUrl());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state.totalHits = data.totalHits || 0;
    if (!append) grid.innerHTML = '';
    (data.hits || []).forEach(addCard);
    const shown = grid.children.length;
    resultInfo.textContent = `${shown.toLocaleString()} / ${(state.totalHits || 0).toLocaleString()} images for "${state.q}"`;
    statusEl.textContent = (data.hits || []).length === 0 && !append ? 'No images found. Try another keyword.' : '';
    moreBtn.hidden = shown >= state.totalHits || (data.hits || []).length === 0;
  } catch (e) {
    statusEl.textContent = 'Failed to load: ' + e.message;
  }
}

function addCard(h) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <img loading="lazy" src="${h.webformatURL}" alt="${escapeAttr(h.tags)}" />
    <div class="ov">
      <span>♥ ${num(h.likes)} · ⬇ ${num(h.downloads)}</span>
      <span>by ${escapeHtml(h.user)}</span>
    </div>`;
  el.addEventListener('click', () => openLB(h));
  grid.appendChild(el);
}

const num = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n ?? 0));
const escapeHtml = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const escapeAttr = (s) => escapeHtml(s).slice(0, 120);

// lightbox
const lb = $('#lightbox');
function openLB(h) {
  $('#lbImg').src = h.largeImageURL || h.webformatURL;
  $('#lbUser').textContent = 'Photo by ' + h.user;
  $('#lbTags').textContent = h.tags;
  $('#lbViews').textContent = num(h.views);
  $('#lbLikes').textContent = num(h.likes);
  $('#lbDownloads').textContent = num(h.downloads);
  $('#lbDownload').href = h.largeImageURL || h.webformatURL;
  lb.hidden = false;
}
$('#lbClose').addEventListener('click', () => (lb.hidden = true));
lb.addEventListener('click', (e) => { if (e.target.classList.contains('lb-backdrop')) lb.hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.hidden = true; });

function setQuery(q) {
  state.q = q.trim() || 'nature';
  state.page = 1;
  $('#q').value = state.q;
  load(false);
}

$('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); setQuery($('#q').value); });
$('#topSearch').addEventListener('change', (e) => setQuery(e.target.value));
$('#imageType').addEventListener('change', (e) => { state.image_type = e.target.value; state.page = 1; load(false); syncNav(); });
$('#orientation').addEventListener('change', (e) => { state.orientation = e.target.value; state.page = 1; load(false); });
$('#order').addEventListener('change', (e) => { state.order = e.target.value; state.page = 1; load(false); });
$('#category').addEventListener('change', (e) => { state.category = e.target.value; state.page = 1; load(false); });
moreBtn.addEventListener('click', () => { state.page += 1; load(true); });

document.querySelectorAll('.popular button').forEach((b) =>
  b.addEventListener('click', () => setQuery(b.dataset.q)));

document.querySelectorAll('.nav-link').forEach((b) =>
  b.addEventListener('click', () => {
    state.image_type = b.dataset.type; state.page = 1;
    $('#imageType').value = b.dataset.type;
    syncNav(); load(false);
  }));

function syncNav() {
  document.querySelectorAll('.nav-link').forEach((b) =>
    b.classList.toggle('active', b.dataset.type === state.image_type));
}

load(false);
