
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const statuses=['Not Started','Saved','Applied','Interview','Offer','Rejected','Not Eligible'];
const stateKey='vaConnectReferenceV11';
const state=JSON.parse(localStorage.getItem(stateKey)||'{}');
let activeAgency=null, frameTimer=null;

const logoMap={};

// Official-logo policy:
// Local agency logo assets from earlier versions were intentionally removed.
// A logo may only be added here after it has been verified/downloaded from the
// agency's own official website or official brand-assets page.
// Format: id:'assets/logos/AgencyName_logo.ext'
// Do NOT use third-party logo services, generated logos, favicons, or old assets.

const bannerMap={
  1:{theme:'',headline:'Do Work\\nThat Matters',sub:'Meaningful opportunities. A brighter tomorrow.'},
  2:{theme:'',headline:'Flexible Work\\nfor a Brighter Tomorrow',sub:'Find remote opportunities that fit your life.'},
  3:{theme:'purple',headline:'Empowering\\nVirtual Professionals',sub:'Match with global clients and grow your career.'},
  4:{theme:'green',headline:'Build a Career\\nWithout Boundaries',sub:'Flexible. Fulfilling. For What’s Next.'},
  5:{theme:'',headline:'Virtual Talent.\\nReal Success.',sub:'World-class virtual professionals for growing businesses.'},
  6:{theme:'dark',headline:'Do More\\nWith the Right Support',sub:'Virtual assistants for busy professionals and growing businesses.'}
};

