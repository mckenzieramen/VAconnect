const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const statuses = ['Not Started','Saved','Applied','Interview','Offer','Rejected','Not Eligible'];
const guestStateKey = 'vaConnectTrackerGuestV2';
const accountsKey = 'vaConnectAccountsV1';
const sessionKey = 'vaConnectSessionV1';
let state = {};
let activeAgency = null;
let applicationAgency = null;

const header = $('#header');
const progress = $('#progress');
const menuBtn = $('#menuBtn');
const loginBtn = $('#loginBtn');
const accountChip = $('#accountChip');
const accountMenu = $('#accountMenu');

function currentSession(){ return localStorage.getItem(sessionKey) || ''; }
function userStateKey(){ const email=currentSession(); return email ? `vaConnectTracker:${email.toLowerCase()}` : guestStateKey; }
function loadState(){ try { state = JSON.parse(localStorage.getItem(userStateKey()) || '{}') || {}; } catch { state = {}; } }
function saveState(){ localStorage.setItem(userStateKey(), JSON.stringify(state)); updateStats(); }
function getAccounts(){ try{return JSON.parse(localStorage.getItem(accountsKey)||'{}')||{};}catch{return {};} }
function saveAccounts(accounts){localStorage.setItem(accountsKey,JSON.stringify(accounts));}
function getRecord(id){ if(!state[id]) state[id]={status:'Not Started',note:''}; return state[id]; }
function statusClass(status){ return status.toLowerCase().replace(/\s+/g,'-'); }
function domainOf(url){ try{return new URL(url).hostname.replace(/^www\./,'')}catch{return ''} }
function initials(name){ return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
function splitRegions(str){ return str.split('/').map(x=>x.trim()).filter(Boolean); }
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function coverTheme(id){ return ['cover-ocean','cover-sky','cover-violet','cover-mint','cover-sand','cover-indigo'][((Number(id)||1)-1)%6]; }
function logoMarkup(a){ return a.name==='Ataraxis' ? '<img class="cover-real-logo" src="ataraxis-main.png" alt="Ataraxis logo">' : `<div class="cover-mini-logo">${escapeHtml(initials(a.name))}</div>`; }
function coverMarkup(a, compact=false){
  const theme=coverTheme(a.id);
  return `<div class="agency-cover ${theme}"><div class="cover-glow"></div><div class="cover-grid"></div><div class="cover-content">${logoMarkup(a)}<div class="cover-copy"><strong>${escapeHtml(a.name)}</strong><span>${escapeHtml((a.roles||'Virtual Assistant opportunities').split(',').slice(0,2).join(' · '))}</span></div></div><div class="cover-caption">REMOTE OPPORTUNITY</div></div>`;
}

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
    card.innerHTML=`<button class="agency-cover-button" type="button" data-details="${a.id}" aria-label="View details for ${escapeHtml(a.name)}">${coverMarkup(a)}</button>
      <div class="agency-body"><div class="agency-title"><div><span class="agency-index">#${String(a.id).padStart(3,'0')}</span><h3>${escapeHtml(a.name)}</h3></div><span class="status-pill ${statusClass(rec.status)}">${escapeHtml(rec.status)}</span></div>
      <p class="agency-role">${escapeHtml(a.roles)}</p><div class="agency-tags"><span>${escapeHtml(a.scope)}</span><span>${escapeHtml(splitRegions(a.region)[0]||'Global')}</span></div>
      <div class="agency-actions"><button class="details-btn preview-btn" data-details="${a.id}" type="button">◉ Preview</button><button class="apply-btn apply-now-card" data-apply="${a.id}" type="button">Apply Now →</button><a class="visit-btn" href="${a.url}" target="_blank" rel="noopener noreferrer">Visit ↗</a><select class="card-status" data-status="${a.id}" aria-label="Application status for ${escapeHtml(a.name)}">${statuses.map(s=>`<option ${s===rec.status?'selected':''}>${s}</option>`).join('')}</select></div></div>`;
    grid.appendChild(card);
  });
  bindCards();
}
function bindCards(){
  $$('[data-details]').forEach(b=>b.addEventListener('click',()=>openModal(Number(b.dataset.details))));
  $$('[data-apply]').forEach(b=>b.addEventListener('click',()=>openApplication(Number(b.dataset.apply))));
  $$('[data-status]').forEach(s=>s.addEventListener('change',()=>{ const id=Number(s.dataset.status); getRecord(id).status=s.value; saveState(); render(); }));
}

