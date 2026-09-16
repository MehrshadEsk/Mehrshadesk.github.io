# Apply Vault — Admin Guide (V5)

## What V5 does

The Apply Vault now uses the same visual language as the main site and adds a terminal-style authorization flow.

- Visitor enters **email (username)** + **access key**.
- The browser hashes the credential before verification.
- Google Apps Script checks the private `Vault Access` tab.
- Approved users see the access-granted motion and enter `apply-vault-private.html`.
- Unapproved users get the authorization-request form.
- Request submission is automatic: it is saved to the `Access Requests` tab and an HTML email is sent to `mehrsh3d@gmail.com`.

## Important: one update is required after uploading V5

The website already has your existing Apps Script `/exec` URL in `access-config.js`.
Keep that URL. You only need to update the code behind the same Apps Script deployment.

1. Open the Google Sheet currently connected to Apply Vault.
2. Go to **Extensions → Apps Script**.
3. Replace the existing script with the new `google-apps-script.gs` from this project.
4. Save.
5. Run **setupVault** once from the function dropdown and approve permissions if Google asks.
6. Go to **Deploy → Manage deployments**.
7. Edit the existing Web App deployment.
8. Under **Version**, choose **New version**.
9. Deploy/update it.

Using the existing deployment keeps the `/exec` URL unchanged, so `access-config.js` does not need a new URL.

## Google Sheet structure

### Vault Access

This remains intentionally simple:

| Email | Password | Status | Note |
|---|---|---|---|
| person@example.com | AV-Jordan-2026! | ALLOW | Applicant |

The visitor uses the **Email** as their username and the **Password** as their access key.

Rules:
- Email matching is case-insensitive.
- Password matching is exact after trimming beginning/end spaces.
- Status must be `ALLOW`.
- If an email appears multiple times, the newest/lower row wins.
- To revoke access, change the newest row to `REVOKED`.

### Access Requests

V5 uses these columns automatically:

| Timestamp | Request ID | First Name | Last Name | Mobile | Email | University / Affiliation | University Entry Year | Reason for Access | Status |
|---|---|---|---|---|---|---|---|---|---|

If the old six-column request layout exists, `setupVault()` migrates it to the new structure and keeps the existing requests.

## Approve a new request

1. Open the `Access Requests` tab.
2. Review the applicant.
3. Open `Vault Access`.
4. Add their email.
5. Assign a unique access key/password.
6. Set Status to `ALLOW`.
7. Send the applicant their email + access key.

They can then sign in immediately. You do not need to redeploy anything when you add, remove, revoke, or change a user's password.

## Email notification

Every successful access request is also emailed to:

`mehrsh3d@gmail.com`

The email includes:
- request reference ID
- first and last name
- mobile number
- email
- university / affiliation
- university entry year
- reason for access
- the exact admin action required to approve them

## Security note

Credentials are checked against a private Google Sheet and the raw password is not sent in the verification URL; the browser sends a SHA-256 credential signature.

However, the site is hosted on GitHub Pages, which is static hosting. A page stored in a public repository is not suitable for highly sensitive/private documents even if navigation to it is gated. Do not put IDs, financial data, confidential research, secrets, or other high-risk material in `apply-vault-private.html` unless the protected content is later moved behind real server-side authentication.
