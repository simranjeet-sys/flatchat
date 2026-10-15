(function () {
  const form = document.getElementById('login-form');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const toggle = document.getElementById('toggle-password');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');

  // TODO: replace with a real call to the auth backend.
  async function login(credentials) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log('login stub called with', { email: credentials.email, remember: credentials.remember });
    return { ok: true };
  }

  function setError(input, message) {
    document.getElementById(input.id + '-error').textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validate() {
    let valid = true;

    if (!email.value.trim()) {
      setError(email, 'Email is required.');
      valid = false;
    } else if (!email.validity.valid) {
      setError(email, 'Enter a valid email address.');
      valid = false;
    } else {
      setError(email, '');
    }

    if (!password.value) {
      setError(password, 'Password is required.');
      valid = false;
    } else if (password.value.length < 8) {
      setError(password, 'Password must be at least 8 characters.');
      valid = false;
    } else {
      setError(password, '');
    }

    return valid;
  }

  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.setAttribute('aria-pressed', String(show));
  });

  [email, password].forEach((input) => {
    input.addEventListener('input', () => {
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
    submitBtn.textContent = 'Logging in…';

    try {
      const result = await login({
        email: email.value.trim(),
        password: password.value,
        remember: document.getElementById('remember').checked,
      });
      if (!result.ok) throw new Error(result.message || 'Invalid email or password.');
      // TODO: redirect to the chat view once it exists.
      submitBtn.textContent = 'Logged in';
    } catch (err) {
      formError.textContent = err.message || 'Something went wrong. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Log in';
    }
  });
})();
