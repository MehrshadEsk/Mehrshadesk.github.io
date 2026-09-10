# Apply Vault — Google Sheet Access Gate

The new Apply Vault uses a minimal access flow:

1. Visitor enters only their email.
2. The site checks the `Access Requests` Google Sheet.
3. If the newest row for that email is `ALLOW`, Apply Vault opens.
4. If access is missing, the request form appears automatically.
5. Submitting the form logs the request in Google Sheets **and emails it to `mehrsh3d@gmail.com`**.
6. To approve the visitor, change the newest Status for their email from `PENDING` to `ALLOW`.
7. The private Apply Vault re-checks authorization on every page load.
8. To revoke access, change `ALLOW` to `REVOKED` (or anything other than `ALLOW`).

## 1. Create / use the Google Sheet

Use a Google Sheet with a tab named `Access Requests`. The script will create it automatically if needed with:

`Timestamp | Name | Email | Affiliation | Reason | Status`

## 2. Install the Apps Script

In the Sheet, open **Extensions → Apps Script**.

Replace the existing Apps Script with the contents of `google-apps-script.gs`, then save.

The script now uses `MailApp.sendEmail`, so the first deployment/update may ask you to authorize permission to send email.

## 3. Deploy or update the Web App

If this is the first deployment:

**Deploy → New deployment → Web app**

- Execute as: **Me**
- Who has access: **Anyone**

If you already deployed the old access script, create a **new version/deployment update** after replacing the code so the live `/exec` endpoint receives the new behavior.

Copy the Web App URL ending in `/exec`.

## 4. Connect the site

Open `access-config.js` and replace:

```js
apiUrl: 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
```

with the real `/exec` URL.

## 5. Approve / reject / revoke

- Approve: `PENDING` → `ALLOW`
- Reject: `PENDING` → `DENIED`
- Revoke: `ALLOW` → `REVOKED`

The newest row for each email is treated as the current decision.

## Personal experience content

`apply-vault-private.html` contains a **MY EXPERIENCE** section with four clearly marked placeholders:

- CONTEXT
- STRATEGY
- FRICTION
- LESSON

Replace those bracketed placeholder sentences with Mehrshad's real history before publishing personal claims.

## Security note

This remains a lightweight gate on a static GitHub Pages site. It is useful for controlled portfolio access, but it is not equivalent to server-side authentication for highly sensitive documents.
