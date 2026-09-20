const TSTATE='vaConnectTracker:';const USER='vaConnectUserEmail';const legacy='vaConnectReferenceV11';
let email=(localStorage.getItem(USER)||'').trim().toLowerCase();let state={};let filter='all';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const statuses=['Not Started','Saved','Applied','Interview','Offer','Rejected','Not Eligible'];
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function initials(n){return String(n||'VA').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'VA'}
function load(){try{state=JSON.parse(localStorage.getItem(email?TSTATE+email:'vaConnectGuestTracker')||localStorage.getItem(legacy)||'{}')||{}}catch{state={}}}
function rec(id){if(!state[id])state[id]={status:'Not Started',note:'',favorite:false};if(typeof state[id].favorite!=='boolean')state[id].favorite=false;return state[id]}
function save(){localStorage.setItem(email?TSTATE+email:'vaConnectGuestTracker',JSON.stringify(state));render()}
function tracked(){return(window.VA_AGENCIES||[]).filter(a=>{const r=rec(a.id);return r.favorite||r.status!=='Not Started'})}
function officialFavicon(a){try{const u=new URL(a.url);return `${u.origin}/favicon.ico`}catch{return ''}}
function logoFor(a){return (window.VA_AGENCY_LOGOS&&window.VA_AGENCY_LOGOS[String(a.id)])||officialFavicon(a)}
function logoMarkup(a){
  const src=logoFor(a);const safeName=escapeHtml(a.name);const fallback=initials(a.name);
  if(!src)return `<span class="tracker-logo text-only" aria-label="${safeName}">${fallback}</span>`;
  return `<span class="tracker-logo has-image" data-fallback="${fallback}" aria-label="${safeName} logo"><img src="${escapeHtml(src)}" alt="${safeName} logo" loading="lazy" referrerpolicy="no-referrer"><span class="tracker-logo-fallback" aria-hidden="true">${fallback}</span></span>`;
}
function signIn(){const form=$('#trackerEmailForm');if(!form)return;const value=$('#trackerEmail').value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){$('#trackerEmailError').textContent='Please enter a valid email address.';return}email=value;localStorage.setItem(USER,email);$('#trackerEmailError').textContent='';render()}
function signOut(){localStorage.removeItem(USER);email='';render()}
function openOpportunity(id){location.href=`index.html?preview=${encodeURIComponent(id)}`}
function render(){
  load();const list=tracked();const counts={Saved:0,Applied:0,Interview:0,Offer:0};
  list.forEach(a=>{const r=rec(a.id);if(counts[r.status]!==undefined)counts[r.status]++});
  $('#trackAllCount').textContent=list.length;$('#trackSavedCount').textContent=counts.Saved;$('#trackAppliedCount').textContent=counts.Applied;$('#trackInterviewCount').textContent=counts.Interview;$('#trackOfferCount').textContent=counts.Offer;
  const shown=filter==='all'?list:list.filter(a=>rec(a.id).status===filter);
  $('#trackerTitle').textContent=filter==='all'?'All Tracked Opportunities':filter+' Opportunities';
  $('#trackerSubtitle').textContent=shown.length?shown.length+' '+(shown.length===1?'opportunity':'opportunities')+' in this stage.':'Nothing is in this stage yet.';
  $('#trackerList').innerHTML=shown.map(a=>{
    const r=rec(a.id);const statusClass=String(r.status).toLowerCase().replace(/\s+/g,'-');
    return `<article class="tracker-row" data-track-id="${a.id}">
      <div class="tracker-company">${logoMarkup(a)}<div><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(a.region||'Global')} · ${escapeHtml(a.roles||'Virtual Assistant')}</small></div></div>
      <div class="tracker-stage"><span class="tracker-stage-dot ${statusClass}"></span><select class="tracker-stage-select" data-track-status="${a.id}" aria-label="Update ${escapeHtml(a.name)} status">${statuses.map(s=>`<option${r.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
      <div class="tracker-note">${r.note?escapeHtml(r.note):'No personal note added'}</div>
      <div class="tracker-actions"><button type="button" class="tracker-open" data-open="${a.id}">View</button><a href="${escapeHtml(a.url)}" target="_blank" rel="noopener noreferrer" data-apply="${a.id}">Apply ↗</a></div>
    </article>`
  }).join('');
  $('#trackerEmpty').hidden=shown.length>0;
  $$('.tracker-stat').forEach(b=>b.classList.toggle('active',b.dataset.trackFilter===filter));
  $$('#trackerList [data-open]').forEach(b=>b.onclick=()=>openOpportunity(Number(b.dataset.open)));
  $$('#trackerList [data-track-status]').forEach(s=>s.onchange=()=>{rec(Number(s.dataset.trackStatus)).status=s.value;save()});
  $$('#trackerList [data-apply]').forEach(b=>b.onclick=()=>{rec(Number(b.dataset.apply)).status='Applied';save()});
  $$('#trackerList .tracker-logo img').forEach(img=>img.addEventListener('error',()=>{const box=img.closest('.tracker-logo');if(box){img.style.display='none';box.classList.add('broken');}}, {once:true}));
  const profile=$('#trackerProfile');
  if(email){profile.innerHTML=`<strong>${escapeHtml(email)}</strong><small>Your personal tracker is connected on this device.</small><button class="outline-btn" id="trackerSignOut" type="button">Sign Out</button>`;$('#trackerSignOut').onclick=signOut}
  else{profile.innerHTML=`<div><strong>Sign in to your VA CONNECT account</strong><small>Your Favorites, Applied, Interview and Offer stages will be associated with your VA CONNECT account.</small></div><form id="trackerEmailForm" class="tracker-email-form"><input id="trackerEmail" type="email" placeholder="you@example.com" autocomplete="email" required><button class="create-btn" type="submit">Continue with Email</button><small id="trackerEmailError"></small></form>`;$('#trackerEmailForm').onsubmit=e=>{e.preventDefault();signIn()}}
}
$$('[data-track-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.trackFilter;render()});
$('#pageSignIn')?.addEventListener('click',()=>location.href='index.html?auth=signin');
load();render();
