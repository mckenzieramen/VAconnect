(()=>{
  const nav=document.querySelector('.site-header nav');
  const menu=document.querySelector('.menu-btn');
  if(menu&&nav){
    menu.addEventListener('click',e=>{
      e.preventDefault();
      const open=nav.classList.toggle('mobile-open');
      menu.textContent=open?'×':'☰';
      menu.setAttribute('aria-expanded',String(open));
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('mobile-open');menu.textContent='☰';menu.setAttribute('aria-expanded','false')}));
  }
  document.querySelector('#pageSignIn')?.addEventListener('click',()=>{location.href='index.html?auth=signin'});
})();
