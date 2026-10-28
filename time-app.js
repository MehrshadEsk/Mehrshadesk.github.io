
const CONFIG=Object.freeze({
  API_URL: 'https://script.google.com/macros/s/AKfycbw5hC7zSlh_fURtXyFDR44Ouz8rKUuiBAbdww5frcdogQ_C1xpYCA0WstgRCWsN99gySg/exec',
  TIME_ZONE: 'Asia/Tehran',
  EMPLOYEES: [
    {id:'e1',name:'احسان مجاهد'},{id:'e3',name:'بهنام اسکندری'},
    {id:'e6',name:'امیرعباس کارگزار'},{id:'e7',name:'محمد یوسفی'}
  ]
});
(()=>{'use strict';const $=id=>document.getElementById(id),SESSION='farmad_time_v6_pin4_20261028';
const timeFormat=new Intl.DateTimeFormat('fa-IR',{timeZone:CONFIG.TIME_ZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}),dateFormat=new Intl.DateTimeFormat('fa-IR',{timeZone:CONFIG.TIME_ZONE,weekday:'long',year:'numeric',month:'long',day:'numeric'});
const fa=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]),digits=s=>String(s).replace(/[۰-۹٠-٩]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.includes(c)?'۰۱۲۳۴۵۶۷۸۹'.indexOf(c):'٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
let account=null,record=null,busy=false,loaded=false,epoch=0,offset=0;
const now=()=>Date.now()+offset,error=(id,text)=>{$(id).textContent=text;$(id).hidden=!text;};
function success(text){$('message').textContent=text;$('message').hidden=!text;}
function validRecord(r){if(r==null)return null;if(r.employeeId!==account.id||!r.id||!/^\d{2}:\d{2}$/.test(r.startTime)||!['working','completed'].includes(r.status)||(r.status==='completed'&&!/^\d{2}:\d{2}$/.test(r.endTime)))throw Error('وضعیت شیفت معتبر نیست. نسخه جدید Apps Script را منتشر کنید.');return r;}
async function api(action,p={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000),sent=Date.now();try{const res=await fetch(CONFIG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...p,token:account?.token||''}),credentials:'omit',redirect:'follow',signal:controller.signal});let r;try{r=JSON.parse(await res.text());}catch{throw Error('پاسخ سرویس معتبر نیست. دسترسی Web app و لینک /exec را بررسی کنید.');}if(!r.ok){if(r.code==='AUTH'&&action!=='login'){leave(false);throw Error('نشست تمام شد. دوباره وارد شوید.');}throw Error(r.error||'ثبت انجام نشد.');}if(r.version!==6)throw Error('Apps Script هنوز نسخه قبلی است. کد جدید را جایگزین و با New version منتشر کنید.');if(Number.isFinite(r.serverTime))offset=r.serverTime-(sent+Date.now())/2;return r;}catch(e){if(e.name==='AbortError')throw Error('پاسخ نرسید؛ نتیجه ثبت نامشخص است. صفحه را تازه کنید تا وضعیت از شیت دریافت شود.');if(e instanceof TypeError)throw Error('اتصال برقرار نشد. اینترنت و دسترسی سرویس را بررسی کنید.');throw e;}finally{clearTimeout(timer);}}
function render(){if(!account)return;const state=record?.status||'idle';$('shiftStatus').textContent=state==='working'?'در حال کار':state==='completed'?'پایان یافته':'شروع نشده';$('shiftStatus').className='status '+state;$('factIn').textContent=record?fa(record.startTime):'—';$('factOut').textContent=record?.endTime?fa(record.endTime):'—';$('shiftButton').disabled=busy||!loaded||state==='completed';$('shiftButton').className='btn '+(state==='working'?'end':state==='completed'?'done':'');$('shiftButton').textContent=busy?'در حال ثبت…':!loaded?'دریافت وضعیت…':state==='working'?'پایان شیفت':state==='completed'?'شیفت پایان یافت':'شروع شیفت';$('consent').textContent=state==='idle'?'برای شروع شیفت، اجازه دریافت موقعیت را بدهید.':state==='working'?'ساعت پایان را انتخاب کنید؛ موقعیت همان لحظه نیز برای خودتان نمایش داده می‌شود.':'شروع شیفت بعدی از روز بعد فعال می‌شود.';const today=new Intl.DateTimeFormat('en-CA',{timeZone:CONFIG.TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now()));$('shiftLabel').textContent=record&&record.day!==today?'شیفت باز از '+fa(record.day):'شیفت امروز';}

