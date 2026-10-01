/**
 * Mehrshad Eskandarpour — Apply Vault authentication + access requests (V5)
 *
 * Bind this script to the Google Spreadsheet used for the vault.
 * Run setupVault() once after replacing the script, then deploy/update the Web App.
 *
 * Vault Access columns:
 *   Email | Password | Status | Note
 *
 * Access Requests columns:
 *   Timestamp | Request ID | First Name | Last Name | Mobile | Email |
 *   University / Affiliation | University Entry Year | Reason for Access | Status
 *
 * Access rule:
 * - The visitor's email is the username.
 * - Password must match the password assigned to that email.
 * - Status must be ALLOW.
 * - If an email appears more than once, the newest row wins.
 */

const ACCESS_SHEET_NAME = 'Vault Access';
const REQUEST_SHEET_NAME = 'Access Requests';
const ALLOWED_STATUS = 'ALLOW';
const OWNER_EMAIL = 'mehrsh3d@gmail.com';
const REQUEST_HEADERS = [
  'Timestamp','Request ID','First Name','Last Name','Mobile','Email',
  'University / Affiliation','University Entry Year','Reason for Access','Status'
];

/** Run once manually after pasting/updating this script. */
function setupVault() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Open this script from the target Google Sheet, then run setupVault again.');
  PropertiesService.getScriptProperties().setProperty('VAULT_SPREADSHEET_ID', active.getId());

  const access = getAccessSheet_();
  const requests = getRequestSheet_();
  access.setFrozenRows(1);
  requests.setFrozenRows(1);
  access.getRange('B:B').setNumberFormat('@');
  access.autoResizeColumns(1, 4);
  requests.autoResizeColumns(1, REQUEST_HEADERS.length);
  requests.setColumnWidth(9, 380);
  return 'Apply Vault V5 is ready.';
}

function doPost(e) {
  if (String((e && e.parameter && e.parameter.action) || "").startsWith("farmad_")) return farmadPost_(e);
  try {
    const data = (e && e.parameter) || {};
    if (String(data.website || '').trim()) return textResponse_('accepted'); // honeypot
    if (String(data.action || '') !== 'request') return textResponse_('invalid action');

    const requestId = cleanRequestId_(data.requestId) || makeRequestId_();
    const firstName = clean_(data.firstName, 80);
    const lastName = clean_(data.lastName, 80);
    const mobile = clean_(data.mobile, 30);
    const email = normalizeEmail_(data.email);
    const affiliation = clean_(data.affiliation, 180);
    const entryYear = clean_(data.entryYear, 4);
    const reason = clean_(data.reason, 1200);

    if (!firstName || !lastName || !isValidMobile_(mobile) || !isValidEmail_(email) || !affiliation || !isValidYear_(entryYear) || !reason) {
      return textResponse_('invalid request');
    }

    // Light anti-spam throttle. A legitimate retry becomes harmless for two minutes.
    const cache = CacheService.getScriptCache();
    const throttleKey = 'vault_req_' + sha256Hex_(email).slice(0, 24);
    if (cache.get(throttleKey)) return textResponse_('accepted');
    cache.put(throttleKey, '1', 120);

    const now = new Date();
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      const sheet = getRequestSheet_();
      sheet.appendRow([
        now, requestId, firstName, lastName, mobile, email,
        affiliation, entryYear, reason, 'PENDING'
      ]);
    } finally {
      lock.releaseLock();
    }

    try {
      sendRequestEmail_({
        timestamp: now, requestId: requestId, firstName: firstName, lastName: lastName,
        mobile: mobile, email: email, affiliation: affiliation, entryYear: entryYear, reason: reason
      });
    } catch (mailErr) {
      console.error('Request saved, but email notification failed:', mailErr);
    }

    return textResponse_('request received');
  } catch (err) {
    console.error(err);
    return textResponse_('error');
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const callback = safeCallback_(p.callback);
  let payload = { allowed: false };

  try {
    if (String(p.action || '') === 'verify') {
      const email = normalizeEmail_(p.email);
      const credential = String(p.credential || '').trim().toLowerCase();
      payload.allowed = isValidEmail_(email) && /^[a-f0-9]{64}$/.test(credential) && isAllowed_(email, credential);
    }
  } catch (err) {
    console.error(err);
    payload = { allowed: false };
  }

  const js = callback + '(' + JSON.stringify(payload) + ');';
  return ContentService.createTextOutput(js).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function isAllowed_(email, submittedCredentialHash) {
  const sheet = getAccessSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const rows = sheet.getRange(2, 1, lastRow - 1, 4).getDisplayValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    const rowEmail = normalizeEmail_(rows[i][0]);
    if (rowEmail !== email) continue;

    const password = String(rows[i][1] || '').trim();
    const status = String(rows[i][2] || '').trim().toUpperCase();
    if (status !== ALLOWED_STATUS || !password) return false;

    const expected = credentialHash_(email, password);
    return timingSafeEqual_(expected, submittedCredentialHash);
  }
  return false;
}

