# flatchat reviewer notes

## Architecture

Flatchat is a vanilla JavaScript frontend for a chat application, with page-specific scripts under `js/`. `home.js` owns the chat list, active conversation, search, rendering, and message composition; `login.js` and `signup.js` independently manage form validation and authentication flows through temporary stubs. Scripts use IIFEs and interact directly with DOM elements identified by IDs and classes.

## Conventions

- Wrap each page script in an immediately invoked function expression, as in `js/home.js`, `js/login.js`, and `js/signup.js`, to avoid leaking variables globally.
- Cache required DOM elements near the top of each script using `getElementById` or `querySelector`; event handlers then operate on those cached references.
- Build dynamic UI with DOM APIs rather than HTML string interpolation. `home.js` uses the `el()` helper, `replaceChildren()`, `append()`, and `textContent`.
- Prefer `textContent` for user-visible dynamic text. Do not introduce `innerHTML` for chat messages or form errors without a concrete sanitization requirement.
- Keep chat state in the `chats` array and derive rendered output through `renderList()` and `renderChat()` (`js/home.js`). Mutations should be followed by both relevant render calls.
- Use semantic controls and accessibility state: chat entries are `button` elements with `aria-current`; form fields update `aria-invalid`; password toggles maintain `aria-label` and `aria-pressed`.
- Form validation is performed before submission and uses native email validity plus explicit password and confirmation rules (`js/login.js`, `js/signup.js`). Invalid forms focus the first `[aria-invalid="true"]` field.
- Async form submission disables the submit button, changes its label during the request, and restores it only on failure. Successful login redirects to `index.html`; successful signup redirects to `login.html`.

## Intentional non-standard choices

- Backend integration is intentionally stubbed. Chat data and send operations are local sample behavior in `js/home.js`; authentication uses delayed `login()`/`signup()` stubs in `js/login.js` and `js/signup.js`. The existing TODO comments identify planned replacement points.
- Chat rendering deliberately appends the sender name only for non-self messages in group chats; direct-chat messages omit it (`js/home.js`).

## Watch out for

- Do not remove `event.preventDefault()` from form submission handlers or the UI will bypass the current validation/loading flow.
- Preserve empty-message rejection (`text.trim()`) and password validation rules when changing form or composer logic.
- Changes to chat state must account for the active chat and rerender the list preview as well as the message pane.
- Avoid logging credentials or adding password values to diagnostics; current stubs intentionally log only non-sensitive fields.