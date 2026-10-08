const API_KEY = '56717531-69c94562dda0982e9b5c8b8af';
const IMG_API = 'https://pixabay.com/api/';
const VID_API = 'https://pixabay.com/api/videos/';
const state = { media: 'image', q: 'nature', image_type: 'photo', orientation: 'all', order: 'popular', category: '', page: 1, per_page: 20, totalHits: 0 };

const $ = (s) => document.querySelector(s);
const grid = $('#grid'), statusEl = $('#status'), pagination = $('#pagination'),
  resultInfo = $('#resultInfo'), hero = $('#hero'), heroCredit = $('#heroCredit');

function buildUrl() {
  if (state.media === 'video') {
    const p = new URLSearchParams({
      key: API_KEY, q: state.q || 'nature', order: state.order,
      page: state.page, per_page: Math.max(3, state.per_page), safesearch: 'true',
    });
    if (state.category) p.set('category', state.category);
    return `${VID_API}?${p.toString()}`;
  }
  const p = new URLSearchParams({
    key: API_KEY, q: state.q || 'nature',
    image_type: state.image_type === 'all' ? 'all' : state.image_type,
    order: state.order, page: state.page, per_page: state.per_page, safesearch: 'true',
  });
  if (state.orientation !== 'all') p.set('orientation', state.orientation);
  if (state.category) p.set('category', state.category);
  return `${IMG_API}?${p.toString()}`;
}

async function load() {
  statusEl.textContent = 'Loading…';
  pagination.innerHTML = '';
  try {
    const res = await fetch(buildUrl());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    state.totalHits = Math.min(data.totalHits || 0, 500); // API caps paging at 500
    grid.innerHTML = '';
    (data.hits || []).forEach((h) => (state.media === 'video' ? addVideoCard(h) : addCard(h)));
    const totalPages = Math.max(1, Math.ceil(state.totalHits / state.per_page));
    resultInfo.textContent = `Page ${state.page}/${totalPages} — ${state.totalHits.toLocaleString()} ${state.media === 'video' ? 'videos' : 'images'} for "${state.q}"`;
    statusEl.textContent = (data.hits || []).length === 0 ? 'No results. Try another keyword.' : '';
    renderPagination(totalPages);
  } catch (e) {
    statusEl.textContent = 'Failed to load: ' + e.message;
  }
}

// --- cards ---
function addCard(h) {
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <img loading="lazy" src="${h.webformatURL}" alt="${esc(h.tags)}" />
    <div class="ov"><span>♥ ${num(h.likes)} · ⬇ ${num(h.downloads)}</span><span>by ${esc(h.user)}</span></div>`;
  el.addEventListener('click', () => openImageLB(h));
  grid.appendChild(el);
}

function addVideoCard(h) {
  const v = h.videos || {};
  const thumb = (v.medium && v.medium.thumbnail) || (v.small && v.small.thumbnail) || (v.tiny && v.tiny.thumbnail) || '';
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <img loading="lazy" src="${thumb}" alt="${esc(h.tags)}" />
    <span class="badge-play">▶</span>
    <span class="badge-dur">${fmtDur(h.duration)}</span>
    <div class="ov"><span>♥ ${num(h.likes)} · 👁 ${num(h.views)}</span><span>by ${esc(h.user)}</span></div>`;
  el.addEventListener('click', () => openVideoLB(h));
  grid.appendChild(el);
}

const num = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n ?? 0));
const fmtDur = (s) => `${Math.floor((s || 0) / 60)}:${String((s || 0) % 60).padStart(2, '0')}`;
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).slice(0, 140);

// --- numeric pagination ---
function renderPagination(totalPages) {
  pagination.innerHTML = '';
  const go = (p, label, opts = {}) => {
    const b = document.createElement('button');
    b.textContent = label ?? p;
    if (opts.active) b.classList.add('active');
    if (opts.disabled) b.disabled = true;
    b.addEventListener('click', () => { state.page = p; load(); grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    pagination.appendChild(b);
  };
  const dots = () => { const s = document.createElement('span'); s.className = 'dots'; s.textContent = '…'; pagination.appendChild(s); };
  go(Math.max(1, state.page - 1), '‹ Prev', { disabled: state.page <= 1 });
  const win = 2, pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - state.page) <= win) pages.push(p);
  }
  let last = 0;
  pages.forEach((p) => { if (p - last > 1) dots(); go(p, String(p), { active: p === state.page }); last = p; });
  go(Math.min(totalPages, state.page + 1), 'Next ›', { disabled: state.page >= totalPages });
}

