(() => {
  'use strict';
  const c=window.SIGNAL_CONFIG, $=id=>document.getElementById(id),form=$('registration'),members=$('members'),submit=$('submit'),add=$('add-member');
  const deadline=Date.parse(c.DEADLINE); let busy=false,completed=false;
  const registered=new Set([...document.querySelectorAll('.signal-registered-grid li')].map(x=>x.textContent.trim()));
  const digits=v=>v.replace(/[۰-۹٠-٩]/g,x=>String(x.charCodeAt(0)-(x.charCodeAt(0)>=1776?1776:1632)));
  const isConfigured=()=>/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(c.API_URL.trim());
  function status(message=''){const el=$('form-status');el.textContent=message;el.hidden=!message;}
  function updateControls(){const closed=Date.now()>=deadline;submit.disabled=busy||completed||closed||!isConfigured();add.disabled=busy||closed||members.children.length>=c.MAX_MEMBERS;for(const el of form.querySelectorAll('input, .remove-button'))el.disabled=busy||closed;if(closed&&!completed)status('The registration deadline has passed.');else if(!isConfigured()&&!completed)status('Registration service is not configured yet. Please contact the course team.');}
  function renumber(){[...members.children].forEach((el,i)=>{el.querySelector('.member-name').textContent=`Member ${i+1}`;const remove=el.querySelector('.remove-button');remove.hidden=i===0;remove.setAttribute('aria-label',`Remove member ${i+1}`);});$('member-count').textContent=`${members.children.length} / ${c.MAX_MEMBERS}`;updateControls();}
  function addMember(){if(members.children.length>=c.MAX_MEMBERS)return;const el=$('member-template').content.firstElementChild.cloneNode(true);el.querySelector('.remove-button').addEventListener('click',()=>{el.remove();renumber();});el.querySelectorAll('input').forEach(input=>{input.addEventListener('input',()=>{fieldError(input,'');});});members.append(el);renumber();}
  function fieldError(input,message){const el=input.parentElement.querySelector('.field-error');el.textContent=message;el.hidden=!message;input.setAttribute('aria-invalid',String(!!message));}
  add.addEventListener('click',addMember);addMember();
  form.addEventListener('change',e=>{if(e.target.name==='project')$('project-error').hidden=true;});
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(busy||completed||Date.now()>=deadline||!isConfigured())return;
    status();let valid=true;const ids=new Set(),team=[];
    for(const el of members.children){const input=key=>el.querySelector(`[data-field="${key}"]`),name=input('name'),phone=input('phone'),id=input('studentId');const m={name:name.value.trim(),phone:digits(phone.value).replace(/[\s()-]/g,''),studentId:digits(id.value).trim()};
      const check=(field,msg)=>{fieldError(field,msg);if(msg)valid=false;};
      check(name,m.name.length<2?'Enter your full name.':'');check(phone,!/^\+?\d{10,15}$/.test(m.phone)?'Enter a valid phone number.':'');
      check(id,!/^\d{9}$/.test(m.studentId)?'Enter a 9-digit student ID.':registered.has(m.studentId)?'This student is already registered.':ids.has(m.studentId)?'Duplicate student ID.':'');ids.add(m.studentId);team.push(m);
    }
    const project=form.querySelector('input[name=project]:checked')?.value;$('project-error').hidden=!!project;if(!valid||!project){status('Please check the highlighted fields.');return;}
    busy=true;updateControls();$('submit-label').textContent='Registering…';$('submit-arrow').hidden=true;submit.querySelector('.spinner').hidden=false;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
    try{const response=await fetch(c.API_URL.trim(),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action:'register',project,members:team,website:$('website').value}),redirect:'follow',credentials:'omit',signal:controller.signal});const result=await response.json();if(!response.ok||result.ok!==true||!result.registrationId)throw new Error(result.error||'Registration was not confirmed.');completed=true;$('registration-view').hidden=true;$('success-view').hidden=false;$('success-summary').textContent=`Your team of ${team.length} is registered for Project ${project}.`;$('receipt-id').textContent=result.registrationId;$('success-view').focus();
    }catch(error){status(error.name==='AbortError'||error instanceof TypeError?'Connection interrupted. Registration may have been saved; contact the course team before retrying.':error instanceof SyntaxError?'Invalid server response. Contact the course team to verify registration.':error.message);}
    finally{clearTimeout(timeout);busy=false;$('submit-label').textContent='Register team';$('submit-arrow').hidden=false;submit.querySelector('.spinner').hidden=true;updateControls();}
  });
  setInterval(updateControls,1000);document.addEventListener('visibilitychange',updateControls);
})();
