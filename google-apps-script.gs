/**
 * Mehrshad Eskandarpour — Apply Vault authentication + access requests
 *
 * This script is designed to be BOUND to the Google Sheet you use for access control.
 * Run setupVault() once, then deploy as a Web App.
 *
 * Sheet tab: Vault Access
 * Columns: Email | Password | Status | Note
 *
 * Sheet tab: Access Requests
 * Columns: Timestamp | Name | Email | Affiliation | Reason | Status
 *
 * Access rule:
 * - Email must match.
 * - Password must match the password assigned to that email.
 * - Status must be ALLOW.
 * - The newest row for a duplicated email wins.
 *
 * To revoke access: set Status to REVOKED (or anything other than ALLOW).
 * To change a password: edit Password for that email.
 * Do not use important passwords from other accounts here; assign a unique vault key.
 */

const ACCESS_SHEET_NAME = 'Vault Access';
const REQUEST_SHEET_NAME = 'Access Requests';
const ALLOWED_STATUS = 'ALLOW';
const OWNER_EMAIL = 'mehrsh3d@gmail.com';

/** Run once manually from Apps Script after pasting this file. */
function setupVault() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Open this script from the target Google Sheet, then run setupVault again.');
  PropertiesService.getScriptProperties().setProperty('VAULT_SPREADSHEET_ID', active.getId());

  const access = getAccessSheet_();
  const requests = getRequestSheet_();
  access.setFrozenRows(1);
  requests.setFrozenRows(1);
  access.getRange('B:B').setNumberFormat('@'); // keep passwords as literal text
  access.autoResizeColumns(1, 4);
  requests.autoResizeColumns(1, 6);
  return 'Apply Vault sheets are ready.';
}

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
    const sheet = getRequestSheet_();
    sheet.appendRow([now, name, email, affiliation, reason, 'PENDING']);

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
      const credential = String(p.credential || '').trim().toLowerCase();
      payload.allowed = isValidEmail_(email) && /^[a-f0-9]{64}$/.test(credential) && isAllowed_(email, credential);
    }
  } catch (err) {
    console.error(err);
    payload = { allowed: false };
  }

  // JSONP allows a static GitHub Pages frontend to receive a tiny boolean response.
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
    'TO GRANT ACCESS:',
    'Open the "Vault Access" sheet, add this email, choose a unique password, and set Status to ALLOW.'
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
      <div style="margin-top:24px;padding:14px;background:#141714;color:#959990;font-size:12px;line-height:1.6">To approve: open <b>Vault Access</b>, add <b>${safeEmail}</b>, choose a unique password, and set Status to <b style="color:#78b98b">ALLOW</b>.</div>
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