// Preview images live only in this page's memory and are never sent to the API.
let locationPreviewEpoch=0;
function clearLocationPreview(){
  locationPreviewEpoch++;
  $('locationPreview').hidden=true;
  $('locationImage').hidden=true;
  $('locationImage').removeAttribute('src');
  for(const id of ['locationTitle','locationMeta','locationCoordinates','locationMapStatus'])$(id).textContent='';
}
function showLocationPreview(location,label,locationError=''){
  clearLocationPreview();
  const previewEpoch=locationPreviewEpoch,owner=account;
  $('locationPreview').hidden=false;
  $('locationTitle').textContent='موقعیت هنگام '+label;
  if(!location){$('locationMapStatus').textContent='ثبت پایان انجام شد، اما موقعیت دریافت نشد. '+locationError;return;}
  $('locationCoordinates').textContent=location.lat.toFixed(6)+', '+location.lng.toFixed(6);
  $('locationMeta').textContent='زمان دریافت موقعیت: '+timeFormat.format(new Date(location.capturedAt))+(Number.isFinite(location.accuracy)?' · دقت GPS حدود '+fa(Math.round(location.accuracy))+' متر':'');
  $('locationMapStatus').textContent='در حال دریافت تصویر نقشه…';
  locationSnapshot(location).then(src=>{
    if(previewEpoch!==locationPreviewEpoch||account!==owner)return;
    $('locationImage').src=src;
    $('locationImage').hidden=false;
    $('locationMapStatus').textContent='';
  }).catch(()=>{
    if(previewEpoch!==locationPreviewEpoch||account!==owner)return;
    $('locationMapStatus').textContent='تصویر نقشه دریافت نشد؛ مختصات موقعیت در بالا نمایش داده شده است.';
  });
}
async function locationSnapshot({lat,lng}){
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>85.05||Math.abs(lng)>180)throw Error('Invalid map coordinates');
  const zoom=16,count=2**zoom,width=640,height=400;
  const pixelX=(lng+180)/360*count*256,radians=lat*Math.PI/180;
  const pixelY=(1-Math.log(Math.tan(radians)+1/Math.cos(radians))/Math.PI)/2*count*256;
  const left=pixelX-width/2,top=pixelY-height/2;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#FAF7F0';ctx.fillRect(0,0,width,height);
  const tiles=[];
  for(let x=Math.floor(left/256);x<=Math.floor((left+width-1)/256);x++){
    for(let y=Math.floor(top/256);y<=Math.floor((top+height-1)/256);y++){
      if(y<0||y>=count)continue;
      tiles.push(new Promise((resolve,reject)=>{
        const image=new Image();image.crossOrigin='anonymous';
        const timer=setTimeout(()=>{image.onload=image.onerror=null;image.src='';reject(Error('Map timeout'));},8000);
        image.onload=()=>{clearTimeout(timer);ctx.drawImage(image,x*256-left,y*256-top,256,256);resolve();};
        image.onerror=()=>{clearTimeout(timer);reject(Error('Map unavailable'));};
        image.src='https://tile.openstreetmap.org/'+zoom+'/'+((x%count+count)%count)+'/'+y+'.png';
      }));
    }
  }
  await Promise.all(tiles);
  ctx.fillStyle='#F25432';ctx.beginPath();ctx.arc(width/2,height/2,11,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillRect(width-245,height-27,245,27);
  ctx.fillStyle='#292C23';ctx.font='12px sans-serif';ctx.textAlign='right';ctx.direction='ltr';
  ctx.fillText('© OpenStreetMap contributors',width-8,height-9);
  return canvas.toDataURL('image/png');
}

