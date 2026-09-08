const BRAND_URL='https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/logo_url-1788772067032-e4eed05d-4775-4d75-961a-5352ac3fd547.png';
document.querySelectorAll('.brand-logo-exact').forEach(el=>{
  el.style.backgroundImage=`url("${BRAND_URL}")`;
  el.style.backgroundRepeat='no-repeat';
  el.style.backgroundPosition='center';
  el.style.backgroundSize='contain';
  el.classList.add('brand-loaded');
});
