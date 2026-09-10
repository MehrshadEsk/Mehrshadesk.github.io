# Apply Vault — Access Setup

The gate now has a zero-setup mode that works directly on GitHub Pages.

## Current flow

1. Visitor sees only the email access field.
2. The owner email `mehrsh3d@gmail.com` is already approved.
3. Unknown emails receive **ACCESS DENIED** and the request form opens automatically.
4. The visitor fills in name, affiliation (optional), and reason for access.
5. Clicking **Continue to email** creates a pre-filled request addressed to `mehrsh3d@gmail.com`.
6. The visitor can choose **Open email app** or **Open Gmail web** and then press Send.

This flow does not require Google Apps Script, so the access screen will never show an "AUTH NODE OFFLINE" setup error.

## Optional Google Sheet mode

`google-apps-script.gs` is still included. If you want to approve visitors by changing a Google Sheet status to `ALLOW`, deploy that script as a Web App:

- Google Sheet → Extensions → Apps Script
- Replace the script with `google-apps-script.gs`
- Deploy → New deployment → Web app
- Execute as: **Me**
- Who has access: **Anyone**
- Copy the URL ending in `/exec`
- Paste it into `access-config.js` as `apiUrl`

With `apiUrl` configured, the gate checks both the local owner access and the Google Sheet allow list. Request submissions also attempt to send a server-side notification copy while keeping the two email buttons as a reliable fallback.

The Sheet structure used by the included script is:

`Timestamp | Name | Email | Affiliation | Reason | Status`

Use `ALLOW` to approve an email.

## Security

GitHub Pages is a static host. This is a polished access gate, not true server-side authentication. Do not place highly sensitive/private documents behind it.
