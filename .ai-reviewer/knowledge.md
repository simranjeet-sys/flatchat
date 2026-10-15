# flatchat reviewer notes

## Architecture
Flatchat currently includes a browser-side login flow implemented in `js/login.js`. The script is an immediately invoked function that queries login-form elements, performs client-side validation, manages accessibility state, and calls a temporary asynchronous authentication stub. The eventual chat view and real auth backend are not implemented yet.

## Conventions
- Keep page-specific behavior in an isolated IIFE, as in `js/login.js`, to avoid leaking variables into the global scope.
- Cache DOM elements at initialization with `document.getElementById(...)`; the login module uses this for `form`, `email`, `password`, controls, and error containers.
- Validation is explicit and field-specific: required checks precede format/length checks, and errors are cleared with `setError(input, '')` when valid (`js/login.js`).
- Field errors are written to the corresponding `${input.id}-error` element, while form-level failures use `#form-error` (`js/login.js`).
- Preserve accessibility state when changing validation or control behavior: inputs use `aria-invalid`, and the password toggle updates both `aria-label` and `aria-pressed` (`js/login.js`).
- Submit handlers prevent the browser default, validate before submission, focus the first invalid field, and disable/update the submit button while awaiting async work (`js/login.js`).
- User-facing error text has explicit fallbacks: authentication errors use `err.message || 'Something went wrong. Please try again.'` (`js/login.js`).

## Intentional non-standard choices
- `login()` is deliberately a delayed stub that logs only the email and remember flag and returns `{ ok: true }`; do not treat the missing backend call as an accidental implementation unless the associated TODO is being addressed (`js/login.js`).
- The successful submit path leaves the button disabled and changes its label to `Logged in`; redirect behavior is explicitly deferred until the chat view exists (`js/login.js`).
- Password validation requires at least eight characters but does not impose additional complexity rules (`js/login.js`).

## Watch out for
- Do not log or expose password values. The existing stub intentionally logs only non-sensitive fields; preserve that boundary (`js/login.js`).
- New validation errors must update both visible error text and `aria-invalid`; otherwise the existing invalid-field focus and live interaction behavior can become inconsistent.
- Changes to the submit flow must restore the button’s enabled state and label on failures, as the current `catch` block does.
- Avoid assuming `result.ok` alone is sufficient for real authentication: the current implementation is a placeholder and should eventually handle backend failures, malformed responses, and redirect behavior.