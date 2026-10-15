(function () {
  const form = document.getElementById('signup-form');
  const name = document.getElementById('name');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  const terms = document.getElementById('terms');
  const toggle = document.getElementById('toggle-password');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');

  // TODO: replace with a real call to the auth backend.
  async function signup(details) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log('signup stub called with', { name: details.name, email: details.email });
    return { ok: true };
  }

  function setError(input, message) {
    document.getElementById(input.id + '-error').textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate() {
    const checks = [
      [name, !name.value.trim() ? 'Name is required.' : ''],
      [email, !email.value.trim() ? 'Email is required.'
        : !email.validity.valid ? 'Enter a valid email address.' : ''],
      [password, !password.value ? 'Password is required.'
        : password.value.length < 8 ? 'Password must be at least 8 characters.' : ''],
      [confirm, !confirm.value ? 'Please confirm your password.'
        : confirm.value !== password.value ? 'Passwords do not match.' : ''],
      [terms, !terms.checked ? 'You must accept the terms to continue.' : ''],
    ];

    checks.forEach(([input, message]) => setError(input, message));
    return checks.every(([, message]) => !message);
  }

  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    confirm.type = password.type;
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.setAttribute('aria-pressed', String(show));
  });

  [name, email, password, confirm, terms].forEach((input) => {
    input.addEventListener(input.type === 'checkbox' ? 'change' : 'input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';

    if (!validate()) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      const result = await signup({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
      });
      if (!result.ok) throw new Error(result.message || 'Could not create account.');
      window.location.href = 'login.html';
    } catch (err) {
      formError.textContent = err.message || 'Something went wrong. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign up';
    }
  });
})();
