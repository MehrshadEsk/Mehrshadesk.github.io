/**
 * Mehrshad Eskandarpour — Application Journey access list
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

    const sheet = getSheet_();
    sheet.appendRow([new Date(), name, email, affiliation, reason, 'PENDING']);
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

function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}
function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function clean_(value, max) {
  return String(value || '').trim().slice(0, max);
}
function safeCallback_(value) {
  const callback = String(value || 'callback');
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback) ? callback : 'callback';
}
function textResponse_(message) {
  return ContentService.createTextOutput(message).setMimeType(ContentService.MimeType.TEXT);
}
