/**
 * Mehrshad Eskandarpour — Apply Vault access list + email notification
 *
 * Google Sheet setup:
 * Sheet tab name: Access Requests
 * Columns: Timestamp | Name | Email | Affiliation | Reason | Status
 *
 * To approve someone, set Status to ALLOW.
 * To revoke access, change Status to REVOKED (or anything other than ALLOW).
 */

const SHEET_NAME = 'Access Requests';
const ALLOWED_STATUS = 'ALLOW';
const OWNER_EMAIL = 'mehrsh3d@gmail.com';

function doPost(e) {
  try {
    const data = (e && e.parameter) || {};
    if (String(data.website || '').trim()) return textResponse_('ignored'); // honeypot
    if (String(data.action || '') !== 'request') return textResponse_('invalid action');

    const name = clean_(data.name, 120);
    const email = normalizeEmail_(data.email);
    const affiliation = clean_(data.affiliation, 180);
    const reason = clean_(data.reason, 1000);
    if (!name || !isValidEmail_(email) || !reason) return textResponse_('invalid request');

    const now = new Date();
    const sheet = getSheet_();
    sheet.appendRow([now, name, email, affiliation, reason, 'PENDING']);

    // Email notification. The Sheet remains the source of truth even if MailApp is temporarily unavailable.
    try {
      sendRequestEmail_(now, name, email, affiliation, reason);
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
      payload.allowed = isValidEmail_(email) && isAllowed_(email);
    }
  } catch (err) {
    console.error(err);
    payload = { allowed: false };
  }

  // JSONP lets a static GitHub Pages site read the result without a cross-origin fetch.
  const js = callback + '(' + JSON.stringify(payload) + ');';
  return ContentService.createTextOutput(js).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sendRequestEmail_(timestamp, name, email, affiliation, reason) {
  const tz = Session.getScriptTimeZone() || 'Etc/GMT';
  const when = Utilities.formatDate(timestamp, tz, 'yyyy-MM-dd HH:mm:ss z');
  const subject = 'Apply Vault — Access Request — ' + name;
  const safeName = htmlEscape_(name);
  const safeEmail = htmlEscape_(email);
  const safeAffiliation = htmlEscape_(affiliation || 'Not provided');
  const safeReason = htmlEscape_(reason).replace(/\n/g, '<br>');

  const plain = [
    'APPLY VAULT — ACCESS REQUEST',
    '',
    'Name: ' + name,
    'Email: ' + email,
    'Affiliation: ' + (affiliation || 'Not provided'),
    'Requested at: ' + when,
    '',
    'Reason:',
    reason,
    '',
    'Approval: change this email\'s newest Status in the Access Requests sheet to ALLOW.'
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#0d0f0d;color:#ecece5;padding:28px;border:1px solid #2a2d29">
      <div style="font-size:11px;letter-spacing:2px;color:#d35a36;margin-bottom:18px">APPLY VAULT / ACCESS REQUEST</div>
      <h2 style="font-size:22px;margin:0 0 24px;font-weight:600">New access request</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#d9dbd3">
        <tr><td style="padding:10px 0;color:#777b73;width:130px">Name</td><td style="padding:10px 0">${safeName}</td></tr>
        <tr><td style="padding:10px 0;color:#777b73">Email</td><td style="padding:10px 0">${safeEmail}</td></tr>
        <tr><td style="padding:10px 0;color:#777b73">Affiliation</td><td style="padding:10px 0">${safeAffiliation}</td></tr>
        <tr><td style="padding:10px 0;color:#777b73">Requested</td><td style="padding:10px 0">${htmlEscape_(when)}</td></tr>
      </table>
      <div style="margin-top:22px;border-top:1px solid #2a2d29;padding-top:18px">
        <div style="font-size:11px;letter-spacing:1px;color:#777b73;margin-bottom:9px">REASON FOR ACCESS</div>
        <div style="font-size:14px;line-height:1.7;color:#d9dbd3">${safeReason}</div>
      </div>
      <div style="margin-top:24px;padding:14px;background:#141714;color:#959990;font-size:12px;line-height:1.6">To approve: open <b>Access Requests</b> and change the newest row for <b>${safeEmail}</b> from PENDING to <b style="color:#78b98b">ALLOW</b>.</div>
    </div>`;

  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: subject,
    body: plain,
    htmlBody: html,
    replyTo: email,
    name: 'Mehrshad Apply Vault'
  });
}

function isAllowed_(email) {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  // Email = column C, Status = column F. Search bottom-up so the newest decision wins.
  const rows = sheet.getRange(2, 3, lastRow - 1, 4).getDisplayValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    const rowEmail = normalizeEmail_(rows[i][0]);
    const status = String(rows[i][3] || '').trim().toUpperCase();
    if (rowEmail === email) return status === ALLOWED_STATUS;
  }
  return false;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Affiliation', 'Reason', 'Status']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function isValidEmail_(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function clean_(value, max) { return String(value || '').trim().slice(0, max); }
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
