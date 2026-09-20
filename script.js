const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const stateKey = 'vaConnectTrackerV1';
const state = JSON.parse(localStorage.getItem(stateKey) || '{}');
const statuses = ['Not Started','Saved','Applied','Interview','Offer','Rejected','Not Eligible'];
let activeAgency = null;

const logoMap = {
  1:'Ataraxis-Main.png', 2:'wing-logo.png', 3:'Athena.svg', 5:'MyOutDesk.png', 6:'Zirtual_Logo.webp',
  8:'somewhere.svg', 9:'magic-logo-dark.webp', 11:'boldly-logo.png.webp', 12:'Hellorache-Logo-Horizontal-1024x308.webp',
  14:'Medva.svg', 15:'wishup.webp', 17:'20four7va_logo_transparent_white_400px.webp', 19:'logo-prialto.webp',
  23:'Valatam.webp', 25:'South.svg', 26:'STAFFVIRTUAL LOGO FULL.svg', 27:'remote co worker.svg', 29:'VLBPO.png',
  30:'cloudstaff-logo.svg', 31:'Hire Hangar.svg', 32:'Virtual-Wizards-Logo-Black-1.webp', 33:'Virtual Assist USA.png',
  34:'Delegated.png', 39:'Founders Arm.jpg', 41:'stealth-agents-logo-black.png', 42:'asksunday-logo.gif', 43:'OkayRelax.svg',
  44:'peachtreeva-logo-1a.png', 45:'Support Ninja.svg', 46:'DocVA.webp', 47:'helpsquad-health-horizontal.svg',
  48:'PENBROTHERS-HORIZONTAL.svg', 50:'Go Carpathian.png', 51:'pearl talent.png', 52:'Virtual Coworker.webp',
  53:'EMAPTA.svg', 54:'virtual-gurus.svg', 55:'Elite Virtual Assistants.webp', 57:'task us.webp', 58:'Outsourced.png',
  59:'Remote Latinos.svg', 60:'VA Platinum.svg', 61:'edge-operations-managers-logo.png', 62:'TaskFlo.png',
  63:'Outsourced Doers.png', 64:'Mom to Virtual Assistant.png', 65:'SmartVAs.webp', 66:'Winning Assistants.svg',
  67:'360VMA.svg', 68:'Assist World.jpg', 69:'Double.jpg', 70:'Coconut.png', 71:'REVA Global.jpg', 72:'5 Star VAs.png',
  73:'CRDLE.jpg', 74:'Maado.svg', 75:'Persona.svg', 76:'HireLATAM.webp', 77:'CrewBloom.png', 78:'Filta.png',
  79:'Outsourcey.png', 80:'MyTasker.webp', 81:'Octhopus.webp', 82:'There Is Talent.webp', 83:'Pepper Virtual Assistants.png',
  84:'Vitalis Outsourcing.webp', 85:'Virtual Staff PH.png', 86:'Aristo Sourcing.png', 87:'Invedus Outsourcing.png',
  88:'Rocket Station.jpg', 89:'Cherry Assistant.svg', 91:'Taskbullet.png', 92:'Klarecon.webp', 93:'iWorker.webp',
  94:'Summit VA Solutions.webp', 95:'Upwork.jpg', 96:'images.jpg'
};
const cardThemes = ['theme-blue','theme-cyan','theme-violet','theme-teal','theme-indigo','theme-slate'];
function logoFor(a){ const f=logoMap[a.id]; return f ? `assets/logos/${encodeURI(f)}` : ''; }
function snapshotLogo(a){ const src=logoFor(a); return src ? `<img src="${src}" alt="${escapeHtml(a.name)} logo">` : `<span>${initials(a.name)}</span>`; }


const header = $('#header');
const progress = $('#progress');
const menuBtn = $('#menuBtn');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', scrollY > 20);
  const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.width = (h ? scrollY / h * 100 : 0) + '%';
  let current = 'home';
  $$('main section[id]').forEach(s => { if(scrollY >= s.offsetTop - 180) current = s.id; });
  $$('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+current));
}, {passive:true});
menuBtn.addEventListener('click', () => header.classList.toggle('menu-open'));
$$('#nav a').forEach(a => a.addEventListener('click', () => header.classList.remove('menu-open')));

const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), {threshold:.1});
$$('.reveal').forEach(el => observer.observe(el));

