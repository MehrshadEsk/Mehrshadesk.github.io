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
