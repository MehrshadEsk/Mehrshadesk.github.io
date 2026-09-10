# Application Journey — Simple Google Sheet Access Gate

This setup keeps the workflow intentionally simple:

1. Visitor submits the Request Access form.
2. The request appears in your Google Sheet.
3. You manually change that row's `Status` to `ALLOW`.
4. The visitor returns to the page and enters the same email under Verify Access.
5. If the newest row for that email is `ALLOW`, the site redirects to `application-journey-private.html`.
6. The private page re-checks the same allow list on every load/refresh.
7. To revoke access, change `ALLOW` to `REVOKED` (or any other value).

## 1. Create the Google Sheet

Create a new Google Sheet. You do not need to create columns manually; the script can create a tab named `Access Requests` with:

`Timestamp | Name | Email | Affiliation | Reason | Status`

## 2. Add the Apps Script

In the Google Sheet, open:

**Extensions → Apps Script**

Delete the default code and paste the contents of `google-apps-script.gs`.

Save the project.

## 3. Deploy it as a Web App

In Apps Script:

**Deploy → New deployment → Web app**

Use:

- Execute as: **Me**
- Who has access: **Anyone**

Deploy and authorize it. Copy the URL ending in `/exec`.

## 4. Connect the website

Open `access-config.js` and find:

```js
apiUrl: 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
```

Replace the placeholder with your `/exec` URL. This is the only website file where the Apps Script URL needs to be pasted.

The approved destination is already set to:

```js
privateJourneyUrl: 'application-journey-private.html',
```

The private page also revalidates the approved email against the Sheet on every load.

## 5. Approve / revoke people

When someone requests access, a row is added with `PENDING` status.

- Approve: change `PENDING` → `ALLOW`
- Reject: change it to `DENIED`
- Revoke later: change `ALLOW` → `REVOKED`

The newest row for an email is treated as the current decision.

## Important security note

This is a lightweight access gate for a static GitHub Pages site. The private page checks for an authorized browser session and revalidates the email against Google Sheets on each load, which is appropriate for the simple workflow requested. However, because the HTML itself is hosted statically on GitHub Pages, this is not equivalent to server-side authentication for highly sensitive material.
