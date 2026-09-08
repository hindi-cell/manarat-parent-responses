const parts=['01.txt','02.txt','03.txt'];
const base=new URL('./exact-logo/',import.meta.url);
try{
  const data=(await Promise.all(parts.map(async p=>{
    const r=await fetch(new URL(p,base),{cache:'no-store'});
    if(!r.ok) throw new Error(p);
    return (await r.text()).trim();
  }))).join('');
  const url='data:image/png;base64,'+data;
  document.querySelectorAll('.brand-logo-exact').forEach(el=>{
    el.style.backgroundImage=`url("${url}")`;
    el.style.backgroundRepeat='no-repeat';
    el.style.backgroundPosition='center';
    el.style.backgroundSize='contain';
    el.classList.add('brand-loaded');
  });
}catch(e){console.error('Exact logo failed',e);}
