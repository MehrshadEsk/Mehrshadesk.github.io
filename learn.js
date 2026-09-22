(()=>{'use strict';
const tuition=[24500000,24500000,28000000,28000000,45000000,55000000];
const nf=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:0});
const two=new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false});
const courseSelect=document.getElementById('course-select');
const students=document.getElementById('students');
const firstInstallmentDate=document.getElementById('first-installment-date');
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const persianDate=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'});
function isoLocal(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function parseLocalDate(value){if(!value)return new Date();const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d)}
function addMonthsClamped(date,months){const d=new Date(date.getFullYear(),date.getMonth(),1);const wanted=date.getDate();d.setMonth(d.getMonth()+months);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(wanted,last));return d}
function updateInstallmentDates(){
 if(!firstInstallmentDate)return;
 if(!firstInstallmentDate.value)firstInstallmentDate.value=isoLocal(new Date());
 const base=parseLocalDate(firstInstallmentDate.value);
 [0,1,2].forEach((offset,i)=>{const el=document.getElementById(`installment-date-${i+1}`);if(el)el.textContent=persianDate.format(addMonthsClamped(base,offset))});
}
function calculate(){
 const n=clamp(Math.floor(Number(students.value)||1),1,4);students.value=n;
 const total=tuition[Number(courseSelect.value)];
 const installment=Math.ceil(total/3/500000)*500000;
 const roundUp=v=>Math.ceil(v/100000)*100000;
 const cash=roundUp(total/n),monthly=roundUp(installment/n);
 document.getElementById('cash').textContent=nf.format(cash);
 document.getElementById('monthly').textContent=nf.format(monthly);
 document.getElementById('cash-total').textContent='مجموع پرداخت کلاس: '+nf.format(cash*n)+' تومان';
 document.getElementById('install-total').textContent='مجموع ۳ قسط هر نفر: '+nf.format(monthly*3)+' تومان';
 document.querySelectorAll('.month-value').forEach(el=>el.textContent=nf.format(monthly)+' تومان');
 updateInstallmentDates();
 document.getElementById('minus').disabled=n===1;document.getElementById('plus').disabled=n===4;
}
courseSelect?.addEventListener('change',calculate);students?.addEventListener('change',calculate);firstInstallmentDate?.addEventListener('change',calculate);
document.getElementById('minus')?.addEventListener('click',()=>{students.value=Number(students.value)-1;calculate()});
document.getElementById('plus')?.addEventListener('click',()=>{students.value=Number(students.value)+1;calculate()});
document.querySelectorAll('.payment-jump').forEach(btn=>btn.addEventListener('click',()=>{courseSelect.value=btn.dataset.payment;calculate();document.getElementById('payment').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});setTimeout(()=>courseSelect.focus({preventScroll:true}),350)}));
calculate();

let lastTrigger=null;
document.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>{lastTrigger=btn;const d=document.getElementById('detail-'+btn.dataset.open);d?.showModal();document.body.style.overflow='hidden'}));
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.dialog-close')?.addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()});d.addEventListener('close',()=>{document.body.style.overflow='';lastTrigger?.focus()})});

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduced&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -35px'});document.querySelectorAll('[data-reveal]').forEach((el,i)=>{el.style.animationDelay=(i%4)*55+'ms';io.observe(el)})}else document.querySelectorAll('[data-reveal]').forEach(el=>el.classList.add('is-visible'));

let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;const bar=document.querySelector('.scroll-progress');if(bar)bar.style.width=(max>0?scrollY/max*100:0)+'%';ticking=false})},{passive:true});

// Countdown is controlled from one editable data-sale-end value on <body>.
const deadline=new Date(document.body.dataset.saleEnd||'').getTime();
const countdowns=[...document.querySelectorAll('[data-countdown]')];
function updateCountdown(){
 if(!Number.isFinite(deadline))return;
 let diff=Math.max(0,deadline-Date.now());
 const days=Math.floor(diff/86400000);diff%=86400000;
 const hours=Math.floor(diff/3600000);diff%=3600000;
 const minutes=Math.floor(diff/60000);diff%=60000;
 const seconds=Math.floor(diff/1000);
 const values={days,hours,minutes,seconds};
 countdowns.forEach(box=>{Object.entries(values).forEach(([unit,value])=>{const el=box.querySelector(`[data-unit="${unit}"]`);if(el)el.textContent=two.format(value)});box.classList.toggle('countdown-ended',deadline<=Date.now())});
 document.querySelectorAll('.has-sale').forEach(card=>card.classList.toggle('countdown-ended',deadline<=Date.now()));
}
updateCountdown();setInterval(updateCountdown,1000);

// Subtle pointer physics: depth without changing layout or content.
if(!reduced&&matchMedia('(pointer:fine)').matches){
 const hero=document.querySelector('.hero-playground');const win=document.querySelector('.hero-window');
 hero?.addEventListener('pointermove',e=>{if(!win)return;const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;win.style.transform=`rotateX(${-y*4.5}deg) rotateY(${x*5.5}deg) translate3d(${x*4}px,${y*3}px,0)`;win.style.setProperty('--mx',`${(x+.5)*100}%`);win.style.setProperty('--my',`${(y+.5)*100}%`)});
 hero?.addEventListener('pointerleave',()=>{if(win)win.style.transform='' });
 document.querySelectorAll('.course-card').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width;const y=(e.clientY-r.top)/r.height;card.style.setProperty('--spot-x',`${x*100}%`);card.style.setProperty('--spot-y',`${y*100}%`);card.style.transform=`perspective(900px) rotateX(${(0.5-y)*2.2}deg) rotateY(${(x-0.5)*2.8}deg) translateY(-5px)`});card.addEventListener('pointerleave',()=>card.style.transform='')});
}
})();
