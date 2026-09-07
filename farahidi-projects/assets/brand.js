const parts=['01.txt','02.txt','03.txt','04.txt','05.txt','06.txt','07.txt','08.txt','09.txt','10.txt','11.txt','12.txt','13.txt','14.txt','15.txt','16.txt','17.txt','18.txt','19.txt','20.txt'];
const baseUrl=new URL('./logo2/',import.meta.url);
try{
 const data=(await Promise.all(parts.map(async p=>{const r=await fetch(new URL(p,baseUrl));if(!r.ok)throw new Error(p);return r.text();}))).join('');
 const url='data:image/webp;base64,'+data;
 document.querySelectorAll('.brand-logo-exact').forEach(el=>{el.style.backgroundImage=`url(${url})`;el.classList.add('brand-loaded');});
}catch(e){console.error('Brand logo failed',e);}
