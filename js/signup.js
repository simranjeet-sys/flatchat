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
    let valid = true;

    if (!name.value.trim()) {
      setError(name, 'Name is required.');
      valid = false;
    } else {
      setError(name, '');
    }

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

    if (!confirm.value) {
      setError(confirm, 'Please confirm your password.');
      valid = false;
    } else if (confirm.value !== password.value) {
      setError(confirm, 'Passwords do not match.');
      valid = false;
    } else {
      setError(confirm, '');
    }

    if (!terms.checked) {
      setError(terms, 'You must accept the terms to continue.');
      valid = false;
    } else {
      setError(terms, '');
    }

    return valid;
  }

  toggle.addEventListener('click', () => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    confirm.type = password.type;
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute('aria-label', show ? 'Hide passwords' : 'Show passwords');
    toggle.setAttribute('aria-pressed', String(show));
  });

  [name, email, password, confirm].forEach((input) => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate();
    });
  });

  terms.addEventListener('change', () => {
    if (terms.getAttribute('aria-invalid') === 'true') validate();
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
      if (!result.ok) throw new Error(result.message || 'Could not create your account.');
      window.location.href = 'login.html';
    } catch (err) {
      formError.textContent = err.message || 'Something went wrong. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign up';
    }
  });
})();
