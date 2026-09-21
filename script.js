
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const statuses=['Not Started','Saved','Applied','Interview','Offer','Rejected','Not Eligible'];
const legacyStateKey='vaConnectReferenceV11';
const userKey='vaConnectUserEmail';
const guestStateKey='vaConnectGuestTracker';
let currentUserEmail='';
let state=loadStoredState();
let activeAgency=null, frameTimer=null;
let authMode='signin';
let firebaseConfigured=false;
let authResolved=false;
let cloudSaveTimer=null;

function loadStoredState(){
  try{return JSON.parse(localStorage.getItem(guestStateKey)||localStorage.getItem(legacyStateKey)||'{}')||{}}catch{return {}}
}
function cloneState(value){try{return JSON.parse(JSON.stringify(value||{}))}catch{return {}}}
function mergeStates(primary, secondary){
  const out=cloneState(primary);
  Object.entries(secondary||{}).forEach(([id,rec])=>{if(!out[id])out[id]=cloneState(rec)});
  return out;
}
function setUserState(next){state=cloneState(next);renderCards();updateStats();renderTracker();updateAuthUI()}
async function handleFirebaseAuth(detail){
  if(detail.loading)return;
  authResolved=true;
  if(detail.user){
    currentUserEmail=(detail.user.email||'').trim().toLowerCase();
    localStorage.setItem(userKey,currentUserEmail);
    const guest=loadStoredState();
    const cloud=detail.tracker||{};
    state=mergeStates(cloud,guest);
    try{await window.VAConnectCloud.saveTracker(detail.user,state)}catch(error){console.warn('VA CONNECT cloud sync failed:',error)}
    localStorage.setItem(`vaConnectTracker:${currentUserEmail}`,JSON.stringify(state));
    updateAuthUI();renderCards();updateStats();renderTracker();closeWelcome();
  }else{
    currentUserEmail='';
    localStorage.removeItem(userKey);
    state=loadStoredState();
    updateAuthUI();renderCards();updateStats();renderTracker();
  }
}
function saveState(){
  localStorage.setItem(currentUserEmail?`vaConnectTracker:${currentUserEmail}`:guestStateKey,JSON.stringify(state));
  updateStats();renderTracker();
  const el=$('#saveIndicator');if(el){el.textContent=currentUserEmail?'Saved to your account':'Saved on this device';clearTimeout(saveState.t);saveState.t=setTimeout(()=>el.textContent=currentUserEmail?'Synced to your account':'Your progress is saved automatically',1200)}
  if(currentUserEmail&&window.VAConnectCloud?.isConfigured()){
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer=setTimeout(async()=>{try{await window.VAConnectCloud.saveTracker(window.VAConnectCloud.currentUser(),state)}catch(error){console.warn('Cloud save failed:',error)}},250);
  }
}
function getRecord(id){
  if(!state[id])state[id]={status:'Not Started',note:'',favorite:false};
  if(typeof state[id].favorite!=='boolean')state[id].favorite=false;
  return state[id];
}
function getStatusCounts(){
  const values=Object.values(state);
  return {applied:values.filter(x=>['Applied','Interview','Offer'].includes(x.status)).length,interview:values.filter(x=>x.status==='Interview').length,offer:values.filter(x=>x.status==='Offer').length};
}
function updateStats(){
  const c=getStatusCounts();
  ['appliedCount','heroApplied'].forEach(id=>{const e=$('#'+id);if(e)e.textContent=c.applied});
  ['interviewCount','heroInterview'].forEach(id=>{const e=$('#'+id);if(e)e.textContent=c.interview});
  ['offerCount','heroOffer'].forEach(id=>{const e=$('#'+id);if(e)e.textContent=c.offer});
  const total=$('#heroTotal');if(total)total.textContent=(window.VA_AGENCIES?.length||118)+'+';
}
function updateAuthUI(){
  const signed=!!currentUserEmail;
  const sign=$('#signInBtn'),create=$('#createAccountBtn');
  if(sign)sign.textContent=signed?currentUserEmail:'Sign In';
  if(create)create.textContent=signed?'Sign Out':'Create Account';
  const email=$('#authEmail'),account=$('#authAccountState');
  if(email&&signed)email.value=currentUserEmail;
  if(account)account.textContent=signed?`Signed in as ${currentUserEmail}`:'Sign in to keep your tracker synced across devices.';
  const signout=$('#authSignOut');if(signout)signout.style.display=signed?'inline-flex':'none';
}
let trackerFilter='all';
function trackedAgencies(){return(window.VA_AGENCIES||[]).filter(a=>getRecord(a.id).status!=='Not Started'||getRecord(a.id).favorite)}
function trackerRow(a){
  const r=getRecord(a.id),statusClass=r.status.toLowerCase().replace(/\s+/g,'-'),logo=logoFor(a);
  const logoBox=logo?`<span class="tracker-logo has-image"><img src="${escapeHtml(logo)}" alt="${escapeHtml(a.name)} logo" loading="lazy" referrerpolicy="no-referrer"></span>`:`<span class="tracker-logo text-only" aria-hidden="true"><span class="generic-brand-icon">✦</span></span>`;
  return `<article class="tracker-row" data-track-id="${a.id}"><div class="tracker-company">${logoBox}<div><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(regionPrimary(a))} · ${escapeHtml(roleLabel(a))}</small></div></div><div class="tracker-stage"><span class="tracker-stage-dot ${statusClass}"></span><select class="tracker-stage-select" data-track-status="${a.id}" aria-label="Update ${escapeHtml(a.name)} status">${statuses.map(s=>`<option${r.status===s?' selected':''}>${s}</option>`).join('')}</select></div><div class="tracker-note">${r.note?escapeHtml(r.note):'No personal note added'}</div><div class="tracker-actions"><button type="button" class="tracker-open" data-track-open="${a.id}">View</button><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer" data-track-apply="${a.id}">Apply ↗</a></div></article>`;
}
function renderTracker(){
  const tracked=trackedAgencies(),counts={Saved:0,Applied:0,Interview:0,Offer:0};
  tracked.forEach(a=>{const st=getRecord(a.id).status;if(counts[st]!==undefined)counts[st]++});
  const all=$('#trackAllCount');if(all)all.textContent=tracked.length;
  const saved=$('#trackSavedCount');if(saved)saved.textContent=counts.Saved;
  const applied=$('#trackAppliedCount');if(applied)applied.textContent=counts.Applied;
  const interview=$('#trackInterviewCount');if(interview)interview.textContent=counts.Interview;
  const offer=$('#trackOfferCount');if(offer)offer.textContent=counts.Offer;
  const list=trackerFilter==='all'?tracked:tracked.filter(a=>getRecord(a.id).status===trackerFilter);
  const title=$('#trackerTitle'),subtitle=$('#trackerSubtitle');
  if(title)title.textContent=trackerFilter==='all'?'All Tracked Opportunities':`${trackerFilter} Opportunities`;
  if(subtitle)subtitle.textContent=list.length?`${list.length} ${list.length===1?'opportunity':'opportunities'} in this stage.`:'Nothing is in this stage yet.';
  const container=$('#trackerList'),empty=$('#trackerEmpty');
  if(container)container.innerHTML=list.map(trackerRow).join('');
  if(empty)empty.hidden=list.length!==0;
  $$('.tracker-stat').forEach(btn=>btn.classList.toggle('active',(btn.dataset.trackFilter||'all')===trackerFilter));
  $$('#trackerList [data-track-open]').forEach(btn=>btn.addEventListener('click',()=>openPreview(Number(btn.dataset.trackOpen))));
  $$('#trackerList [data-track-status]').forEach(select=>select.addEventListener('change',()=>{getRecord(Number(select.dataset.trackStatus)).status=select.value;saveState()}));
}


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
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function officialFavicon(a){
  try{
    const u=new URL(a.url);
    return `${u.origin}/favicon.ico`;
  }catch{return ''}
}
function logoFor(a){
  try{ const u=new URL(a.url); return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=128`; }catch{return ''}
}
function coverFor(a){ return (window.VA_AGENCY_COVERS&&window.VA_AGENCY_COVERS[String(a.id)])||''; }
function cardBanner(a,index){
  const cover=coverFor(a);
  if(cover){
    const safeName=escapeHtml(a.name);
    return `<div class="card-banner cover-photo" data-agency="${a.id}">
      <img class="card-cover-image" src="${escapeHtml(cover)}" alt="${safeName} official website cover" loading="lazy" decoding="async" referrerpolicy="no-referrer" draggable="false" onerror="this.onerror=null;this.style.display='none';this.parentElement.classList.add('image-failed');">
      <div class="agency-cover-fallback" aria-hidden="true"><div class="agency-cover-fallback-glow"></div><span>${safeName}</span></div>
      <div class="cover-photo-shade" aria-hidden="true"></div>
      <div class="banner-badge cover-badge"><span>✓</span>#${String(index+1).padStart(2,'0')}</div>
      <span class="banner-status cover-status">${escapeHtml(getRecord(a.id).status)}</span>
    </div>`;
  }
  const b=bannerMap[a.id]||{};
  const theme=b.theme||(['','wing','purple','green','gold','dark'][a.id]||'');
  const headline=b.headline||`${a.name}\nRemote Opportunities`;
  const sub=b.sub||`Explore ${roleLabel(a)} opportunities.`;
  const verified=a.id<=118;
  return `<div class="card-banner ${theme}" data-agency="${a.id}">
    <div class="banner-badge ${theme}"><span>✓</span>#${String(index+1).padStart(2,'0')}</div>
    <span class="banner-status">${escapeHtml(getRecord(a.id).status)}</span>
    <div class="banner-copy">
      <div class="cover-logo-lockup" aria-label="${escapeHtml(a.name)}">
        <span class="cover-logo-name">${escapeHtml(a.name)}</span>
      </div>
      <div class="banner-headline">${escapeHtml(headline).replace(/\\n/g,'<br>')}</div>
      <div class="banner-sub">${escapeHtml(sub)}</div>
      ${verified?'<span class="banner-verified">Official directory listing</span>':''}
    </div>
    <div class="banner-visual" aria-hidden="true">
      <span class="shape shape-a"></span><span class="shape shape-b"></span><span class="shape shape-c"></span>
    </div>
  </div>`;
}
function cardMarkup(a,index){
  const r=getRecord(a.id), logo=logoFor(a), tags=tagsFor(a);
  const colors=['','','purple','magenta','green','gold','dark'];
  const badgeClass=colors[a.id%colors.length];
  return `<article class="agency-card" data-id="${a.id}">
    ${cardBanner(a,index)}
    <div class="card-body">
      <div class="company-row">
        <div class="company-name">
          <span class="company-wordmark">${escapeHtml(a.name)}</span><strong></strong><span class="verified" aria-label="Verified directory entry">✓</span>
        </div>
        <button class="favorite ${r.favorite?'active':''}" data-favorite="${a.id}" aria-label="${r.favorite?'Remove from favorites':'Add to favorites'}">${r.favorite?'★':'☆'}</button>
      </div>
      <div class="meta-line"><span>● ${escapeHtml(regionPrimary(a))}</span><span>|</span><span class="role-line">${escapeHtml(roleLabel(a))}</span></div>
      <div class="tags">${tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      <div class="card-actions">
        <button class="card-btn" data-preview="${a.id}" aria-label="Preview ${escapeHtml(a.name)}">◉ &nbsp;Preview</button>
        <select class="card-status" data-status="${a.id}" aria-label="Update ${escapeHtml(a.name)} application status">${statuses.map(s=>`<option${r.status===s?' selected':''}>${s}</option>`).join('')}</select>
        <a class="card-btn primary" href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer" data-apply="${a.id}">Visit / Apply ↗</a>
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
  $('#modalFavicon').innerHTML=logo?`<img src="${escapeHtml(logo)}" alt="${escapeHtml(activeAgency.name)} logo" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:contain;background:#fff;border-radius:11px;padding:4px">`:`<span class="generic-brand-icon">✦</span>`;
  $('#modalStatus').textContent=r.status.toUpperCase();
  $('#modalUrl').textContent=hostname(activeAgency.url);
  $('#modalRegion').textContent=activeAgency.region||'Global';
  $('#modalRoles').textContent=activeAgency.roles||'Virtual Assistant';
  $('#modalEligibility').textContent=activeAgency.eligibility||'Check the current vacancy for eligibility.';
  $('#modalStatusSelect').value=r.status;
  $('#modalNote').value=r.note||'';
  $('#visitBtn').href=activeAgency.url;

  // V1-style preview merge: show the same supplied website screenshot used
  // on the card immediately, then let the current live/proxy preview take over.
  const previewCover=$('#previewCoverLayer');
  const previewCoverImage=$('#previewCoverImage');
  const previewCoverName=$('#previewCoverName');
  const cover=coverFor(activeAgency);
  if(cover){
    previewCoverImage.src=cover;
    previewCoverImage.alt=`${activeAgency.name} official website preview`;
    previewCoverName.textContent=activeAgency.name;
    previewCover.classList.add('has-cover');
  }else{
    previewCoverImage.removeAttribute('src');
    previewCoverName.textContent='Official Website';
    previewCover.classList.remove('has-cover');
  }

  const frame=$('#websiteFrame'), fallback=$('#frameFallback');
  clearTimeout(frameTimer);
  let mode='cover';
  const directUrl=activeAgency.url;
  const proxyUrl=`/preview?url=${encodeURIComponent(activeAgency.url)}`;
  const loading=`<div class="preview-logo-box">${logo?`<img src="${escapeHtml(logo)}" alt="${escapeHtml(activeAgency.name)} logo" referrerpolicy="no-referrer">`:'<span class="generic-brand-icon">✦</span>'}</div><strong>${escapeHtml(activeAgency.name)}</strong><span>Official website screenshot preview</span>`;
  const failed=`<div class="preview-logo-box">${logo?`<img src="${escapeHtml(logo)}" alt="${escapeHtml(activeAgency.name)} logo" referrerpolicy="no-referrer">`:'<span class="generic-brand-icon">✦</span>'}</div><strong>${escapeHtml(activeAgency.name)}</strong><span>Use Visit / Apply to open the live official website.</span>`;

  // The supplied website screenshot is the stable V1-style Preview. Do not
  // replace it with an iframe that can remain stuck on an endless loader.
  if(cover){
    mode='cover';
    frame.src='about:blank';
    frame.style.display='none';
    frame.style.opacity='0';
    frame.setAttribute('aria-hidden','true');
    fallback.classList.remove('show');
    previewCover.classList.add('has-cover');
  }else{
    // Agencies without a supplied screenshot can still use the existing
    // live/proxy fallback path.
    fallback.classList.add('show');
    fallback.innerHTML=loading;
    frame.style.display='block';
    frame.style.opacity='1';
    frame.setAttribute('aria-hidden','false');
    const showProxy=()=>{
      mode='proxy';
      frame.onload=()=>{clearTimeout(frameTimer);fallback.classList.remove('show');frame.style.display='block';frame.style.opacity='1';};
      frame.onerror=()=>{frame.style.display='none';fallback.classList.add('show');fallback.innerHTML=failed;};
      frame.src=proxyUrl;
      frameTimer=setTimeout(()=>{if(mode==='proxy'&&fallback.classList.contains('show')){frame.style.display='none';fallback.innerHTML=failed;}},12000);
    };
    mode='direct';
    frame.onload=()=>{if(mode==='direct'){clearTimeout(frameTimer);fallback.classList.remove('show');}};
    frame.onerror=()=>{if(mode==='direct')showProxy();};
    frame.src=directUrl;
    frameTimer=setTimeout(()=>{if(mode==='direct')showProxy();},4500);
  }
  $('#agencyModal').classList.add('open');$('#agencyModal').setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
}
function closePreview(){clearTimeout(frameTimer);$('#websiteFrame').src='about:blank';$('#websiteFrame').style.display='none';$('#websiteFrame').style.opacity='1';$('#previewCoverLayer')?.classList.remove('has-cover');$('#agencyModal').classList.remove('open');$('#agencyModal').setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');activeAgency=null}
function populateFilters(){
  const regions=new Set(), roles=new Set();
  (window.VA_AGENCIES||[]).forEach(a=>{
    regionPrimary(a).split(',').map(x=>x.trim()).forEach(x=>{if(x)regions.add(x)});
    (a.roles||'').split(',').map(x=>x.trim()).forEach(x=>{if(x)roles.add(x)});
  });
  $('#regionFilter').innerHTML='<option value="">◉  All Regions</option>'+[...regions].sort().map(x=>`<option>${escapeHtml(x)}</option>`).join('');
  $('#roleFilter').innerHTML='<option value="">▣  All Roles</option>'+[...roles].sort().map(x=>`<option>${escapeHtml(x)}</option>`).join('');
}


// Reference-style navigation: the active cyan pill follows the visible section.
function updateActiveNav(){
  const links=$$('#nav a');
  const sections=[
    ['#home','home'],['#directory','directory'],['#discover','discover'],
    ['#track','track'],['#resources','resources'],['#about','about']
  ];
  let current='home';
  const y=window.scrollY+110;
  sections.forEach(([sel,id])=>{
    const el=$(sel);
    if(el && el.offsetTop<=y) current=id;
  });
  links.forEach(a=>{
    const id=(a.getAttribute('href')||'').slice(1);
    a.classList.toggle('active',id===current);
    if(id===current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
}

function openWelcome(){const modal=$('#welcomeModal');if(modal){modal.classList.add('open');modal.setAttribute('aria-hidden','false')}}
function closeWelcome(){const modal=$('#welcomeModal');if(modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}}
function openAuth(mode='signin'){
  authMode=mode==='create'?'create':'signin';
  const title=$('#authTitle'),submit=$('#authSubmit'),toggle=$('#authModeToggle'),password=$('#authPassword');
  if(title)title.textContent=authMode==='create'?'Create Account':'Sign In';
  if(submit)submit.textContent=authMode==='create'?'Create Account':'Sign In';
  if(toggle)toggle.textContent=authMode==='create'?'Already have an account? Sign in':'Need an account? Create one';
  if(password)password.autocomplete=authMode==='create'?'new-password':'current-password';
  $('#authModal')?.classList.add('open');closeWelcome();
}
async function submitAuthForm(e){
  e.preventDefault();
  const email=String($('#authEmail')?.value||'').trim().toLowerCase();
  const password=String($('#authPassword')?.value||'');
  const msg=$('#authMessage');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){if(msg)msg.textContent='Please enter a valid email address.';return}
  if(password.length<6){if(msg)msg.textContent='Password must be at least 6 characters.';return}
  if(!window.VAConnectCloud?.isConfigured()){if(msg)msg.textContent='Your Firebase account backend is not connected yet. Add the VA CONNECT Firebase Web App configuration first.';return}
  try{
    if(msg)msg.textContent=authMode==='create'?'Creating your secure account…':'Signing you in…';
    if(authMode==='create')await window.VAConnectCloud.createAccount(email,password);else await window.VAConnectCloud.signIn(email,password);
    $('#authModal')?.classList.remove('open');
  }catch(error){
    const code=error?.code||'';
    const text=code.includes('email-already-in-use')?'That email already has an account. Switch to Sign In.':code.includes('invalid-credential')||code.includes('invalid-login-credentials')?'Email or password is incorrect.':code.includes('weak-password')?'Choose a stronger password.':(error?.message||'Unable to sign in right now.');
    if(msg)msg.textContent=text;
  }
}


const header=$('#header'),progress=$('#progress');
window.addEventListener('scroll',()=>{
  header.classList.toggle('scrolled',scrollY>15);
  const max=document.documentElement.scrollHeight-innerHeight;
  progress.style.width=(max?scrollY/max*100:0)+'%';
  updateActiveNav();
}, {passive:true});
$('#menuBtn')?.addEventListener('click',()=>{
  const nav=$('#nav');const open=nav.classList.toggle('mobile-open');$('#menuBtn').textContent=open?'×':'☰';
});
$$('#nav a').forEach(a=>a.addEventListener('click',()=>{$('#nav').classList.remove('mobile-open');$('#menuBtn').textContent='☰'}));
$('#headerSearchBtn')?.addEventListener('click',()=>{document.querySelector('#directory').scrollIntoView({behavior:'smooth'});setTimeout(()=>$('#searchInput').focus(),450)});
$('#signInBtn')?.addEventListener('click',()=>{if(currentUserEmail)window.VAConnectCloud?.signOut();else openAuth('signin')});
$('#createAccountBtn')?.addEventListener('click',()=>{if(currentUserEmail)window.VAConnectCloud?.signOut();else openAuth('create')});
$('#welcomeSignIn')?.addEventListener('click',()=>openAuth('signin'));
$('#welcomeCreate')?.addEventListener('click',()=>openAuth('create'));
$('#welcomeGuest')?.addEventListener('click',closeWelcome);
$('#authEmailForm')?.addEventListener('submit',submitAuthForm);
$('#googleSignInBtn')?.addEventListener('click',async()=>{
  const msg=$('#authMessage');
  if(!window.VAConnectCloud?.isConfigured()){if(msg)msg.textContent='Your Firebase account backend is not connected yet. Add the VA CONNECT Firebase Web App configuration first.';return}
  try{
    if(msg)msg.textContent='Opening Google sign-in…';
    await window.VAConnectCloud.signInWithGoogle();
    if(msg)msg.textContent='Signed in with Google. Your account data is synced securely.';
    $('#authModal')?.classList.remove('open');
  }catch(error){
    const code=error?.code||'';
    if(msg)msg.textContent=code.includes('popup-closed-by-user')?'Google sign-in was cancelled.':code.includes('popup-blocked')?'Please allow pop-ups for VA CONNECT, then try again.':(error?.message||'Unable to sign in with Google right now.');
  }
});
$('#authModeToggle')?.addEventListener('click',()=>openAuth(authMode==='create'?'signin':'create'));
$('#authSignOut')?.addEventListener('click',()=>window.VAConnectCloud?.signOut());
$$('[data-close-auth]').forEach(x=>x.addEventListener('click',()=>$('#authModal').classList.remove('open')));
$('#modalClose')?.addEventListener('click',closePreview);
$$('[data-close-modal]').forEach(x=>x.addEventListener('click',closePreview));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePreview();$('#authModal').classList.remove('open')}});

['searchInput','regionFilter','roleFilter','statusFilter','sortFilter'].forEach(id=>{const e=$('#'+id);if(e)e.addEventListener(id==='searchInput'?'input':'change',renderCards)});
$('#modalStatusSelect')?.addEventListener('change',()=>{
  if(!activeAgency)return;getRecord(activeAgency.id).status=$('#modalStatusSelect').value;saveState();$('#modalStatus').textContent=$('#modalStatusSelect').value.toUpperCase();renderCards();
});
$('#modalNote')?.addEventListener('input',()=>{
  if(!activeAgency)return;getRecord(activeAgency.id).note=$('#modalNote').value;saveState();
});
$$('[data-track-filter]').forEach(btn=>btn.addEventListener('click',()=>{trackerFilter=btn.dataset.trackFilter||'all';renderTracker();document.querySelector('#track').scrollIntoView({behavior:'smooth',block:'start'});}));
$('#trackerClear')?.addEventListener('click',()=>document.querySelector('#directory')?.scrollIntoView({behavior:'smooth',block:'start'}));
$('#trackerBrowse')?.addEventListener('click',()=>document.querySelector('#directory')?.scrollIntoView({behavior:'smooth',block:'start'}));

populateFilters();renderCards();updateStats();renderTracker();updateActiveNav();updateAuthUI();

window.addEventListener('va:firebase-ready',e=>{firebaseConfigured=!!e.detail?.configured; if(!firebaseConfigured){authResolved=true;const msg=$('#authMessage');if(msg)msg.textContent='Account sync needs the VA CONNECT Firebase Web App configuration.';}});
window.addEventListener('va:auth-state',e=>{handleFirebaseAuth(e.detail||{})});

// V41: unsigned visitors may browse and save locally, but account-only progress
// becomes available after Firebase Authentication signs them in.
(()=>{const params=new URLSearchParams(location.search);const hasAuth=params.get('auth');if(!hasAuth)setTimeout(()=>{if(authResolved&&!currentUserEmail)openWelcome()},450)})();

// V30: support deep links from standalone pages and the tracker.
(()=>{const params=new URLSearchParams(location.search);const auth=params.get('auth');const previewId=Number(params.get('preview'));if(auth&&['signin','create'].includes(auth)){openAuth(auth)}if(Number.isInteger(previewId)&&previewId>0){setTimeout(()=>openPreview(previewId),80)}})();