function credentialHash_(email, password) {
  return sha256Hex_(normalizeEmail_(email) + '\n' + String(password || '').trim());
}

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function timingSafeEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function sendRequestEmail_(request) {
  const tz = Session.getScriptTimeZone() || 'Etc/GMT';
  const when = Utilities.formatDate(request.timestamp, tz, 'yyyy-MM-dd HH:mm:ss z');
  const fullName = request.firstName + ' ' + request.lastName;
  const subject = 'Apply Vault — Access Request — ' + fullName;

  const plain = [
    'APPLY VAULT — ACCESS REQUEST',
    'Reference: ' + request.requestId,
    '',
    'Name: ' + fullName,
    'Mobile: ' + request.mobile,
    'Email: ' + request.email,
    'University / Affiliation: ' + request.affiliation,
    'University Entry Year: ' + request.entryYear,
    'Requested at: ' + when,
    '',
    'REASON FOR ACCESS',
    request.reason,
    '',
    'TO GRANT ACCESS',
    'Open the "Vault Access" tab in the connected Google Sheet.',
    'Add the applicant email, assign a unique password, and set Status to ALLOW.',
    'The applicant will use their email as the username.'
  ].join('\n');

  const html = `
  <div style="margin:0;background:#f2f2ef;padding:34px 18px;font-family:Arial,Helvetica,sans-serif;color:#252622">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #ddded7">
      <div style="padding:18px 24px;border-bottom:1px solid #ddded7;font-family:monospace;font-size:11px;letter-spacing:1.8px;color:#72736d">
        <span style="color:#c34b29">●</span>&nbsp; APPLY VAULT / AUTHORIZATION REQUEST
      </div>
      <div style="padding:30px 28px 28px">
        <div style="font-family:monospace;font-size:11px;letter-spacing:1.4px;color:#c34b29;margin-bottom:9px">NEW REQUEST / ${htmlEscape_(request.requestId)}</div>
        <h1 style="font-size:26px;line-height:1.2;margin:0 0 7px;font-weight:600;letter-spacing:-.5px">${htmlEscape_(fullName)}</h1>
        <div style="font-size:13px;color:#7a7d76;margin-bottom:26px">Submitted ${htmlEscape_(when)}</div>

        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
          ${emailRow_('Mobile', request.mobile)}
          ${emailRow_('Email', request.email)}
          ${emailRow_('University / affiliation', request.affiliation)}
          ${emailRow_('University entry year', request.entryYear)}
        </table>

        <div style="margin-top:26px;padding-top:22px;border-top:1px solid #ecece8">
          <div style="font-family:monospace;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#7a7d76;margin-bottom:10px">Reason for access</div>
          <div style="font-size:14px;line-height:1.75;color:#33352f">${htmlEscape_(request.reason).replace(/\n/g, '<br>')}</div>
        </div>

        <div style="margin-top:28px;background:#252622;color:#f6f6f2;padding:18px 20px">
          <div style="font-family:monospace;font-size:10px;letter-spacing:1.2px;color:#df8a70;margin-bottom:8px">ADMIN ACTION</div>
          <div style="font-size:13px;line-height:1.7;color:#dedfd8">Open <b>Vault Access</b> → add <b>${htmlEscape_(request.email)}</b> → assign a unique password → set Status to <b style="color:#92cca0">ALLOW</b>.</div>
        </div>
      </div>
    </div>
  </div>`;

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: subject,
    body: plain,
    htmlBody: html,
    replyTo: request.email,
    name: 'Mehrshad Apply Vault'
  });
}

function emailRow_(label, value) {
  return '<tr><td style="width:190px;padding:11px 0;color:#8a8d85;border-bottom:1px solid #f0f0ec">' + htmlEscape_(label) + '</td>' +
    '<td style="padding:11px 0;color:#252622;border-bottom:1px solid #f0f0ec">' + htmlEscape_(value) + '</td></tr>';
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('VAULT_SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Vault spreadsheet is not configured. Run setupVault() once from the bound Sheet.');
}

function getAccessSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(ACCESS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ACCESS_SHEET_NAME);
    sheet.appendRow(['Email', 'Password', 'Status', 'Note']);
    sheet.setFrozenRows(1);
    sheet.getRange('B:B').setNumberFormat('@');
  }
  return sheet;
}

function getRequestSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(REQUEST_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(REQUEST_SHEET_NAME);
    sheet.getRange(1, 1, 1, REQUEST_HEADERS.length).setValues([REQUEST_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  ensureRequestSchema_(sheet);
  return sheet;
}

function ensureRequestSchema_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const oldHeaders = sheet.getRange(1, 1, 1, Math.min(lastColumn, 6)).getDisplayValues()[0];
  const isOldSchema = oldHeaders.join('|') === ['Timestamp','Name','Email','Affiliation','Reason','Status'].join('|');

  if (isOldSchema) {
    const lastRow = sheet.getLastRow();
    const oldRows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 6).getValues() : [];
    const migrated = oldRows.map(function(row) {
      return [row[0], makeRequestId_(), row[1] || '', '', '', row[2] || '', row[3] || '', '', row[4] || '', row[5] || 'PENDING'];
    });
    sheet.clearContents();
    sheet.getRange(1, 1, 1, REQUEST_HEADERS.length).setValues([REQUEST_HEADERS]);
    if (migrated.length) sheet.getRange(2, 1, migrated.length, REQUEST_HEADERS.length).setValues(migrated);
    sheet.setFrozenRows(1);
    return;
  }

  const current = sheet.getRange(1, 1, 1, REQUEST_HEADERS.length).getDisplayValues()[0];
  if (current.join('|') !== REQUEST_HEADERS.join('|') && sheet.getLastRow() <= 1) {
    sheet.getRange(1, 1, 1, REQUEST_HEADERS.length).setValues([REQUEST_HEADERS]);
  }
}

function normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function isValidEmail_(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function isValidMobile_(value) { return /^[0-9+()\-\.\s]{5,30}$/.test(String(value || '').trim()); }
function isValidYear_(value) {
  return /^\d{4}$/.test(String(value || '')) && Number(value) >= 1950 && Number(value) <= 2100;
}
function clean_(value, max) { return String(value || '').trim().slice(0, max); }
function cleanRequestId_(value) {
  const id = String(value || '').trim().toUpperCase();
  return /^AV-[A-Z0-9-]{6,40}$/.test(id) ? id : '';
}
function makeRequestId_() {
  return 'AV-' + Utilities.formatDate(new Date(), 'Etc/GMT', 'yyyyMMdd') + '-' + Utilities.getUuid().slice(0, 6).toUpperCase();
}
function safeCallback_(value) {
  const callback = String(value || 'callback');
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback) ? callback : 'callback';
}
function htmlEscape_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function textResponse_(message) {
  return ContentService.createTextOutput(message).setMimeType(ContentService.MimeType.TEXT);
}


/**
 * فارماد — سرویس مستقل گزارش‌های بازدید.
 * This file is appended to the existing script. Run setupFarmad once.
 */
