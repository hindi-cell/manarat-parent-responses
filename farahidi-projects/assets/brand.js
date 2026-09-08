const BRAND_URL=new URL('./manarat-logo.png?v=2',import.meta.url).href;
document.querySelectorAll('.brand-logo-exact').forEach(el=>{
  el.style.backgroundImage=`url("${BRAND_URL}")`;
  el.style.backgroundRepeat='no-repeat';
  el.style.backgroundPosition='center';
  el.style.backgroundSize='contain';
  el.classList.add('brand-loaded');
});
