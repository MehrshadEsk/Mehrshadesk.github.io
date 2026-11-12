const fa = new Intl.NumberFormat('fa-IR');
const header = document.querySelector('.site-header');
const menu = document.querySelector('nav');
const menuToggle = document.getElementById('menuToggle');
const toast = document.getElementById('toast');
let cart = [];

window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24), { passive: true });
menuToggle.addEventListener('click', () => menu.classList.toggle('open'));
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.classList.remove('open')));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const teacherCard = document.getElementById('teacherCard');
if (window.matchMedia('(pointer:fine)').matches) {
  teacherCard.addEventListener('mousemove', e => {
    const r = teacherCard.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    teacherCard.style.transform = `rotateY(${x * -8}deg) rotateX(${y * 8}deg)`;
  });
  teacherCard.addEventListener('mouseleave', () => teacherCard.style.transform = '');
}

function showToast(message) {
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

const testNames = {10:'دهم',11:'یازدهم',12:'دوازدهم'};
document.querySelectorAll('.grade-tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.grade-tab').forEach(x => x.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('testTitle').textContent = `آزمون طبقه‌بندی‌شده شیمی ${testNames[tab.dataset.grade]}`;
}));

document.querySelectorAll('.book-filter button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.book-filter button').forEach(x => x.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  document.querySelectorAll('.book-card').forEach(card => card.classList.toggle('is-hidden', filter !== 'all' && card.dataset.grade !== filter));
}));

const drawer = document.getElementById('cartDrawer');
const backdrop = document.getElementById('drawerBackdrop');
function toggleCart(open) { drawer.classList.toggle('open', open); backdrop.classList.toggle('open', open); drawer.setAttribute('aria-hidden', String(!open)); document.body.style.overflow = open ? 'hidden' : ''; }
document.getElementById('openCart').addEventListener('click', () => toggleCart(true));
document.getElementById('closeCart').addEventListener('click', () => toggleCart(false));
backdrop.addEventListener('click', () => toggleCart(false));

document.querySelectorAll('.add-cart').forEach(button => button.addEventListener('click', () => {
  const item = { id:button.dataset.id, name:button.dataset.name, price:Number(button.dataset.price) };
  if (!cart.find(x => x.id === item.id)) {
    cart.push(item); button.classList.add('added'); button.innerHTML = 'اضافه شد <span>✓</span>';
    showToast(`${item.name} به سبد اضافه شد`); renderCart();
  } else { toggleCart(true); }
}));

function renderCart() {
  const box = document.getElementById('cartItems');
  const total = cart.reduce((sum,item) => sum + item.price, 0);
  document.getElementById('cartCount').textContent = fa.format(cart.length);
  document.getElementById('cartTotal').textContent = `${fa.format(total)} تومان`;
  document.getElementById('checkoutButton').disabled = !cart.length;
  if (!cart.length) box.innerHTML = '<div class="empty-cart"><span>⌁</span><p>سبد خریدت هنوز خالی است.</p></div>';
  else box.innerHTML = cart.map(item => `<div class="cart-item"><div><strong>${item.name}</strong><br><span>${fa.format(item.price)} تومان</span></div><button type="button" data-remove="${item.id}">حذف</button></div>`).join('');
  box.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.remove; cart = cart.filter(item => item.id !== id);
    const add = document.querySelector(`[data-id="${id}"]`); if(add){ add.classList.remove('added'); add.innerHTML='افزودن <span>+</span>'; }
    renderCart();
  }));
}

function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close)));
document.querySelectorAll('.modal').forEach(modal => modal.addEventListener('click', e => { if(e.target === modal) closeModal(modal.id); }));
document.addEventListener('keydown', e => { if(e.key === 'Escape'){ document.querySelectorAll('.modal.open').forEach(m => closeModal(m.id)); toggleCart(false); } });
document.getElementById('checkoutButton').addEventListener('click', () => { toggleCart(false); openModal('checkoutModal'); });
document.getElementById('checkoutForm').addEventListener('submit', e => { e.preventDefault(); closeModal('checkoutModal'); cart=[]; renderCart(); document.querySelectorAll('.add-cart').forEach(b=>{b.classList.remove('added');b.innerHTML='افزودن <span>+</span>';}); openModal('successModal'); });

document.querySelectorAll('.interest-button').forEach(button => button.addEventListener('click', () => {
  document.getElementById('courseName').textContent = button.dataset.course; openModal('interestModal');
}));
document.getElementById('interestForm').addEventListener('submit', e => { e.preventDefault(); closeModal('interestModal'); showToast('درخواست شما در نسخه دمو ثبت شد'); e.target.reset(); });

const quizQuestions = [
  {q:'عدد اتمی عنصر اکسیژن کدام است؟', options:['۶','۸','۱۰','۱۶'], answer:1},
  {q:'در هر مولکول آب چند اتم هیدروژن وجود دارد؟', options:['۱','۲','۳','۴'], answer:1},
  {q:'در معادلهٔ موازنه‌شدهٔ سوختن متان، ضریب O₂ چند است؟', options:['۱','۲','۳','۴'], answer:1}
];
let quizIndex=0, quizScore=0, selected=null;
function renderQuiz(){
  const content=document.getElementById('quizContent');
  if(quizIndex>=quizQuestions.length){
    document.getElementById('quizStep').textContent='نتیجه آزمون'; document.getElementById('quizBar').style.width='100%';
    content.innerHTML=`<div class="quiz-result"><b>${fa.format(quizScore)} از ۳</b><h2>آزمون تمام شد</h2><p>${quizScore===3?'عالی بود! برای چالش‌های بیشتر آماده‌ای.':'با تمرین هدفمند، نتیجه خیلی سریع بهتر می‌شود.'}</p><button class="button primary" type="button" data-finish>پایان آزمون</button></div>`;
    content.querySelector('[data-finish]').addEventListener('click',()=>closeModal('quizModal')); return;
  }
  const item=quizQuestions[quizIndex]; selected=null;
  document.getElementById('quizStep').textContent=`سؤال ${fa.format(quizIndex+1)} از ۳`; document.getElementById('quizBar').style.width=`${(quizIndex+1)/3*100}%`;
  content.innerHTML=`<h3 class="quiz-question">${item.q}</h3><div class="quiz-options">${item.options.map((o,i)=>`<button type="button" class="quiz-option" data-option="${i}">${o}</button>`).join('')}</div><button type="button" class="button primary quiz-next" disabled>سؤال بعدی</button>`;
  content.querySelectorAll('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>{content.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');selected=Number(btn.dataset.option);content.querySelector('.quiz-next').disabled=false;}));
  content.querySelector('.quiz-next').addEventListener('click',()=>{if(selected===item.answer)quizScore++;quizIndex++;renderQuiz();});
}
document.querySelectorAll('.start-quiz').forEach(button=>button.addEventListener('click',()=>{quizIndex=0;quizScore=0;renderQuiz();openModal('quizModal');}));
