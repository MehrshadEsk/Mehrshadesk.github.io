(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const form = $('#registration');
  const members = $('#members');
  const add = $('#add-member');
  const submit = $('#submit');
  const status = $('#form-status');
  let sequence = 0;
  let pending = null;
  let retry = null; // Memory only: names, phone numbers and IDs are never stored in the browser.
  let timer;

  function digits(value) {
    return value.replace(/[۰-۹٠-٩]/g, c => String(c.charCodeAt(0) - (c <= '٩' ? 0x660 : 0x6f0)));
  }
  function normalize(input) {
    const field = input.dataset.field;
    let value = input.value.trim().replace(/\s+/g, ' ');
    if (field !== 'name') value = digits(value);
    if (field === 'phone') value = value.replace(/[\s()-]/g, '');
    input.value = value;
    return value;
  }
  function fieldError(input, message) {
    const error = input.parentElement.querySelector('.field-error');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message;
    error.hidden = !message;
  }
  function updateMembers() {
    const list = [...members.children];
    list.forEach((member, index) => {
      member.querySelector('.member-name').textContent = index ? `Teammate ${index}` : 'Your details';
      const remove = member.querySelector('.remove-button');
      remove.hidden = index === 0;
      remove.setAttribute('aria-label', `Remove teammate ${index}`);
    });
    $('#member-count').textContent = `${list.length} / 3`;
    add.hidden = list.length >= 3;
  }
  function addMember(focus = true) {
    if (members.children.length >= 3 || pending) return;
    const member = $('#member-template').content.firstElementChild.cloneNode(true);
    const id = ++sequence;
    member.querySelectorAll('input').forEach(input => {
      input.id = `member-${id}-${input.dataset.field}`;
      input.name = `member_${id}_${input.dataset.field}`;
      input.autocomplete = `${id === 1 ? 'section-primary' : `section-teammate${id}`} ${input.dataset.field === 'name' ? 'name' : input.dataset.field === 'phone' ? 'tel' : 'off'}`;
      if (input.dataset.field === 'studentId') input.autocomplete = 'off';
      const error = input.parentElement.querySelector('.field-error');
      error.id = `${input.id}-error`;
      input.setAttribute('aria-describedby', error.id);
      input.addEventListener('input', () => fieldError(input, ''));
      input.addEventListener('blur', () => normalize(input));
    });
    member.querySelector('.remove-button').addEventListener('click', () => {
      if (pending) return;
      member.remove();
      updateMembers();
      add.focus();
    });
    members.append(member);
    updateMembers();
    if (focus) member.querySelector('input').focus();
  }
  add.addEventListener('click', () => addMember());
  addMember(false);
  form.querySelectorAll('[name=project]').forEach(input => input.addEventListener('change', () => {
    $('#project-error').hidden = true;
    form.querySelectorAll('[name=project]').forEach(radio => radio.removeAttribute('aria-invalid'));
  }));

  function collect() {
    let firstInvalid;
    const seenIds = new Set();
    const seenPhones = new Set();
    const list = [...members.children].map(member => {
      const data = {};
      member.querySelectorAll('input').forEach(input => {
        const value = normalize(input);
        const field = input.dataset.field;
        data[field] = value;
        let error = '';
        if (!value) error = 'This field is required.';
        else if (field === 'name' && !/^[A-Za-z]+(?:[ '-][A-Za-z]+)+$/.test(value)) error = 'Enter your first and last name in English.';
        else if (field === 'name' && value.length > 80) error = 'Use 80 characters or fewer.';
        else if (field === 'phone' && !/^\+?[0-9]{8,15}$/.test(value)) error = 'Enter a valid phone number (8–15 digits).';
        else if (field === 'studentId' && !/^[0-9]{5,20}$/.test(value)) error = 'Use 5–20 digits.';
        else if (field === 'studentId' && seenIds.has(value)) error = 'This student is already in your team.';
        else if (field === 'phone' && seenPhones.has(value)) error = 'Use a different phone number for each member.';
        if (field === 'studentId') seenIds.add(value);
        if (field === 'phone') seenPhones.add(value);
        fieldError(input, error);
        if (error && !firstInvalid) firstInvalid = input;
      });
      return data;
    });
    const project = form.querySelector('[name=project]:checked');
    $('#project-error').hidden = !!project;
    form.querySelectorAll('[name=project]').forEach(radio => radio.setAttribute('aria-invalid', String(!project)));
    if (!project && !firstInvalid) firstInvalid = form.querySelector('[name=project]');
    if (firstInvalid) { firstInvalid.focus(); return null; }
    return { members: list, project: project.value };
  }
  function showError(message) {
    status.hidden = false;
    status.textContent = message;
    status.focus();
  }
  function busy(value) {
    form.setAttribute('aria-busy', String(value));
    form.querySelectorAll('input,button').forEach(el => { el.disabled = value; });
    $('#submit-label').textContent = value ? 'Registering…' : 'Register team';
    $('#submit-arrow').hidden = value;
    $('.spinner').hidden = !value;
  }
  function googleOrigin(origin) {
    try {
      const url = new URL(origin);
      return url.protocol === 'https:' && (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com' || url.hostname.endsWith('-script.googleusercontent.com'));
    } catch { return false; }
  }
  function cleanup() {
    clearTimeout(timer);
    if (pending) {
      const { transport, frame } = pending;
      // Defer teardown: Apps Script's iframe may still be executing its response.
      setTimeout(() => { transport.remove(); frame.remove(); }, 1500);
    }
    pending = null;
    busy(false);
  }
  window.addEventListener('message', event => {
    if (!pending || !googleOrigin(event.origin)) return;
    const data = event.data;
    if (!data || data.type !== 'signal-registration' || data.requestId !== pending.requestId || data.nonce !== pending.nonce) return;
    const snapshot = pending.data;
    cleanup();
    if (data.ok === true && data.registrationId === data.requestId) {
      $('#success-summary').textContent = `Project ${snapshot.project} · ${snapshot.members.length} ${snapshot.members.length === 1 ? 'member' : 'members'}`;
      $('#receipt-id').textContent = data.registrationId;
      $('#registration-view').hidden = true;
      $('#success-view').hidden = false;
      $('#success-view').focus();
      form.reset();
      retry = null;
    } else {
      const messages = {
        DUPLICATE_STUDENT: 'A student in this team is already registered. Contact @mehesk.',
        INVALID_DATA: 'Check your details. Use English names and valid phone numbers and student IDs.',
        CLOSED: 'Registration is closed. Contact @mehesk.',
        BUSY: 'The server is busy. Please try again.',
        ID_CONFLICT: 'This request could not be verified. Refresh and try again.',
        NOT_CONFIGURED: 'Registration is not available yet. Contact @mehesk.'
      };
      showError(messages[data.code] || 'Could not save your registration. Try again or contact @mehesk.');
    }
  });
  function randomId() {
    return crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (pending) return;
    status.hidden = true;
    const data = collect();
    if (!data) return;
    let endpoint;
    try {
      endpoint = new URL(window.SIGNAL_CONFIG?.scriptUrl || '');
      if (endpoint.origin !== 'https://script.google.com' || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint.pathname)) throw new Error();
    } catch {
      showError('Registration is not available yet. Contact @mehesk.');
      return;
    }
    const fingerprint = JSON.stringify(data);
    const requestId = retry?.fingerprint === fingerprint ? retry.requestId : randomId();
    retry = { fingerprint, requestId };
    const nonce = randomId();
    const frame = document.createElement('iframe');
    frame.name = `signal-${nonce}`;
    frame.title = 'Registration response';
    frame.style.display = 'none';
    const transport = document.createElement('form');
    transport.method = 'POST';
    transport.action = endpoint.href;
    transport.target = frame.name;
    transport.enctype = 'application/x-www-form-urlencoded';
    transport.style.display = 'none';
    const payload = {
      version: 1, requestId, nonce, origin: location.origin,
      project: data.project, members: data.members, website: $('#website').value
    };
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = 'payload'; input.value = JSON.stringify(payload);
    transport.append(input);
    document.body.append(frame, transport);
    pending = { requestId, nonce, data, frame, transport };
    busy(true);
    timer = setTimeout(() => {
      cleanup();
      showError('Confirmation timed out. Try again with the same details to safely check your registration.');
    }, 45000);
    // A native form POST avoids cross-origin fetch/preflight restrictions. Only a
    // matching, trusted-origin acknowledgement can display success.
    try { HTMLFormElement.prototype.submit.call(transport); }
    catch { cleanup(); showError('Could not connect. Please try again.'); }
  });
})();
