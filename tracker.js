const TSTATE='vaConnectTracker:';const USER='vaConnectUserEmail';const legacy='vaConnectReferenceV11';
let email='';let state={};let filter='all';let trackerAuthMode='signin';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const statuses=['Not Started','Saved','Applied','Interview','Offer','Rejected','Not Eligible'];
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function initials(n){return String(n||'VA').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'VA'}
function loadGuest(){try{return JSON.parse(localStorage.getItem('vaConnectGuestTracker')||localStorage.getItem(legacy)||'{}')||{}}catch{return {}}}
function rec(id){if(!state[id])state[id]={status:'Not Started',note:'',favorite:false};if(typeof state[id].favorite!=='boolean')state[id].favorite=false;return state[id]}
function officialLogo(a){try{const u=new URL(a.url);return `${u.origin}/favicon.ico`}catch{return ''}}
function logoMarkup(a){const src=officialLogo(a),safeName=escapeHtml(a.name),fallback=initials(a.name);if(!src)return `<span class="tracker-logo text-only" aria-label="${safeName}">${fallback}</span>`;return `<span class="tracker-logo has-image" data-fallback="${fallback}" aria-label="${safeName} logo"><img src="${escapeHtml(src)}" alt="${safeName} logo" loading="lazy" referrerpolicy="no-referrer"><span class="tracker-logo-fallback" aria-hidden="true">${fallback}</span></span>`}
function tracked(){return(window.VA_AGENCIES||[]).filter(a=>{const r=rec(a.id);return r.favorite||r.status!=='Not Started'})}
function openOpportunity(id){location.href=`index.html?preview=${encodeURIComponent(id)}`}
window.showTrackerAuth=function(mode='signin'){
  trackerAuthMode=mode==='create'?'create':'signin';
  const modal=$('#trackerAuthModal'),submit=modal?.querySelector('button[type="submit"]'),create=$('#trackerCreateAccount');
  if(!modal)return;
  modal.classList.add('open');modal.setAttribute('aria-hidden','false');
  if(submit)submit.textContent=trackerAuthMode==='create'?'Create Account':'Sign In';
  if(create)create.textContent=trackerAuthMode==='create'?'Already have an account? Sign in':'Create a new account';
}
function hideTrackerAuth(){$('#trackerAuthModal')?.classList.remove('open');$('#trackerAuthModal')?.setAttribute('aria-hidden','true')}
async function submitTrackerAuth(e){
  e.preventDefault();
  const emailValue=String($('#trackerAuthEmail')?.value||'').trim().toLowerCase(),password=String($('#trackerAuthPassword')?.value||''),msg=$('#trackerAuthMessage');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)){if(msg)msg.textContent='Please enter a valid email address.';return}
  if(password.length<6){if(msg)msg.textContent='Password must be at least 6 characters.';return}
  if(!window.VAConnectCloud?.isConfigured()){if(msg)msg.textContent='The account backend is not configured yet. Connect the VA CONNECT Firebase Web App first.';return}
  try{
    if(msg)msg.textContent=trackerAuthMode==='create'?'Creating your account…':'Signing you in…';
    if(trackerAuthMode==='create')await window.VAConnectCloud.createAccount(emailValue,password);else await window.VAConnectCloud.signIn(emailValue,password);
  }catch(error){
    const code=error?.code||'';
    if(msg)msg.textContent=code.includes('email-already-in-use')?'That email already has an account. Switch to Sign In.':code.includes('invalid-credential')||code.includes('invalid-login-credentials')?'Email or password is incorrect.':error?.message||'Unable to sign in right now.';
  }
}
function render(){
  const list=tracked(),counts={Saved:0,Applied:0,Interview:0,Offer:0};
  list.forEach(a=>{const r=rec(a.id);if(counts[r.status]!==undefined)counts[r.status]++});
  $('#trackAllCount').textContent=list.length;$('#trackSavedCount').textContent=counts.Saved;$('#trackAppliedCount').textContent=counts.Applied;$('#trackInterviewCount').textContent=counts.Interview;$('#trackOfferCount').textContent=counts.Offer;
  const shown=filter==='all'?list:list.filter(a=>rec(a.id).status===filter);
  $('#trackerTitle').textContent=filter==='all'?'All Tracked Opportunities':filter+' Opportunities';
  $('#trackerSubtitle').textContent=shown.length?shown.length+' '+(shown.length===1?'opportunity':'opportunities')+' in this stage.':'Nothing is in this stage yet.';
  $('#trackerList').innerHTML=shown.map(a=>{
    const r=rec(a.id),statusClass=String(r.status).toLowerCase().replace(/\s+/g,'-');
    return `<article class="tracker-row ${email?'':'tracker-locked-row'}" data-track-id="${a.id}"><div class="tracker-company">${logoMarkup(a)}<div><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(a.region||'Global')} · ${escapeHtml(a.roles||'Virtual Assistant')}</small></div></div><div class="tracker-stage"><span class="tracker-stage-dot ${statusClass}"></span><select class="tracker-stage-select" data-track-status="${a.id}" aria-label="Update ${escapeHtml(a.name)} status" ${email?'':'disabled'}>${statuses.map(s=>`<option${r.status===s?' selected':''}>${s}</option>`).join('')}</select></div><div class="tracker-note">${r.note?escapeHtml(r.note):'No personal note added'}</div><div class="tracker-actions"><button type="button" class="tracker-open" data-open="${a.id}">View</button><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer" data-apply="${a.id}">Apply ↗</a></div></article>`
  }).join('');
  $('#trackerEmpty').hidden=shown.length>0;
  $$('.tracker-stat').forEach(b=>b.classList.toggle('active',b.dataset.trackFilter===filter));
  $$('#trackerList [data-open]').forEach(b=>b.onclick=()=>openOpportunity(Number(b.dataset.open)));
  $$('#trackerList [data-track-status]').forEach(s=>s.onchange=()=>{if(!email){showTrackerAuth();return}rec(Number(s.dataset.trackStatus)).status=s.value;save()});
  $$('#trackerList .tracker-logo img').forEach(img=>img.addEventListener('error',()=>{const box=img.closest('.tracker-logo');if(box){img.style.display='none';box.classList.add('broken')}},{once:true}));
  const profile=$('#trackerProfile');
  if(email){profile.innerHTML=`<strong>${escapeHtml(email)}</strong><small>Your tracker is synced to your VA CONNECT account.</small><button class="outline-btn" id="trackerSignOut" type="button">Sign Out</button>`;$('#trackerSignOut').onclick=()=>window.VAConnectCloud?.signOut()}
  else{profile.innerHTML=`<div><strong>Guest mode — your saved opportunities are shown below.</strong><small>Sign in to unlock application tracking and sync your progress across devices.</small></div><button class="create-btn" id="trackerSignIn" type="button">Sign In to Track Progress</button>`;$('#trackerSignIn').onclick=()=>showTrackerAuth('signin')}
  if(!email&&shown.length)$('#trackerList').classList.add('tracker-locked');else $('#trackerList').classList.remove('tracker-locked');
}
async function save(){
  localStorage.setItem(email?TSTATE+email:'vaConnectGuestTracker',JSON.stringify(state));
  if(email&&window.VAConnectCloud?.isConfigured())try{await window.VAConnectCloud.saveTracker(window.VAConnectCloud.currentUser(),state)}catch(error){console.warn(error)}
  render();
}
window.addEventListener('va:auth-state',async e=>{
  const d=e.detail||{};if(d.loading)return;
  if(d.user){email=(d.user.email||'').trim().toLowerCase();localStorage.setItem(USER,email);state=d.tracker||{};const guest=loadGuest();Object.entries(guest).forEach(([id,r])=>{if(!state[id])state[id]=r});await save();hideTrackerAuth()}
  else{email='';localStorage.removeItem(USER);state=loadGuest();render();if(!window.__vaTrackerPromptShown){window.__vaTrackerPromptShown=true;setTimeout(()=>showTrackerAuth('signin'),260)}}
});
window.addEventListener('va:firebase-ready',e=>{if(!e.detail?.configured){const msg=$('#trackerAuthMessage');if(msg)msg.textContent='Account sync needs the VA CONNECT Firebase Web App configuration.'}});
$$('[data-track-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.trackFilter;render()});
$('#pageSignIn')?.addEventListener('click',()=>showTrackerAuth('signin'));
$('#trackerAuthForm')?.addEventListener('submit',submitTrackerAuth);
$('#trackerCreateAccount')?.addEventListener('click',()=>showTrackerAuth(trackerAuthMode==='create'?'signin':'create'));
$('#trackerAuthClose')?.addEventListener('click',hideTrackerAuth);
$('.tracker-auth-backdrop')?.addEventListener('click',hideTrackerAuth);
loadGuestState();
function loadGuestState(){state=loadGuest();render()}
