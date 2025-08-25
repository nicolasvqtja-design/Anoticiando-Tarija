// ======= Datos de ejemplo (edítalos o cámbialos por tus noticias reales) =======
const posts = [
  {
    id: "tarija-feria-viticola",
    title: "Tarija inaugura la Feria Vitícola con récord de bodegas participantes",
    category: "Tarija",
    date: "2025-08-20",
    summary: "Productores locales presentan nuevas etiquetas y se anuncia impulso al enoturismo.",
    content: "La Feria Vitícola abre sus puertas en Tarija con la participación de bodegas tradicionales y nuevos emprendimientos. Autoridades destacaron el potencial enoturístico de la región y se anunciaron rutas del vino para la próxima temporada.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1510627498534-cf7e9002facc?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "bolivia-energia-solar",
    title: "Bolivia amplía capacidad de energía solar en el altiplano",
    category: "Bolivia",
    date: "2025-08-18",
    summary: "Nuevos parques fotovoltaicos reforzarán la matriz energética.",
    content: "El Ministerio de Energías anunció la puesta en marcha de nuevos parques solares que permitirán ampliar la cobertura y exportar excedentes en épocas de alta producción. Comunidades aledañas recibirán programas de capacitación.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "internacional-cumbre",
    title: "Líderes mundiales acuerdan hoja de ruta climática",
    category: "Internacional",
    date: "2025-08-15",
    summary: "Los países firmantes se comprometen a acelerar la transición energética.",
    content: "Durante la cumbre internacional se presentó una hoja de ruta con metas concretas para la reducción de emisiones, inversión en tecnologías limpias y mecanismos de cooperación entre países en desarrollo y desarrollados.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1554475901-4538ddfbccc3?q=80&w=1200&auto=format&fit=crop"
  },
  {
    id: "video-resumen-semana",
    title: "Video: Resumen de la semana en Tarija y Bolivia",
    category: "Videos",
    date: "2025-08-22",
    summary: "Los hechos más relevantes, en 3 minutos.",
    content: "Revisa el repaso audiovisual con imágenes de los eventos más importantes en Tarija y a nivel nacional. Incluye enlaces a las notas completas publicadas en el sitio.",
    mediaType: "video",
    mediaUrl: "https://www.youtube.com/embed/ysz5S6PUM-U" // video de ejemplo
  }
];

// ======= Utilidades =======
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', { year:'numeric', month:'short', day:'2-digit' });
}

function makeShareLinks(title, url){
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    wa: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    tw: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
  };
}

function slugify(s){
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

// Simular conteo de lecturas (popular)
const viewKey = 'ntm_views';
const views = JSON.parse(localStorage.getItem(viewKey) || '{}');

function addView(id){
  views[id] = (views[id]||0)+1;
  localStorage.setItem(viewKey, JSON.stringify(views));
}

// ======= Render =======
const feed = $('#feed');
const popularList = $('#popularList');
const searchInput = $('#searchInput');
const nav = $('#nav');
const loadMoreBtn = $('#loadMore');

let currentFilter = 'Todas';
let page = 1;
const pageSize = 7;

function renderPosts(reset=true){
  if(reset){ feed.innerHTML = ''; page = 1; }
  const q = searchInput.value.trim().toLowerCase();
  const filtered = posts
    .filter(p => currentFilter==='Todas' ? true : p.category===currentFilter)
    .filter(p => q ? (p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)) : true)
    .sort((a,b)=> new Date(b.date)-new Date(a.date));

  const start = 0;
  const end = page * pageSize;
  const slice = filtered.slice(start, end);

  slice.forEach((post, idx)=>{
    const card = document.createElement('article');
    card.className = 'card-post' + (idx===0 && page===1 ? ' featured' : '');
    const isVideo = post.mediaType === 'video';
    const media = isVideo
      ? `<iframe src="${post.mediaUrl}" title="${post.title}" allowfullscreen loading="lazy"></iframe>`
      : `<img src="${post.mediaUrl}" alt="${post.title}" loading="lazy">`;

    card.innerHTML = `
      <div class="thumb">
        ${media}
        <span class="badge">${post.category}</span>
      </div>
      <div class="body">
        <h2 class="title">${post.title}</h2>
        <div class="meta"><time>${formatDate(post.date)}</time></div>
        <p>${post.summary}</p>
        <div class="actions">
          <button class="btn" data-open="${post.id}">Leer más</button>
          <a class="btn" href="#${post.id}">Enlace</a>
        </div>
      </div>
    `;
    feed.appendChild(card);
  });

  loadMoreBtn.hidden = filtered.length <= end;
}

