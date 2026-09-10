# Apply Vault — Access Setup V4

Apply Vault now uses **email + a different password for each person**.

The credential list is managed in a private Google Sheet, not in the public website code.

## Connection status

**CONNECTED.** The deployed Google Apps Script Web App URL is already configured in `access-config.js`.

Deployment ID: `AKfycbwpcJ4GUEbty_N_9iFEiU_WDr39YtjDUiSzdFHVDKne6ieew3OXkQGh3f8JrcrJj6TT`

You do not need to paste the URL again.

## One-time connection (already completed)

1. Open the Google Sheet you want to use.
2. Go to **Extensions → Apps Script**.
3. Replace the Apps Script code with the full contents of `google-apps-script.gs`.
4. Save and run `setupVault()` once. Approve permissions.
5. The script creates two tabs: `Vault Access` and `Access Requests`.
6. Deploy the script: **Deploy → New deployment → Web app**.
7. Choose **Execute as: Me** and **Who has access: Anyone**.
8. Copy the Web App URL ending in `/exec`.
9. The current deployment URL is already in `access-config.js`.
10. Upload/commit the V4 website files to GitHub.

After this one-time setup, access changes happen only in the Google Sheet. No website redeploy is needed when adding, revoking, or changing a user's password.

## Vault Access tab

Columns:

`Email | Password | Status | Note`

Example:

`person@example.com | AV-Jordan-2026! | ALLOW | Applicant`

- `ALLOW` = can enter.
- `REVOKED` (or any value other than `ALLOW`) = cannot enter.
- Change the Password cell to rotate that person's access key.
- If an email is listed multiple times, the newest/lower row wins.

See `VAULT_ADMIN_GUIDE.md` for full instructions, request handling, content editing, and security notes.