// --- lightbox ---
const lb = $('#lightbox'), lbImg = $('#lbImg'), lbVideo = $('#lbVideo');
function fillMeta(user, tags, views, likes, downloads, url) {
  $('#lbUser').textContent = (state.media === 'video' ? 'Video by ' : 'Photo by ') + user;
  $('#lbTags').textContent = tags;
  $('#lbViews').textContent = num(views);
  $('#lbLikes').textContent = num(likes);
  $('#lbDownloads').textContent = num(downloads);
  $('#lbDownload').href = url;
  lb.hidden = false;
}
function openImageLB(h) {
  lbVideo.pause(); lbVideo.style.display = 'none'; lbImg.style.display = 'block';
  lbImg.src = h.largeImageURL || h.webformatURL;
  fillMeta(h.user, h.tags, h.views, h.likes, h.downloads, h.largeImageURL || h.webformatURL);
}
function openVideoLB(h) {
  const v = h.videos || {};
  const file = (v.medium && v.medium.url) || (v.small && v.small.url) || (v.tiny && v.tiny.url) || '';
  lbImg.style.display = 'none'; lbVideo.style.display = 'block';
  lbVideo.src = file;
  fillMeta(h.user, h.tags, h.views, h.likes, h.downloads, file);
}
$('#lbClose').addEventListener('click', () => { lb.hidden = true; lbVideo.pause(); });
lb.addEventListener('click', (e) => { if (e.target.classList.contains('lb-backdrop')) { lb.hidden = true; lbVideo.pause(); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { lb.hidden = true; lbVideo.pause(); } });

// --- dynamic hero background from API ---
async function refreshHero() {
  try {
    const q = state.q || 'landscape nature';
    const url = `${IMG_API}?key=${API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&order=popular&per_page=3&safesearch=true`;
    const res = await fetch(url);
    const data = await res.json();
    const hits = data.hits || [];
    if (!hits.length) return;
    const pick = hits[Math.floor(Math.random() * hits.length)];
    const bg = pick.largeImageURL || pick.webformatURL;
    hero.style.backgroundImage = `url('${bg}')`;
    heroCredit.textContent = `Cover: "${(pick.tags || '').split(',').slice(0, 3).join(',')}" by ${pick.user} via Pixabay`;
  } catch { /* keep default */ }
}

// --- controls ---
function setQuery(q) {
  state.q = (q || '').trim() || 'nature';
  state.page = 1;
  $('#q').value = state.q;
  load(); refreshHero();
}
function setMedia(m) {
  state.media = m; state.page = 1;
  $('#tabImage').classList.toggle('active', m === 'image');
  $('#tabVideo').classList.toggle('active', m === 'video');
  const isImg = m === 'image';
  $('#imageType').style.display = isImg ? '' : 'none';
  $('#orientation').style.display = isImg ? '' : 'none';
  $('#heroTitle').textContent = isImg ? 'Stunning royalty-free images' : 'Stunning royalty-free videos';
  document.querySelectorAll('#typeNav .nav-link').forEach((b) =>
    b.classList.toggle('active', isImg ? b.dataset.type === state.image_type : b.dataset.type === 'video'));
  load();
}

$('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); setQuery($('#q').value); });
$('#topSearch').addEventListener('change', (e) => setQuery(e.target.value));
$('#tabImage').addEventListener('click', () => setMedia('image'));
$('#tabVideo').addEventListener('click', () => setMedia('video'));
$('#imageType').addEventListener('change', (e) => { state.image_type = e.target.value; state.page = 1; syncNav(); load(); });
$('#orientation').addEventListener('change', (e) => { state.orientation = e.target.value; state.page = 1; load(); });
$('#order').addEventListener('change', (e) => { state.order = e.target.value; state.page = 1; load(); });
$('#category').addEventListener('change', (e) => { state.category = e.target.value; state.page = 1; load(); });
$('#perPage').addEventListener('change', (e) => { state.per_page = parseInt(e.target.value, 10); state.page = 1; load(); });
document.querySelectorAll('.popular button').forEach((b) => b.addEventListener('click', () => setQuery(b.dataset.q)));
document.querySelectorAll('#typeNav .nav-link').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.type === 'video') return setMedia('video');
  state.image_type = b.dataset.type;
  $('#imageType').value = b.dataset.type;
  if (state.media !== 'image') return setMedia('image');
  state.page = 1; syncNav(); load();
}));
function syncNav() {
  document.querySelectorAll('#typeNav .nav-link').forEach((b) =>
    b.classList.toggle('active', b.dataset.type === (state.media === 'video' ? 'video' : state.image_type)));
}

load(); refreshHero();
