(function () {
  const RESEND_COOLDOWN_SECONDS = 30;

  const form = document.getElementById('reset-form');
  const email = document.getElementById('email');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');
  const sentPanel = document.getElementById('reset-sent');
  const sentMessage = document.getElementById('reset-sent-message');
  const resendBtn = document.getElementById('resend-btn');
  const resendStatus = document.getElementById('resend-status');

  let sentTo = '';
  let cooldownTimer = null;

  async function requestReset(address) {
    const response = await fetch(form.action, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: address }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, message: data.message || data.error || 'Could not send the reset link.' };
    }
    return { ok: true };
  }

  function setError(input, message) {
    document.getElementById(input.id + '-error').textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate() {
    if (!email.value.trim()) {
      setError(email, 'Email is required.');
      return false;
    }
    if (!email.validity.valid) {
      setError(email, 'Enter a valid email address.');
      return false;
    }
    setError(email, '');
    return true;
  }

  function showSent(address) {
    sentTo = address;
    // .auth__form sets display:flex, which would override the hidden attribute.
    form.style.display = 'none';
    sentPanel.hidden = false;
    sentMessage.textContent =
      'If an account exists for ' + address + ', a reset link is on its way. Check your inbox and spam folder.';
    startCooldown();
  }

  function startCooldown() {
    let remaining = RESEND_COOLDOWN_SECONDS;
    clearInterval(cooldownTimer);
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend email (' + remaining + 's)';

    cooldownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend email';
        return;
      }
      resendBtn.textContent = 'Resend email (' + remaining + 's)';
    }, 1000);
  }

  email.addEventListener('input', () => {
    if (email.getAttribute('aria-invalid') === 'true') validate();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';

    if (!validate()) {
      email.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const address = email.value.trim();
      const result = await requestReset(address);
      if (!result.ok) throw new Error(result.message || 'Could not send the reset link.');
      showSent(address);
    } catch (err) {
      formError.textContent = err.message || 'Something went wrong. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send reset link';
    }
  });

  resendBtn.addEventListener('click', async () => {
    if (!sentTo || cooldownTimer) return;

    resendStatus.textContent = '';
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending…';

    try {
      const result = await requestReset(sentTo);
      if (!result.ok) throw new Error(result.message || 'Could not resend the email.');
      resendStatus.textContent = '';
      startCooldown();
    } catch (err) {
      resendStatus.textContent = err.message || 'Something went wrong. Please try again.';
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend email';
    }
  });

  // Prefill from ?email= so the login page can pass along what the user already typed.
  const prefill = new URLSearchParams(window.location.search).get('email');
  if (prefill) email.value = prefill;
})();
