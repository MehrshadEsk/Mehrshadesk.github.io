/* Apply Vault — minimal view, existing credential registry and request endpoint. */
(() => {
  'use strict';
  const cfg = window.MEHRSHAD_ACCESS || {};
  const API = String(cfg.apiUrl || '').trim();
  const remoteConfigured = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/i.test(API);
  const DEST = cfg.privateJourneyUrl || 'apply-vault-private.html';
  const $ = id => document.getElementById(id);
  const verifyForm = $('verify-form');
  const email = $('verify-email');
  const password = $('verify-password');
  const verifyBtn = $('verify-btn');
  const requestToggle = $('request-access');
  const requestShell = $('request-shell');
  const requestForm = $('request-form');
  const requestBtn = $('request-btn');
  const validEmail = text => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(text || '').trim());

  function status(id, message){ const element = $(id); element.textContent=message; element.hidden=!message; }
  function clearSession(){
    ['applicationJourneyAuthorized','applicationJourneyEmail','applicationJourneyCredential'].forEach(key => {
      try{sessionStorage.removeItem(key)}catch(_){}
    });
  }
  function openRequest(open){
    requestShell.hidden = !open;
    requestToggle.setAttribute('aria-expanded',String(open));
    requestToggle.querySelector('span').textContent = open ? '−' : '+';
    if(open){ $('request-email').value = $('request-email').value || email.value.trim(); }
  }
  requestToggle.addEventListener('click', () => {
    const open = requestShell.hidden;
    openRequest(open);
    if(open) $('first-name').focus({preventScroll:true});
  });

  async function makeCredentialHash(address, accessPass){
    if(!crypto || !crypto.subtle) throw new Error('Secure verification is unavailable.');
    const bytes = new TextEncoder().encode(address.trim().toLowerCase() + '\n' + accessPass.trim());
    const digest = await crypto.subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
  }
  function remoteAllowed(address, hash){
    return new Promise(resolve => {
      if(!remoteConfigured){ resolve(null); return; }
      const cb = 'vault_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      let finished = false;
      const finish = value => {
        if(finished) return;
        finished = true;
        clearTimeout(timer);
        try{delete window[cb]}catch(_){window[cb]=undefined}
        script.remove(); resolve(value);
      };
      const timer = setTimeout(() => finish(null),7000);
      window[cb] = value => finish(!!(value && value.allowed === true));
      script.onerror = () => finish(null);
      script.src = `${API}?action=verify&email=${encodeURIComponent(address)}&credential=${encodeURIComponent(hash)}&callback=${encodeURIComponent(cb)}&_=${Date.now()}`;
      document.body.appendChild(script);
    });
  }
  verifyForm.addEventListener('submit', async event => {
    event.preventDefault();
    const address = email.value.trim().toLowerCase();
    const accessPass = password.value;
    status('vault-status','');
    if(!validEmail(address)){status('vault-status','Enter a valid TAN email address.');email.focus();return;}
    if(!accessPass.trim()){status('vault-status','Enter your TAP.');password.focus();return;}
    verifyBtn.disabled=true;
    status('vault-status','Checking access…');
    try{
      const hash=await makeCredentialHash(address,accessPass);
      const result=await remoteAllowed(address,hash);
      if(result !== true){
        clearSession();
        status('vault-status',result===null?'Verification is unavailable. You can request access.':'Access not recognized. You can request access.');
        return;
      }
      sessionStorage.setItem('applicationJourneyAuthorized','1');
      sessionStorage.setItem('applicationJourneyEmail',address);
      sessionStorage.setItem('applicationJourneyCredential',hash);
      password.value='';
      status('vault-status','Access granted. Opening…');
      location.assign(DEST);
    }catch(_){
      clearSession();
      status('vault-status','Verification failed. Please try again.');
    }finally{verifyBtn.disabled=false;}
  });
  const fieldIds=['first-name','last-name','mobile','request-email','affiliation','entry-year','reason'];
  function requestData(){
    return {
      firstName:$('first-name').value.trim(),lastName:$('last-name').value.trim(),
      mobile:$('mobile').value.trim(),email:$('request-email').value.trim().toLowerCase(),
      affiliation:$('affiliation').value.trim(),entryYear:$('entry-year').value.trim(),
      reason:$('reason').value.trim(),website:$('request-website').value.trim()
    };
  }
  function makeRequestId(){return 'AV-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,8).toUpperCase();}
  requestForm.addEventListener('submit',async event => {
    event.preventDefault();
    status('request-status','');
    const data=requestData();
    fieldIds.forEach(id=>$(id).removeAttribute('aria-invalid'));
    const required=[data.firstName,data.lastName,data.mobile,validEmail(data.email),data.affiliation,/^\d{4}$/.test(data.entryYear) && +data.entryYear>=1950 && +data.entryYear<=2100,data.reason];
    const index=required.findIndex(value=>!value);
    if(index>=0){
      $(fieldIds[index]).setAttribute('aria-invalid','true');
      $(fieldIds[index]).focus();
      status('request-status','Please complete the highlighted field.');
      return;
    }
    if(!remoteConfigured){status('request-status','Request service is unavailable.');return;}
    requestBtn.disabled=true;
    requestBtn.firstChild.textContent='Sending… ';
    const requestId=makeRequestId();
    const form=new FormData();
    Object.entries({...data,action:'request',requestId}).forEach(([key,value])=>form.set(key,value));
    try{
      await fetch(API,{method:'POST',mode:'no-cors',body:form,keepalive:true});
      status('request-status',`Request sent for review · ${requestId}`);
      requestBtn.firstChild.textContent='Sent ';
    }catch(_){
      status('request-status','Could not send the request. Please try again.');
      requestBtn.firstChild.textContent='Send request ';
      requestBtn.disabled=false;
    }
  });
  openRequest(false);
})();