const FARMAD_HEADERS=['ID','Owner','Author','Location','Data','Photos','Status','Review','Version','Created','Updated','LastOperation'];
function setupFarmad(){
 const ss=getSpreadsheet_();PropertiesService.getScriptProperties().setProperty('FARMAD_SHEET_ID',ss.getId());
 let users=ss.getSheetByName('Farmad Users');if(!users){users=ss.insertSheet('Farmad Users');users.appendRow(['Email','Password Hash','Name','Role','Status']);}
 users.setFrozenRows(1);users.getRange('A:B').setNumberFormat('@');
 let reports=ss.getSheetByName('Farmad Reports');if(!reports){reports=ss.insertSheet('Farmad Reports');reports.appendRow(FARMAD_HEADERS);}
 reports.setFrozenRows(1);reports.getRange('A:L').setNumberFormat('@');
 const props=PropertiesService.getScriptProperties();if(!props.getProperty('FARMAD_FOLDER_ID'))props.setProperty('FARMAD_FOLDER_ID',DriveApp.createFolder('Farmad — Private inspection photos').getId());
 return 'Farmad ready. Create users with addFarmadUser from the setup menu.';
}
function onOpen(){SpreadsheetApp.getUi().createMenu('فارماد').addItem('ساخت حساب کاربری','addFarmadUser').addToUi();}
function addFarmadUser(){
 const ui=SpreadsheetApp.getUi();const e=ui.prompt('ایمیل کاربر').getResponseText().trim().toLowerCase();if(!isValidEmail_(e))throw Error('Invalid email');
 const p=ui.prompt('رمز اختصاصی (حداقل ۱۲ کاراکتر)').getResponseText();if(p.length<12)throw Error('Password must be at least 12 characters');
 const name=ui.prompt('نام و نام خانوادگی').getResponseText().trim();const role=ui.prompt('نقش: ADMIN برای شرکت یا FIELD برای بازدیدکننده').getResponseText().trim().toUpperCase();if(!['ADMIN','FIELD'].includes(role))throw Error('Invalid role');
 farmadSheet_('Farmad Users').appendRow([e,credentialHash_(e,p),name,role,'ALLOW']);
}
function farmadSheet_(name){const id=PropertiesService.getScriptProperties().getProperty('FARMAD_SHEET_ID');if(!id)throw Error('راه‌اندازی فارماد هنوز انجام نشده است.');return SpreadsheetApp.openById(id).getSheetByName(name);}
function farmadUser_(email){const rows=farmadSheet_('Farmad Users').getDataRange().getDisplayValues();for(let i=rows.length-1;i>0;i--)if(rows[i][0].toLowerCase()===email)return {email:email,hash:rows[i][1],name:rows[i][2],role:rows[i][3],allowed:rows[i][4]==='ALLOW'};return null;}
function farmadJson_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function farmadPost_(e){
 const p=e.parameter||{};try{
 const cache=CacheService.getScriptCache();
 if(p.action==='farmad_login'){
 const email=normalizeEmail_(p.email),key='farmad_attempt_'+sha256Hex_(email),n=Number(cache.get(key)||0);if(n>=10)throw Error('تلاش‌های ورود زیاد است؛ ۱۵ دقیقه دیگر امتحان کنید.');cache.put(key,String(n+1),900);
 const u=farmadUser_(email);if(!u||!u.allowed||!timingSafeEqual_(u.hash,String(p.credential||'')))throw Error('ایمیل یا رمز صحیح نیست یا دسترسی غیرفعال شده است.');
 const token=Utilities.getUuid()+Utilities.getUuid();cache.put('farmad_session_'+sha256Hex_(token),JSON.stringify({email:email,hash:u.hash}),21600);cache.remove(key);return farmadJson_({ok:true,token:token,user:{email:u.email,name:u.name,role:u.role}});
 }
 const session=JSON.parse(cache.get('farmad_session_'+sha256Hex_(String(p.token||'')))||'null');if(!session)throw Error('نشست پایان یافته؛ دوباره وارد شوید.');
 const u=farmadUser_(session.email);if(!u||!u.allowed||!timingSafeEqual_(u.hash,session.hash))throw Error('دسترسی غیرفعال شده؛ دوباره وارد شوید.');
 if(p.action==='farmad_logout'){cache.remove('farmad_session_'+sha256Hex_(p.token));return farmadJson_({ok:true});}
 const sheet=farmadSheet_('Farmad Reports'),rows=sheet.getDataRange().getDisplayValues();
 const unpack=r=>({id:r[0],owner:r[1],author:r[2],location:r[3],data:JSON.parse(r[4]),photos:JSON.parse(r[5]),status:r[6],review:r[7],version:Number(r[8]),created:r[9],updated:r[10]});
 if(p.action==='farmad_list')return farmadJson_({ok:true,user:{email:u.email,name:u.name,role:u.role},reports:rows.slice(1).filter(r=>r[0]&&(u.role==='ADMIN'||r[1]===u.email)).map(unpack)});
 const payload=JSON.parse(p.payload||'{}');
 if(p.action==='farmad_photo'){
 const record=rows.slice(1).find(r=>(u.role==='ADMIN'||r[1]===u.email)&&JSON.parse(r[5]).some(f=>f.id===payload.id));if(!record)throw Error('دسترسی به عکس مجاز نیست.');
 const file=DriveApp.getFileById(payload.id);return farmadJson_({ok:true,image:'data:'+file.getMimeType()+';base64,'+Utilities.base64Encode(file.getBlob().getBytes())});
 }
 if(!['farmad_save','farmad_review'].includes(p.action))throw Error('درخواست نامعتبر است.');
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const fresh=sheet.getDataRange().getDisplayValues();let index=fresh.findIndex((r,i)=>i>0&&r[0]===payload.id),old=index>0?unpack(fresh[index]):null;
 if(payload.id&&!old)throw Error('گزارش یافت نشد.');if(old&&u.role!=='ADMIN'&&old.owner!==u.email)throw Error('دسترسی به گزارش مجاز نیست.');
 if(old&&payload.operation&&fresh[index][11]===payload.operation)return farmadJson_({ok:true,report:old});
 if(old&&Number(payload.version)!==old.version)throw Error('گزارش هم‌زمان تغییر کرده؛ نسخه جدید را باز کنید.');
 const now=new Date().toISOString();
 if(p.action==='farmad_review'){
 if(u.role!=='ADMIN'||!old)throw Error('فقط مدیر شرکت مجاز است.');if(!['approved','changes','pending'].includes(payload.status))throw Error('وضعیت نامعتبر است.');
 old.status=payload.status;old.review=String(payload.review||'').slice(0,4000);old.version++;old.updated=now;
 }else{
 const d=payload.data||{},spec={type:['زمان‌دار','چشمک‌زن'],structure:['دستکدار','مونو','گاما'],power:['برقی','سولار'],battery:['اسیدی','لیتیومی','فاقد باتری'],cable:['زمینی','هوایی'],condition:['سالم','دارای نقص']};
 for(const k of ['pole','location','inspector','date'])if(!String(d[k]||'').trim())throw Error('مشخصات اصلی را تکمیل کنید.');
 for(const k of Object.keys(spec))if(!spec[k].includes(d[k]))throw Error('گزینه‌های تجهیزات را تکمیل کنید.');
 for(const k of ['three','two','one','countdown','solar']){if(d[k]===''||d[k]===undefined||!Number.isInteger(Number(d[k]))||Number(d[k])<0||Number(d[k])>1000)throw Error('تعداد تجهیزات نامعتبر است.');d[k]=Number(d[k]);}
 if(d.lat===''||d.lng===''||!Number.isFinite(Number(d.lat))||!Number.isFinite(Number(d.lng))||Math.abs(Number(d.lat))>90||Math.abs(Number(d.lng))>180)throw Error('موقعیت پایه را ثبت کنید.');
 const allowedKeys=['pole','location','contractor','inspector','date','type','structure','power','battery','cable','condition','three','two','one','countdown','solar','notes','lat','lng','accuracy'];
 const cleaned={};allowedKeys.forEach(k=>{if(d[k]!==undefined)cleaned[k]=typeof d[k]==='number'?d[k]:String(d[k]).trim().slice(0,k==='notes'?4000:300);});
 const pics=payload.photos||[];if(!Array.isArray(pics)||pics.length<1||pics.length>6)throw Error('بین یک تا شش عکس لازم است.');
 const saved=[],newFiles=[];try{
 for(const photo of pics){
 if(photo.id){const existing=old&&old.photos.find(f=>f.id===photo.id);if(!existing)throw Error('عکس متعلق به گزارش نیست.');saved.push(existing);}
 else{if(!/^data:image\/jpeg;base64,/.test(photo.image||'')||photo.image.length>1400000)throw Error('حجم یا نوع عکس نامعتبر است.');const bytes=Utilities.base64Decode(photo.image.split(',')[1]);if((bytes[0]&255)!==255||(bytes[1]&255)!==216)throw Error('عکس معتبر نیست.');const file=DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FARMAD_FOLDER_ID')).createFile(Utilities.newBlob(bytes,'image/jpeg','pole-'+cleaned.pole+'.jpg'));newFiles.push(file);saved.push({id:file.getId(),name:file.getName()});}
 }
 const report={id:old?old.id:payload.operation||Utilities.getUuid(),owner:old?old.owner:u.email,author:old?old.author:u.name,location:cleaned.location,data:cleaned,photos:saved,status:'pending',review:'',version:old?old.version+1:1,created:old?old.created:now,updated:now};
 if(!old){const duplicate=fresh.slice(1).find(r=>r[0]===report.id);if(duplicate){newFiles.forEach(f=>f.setTrashed(true));return farmadJson_({ok:true,report:unpack(duplicate)});}}
 const values=farmadValues_(report,payload.operation);if(old)sheet.getRange(index+1,1,1,12).setValues([values]);else sheet.appendRow(values);return farmadJson_({ok:true,report:report});
 }catch(err){newFiles.forEach(f=>f.setTrashed(true));throw err;}
 }
 sheet.getRange(index+1,1,1,12).setValues([farmadValues_(old,payload.operation)]);return farmadJson_({ok:true,report:old});
 }finally{lock.releaseLock();}
 }catch(err){console.error(err);return farmadJson_({ok:false,error:err.message||'ثبت انجام نشد؛ دوباره تلاش کنید.'});}
}
function farmadValues_(r,op){return [r.id,r.owner,r.author,r.location,JSON.stringify(r.data),JSON.stringify(r.photos),r.status,r.review,r.version,r.created,r.updated,op||''].map(v=>{const s=String(v);return /^[=+\-@]/.test(s)?"'"+s:s;});}