function updateStats(){
  const counts=Object.values(state).reduce((o,r)=>{o[r.status]=(o[r.status]||0)+1;return o;},{});
  $('#appliedCount').textContent=counts.Applied||0; $('#interviewCount').textContent=counts.Interview||0; $('#offerCount').textContent=counts.Offer||0;
  updateAccountUI();
}
function openModal(id){
  activeAgency=VA_AGENCIES.find(a=>a.id===id); if(!activeAgency)return;
  const rec=getRecord(id), modal=$('#agencyModal');
  $('#modalTitle').textContent=activeAgency.name; $('#modalRegion').textContent=activeAgency.region; $('#modalRoles').textContent=activeAgency.roles; $('#modalEligibility').textContent=activeAgency.eligibility;
  $('#visitBtn').href=activeAgency.url; $('#modalStatus').textContent=rec.status.toUpperCase(); $('#modalStatus').className='status-badge '+statusClass(rec.status); $('#modalStatusSelect').value=rec.status; $('#modalNote').value=rec.note||'';
  $('#modalFavicon').textContent=initials(activeAgency.name); $('#modalCover').innerHTML=coverMarkup(activeAgency,true);
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
}
function closeModal(){ $('#agencyModal').classList.remove('open'); $('#agencyModal').setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); activeAgency=null; }
$('#modalClose').addEventListener('click',closeModal); $$('[data-close-modal]').forEach(x=>x.addEventListener('click',closeModal));
$('#modalStatusSelect').addEventListener('change',e=>{if(!activeAgency)return;getRecord(activeAgency.id).status=e.target.value;saveState();$('#modalStatus').textContent=e.target.value.toUpperCase();$('#modalStatus').className='status-badge '+statusClass(e.target.value);render();});
$('#modalNote').addEventListener('input',e=>{if(!activeAgency)return;getRecord(activeAgency.id).note=e.target.value;saveState();});

['searchInput','scopeFilter','regionFilter','statusFilter'].forEach(id=>$( '#'+id).addEventListener(id==='searchInput'?'input':'change',render));
$('#resetBtn').addEventListener('click',()=>{$('#searchInput').value='';scopeFilter.value='';regionFilter.value='';$('#statusFilter').value='';render();});

function openApplication(id){
  applicationAgency=VA_AGENCIES.find(a=>a.id===id); if(!applicationAgency)return;
  const email=currentSession();
  const account=email ? (getAccounts()[email]||{}) : {};
  const rec=getRecord(id);
  $('#applicationCompany').textContent=applicationAgency.name;
  $('#applicationTitle').textContent=`Apply for ${applicationAgency.name}.`;
  $('#applicationSubtitle').textContent=email ? `You're signed in as ${email}. Your application will be added to your tracker.` : 'Submit your application through VA Connect and keep the progress in one place.';
  $('#applicationName').value=account.name||'';
  $('#applicationEmail').value=email||'';
  $('#applicationPhone').value=rec.application?.phone||'';
  $('#applicationRole').value=rec.application?.role||((applicationAgency.roles||'').split(',')[0]||'Virtual Assistant');
  $('#applicationResume').value=rec.application?.resume||'';
  $('#applicationAvailability').value=rec.application?.availability||'Immediately';
  $('#applicationMessage').value=rec.application?.message||'';
  $('#applicationConsent').checked=false;
  $('#applicationMessage').textContent='';
  $('#applicationMessage').className='application-message';
  $('#applicationVisitBtn').onclick=()=>window.open(applicationAgency.url,'_blank','noopener,noreferrer');
  $('#applicationModal').classList.add('open'); $('#applicationModal').setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
}
function closeApplication(){ $('#applicationModal').classList.remove('open'); $('#applicationModal').setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); applicationAgency=null; }
$('#applicationClose').addEventListener('click',closeApplication); $$('[data-close-application]').forEach(x=>x.addEventListener('click',closeApplication));
$('#modalApplyBtn').addEventListener('click',()=>{ if(activeAgency){ const id=activeAgency.id; closeModal(); setTimeout(()=>openApplication(id),80); }});
$('#applicationForm').addEventListener('submit',e=>{
  e.preventDefault(); if(!applicationAgency)return;
  const rec=getRecord(applicationAgency.id);
  rec.status='Applied';
  rec.application={name:$('#applicationName').value.trim(),email:$('#applicationEmail').value.trim(),phone:$('#applicationPhone').value.trim(),role:$('#applicationRole').value.trim(),resume:$('#applicationResume').value.trim(),availability:$('#applicationAvailability').value,message:$('#applicationMessage').value.trim(),submittedAt:new Date().toISOString()};
  rec.note=rec.note||`Application submitted via VA Connect on ${new Date().toLocaleDateString()}.`;
  saveState(); render(); updateStats();
  $('#applicationMessage').textContent='Application submitted and saved to your VA Connect tracker.';
  $('#applicationMessage').className='application-message success';
  setTimeout(closeApplication,900);
});