function renderPopular(){
  const sorted = [...posts].sort((a,b)=> (views[b.id]||0) - (views[a.id]||0)).slice(0,6);
  popularList.innerHTML = '';
  sorted.forEach(p=>{
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${p.id}`;
    a.textContent = `${p.title}`;
    li.appendChild(a);
    popularList.appendChild(li);
  });
}

// ======= Modal =======
const modal = $('#postModal');
const modalTitle = $('#modalTitle');
const modalDate = $('#modalDate');
const modalCategory = $('#modalCategory');
const modalContent = $('#modalContent');
const modalMedia = $('#modalMedia');
const modalClose = $('#modalClose');

function openPost(id){
  const post = posts.find(p=>p.id===id || slugify(p.title)===id);
  if(!post) return;

  addView(post.id);
  renderPopular();

  modalTitle.textContent = post.title;
  modalDate.textContent = formatDate(post.date);
  modalCategory.textContent = post.category;
  modalContent.textContent = post.content;
  modalMedia.innerHTML = '';

  if(post.mediaType==='video'){
    const iframe = document.createElement('iframe');
    iframe.src = post.mediaUrl;
    iframe.title = post.title;
    iframe.allowFullscreen = true;
    modalMedia.appendChild(iframe);
  }else{
    const img = document.createElement('img');
    img.src = post.mediaUrl;
    img.alt = post.title;
    modalMedia.appendChild(img);
  }

  // Share links
  const url = `${location.origin}${location.pathname}#${post.id}`;
  const share = makeShareLinks(post.title, url);
  $('#shareWhatsapp').href = share.wa;
  $('#shareFacebook').href = share.fb;
  $('#shareTwitter').href = share.tw;

  modal.showModal();
}

function closeModal(){
  modal.close();
}

// ======= Eventos =======
document.addEventListener('click', (e)=>{
  const openBtn = e.target.closest('[data-open]');
  if(openBtn){
    openPost(openBtn.getAttribute('data-open'));
  }
  if(e.target.id==='modalClose'){
    closeModal();
  }
});

// Filtrar por navbar y tags
nav?.addEventListener('click', (e)=>{
  const a = e.target.closest('a');
  if(!a || !a.dataset.filter) return;
  e.preventDefault();
  $$('.nav a').forEach(el=>el.classList.remove('active'));
  a.classList.add('active');
  currentFilter = a.dataset.filter;
  renderPosts(true);
});

$$('.tag').forEach(btn=> btn.addEventListener('click', ()=>{
  currentFilter = btn.dataset.filter;
  $$('.nav a').forEach(el=>el.classList.remove('active'));
  const match = $(`.nav a[data-filter="${currentFilter}"]`);
  match?.classList.add('active');
  renderPosts(true);
}));

searchInput.addEventListener('input', ()=> renderPosts(true));

// Botón cargar más
loadMoreBtn.addEventListener('click', ()=>{
  page++;
  renderPosts(false);
});

// Soporte para abrir por hash (enlace directo)
window.addEventListener('hashchange', ()=>{
  const id = location.hash.replace('#','');
  if(id) openPost(id);
});

// Menú responsive
const menuToggle = document.getElementById('menuToggle');
menuToggle.addEventListener('click', ()=>{
  const nav = document.getElementById('nav');
  const open = nav.style.display === 'flex';
  nav.style.display = open ? 'none' : 'flex';
  menuToggle.setAttribute('aria-expanded', String(!open));
});

// Inicializar
document.getElementById('year').textContent = new Date().getFullYear();
renderPosts(true);
renderPopular();

// Abrir si viene con hash
if(location.hash){
  const id = location.hash.replace('#','');
  openPost(id);
}