function getRecord(id){
  if(!state[id]) state[id] = {status:'Not Started', note:''};
  return state[id];
}
function saveState(){ localStorage.setItem(stateKey, JSON.stringify(state)); updateStats(); }
function statusClass(status){ return status.toLowerCase().replace(/\s+/g,'-'); }
function domainOf(url){ try{return new URL(url).hostname.replace(/^www\./,'')}catch{return ''} }
function faviconFor(url){ const d=domainOf(url); return d ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128` : ''; }
function initials(name){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
function splitRegions(str){ return str.split('/').map(x=>x.trim()).filter(Boolean); }

const scopeFilter=$('#scopeFilter'), regionFilter=$('#regionFilter');
[...new Set(VA_AGENCIES.map(a=>a.scope))].sort().forEach(v=>{ const o=document.createElement('option');o.value=v;o.textContent=v;scopeFilter.appendChild(o); });
[...new Set(VA_AGENCIES.flatMap(a=>splitRegions(a.region)))].sort().forEach(v=>{ const o=document.createElement('option');o.value=v;o.textContent=v;regionFilter.appendChild(o); });
$('#heroTotal').textContent=VA_AGENCIES.length; $('#totalCount').textContent=VA_AGENCIES.length;

function matches(a){
  const q=$('#searchInput').value.trim().toLowerCase();
  const sf=scopeFilter.value, rf=regionFilter.value, st=$('#statusFilter').value;
  const hay=[a.name,a.region,a.scope,a.roles,a.eligibility].join(' ').toLowerCase();
  return (!q || hay.includes(q)) && (!sf || a.scope===sf) && (!rf || splitRegions(a.region).includes(rf)) && (!st || getRecord(a.id).status===st);
}

function render(){
  const grid=$('#agencyGrid'); grid.innerHTML='';
  const list=VA_AGENCIES.filter(matches);
  $('#resultCount').textContent=`${list.length} ${list.length===1?'opportunity':'opportunities'}`;
  $('#emptyState').hidden=!!list.length;
  list.forEach(a=>{
    const rec=getRecord(a.id), card=document.createElement('article'); card.className='agency-card reveal visible';
    const domain=domainOf(a.url);
    const theme=cardThemes[(a.id-1)%cardThemes.length];
    card.innerHTML=`<div class="agency-image ${theme}"><div class="image-glow"></div><div class="browser-dots"><i></i><i></i><i></i><span>${domain}</span><b>OFFICIAL SITE</b></div><div class="site-snapshot"><div class="snapshot-nav"><span>${snapshotLogo(a)}</span><span class="snapshot-links">Home &nbsp; Careers &nbsp; About</span><span class="snapshot-menu">☰</span></div><div class="snapshot-hero"><div><small>REMOTE WORK · ${escapeHtml(splitRegions(a.region)[0]||'GLOBAL')}</small><strong>${escapeHtml(a.name)}</strong><p>${escapeHtml(a.roles)}</p><em>EXPLORE OPPORTUNITIES</em></div><div class="snapshot-shape"><span>${String(a.id).padStart(3,'0')}</span></div></div><div class="snapshot-footer"><span>Virtual careers</span><span>↗</span></div></div></div>
      <div class="agency-body"><div class="agency-title"><div><span class="agency-index">#${String(a.id).padStart(3,'0')}</span><h3>${escapeHtml(a.name)}</h3></div><span class="status-pill ${statusClass(rec.status)}">${escapeHtml(rec.status)}</span></div>
      <p class="agency-role">${escapeHtml(a.roles)}</p><div class="agency-tags"><span>${escapeHtml(a.scope)}</span><span>${escapeHtml(splitRegions(a.region)[0]||'Global')}</span></div>
      <div class="agency-actions"><button class="preview-btn" data-preview="${a.id}">◉ &nbsp;Preview</button><a class="apply-btn" href="${a.url}" target="_blank" rel="noopener noreferrer">Visit / Apply ↗</a><select class="card-status" data-status="${a.id}" aria-label="Application status for ${escapeHtml(a.name)}">${statuses.map(s=>`<option ${s===rec.status?'selected':''}>${s}</option>`).join('')}</select></div></div>`;
    grid.appendChild(card);
  });
  bindCards();
}
function bindCards(){
  $$('[data-preview]').forEach(b=>b.addEventListener('click',()=>openModal(Number(b.dataset.preview))));
  $$('[data-status]').forEach(s=>s.addEventListener('change',()=>{ const id=Number(s.dataset.status); getRecord(id).status=s.value; saveState(); render(); }));
}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function updateStats(){
  const counts=Object.values(state).reduce((o,r)=>{o[r.status]=(o[r.status]||0)+1;return o;},{});
  $('#appliedCount').textContent=counts.Applied||0; $('#interviewCount').textContent=counts.Interview||0; $('#offerCount').textContent=counts.Offer||0;
}
function openModal(id){
  activeAgency=VA_AGENCIES.find(a=>a.id===id); if(!activeAgency)return;
  const rec=getRecord(id), modal=$('#agencyModal');
  $('#modalTitle').textContent=activeAgency.name; $('#modalRegion').textContent=activeAgency.region; $('#modalRoles').textContent=activeAgency.roles; $('#modalEligibility').textContent=activeAgency.eligibility;
  $('#modalUrl').textContent=domainOf(activeAgency.url); $('#visitBtn').href=activeAgency.url; $('#modalStatus').textContent=rec.status.toUpperCase(); $('#modalStatus').className='status-badge '+statusClass(rec.status); $('#modalStatusSelect').value=rec.status; $('#modalNote').value=rec.note||'';
  const img=$('#modalFavicon'); img.innerHTML=activeAgency.url?`<img src="${faviconFor(activeAgency.url)}" alt="">`:`<span>${initials(activeAgency.name)}</span>`;
  const frame=$('#websiteFrame'); frame.src=activeAgency.url; frame.style.display='block';
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
}
function closeModal(){ $('#agencyModal').classList.remove('open'); $('#agencyModal').setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); $('#websiteFrame').src='about:blank'; activeAgency=null; }
$('#modalClose').addEventListener('click',closeModal); $$('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
$('#modalStatusSelect').addEventListener('change',e=>{if(!activeAgency)return;getRecord(activeAgency.id).status=e.target.value;saveState();$('#modalStatus').textContent=e.target.value.toUpperCase();$('#modalStatus').className='status-badge '+statusClass(e.target.value);render();});
$('#modalNote').addEventListener('input',e=>{if(!activeAgency)return;getRecord(activeAgency.id).note=e.target.value;saveState();});

['searchInput','scopeFilter','regionFilter','statusFilter'].forEach(id=>$( '#'+id).addEventListener(id==='searchInput'?'input':'change',render));
$('#resetBtn').addEventListener('click',()=>{$('#searchInput').value='';scopeFilter.value='';regionFilter.value='';$('#statusFilter').value='';render();});

updateStats(); render();