// Lightweight local account feature. The tracker remains device-local and is namespaced per signed-in email.
async function hashPassword(value){
  const data=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function setMessage(id,msg,error=false){const el=$(id);el.textContent=msg;el.className='auth-message '+(error?'error':'success');}
function openAuth(tab='login'){
  $('#authModal').classList.add('open'); $('#authModal').setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); switchAuthTab(tab);
}
function closeAuth(){ $('#authModal').classList.remove('open'); $('#authModal').setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }
function switchAuthTab(tab){
  $$('.auth-tab').forEach(b=>b.classList.toggle('active',b.dataset.authTab===tab));
  $('#loginForm').hidden=tab!=='login'; $('#registerForm').hidden=tab!=='register';
  $('#authTitle').textContent=tab==='login'?'Welcome back.':'Create your VA Connect account.';
  $('#loginMessage').textContent=''; $('#registerMessage').textContent='';
}
function updateAccountUI(){
  const email=currentSession();
  if(!email){loginBtn.hidden=false;accountChip.hidden=true;accountMenu.hidden=true;return;}
  const account=getAccounts()[email] || {name:'VA Connect User',email};
  loginBtn.hidden=true; accountChip.hidden=false; $('#accountLabel').textContent=account.name.split(' ')[0]||'Account'; $('#accountAvatar').textContent=initials(account.name||'VC'); $('#menuAvatar').textContent=initials(account.name||'VC'); $('#menuName').textContent=account.name||'VA Connect User'; $('#menuEmail').textContent=email;
}
loginBtn.addEventListener('click',()=>openAuth('login'));
accountChip.addEventListener('click',()=>{accountMenu.hidden=!accountMenu.hidden;});
document.addEventListener('click',e=>{if(!accountMenu.contains(e.target)&&!accountChip.contains(e.target))accountMenu.hidden=true;});
$$('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>switchAuthTab(b.dataset.authTab)));
$('#authClose').addEventListener('click',closeAuth); $$('[data-close-auth]').forEach(x=>x.addEventListener('click',closeAuth));
$('#loginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=$('#loginEmail').value.trim().toLowerCase(), password=$('#loginPassword').value;
  const accounts=getAccounts(), account=accounts[email];
  if(!account){setMessage('#loginMessage','No account found. Create an account first.',true);return;}
  if(account.passwordHash!==await hashPassword(password)){setMessage('#loginMessage','Incorrect email or password.',true);return;}
  localStorage.setItem(sessionKey,email); loadState(); updateAccountUI(); render(); setMessage('#loginMessage','Signed in successfully.'); setTimeout(closeAuth,450);
});
$('#registerForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=$('#registerName').value.trim(), email=$('#registerEmail').value.trim().toLowerCase(), password=$('#registerPassword').value;
  const accounts=getAccounts();
  if(accounts[email]){setMessage('#registerMessage','That email is already registered.',true);return;}
  accounts[email]={name,email,passwordHash:await hashPassword(password),createdAt:new Date().toISOString()}; saveAccounts(accounts); localStorage.setItem(sessionKey,email); loadState(); updateAccountUI(); render(); setMessage('#registerMessage','Account created successfully.'); setTimeout(closeAuth,450);
});
$('#logoutBtn').addEventListener('click',()=>{localStorage.removeItem(sessionKey);loadState();updateAccountUI();render();accountMenu.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeAuth();closeApplication();accountMenu.hidden=true;}});

loadState(); updateStats(); render();
