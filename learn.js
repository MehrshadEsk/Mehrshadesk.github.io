(()=>{'use strict';
const tuition=[24500000,24500000,28000000,28000000,45000000,55000000];
const nf=new Intl.NumberFormat('fa-IR',{maximumFractionDigits:0});
const two=new Intl.NumberFormat('fa-IR',{minimumIntegerDigits:2,useGrouping:false});
const courseSelect=document.getElementById('course-select');
const students=document.getElementById('students');
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
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
 document.getElementById('minus').disabled=n===1;document.getElementById('plus').disabled=n===4;
}
courseSelect?.addEventListener('change',calculate);students?.addEventListener('change',calculate);
document.getElementById('minus')?.addEventListener('click',()=>{students.value=Number(students.value)-1;calculate()});
document.getElementById('plus')?.addEventListener('click',()=>{students.value=Number(students.value)+1;calculate()});
document.querySelectorAll('.payment-jump').forEach(btn=>btn.addEventListener('click',()=>{courseSelect.value=btn.dataset.payment;calculate();document.getElementById('payment').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});setTimeout(()=>courseSelect.focus({preventScroll:true}),350)}));
calculate();

let lastTrigger=null;
document.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>{lastTrigger=btn;const d=document.getElementById('detail-'+btn.dataset.open);d?.showModal();document.body.style.overflow='hidden'}));
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.dialog-close')?.addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()});d.addEventListener('close',()=>{document.body.style.overflow='';lastTrigger?.focus()})});


})();
