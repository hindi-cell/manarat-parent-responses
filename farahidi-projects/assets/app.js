import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const grid = document.getElementById('projects-grid');
const modal = document.getElementById('details-modal');
const modalContent = document.getElementById('modal-content');
let projects = [];

const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const nl2br = (v='') => esc(v).replace(/\n/g,'<br>');

const FALLBACK_PROJECTS = [
  {id:'student-clubs-fallback',name:'النوادي الطلابية',slug:'student-clubs',short_description:'برامج تربوية موسمية تجمع البناء الإيماني والمهاري والتفاعل التربوي.',registration_status:'soon',registration_url:null,registration_button_text:'التسجيل الآن',display_order:1,is_visible:true,logo_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/logo_url-1788777891897-81e32f89-b81d-4c9d-9fd1-77156f1a700a.png'},
  {id:'huffaz-fallback',name:'منارة الحفاظ',slug:'manarat-al-huffaz',short_description:'مشروع قرآني تربوي لمتابعة الطالب في رحلته مع حفظ كتاب الله.',registration_status:'open',registration_url:'https://forms.gle/9wXNjdV4hzHPdo4D7',registration_button_text:'التسجيل الآن',display_order:2,is_visible:true,cover_image_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/cover_image_url-1788774381934-5c3c2545-3277-41f8-96df-12c30cada1b3.png'},
  {id:'body-fallback',name:'شيفرة الجسد – Body Code',slug:'body-code',short_description:'برنامج رياضي تربوي لبناء القوة والانضباط عبر تمارين الكالستنكس.',registration_status:'open',registration_url:null,registration_button_text:'التسجيل الآن',display_order:3,is_visible:true,cover_image_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/cover_image_url-1788774424798-2384d0bb-21d2-4190-96c4-58efb898c749.png'},
  {id:'jil-fallback',name:'ملتقى جيل',slug:'jil',short_description:'تهيئة إيمانية ودعوية ومهارية لمرحلة الحياة الجامعية.',registration_status:'closed',registration_url:null,registration_button_text:'التسجيل الآن',display_order:4,is_visible:true,cover_image_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/cover_image_url-1788774361823-2e252c22-bbd0-415d-8226-bbe47acd4e93.png'},
  {id:'strategic-fallback',name:'برنامج استراتيجي',slug:'strategic',short_description:'برنامج ميداني تربوي لبناء التفكير الاستراتيجي والعمل الجماعي واتخاذ القرار.',registration_status:'closed',registration_url:null,registration_button_text:'التسجيل الآن',display_order:5,is_visible:true}
];
function projectVisual(p){
  const logo=String(p.logo_url||'').trim();
  if(/^https?:\/\//.test(logo)) return logo;
  const cover=String(p.cover_image_url||'').trim();
  if(/^https?:\/\//.test(cover)) return cover;
  return '';
}

const statusMeta = {
  open: {label:'التسجيل متاح الآن', cls:'status-open'},
  closed: {label:'التسجيل غير متاح حاليًا', cls:'status-closed'},
  soon: {label:'التسجيل قريبًا', cls:'status-soon'},
  full: {label:'اكتمل العدد', cls:'status-full'}
};

async function loadSettings(){
  const { data } = await supabase.from('farahidi_site_settings').select('*').eq('id',1).maybeSingle();
  if(!data) return;
  document.getElementById('site-title').textContent = data.site_title || 'مشاريع مؤسسة الفراهيدي';
  document.getElementById('site-subtitle').textContent = data.site_subtitle || '';
  document.getElementById('footer-name').textContent = data.footer_name || 'مؤسسة الفراهيدي للتعليم والتدريب';
  document.getElementById('footer-text').textContent = data.footer_text || '';
  const contacts=[];
  if(data.contact_phone) contacts.push(`<a href="tel:${esc(data.contact_phone)}">${esc(data.contact_phone)}</a>`);
  if(data.contact_email) contacts.push(`<a href="mailto:${esc(data.contact_email)}">${esc(data.contact_email)}</a>`);
  if(data.whatsapp_url) contacts.push(`<a href="${esc(data.whatsapp_url)}" target="_blank" rel="noopener">واتساب</a>`);
  document.getElementById('footer-contact').innerHTML = contacts.join('<span>•</span>');
}

async function loadProjects(){
  const { data, error } = await supabase.from('farahidi_projects').select('*').eq('is_visible',true).order('display_order',{ascending:true});
  projects = (!error && Array.isArray(data) && data.length) ? data.filter(p=>p.is_visible!==false) : FALLBACK_PROJECTS;
  renderProjects();
  const previewId = new URLSearchParams(location.search).get('preview');
  if(previewId){ const p=projects.find(x=>x.id===previewId); if(p) openDetails(p); }
}

function renderProjects(){
  if(!projects.length){ grid.innerHTML='<div class="empty-state">لا توجد مشاريع منشورة حاليًا.</div>'; return; }
  grid.innerHTML = projects.map(p => {
    const s=statusMeta[p.registration_status] || statusMeta.closed;
    const canRegister=p.registration_status==='open' && p.registration_url;
    return `<article class="project-card">
      <div class="project-logo-wrap">${projectVisual(p) ? `<img src="${esc(projectVisual(p))}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'" /><div class="project-visual-placeholder">${esc(p.name)}</div>` : `<div class="project-visual-placeholder show">${esc(p.name)}</div>`}</div>
      <div class="project-card-body">
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.short_description || '')}</p>
        <div class="registration-status ${s.cls}"><span></span>${s.label}</div>
        <div class="card-actions">
          <button class="btn btn-outline" data-details="${p.id}" type="button">عرض التفاصيل</button>
          ${canRegister
            ? `<a class="btn btn-primary" href="${esc(p.registration_url)}" target="_blank" rel="noopener">${esc(p.registration_button_text || 'التسجيل الآن')}</a>`
            : `<button class="btn btn-disabled" type="button" disabled>التسجيل غير متاح</button>`}
        </div>
      </div>
    </article>`;
  }).join('');
}

function field(label,value){ return value ? `<div class="detail-field"><span>${label}</span><strong>${nl2br(value)}</strong></div>` : ''; }
function arraySection(title,arr){
  if(!Array.isArray(arr) || !arr.length) return '';
  return `<section class="detail-section"><h4>${title}</h4><ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;
}

function openDetails(p){
  const s=statusMeta[p.registration_status] || statusMeta.closed;
  const canRegister=p.registration_status==='open' && p.registration_url;
  modalContent.innerHTML = `
    ${p.cover_image_url ? `<div class="detail-cover"><img src="${esc(p.cover_image_url)}" alt="${esc(p.name)}" /></div>`:''}
    <div class="detail-header">
      <div class="detail-logo">${projectVisual(p) ? `<img src="${esc(projectVisual(p))}" alt="${esc(p.name)}" onerror="this.style.display='none'" />` : `<div class="detail-visual-placeholder">${esc(p.name)}</div>`}</div>
      <div><span class="registration-status ${s.cls}"><span></span>${s.label}</span><h2 id="modal-title">${esc(p.name)}</h2><p>${nl2br(p.short_description || '')}</p></div>
    </div>
    ${p.full_description ? `<section class="detail-section"><h4>عن المشروع</h4><p>${nl2br(p.full_description)}</p></section>`:''}
    ${p.idea ? `<section class="detail-section"><h4>فكرة المشروع</h4><p>${nl2br(p.idea)}</p></section>`:''}
    ${arraySection('أهداف المشروع',p.objectives)}
    <div class="details-grid">
      ${field('الفئة المستهدفة',p.target_audience)}
      ${field('الأعمار',p.age_range)}
      ${field('الصفوف',p.grades)}
      ${field('مدة البرنامج',p.duration)}
      ${field('الأيام والأوقات',p.schedule)}
      ${field('مكان التنفيذ',p.location)}
      ${field('الرسوم',p.price)}
    </div>
    ${arraySection('أبرز المزايا',p.features)}
    ${p.additional_info ? `<section class="detail-section"><h4>معلومات إضافية</h4><p>${nl2br(p.additional_info)}</p></section>`:''}
    ${Array.isArray(p.gallery) && p.gallery.length ? `<section class="detail-section"><h4>صور المشروع</h4><div class="gallery">${p.gallery.map(u=>`<img src="${esc(u)}" alt="صورة من ${esc(p.name)}" loading="lazy" />`).join('')}</div></section>`:''}
    <div class="detail-cta">
      ${canRegister ? `<a class="btn btn-primary btn-lg" href="${esc(p.registration_url)}" target="_blank" rel="noopener">${esc(p.registration_button_text || 'التسجيل الآن')}</a>` : `<button class="btn btn-disabled btn-lg" disabled>التسجيل غير متاح حاليًا</button>`}
    </div>`;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
}

function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }

grid.addEventListener('click', e=>{
  const btn=e.target.closest('[data-details]'); if(!btn) return;
  const p=projects.find(x=>x.id===btn.dataset.details); if(p) openDetails(p);
});
modal.addEventListener('click', e=>{ if(e.target.closest('[data-close-modal]')) closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

await Promise.all([loadSettings(),loadProjects()]);
