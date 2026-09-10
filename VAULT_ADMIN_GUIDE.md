# Apply Vault — Admin Guide (V4)

## Current status

The Google Apps Script deployment is already connected to the website configuration. For normal access management, you only edit the `Vault Access` Google Sheet.

## One-time setup (already completed)

1. Open the Google Sheet you want to use for Apply Vault.
2. Go to **Extensions → Apps Script**.
3. Delete the old Apps Script code and paste the full content of `google-apps-script.gs`.
4. Save.
5. From the function dropdown, choose **setupVault** and click **Run** once. Approve Google's permissions when prompted.
6. Return to the Sheet. You should now have two tabs:
   - `Vault Access`
   - `Access Requests`
7. In Apps Script choose **Deploy → New deployment → Web app**.
8. Set **Execute as: Me** and **Who has access: Anyone**.
9. Deploy and copy the URL ending in `/exec`.
10. The deployed `/exec` URL is already configured in `access-config.js`.
11. Upload/commit the V4 site files to GitHub.

> When you later change only users/passwords/statuses in the Sheet, you do **not** redeploy the website and you do **not** redeploy Apps Script.

## Give someone access

Open the `Vault Access` tab and add a row:

| Email | Password | Status | Note |
|---|---|---|---|
| person@example.com | AV-Jordan-2026! | ALLOW | Applicant |

Then send that person exactly the email + password you assigned.

Rules:
- Email matching is case-insensitive.
- Password matching is exact after trimming spaces at the beginning/end.
- Use a unique password for Apply Vault; never reuse one of your real account passwords.
- Avoid passwords made only of numbers. The script formats the Password column as text, but a mixed password is safer and clearer.
- If an email appears more than once, the **lowest/newest row wins**. This lets you keep an audit trail instead of deleting old rows.

## Revoke access

Find the user's newest row in `Vault Access` and change:

`ALLOW` → `REVOKED`

That user will fail the next verification. An already-open vault session is rechecked about once per minute and will be terminated when the new status is seen.

You can also append a newer row for the same email with Status `REVOKED`; newest row wins.

## Change someone's password

Edit the Password cell on that person's newest `ALLOW` row. The old password stops working. Open sessions are revalidated, so they will be terminated after the next check and must sign in with the new password.

## Approve a request

Requests arrive in two places:
- Your email (`mehrsh3d@gmail.com`)
- The `Access Requests` tab, if the Apps Script URL is connected

To approve someone, copy their email into `Vault Access`, assign any password you want, and set Status to `ALLOW`. Then send them the password yourself.

## Edit the content people see after login

The private content is in:

`apply-vault-private.html`

Open that file in VS Code or GitHub's editor. Search for:

`EDITABLE APPLY VAULT CONTENT START`

Everything until:

`EDITABLE APPLY VAULT CONTENT END`

is the content shown after access is granted.

The page is divided into `<section>` blocks such as:
- `id="experience"` — your personal application experience
- `id="universities"` — university search
- `id="professors"` — professor/research fit
- `id="cv"` — academic CV
- `id="sop"` — SOP
- `id="emailing"` — professor emails
- `id="funding"` — funding
- `id="interview"` — interviews
- `id="resources"` — templates/resources

For a simple text change, edit only the text between HTML tags and keep the surrounding tags/IDs intact.

Example:

```html
<p class="body-copy">Your new paragraph goes here.</p>
```

After editing `apply-vault-private.html`, commit/upload it to GitHub. GitHub Pages will publish the new version automatically after the deployment finishes.

## Important security note

This is a strong **access gate for a public portfolio site**, with credentials checked against a private Google Sheet and no raw password stored in the browser. However, GitHub Pages is static hosting. If `apply-vault-private.html` lives in a public GitHub repository, its HTML source is still technically public to a determined person who knows how to inspect the repository or fetch the file directly.

Do not put highly sensitive documents, private IDs, financial information, unreleased confidential research, or secrets in this page. For true private-content protection, move the protected content behind server-side authentication or a private storage/backend service.
