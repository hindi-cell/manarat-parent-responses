import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const grid = document.getElementById('projects-grid');
const weeklyTimeline = document.getElementById('weekly-timeline');
const modal = document.getElementById('details-modal');
const modalContent = document.getElementById('modal-content');
let projects = [];

const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const nl2br = (v='') => esc(v).replace(/\n/g,'<br>');

const FALLBACK_PROJECTS = [
  {id:'student-clubs-fallback',name:'النوادي الطلابية',slug:'student-clubs',short_description:'برامج تربوية موسمية تجمع البناء الإيماني والمهاري والتفاعل التربوي.',full_description:'مساحة تربوية وتعليمية متجددة تقدم برامج موسمية للطلاب، وتجمع بين البناء الإيماني والمهاري والأنشطة التفاعلية.',registration_status:'soon',registration_url:null,registration_button_text:'التسجيل الآن',display_order:1,is_visible:true,logo_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/logo_url-1788777891897-81e32f89-b81d-4c9d-9fd1-77156f1a700a.png'},
  {id:'huffaz-fallback',name:'منارة الحفاظ',slug:'manarat-al-huffaz',short_description:'مشروع قرآني تربوي لمتابعة الطالب في رحلته مع حفظ كتاب الله.',registration_status:'open',registration_url:'https://forms.gle/9wXNjdV4hzHPdo4D7',registration_button_text:'التسجيل الآن',display_order:2,is_visible:true,schedule:'يوم الأربعاء: 4:00م - 6:00م لطلاب المدارس (الذكور)، باقي الفئات ترتيب خاص',target_audience:'ذكور + إناث',age_range:'جميع الأعمار',location:'في مركز منارات - أو عن بعد',cover_image_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/cover_image_url-1788774381934-5c3c2545-3277-41f8-96df-12c30cada1b3.png'},
  {id:'body-fallback',name:'شيفرة الجسد – Body Code',slug:'body-code',short_description:'برنامج رياضي تربوي لبناء القوة والانضباط عبر تمارين الكالستنكس.',registration_status:'open',registration_url:'https://forms.gle/dnhAKJ6fwPC4Bu8Q8',registration_button_text:'التسجيل الآن',display_order:3,is_visible:true,schedule:'الأحد + الخميس (5:00م - 6:30م)',grades:'طلاب المدارس (1 - 11)',target_audience:'ذكور',location:'مدينة الحسين للشباب (المدينة الرياضية)',cover_image_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/cover_image_url-1788774424798-2384d0bb-21d2-4190-96c4-58efb898c749.png'},
  {id:'jil-fallback',name:'ملتقى جيل',slug:'jil',short_description:'تهيئة إيمانية ودعوية ومهارية لمرحلة الحياة الجامعية.',registration_status:'closed',registration_url:null,registration_button_text:'التسجيل الآن',display_order:4,is_visible:true,cover_image_url:'https://dbydrbhbjhngpenkptwj.supabase.co/storage/v1/object/public/farahidi-media/cover_image_url-1788774361823-2e252c22-bbd0-415d-8226-bbe47acd4e93.png'},
  {id:'strategic-fallback',name:'برنامج استراتيجي',slug:'strategic',short_description:'برنامج ميداني تربوي لبناء التفكير الاستراتيجي والعمل الجماعي واتخاذ القرار.',registration_status:'closed',registration_url:null,registration_button_text:'التسجيل الآن',display_order:5,is_visible:true}
];

const WEEKLY_SCHEDULES = {
  'student-clubs': [
    {day:'السبت',dayIndex:6,time:'حسب المرحلة والفترة',note:'اللقاء الرئيس للنادي'},
    {day:'الثلاثاء',dayIndex:2,time:'حسب المرحلة والفترة',note:'لقاء المتابعة'}
  ],
  'manarat-al-huffaz': [
    {day:'الأربعاء',dayIndex:3,time:'4:00م – 6:00م',start:'16:00',end:'18:00',note:'طلاب المدارس (الذكور) — وباقي الفئات بترتيب خاص'}
  ],
  'body-code': [
    {day:'الأحد',dayIndex:0,time:'5:00م – 6:30م',start:'17:00',end:'18:30',note:'مدينة الحسين للشباب'},
    {day:'الخميس',dayIndex:4,time:'5:00م – 6:30م',start:'17:00',end:'18:30',note:'مدينة الحسين للشباب'}
  ]
};

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

const scheduleFor = p => WEEKLY_SCHEDULES[p?.slug] || [];
function timeParts(value){
  if(!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [h,m]=value.split(':').map(Number); return {h,m};
}
function occurrenceDate(entry, now=new Date()){
  const delta=(entry.dayIndex-now.getDay()+7)%7;
  const d=new Date(now);
  d.setSeconds(0,0);
  d.setDate(now.getDate()+delta);
  const tp=timeParts(entry.start);
  if(tp){
    d.setHours(tp.h,tp.m,0,0);
    if(delta===0 && d.getTime()<now.getTime()) d.setDate(d.getDate()+7);
  }else{
    d.setHours(23,59,0,0);
  }
  return d;
}
function nextOccurrence(entries, now=new Date()){
  if(!entries.length) return null;
  return entries.map(entry=>({entry,date:occurrenceDate(entry,now)})).sort((a,b)=>a.date-b.date)[0];
}
function relativeDateLabel(date, entry){
  const now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const target=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const diff=Math.round((target-today)/86400000);
  if(diff===0) return 'اليوم';
  if(diff===1) return 'غدًا';
  return `${entry.day} ${date.toLocaleDateString('ar-JO',{day:'numeric',month:'short'})}`;
}
function nextSlotMarkup(p, compact=false){
  const next=nextOccurrence(scheduleFor(p));
  if(!next) return '';
  const label=relativeDateLabel(next.date,next.entry);
  const text=`${label} — ${next.entry.time}`;
  if(compact) return text;
  return `<div class="next-slot"><span class="next-slot-dot"></span><div><strong>الموعد القادم: ${esc(text)}</strong>${next.entry.note?`<small>${esc(next.entry.note)}</small>`:''}</div></div>`;
}

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
  renderWeeklyTimeline();
  renderProjects();
  const previewId = new URLSearchParams(location.search).get('preview');
  if(previewId){ const p=projects.find(x=>x.id===previewId); if(p) openDetails(p); }
}

function renderWeeklyTimeline(){
  if(!weeklyTimeline) return;
  const items=[];
  projects.forEach(p=>scheduleFor(p).forEach(entry=>items.push({p,entry})));
  if(!items.length){ weeklyTimeline.innerHTML='<div class="weekly-loading">سيتم عرض مواعيد البرامج المستمرة هنا.</div>'; return; }
  items.sort((a,b)=>a.entry.dayIndex-b.entry.dayIndex || String(a.entry.start||'').localeCompare(String(b.entry.start||'')));
  const now=new Date();
  let closestIndex=-1, closestTime=Infinity;
  items.forEach((item,i)=>{ const t=occurrenceDate(item.entry,now).getTime(); if(t<closestTime){closestTime=t;closestIndex=i;} });
  weeklyTimeline.innerHTML=items.map((item,i)=>`<article class="weekly-event ${i===closestIndex?'is-next':''}" data-weekly-project="${esc(item.p.id)}" tabindex="0" role="button" aria-label="عرض تفاصيل ${esc(item.p.name)}"><span class="weekly-day">${esc(item.entry.day)}</span><strong class="weekly-project">${esc(item.p.name)}</strong><span class="weekly-time">${esc(item.entry.time)}</span>${item.entry.note?`<small class="weekly-note">${esc(item.entry.note)}</small>`:''}</article>`).join('');
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
        ${nextSlotMarkup(p)}
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
function quickFact(label,value){ return value ? `<div class="quick-fact"><span>${esc(label)}</span><strong>${nl2br(value)}</strong></div>` : ''; }
function schedulePanel(p){
  const entries=scheduleFor(p);
  if(entries.length){
    return `<div class="detail-schedule-stack">${entries.map(entry=>`<div class="detail-schedule-item"><b>${esc(entry.day)}</b><div><strong>${esc(entry.time)}</strong>${entry.note?`<small>${esc(entry.note)}</small>`:''}</div></div>`).join('')}</div>${p.schedule?`<section class="detail-section"><h4>تفاصيل إضافية عن الموعد</h4><p>${nl2br(p.schedule)}</p></section>`:''}`;
  }
  return p.schedule ? `<section class="detail-section"><h4>الأيام والأوقات</h4><p>${nl2br(p.schedule)}</p></section>` : '<div class="empty-state">سيتم إعلان الموعد عند اعتماده.</div>';
}

function openDetails(p){
  const s=statusMeta[p.registration_status] || statusMeta.closed;
  const canRegister=p.registration_status==='open' && p.registration_url;
  const nextText=nextSlotMarkup(p,true);
  modalContent.innerHTML = `<div class="project-detail-shell">
    ${p.cover_image_url ? `<div class="project-detail-cover"><img src="${esc(p.cover_image_url)}" alt="${esc(p.name)}" /></div>`:''}
    <div class="project-detail-top">
      <div class="project-detail-logo">${projectVisual(p) ? `<img src="${esc(projectVisual(p))}" alt="${esc(p.name)}" onerror="this.style.display='none'" />` : `<div class="detail-visual-placeholder">${esc(p.name)}</div>`}</div>
      <div class="project-detail-title"><span class="registration-status ${s.cls}"><span></span>${s.label}</span><h2 id="modal-title">${esc(p.name)}</h2><p>${nl2br(p.short_description || '')}</p></div>
    </div>
    <div class="detail-quick-facts">
      ${quickFact('الفئة المستهدفة',p.target_audience || p.grades || p.age_range)}
      ${quickFact('مدة البرنامج',p.duration)}
      ${quickFact('المكان',p.location)}
      ${quickFact('الموعد القادم',nextText)}
    </div>
    <div class="detail-tabs" role="tablist">
      <button class="detail-tab-btn active" data-detail-tab="overview" type="button">عن المشروع</button>
      <button class="detail-tab-btn" data-detail-tab="schedule" type="button">المواعيد</button>
      <button class="detail-tab-btn" data-detail-tab="benefits" type="button">الأهداف والمزايا</button>
      <button class="detail-tab-btn" data-detail-tab="registration" type="button">التسجيل</button>
    </div>
    <div class="detail-tab-panel active" data-detail-panel="overview">
      ${p.full_description ? `<section class="detail-section"><h4>عن المشروع</h4><p>${nl2br(p.full_description)}</p></section>`:''}
      ${p.idea ? `<section class="detail-section"><h4>فكرة المشروع</h4><p>${nl2br(p.idea)}</p></section>`:''}
      <div class="details-grid">
        ${field('الأعمار',p.age_range)}${field('الصفوف',p.grades)}${field('الفئة المستهدفة',p.target_audience)}${field('مدة البرنامج',p.duration)}${field('مكان التنفيذ',p.location)}${field('الرسوم',p.price)}
      </div>
      ${Array.isArray(p.gallery) && p.gallery.length ? `<section class="detail-section"><h4>صور المشروع</h4><div class="gallery">${p.gallery.map(u=>`<img src="${esc(u)}" alt="صورة من ${esc(p.name)}" loading="lazy" />`).join('')}</div></section>`:''}
    </div>
    <div class="detail-tab-panel" data-detail-panel="schedule">${schedulePanel(p)}</div>
    <div class="detail-tab-panel" data-detail-panel="benefits">${arraySection('أهداف المشروع',p.objectives)}${arraySection('أبرز المزايا',p.features)}${(!Array.isArray(p.objectives)||!p.objectives.length)&&(!Array.isArray(p.features)||!p.features.length)?'<div class="empty-state">تُضاف الأهداف والمزايا من لوحة الإدارة.</div>':''}</div>
    <div class="detail-tab-panel" data-detail-panel="registration">
      <div class="detail-registration-box"><div class="registration-status ${s.cls}"><span></span>${s.label}</div>${p.price?`<div><strong>الرسوم</strong><p>${nl2br(p.price)}</p></div>`:''}${p.additional_info?`<div><strong>معلومات إضافية</strong><p>${nl2br(p.additional_info)}</p></div>`:''}<div><strong>الخطوة التالية</strong><p>${canRegister?'يمكنك الانتقال مباشرة إلى نموذج التسجيل.':'سيظهر زر التسجيل هنا فور فتح التسجيل.'}</p></div></div>
    </div>
    <div class="detail-registration-bar">${canRegister ? `<a class="btn btn-primary btn-lg" href="${esc(p.registration_url)}" target="_blank" rel="noopener">${esc(p.registration_button_text || 'التسجيل الآن')}</a>` : `<button class="btn btn-disabled btn-lg" disabled>التسجيل غير متاح حاليًا</button>`}</div>
  </div>`;
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
}

function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); }
function openProjectById(id){ const p=projects.find(x=>String(x.id)===String(id)); if(p) openDetails(p); }

grid.addEventListener('click', e=>{ const btn=e.target.closest('[data-details]'); if(btn) openProjectById(btn.dataset.details); });
if(weeklyTimeline){
  weeklyTimeline.addEventListener('click',e=>{ const card=e.target.closest('[data-weekly-project]'); if(card) openProjectById(card.dataset.weeklyProject); });
  weeklyTimeline.addEventListener('keydown',e=>{ const card=e.target.closest('[data-weekly-project]'); if(card && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); openProjectById(card.dataset.weeklyProject); } });
}
modal.addEventListener('click', e=>{
  if(e.target.closest('[data-close-modal]')){ closeModal(); return; }
  const tab=e.target.closest('[data-detail-tab]');
  if(tab){
    modal.querySelectorAll('.detail-tab-btn').forEach(x=>x.classList.toggle('active',x===tab));
    modal.querySelectorAll('[data-detail-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.detailPanel===tab.dataset.detailTab));
  }
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

await Promise.all([loadSettings(),loadProjects()]);
