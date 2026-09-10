/*
 * Apply Vault access configuration.
 *
 * The page works even with apiUrl left blank:
 * - approved local hashes below can enter;
 * - everyone else sees the request form;
 * - the request opens as a pre-filled email in the visitor's email app or Gmail Web.
 *
 * Optional: later paste a deployed Google Apps Script /exec URL into apiUrl.
 * That adds Google-Sheet based approvals and an automatic server-side request copy.
 */
window.MEHRSHAD_ACCESS = {
  ownerEmail: 'mehrsh3d@gmail.com',
  apiUrl: '',
  privateJourneyUrl: 'apply-vault-private.html',
  gateUrl: 'apply-vault.html',

  // SHA-256 hashes only — raw approved email addresses are not exposed here.
  // mehrsh3d@gmail.com is already approved as the owner account.
  allowedEmailHashes: [
    '02b88b6d22382de695ee35ea81f230c3893cf575c6640057618f85d77f160871'
  ]
};