function getRecord(id){
  if(!state[id]) state[id]={status:'Not Started',note:'',favorite:false};
  if(typeof state[id].favorite!=='boolean') state[id].favorite=false;
  return state[id];
}
function saveState(){
  localStorage.setItem(stateKey,JSON.stringify(state));
  updateStats();
  const el=$('#saveIndicator'); if(el){el.textContent='Saved just now';clearTimeout(saveState.t);saveState.t=setTimeout(()=>el.textContent='Your progress is saved automatically',1200);}
}
function getStatusCounts(){
  const values=Object.values(state);
  return {
    applied:values.filter(x=>['Applied','Interview','Offer'].includes(x.status)).length,
    interview:values.filter(x=>x.status==='Interview').length,
    offer:values.filter(x=>x.status==='Offer').length
  };
}
function updateStats(){
  const c=getStatusCounts();
  ['appliedCount','heroApplied'].forEach(id=>{const e=$('#'+id);if(e)e.textContent=c.applied});
  ['interviewCount','heroInterview'].forEach(id=>{const e=$('#'+id);if(e)e.textContent=c.interview});
  ['offerCount','heroOffer'].forEach(id=>{const e=$('#'+id);if(e)e.textContent=c.offer});
  const total=$('#heroTotal');if(total)total.textContent=(window.VA_AGENCIES?.length||118)+'+';
}
function hostname(url){try{return new URL(url).hostname.replace(/^www\./,'www.')}catch{return 'official website'}}
function regionPrimary(a){return (a.region||'Global').split('/')[0].trim()}
function tagsFor(a){
  const tags=[];
  if(a.scope) tags.push(a.scope);
  const r=regionPrimary(a); if(r && !tags.includes(r)) tags.push(r);
  if(/remote/i.test(a.roles||'')) tags.push('Remote');
  return tags.slice(0,3);
}
function roleLabel(a){return (a.roles||'Virtual Assistant').replace(/\s+/g,' ').trim()}
function logoFor(a){return logoMap[a.id]||null}
function initials(name){return name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function cardBanner(a){
  const b=bannerMap[a.id]||{};
  const logo=logoFor(a);
  const theme=b.theme||(['purple','dark','green'][a.id%3]||'');
  const headline=b.headline||`${a.name}\\nRemote Opportunities`;
  const sub=b.sub||`Explore ${roleLabel(a)} opportunities.`;
  return `<div class="card-banner ${theme}">
    <div class="banner-copy">
      ${logo?`<img class="banner-logo" src="${logo}" alt="${escapeHtml(a.name)} official logo">`:`<div class="banner-logo official-logo-slot" aria-label="Official logo pending verification">${escapeHtml(a.name)}</div>`}
      <div class="banner-headline">${escapeHtml(headline).replace(/\\n/g,'<br>')}</div>
      <div class="banner-sub">${escapeHtml(sub)}</div>
    </div>
    <div class="banner-visual"></div>
  </div>`;
}
function cardMarkup(a,index){
  const r=getRecord(a.id), logo=logoFor(a), tags=tagsFor(a);
  const colors=['','','purple','magenta','green','purple','magenta'];
  const badgeClass=colors[index%colors.length];
  return `<article class="agency-card" data-id="${a.id}">
    <div class="card-browser">
      <div class="browser-left"><span class="browser-dots">● ● ●</span><span class="number-badge ${badgeClass}">#${String(index+1).padStart(3,'0')}</span><span class="domain"><span class="domain-icon">◉</span>www.${escapeHtml(hostname(a.url).replace(/^www\./,''))}</span></div>
      <button class="favorite ${r.favorite?'active':''}" data-favorite="${a.id}" aria-label="${r.favorite?'Remove from favorites':'Add to favorites'}">${r.favorite?'♥':'♡'}</button>
    </div>
    ${cardBanner(a)}
    <div class="card-body">
      <div class="company-row">
        <div class="company-name">
          <span class="mini-logo">${logo?`<img src="${logo}" alt="">`:escapeHtml(initials(a.name))}</span>
          <strong>${escapeHtml(a.name)}</strong><span class="verified">◆</span>
        </div>
        <span class="status-pill">${escapeHtml(r.status)}</span>
      </div>
      <div class="meta-line"><span>⌖ ${escapeHtml(regionPrimary(a))}</span><span>|</span><span class="role-line">▣ ${escapeHtml(roleLabel(a))}</span></div>
      <div class="tags">${tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="card-actions">
        <button class="card-btn" data-preview="${a.id}" aria-label="Preview ${escapeHtml(a.name)}">◉ &nbsp;Preview</button>
        <a class="card-btn primary" href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer" data-apply="${a.id}">Visit / Apply ↗</a>
        <select class="card-status" data-status="${a.id}" aria-label="Status for ${escapeHtml(a.name)}">${statuses.map(s=>`<option ${s===r.status?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    </div>
  </article>`;
}

function renderCards(){
  const q=($('#searchInput')?.value||'').trim().toLowerCase();
  const region=$('#regionFilter')?.value||'';
  const role=$('#roleFilter')?.value||'';
  const status=$('#statusFilter')?.value||'';
  const sort=$('#sortFilter')?.value||'recommended';
  let list=[...(window.VA_AGENCIES||[])];
  list=list.filter(a=>{
    const r=getRecord(a.id);
    const hay=[a.name,a.url,a.region,a.scope,a.roles,a.eligibility].join(' ').toLowerCase();
    const roleMatch=!role||((a.roles||'').toLowerCase().includes(role.toLowerCase()));
    const regionMatch=!region||((a.region||'').toLowerCase().includes(region.toLowerCase()));
    return (!q||hay.includes(q))&&roleMatch&&regionMatch&&(!status||r.status===status);
  });
  if(sort==='az') list.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='za') list.sort((a,b)=>b.name.localeCompare(a.name));
  if(sort==='newest') list.sort((a,b)=>b.id-a.id);
  $('#agencyGrid').innerHTML=list.map((a,i)=>cardMarkup(a,i)).join('');
  $('#resultCount').textContent=`${list.length} opportunities found`;
  $('#emptyState').hidden=list.length!==0;
  bindCards();
}
function bindCards(){
  $$('[data-preview]').forEach(b=>b.addEventListener('click',()=>openPreview(Number(b.dataset.preview))));
  $$('[data-favorite]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();const r=getRecord(Number(b.dataset.favorite));r.favorite=!r.favorite;saveState();renderCards();
  }));
  $$('[data-status]').forEach(s=>s.addEventListener('change',()=>{getRecord(Number(s.dataset.status)).status=s.value;saveState();renderCards()}));
  $$('[data-apply]').forEach(a=>a.addEventListener('click',()=>{getRecord(Number(a.dataset.apply)).status='Applied';saveState();}));
}
function openPreview(id){
  activeAgency=(window.VA_AGENCIES||[]).find(a=>a.id===id); if(!activeAgency)return;
  const r=getRecord(id), logo=logoFor(activeAgency);
  $('#modalTitle').textContent=activeAgency.name;
  $('#modalFavicon').innerHTML=logo?`<img src="${logo}" alt="" style="width:100%;height:100%;object-fit:contain;background:#fff;border-radius:11px;padding:4px">`:escapeHtml(initials(activeAgency.name));
  $('#modalStatus').textContent=r.status.toUpperCase();
  $('#modalUrl').textContent=hostname(activeAgency.url);
  $('#modalRegion').textContent=activeAgency.region||'Global';
  $('#modalRoles').textContent=activeAgency.roles||'Virtual Assistant';
  $('#modalEligibility').textContent=activeAgency.eligibility||'Check the current vacancy for eligibility.';
  $('#modalStatusSelect').value=r.status;
  $('#modalNote').value=r.note||'';
  $('#visitBtn').href=activeAgency.url;
  const frame=$('#websiteFrame'), fallback=$('#frameFallback');
  fallback.classList.remove('show'); clearTimeout(frameTimer);
  frame.src='about:blank';
  setTimeout(()=>{frame.src=activeAgency.url;},20);
  frame.onload=()=>{clearTimeout(frameTimer);fallback.classList.remove('show')};
  frameTimer=setTimeout(()=>fallback.classList.add('show'),3200);
  $('#agencyModal').classList.add('open');$('#agencyModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
}
function closePreview(){clearTimeout(frameTimer);$('#websiteFrame').src='about:blank';$('#agencyModal').classList.remove('open');$('#agencyModal').setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');activeAgency=null}
function populateFilters(){
  const regions=new Set(), roles=new Set();
  (window.VA_AGENCIES||[]).forEach(a=>{
    regionPrimary(a).split(',').map(x=>x.trim()).forEach(x=>{if(x)regions.add(x)});
    (a.roles||'').split(',').map(x=>x.trim()).forEach(x=>{if(x)roles.add(x)});
  });
  $('#regionFilter').innerHTML='<option value="">◉  All Regions</option>'+[...regions].sort().map(x=>`<option>${escapeHtml(x)}</option>`).join('');
  $('#roleFilter').innerHTML='<option value="">▣  All Roles</option>'+[...roles].sort().map(x=>`<option>${escapeHtml(x)}</option>`).join('');
}

const header=$('#header'),progress=$('#progress');
window.addEventListener('scroll',()=>{
  header.classList.toggle('scrolled',scrollY>15);
  const max=document.documentElement.scrollHeight-innerHeight;
  progress.style.width=(max?scrollY/max*100:0)+'%';
}, {passive:true});
$('#menuBtn').addEventListener('click',()=>{
  const nav=$('#nav');const open=nav.classList.toggle('mobile-open');$('#menuBtn').textContent=open?'×':'☰';
});
$$('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('mobile-open');$('#menuBtn').textContent='☰'}));
$('#headerSearchBtn').addEventListener('click',()=>{document.querySelector('#directory').scrollIntoView({behavior:'smooth'});setTimeout(()=>$('#searchInput').focus(),450)});
$('#signInBtn').addEventListener('click',()=>$('#authModal').classList.add('open'));
$('#createAccountBtn').addEventListener('click',()=>$('#authModal').classList.add('open'));
$$('[data-close-auth]').forEach(x=>x.addEventListener('click',()=>$('#authModal').classList.remove('open')));
$('#modalClose').addEventListener('click',closePreview);
$$('[data-close-modal]').forEach(x=>x.addEventListener('click',closePreview));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePreview();$('#authModal').classList.remove('open')}});

['searchInput','regionFilter','roleFilter','statusFilter','sortFilter'].forEach(id=>$(('#'+id)).addEventListener(id==='searchInput'?'input':'change',renderCards));
$('#modalStatusSelect').addEventListener('change',()=>{
  if(!activeAgency)return;getRecord(activeAgency.id).status=$('#modalStatusSelect').value;saveState();$('#modalStatus').textContent=$('#modalStatusSelect').value.toUpperCase();renderCards();
});
$('#modalNote').addEventListener('input',()=>{
  if(!activeAgency)return;getRecord(activeAgency.id).note=$('#modalNote').value;saveState();
});

populateFilters();renderCards();updateStats();