function enter(){clearLocationPreview();record=null;loaded=false;epoch++;$('loginPage').hidden=true;$('employeePage').hidden=false;$('topUser').hidden=false;$('userName').textContent=account.name;$('greeting').textContent='سلام '+account.name.split(' ')[0];success('');error('shiftError','');render();tick();}
function leave(remote=true){clearLocationPreview();const old=account;account=null;record=null;loaded=false;epoch++;$('confirmDialog').close();$('loginPage').hidden=false;$('employeePage').hidden=true;$('topUser').hidden=true;$('password').value='';try{sessionStorage.removeItem(SESSION);}catch{}if(remote&&old)fetch(CONFIG.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'logout',token:old.token}),credentials:'omit'}).catch(()=>{});}
async function refresh(){if(!account||busy)return;const owner=account,e=++epoch;try{const r=await api('list');if(account!==owner||e!==epoch||busy)return;record=validRecord(r.record);loaded=true;error('shiftError','');render();}catch(err){if(account===owner&&e===epoch){error('shiftError',err.message);render();}}}
$('employeeSelect').innerHTML='<option value="" selected disabled>انتخاب نام</option>';CONFIG.EMPLOYEES.forEach(e=>{const o=document.createElement('option');o.value=e.id;o.textContent=e.name;$('employeeSelect').appendChild(o);});
$('password').addEventListener('input',()=>{$('password').value=digits($('password').value);});$('revealPassword').onclick=()=>{const visible=$('password').type==='password';$('password').type=visible?'text':'password';$('revealPassword').textContent=visible?'پنهان':'نمایش';$('revealPassword').setAttribute('aria-pressed',visible);};
$('loginForm').onsubmit=async e=>{e.preventDefault();if(busy)return;const enteredPin=digits($('password').value);if(!/^\d{4}$/.test(enteredPin)){error('loginError','رمز ورود باید دقیقاً ۴ رقم باشد.');return;}busy=true;$('loginButton').disabled=true;error('loginError','');try{const r=await api('login',{username:$('employeeSelect').value,password:enteredPin,role:'employee'});const employee=CONFIG.EMPLOYEES.find(person=>person.id===r.user?.id);if(!employee||employee.id!==$('employeeSelect').value||r.user.role!=='employee'||!r.token)throw Error('حساب کاربری با فهرست جدید کارکنان مطابقت ندارد. تنظیمات سرویس حضور و غیاب را به‌روزرسانی کنید.');account={...r.user,name:employee.name,token:r.token};try{sessionStorage.setItem(SESSION,JSON.stringify({...account,api:CONFIG.API_URL}));}catch{}$('password').value='';busy=false;enter();await refresh();}catch(err){error(account?'shiftError':'loginError',err.message);}finally{busy=false;$('loginButton').disabled=false;}};
function locate(){return new Promise((resolve,reject)=>{if(!window.isSecureContext||!navigator.geolocation){reject(Error('برای ثبت موقعیت، صفحه را با HTTPS و مرورگر دارای موقعیت‌یابی باز کنید.'));return;}navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,capturedAt:now()}),e=>reject(Error(e.code===1?'مجوز Location سایت را فعال کنید.':'موقعیت دریافت نشد. GPS را روشن و دوباره تلاش کنید.')),{enableHighAccuracy:true,maximumAge:0,timeout:20000});});}
async function start(){if(busy||!loaded||record)return;const owner=account;busy=true;epoch++;$('logout').disabled=true;success('');error('shiftError','');render();clearLocationPreview();try{const location=await locate();if(account!==owner)return;const r=await api('start',{location:{lat:location.lat,lng:location.lng}});if(account!==owner)return;record=validRecord(r.record);loaded=true;success(record.status==='completed'?'شیفت امروز قبلاً پایان یافته است.':'شروع شیفت ثبت شد.');if(record.status==='working')showLocationPreview(location,'شروع شیفت');}catch(err){if(account===owner)error('shiftError',err.message);}finally{busy=false;$('logout').disabled=false;render();}}
$('shiftButton').onclick=()=>{if(busy||!loaded||record?.status==='completed')return;if(record?.status==='working'){$('endModeCurrent').checked=true;$('endModeManual').checked=false;$('endHour').value='';$('endMinute').value='';setEndMode();error('endError','');$('confirmDialog').showModal();$('endModeCurrent').focus();}else start();};
function currentTime(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:CONFIG.TIME_ZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now()));return parts.find(p=>p.type==='hour').value+':'+parts.find(p=>p.type==='minute').value;}
function setEndMode(){const manual=$('endModeManual').checked;$('manualTime').hidden=!manual;$('currentPreview').hidden=manual;for(const id of ['endHour','endMinute']){$(id).disabled=!manual;$(id).required=manual;}error('endError','');$('currentPreview').textContent='ساعت فعلی تهران: '+fa(currentTime());}
$('endModeCurrent').onchange=setEndMode;$('endModeManual').onchange=()=>{setEndMode();if($('endModeManual').checked)$('endHour').focus();};setEndMode();
$('endForm').onsubmit=async e=>{e.preventDefault();if(busy||record?.status!=='working')return;let endTime;if($('endModeCurrent').checked){endTime=currentTime();}else{const hour=digits($('endHour').value.trim()),minute=digits($('endMinute').value.trim());if(!/^\d{1,2}$/.test(hour)||!/^\d{1,2}$/.test(minute)||Number(hour)>23||Number(minute)>59){error('endError','ساعت باید از ۰ تا ۲۳ و دقیقه از ۰ تا ۵۹ باشد.');return;}endTime=String(Number(hour)).padStart(2,'0')+':'+String(Number(minute)).padStart(2,'0');}const owner=account,id=record.id;busy=true;epoch++;$('confirmEnd').disabled=true;$('logout').disabled=true;error('endError','');error('shiftError','');render();clearLocationPreview();try{let location=null,locationError='';try{location=await locate();}catch(err){locationError=err.message;}if(account!==owner)return;const r=await api('end',{id,endTime});if(account!==owner)return;const saved=validRecord(r.record);if(saved.status!=='completed')throw Error('پایان شیفت تأیید نشد. صفحه را تازه کنید و وضعیت را بررسی کنید.');record=saved;loaded=true;$('confirmDialog').close();success('پایان شیفت در ساعت '+fa(saved.endTime)+' ثبت شد.');showLocationPreview(location,'پایان شیفت',locationError);}catch(err){if(account===owner)error($('confirmDialog').open?'endError':'shiftError',err.message);}finally{busy=false;$('confirmEnd').disabled=false;$('logout').disabled=false;render();}};
$('cancelEnd').onclick=()=>{if(!busy)$('confirmDialog').close();};$('confirmDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();});$('logout').onclick=()=>{if(!busy)leave();};
function tick(){if($('confirmDialog').open&&!$('endModeManual').checked)$('currentPreview').textContent='ساعت فعلی تهران: '+fa(currentTime());$('mainClock').textContent=timeFormat.format(new Date(now()));$('employeeToday').textContent=dateFormat.format(new Date(now()));}tick();setInterval(tick,15000);setInterval(()=>{if(account&&!busy&&!document.hidden)refresh();},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
try{const a=JSON.parse(sessionStorage.getItem(SESSION)||'null');sessionStorage.removeItem('farmad_time_v6');const employee=CONFIG.EMPLOYEES.find(person=>person.id===a?.id);if(a?.token&&a.role==='employee'&&a.api===CONFIG.API_URL&&employee){account={...a,name:employee.name};enter();refresh();}}catch{sessionStorage.removeItem(SESSION);}
})();
