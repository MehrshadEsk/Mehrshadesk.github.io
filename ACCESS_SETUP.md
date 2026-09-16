# Apply Vault — Access Setup V5

Apply Vault uses **email as the username + a unique password/access key for each approved person**.

The credential list is managed in the private Google Sheet, not in the public website code.

## Connection status

**CONNECTED.** The existing Google Apps Script Web App URL is already configured in `access-config.js`.

You do not need to change the URL. After replacing `google-apps-script.gs`, update the existing Apps Script deployment to a **new version** so the same `/exec` endpoint runs V5.

## Update steps for V5

1. Open the Google Sheet already connected to Apply Vault.
2. Go to **Extensions → Apps Script**.
3. Replace the old script with the contents of `google-apps-script.gs`.
4. Save.
5. Run `setupVault()` once.
6. Go to **Deploy → Manage deployments**.
7. Edit the current Web App deployment.
8. Choose **New version** and deploy/update it.

## Vault Access tab

Columns:

`Email | Password | Status | Note`

Example:

`person@example.com | AV-Jordan-2026! | ALLOW | Applicant`

- `ALLOW` = can enter.
- `REVOKED` or any value other than `ALLOW` = cannot enter.
- The visitor uses the Email as the username.
- Change the Password cell to rotate that person's access key.
- If an email appears multiple times, the newest/lower row wins.

## Access Requests tab

V5 records:

`Timestamp | Request ID | First Name | Last Name | Mobile | Email | University / Affiliation | University Entry Year | Reason for Access | Status`

A successful form submission is automatically written to this tab and emailed to the vault owner.

See `VAULT_ADMIN_GUIDE.md` for the full workflow and security note.
