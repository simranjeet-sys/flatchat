// Shared layout components. Usage:
//   <fc-header></fc-header>   (optional attrs: current="index.html", hide-actions)
//   <fc-footer></fc-footer>
(function () {
  const NAV_LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'components.html', label: 'Components' },
  ];

  const FOOTER_LINKS = [
    { href: '#', label: 'About' },
    { href: '#', label: 'Privacy' },
    { href: '#', label: 'Terms' },
    { href: '#', label: 'Contact' },
  ];

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  class FcHeader extends HTMLElement {
    connectedCallback() {
      const current = this.getAttribute('current') || currentPage();
      const nav = NAV_LINKS.map(({ href, label }) =>
        `<a class="site-header__link" href="${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`
      ).join('');
      const actions = this.hasAttribute('hide-actions') ? '' : `
        <div class="site-header__actions">
          <a class="btn btn--secondary btn--sm" href="login.html">Log in</a>
          <a class="btn btn--sm" href="signup.html">Sign up</a>
        </div>`;

      this.innerHTML = `
        <header class="site-header">
          <a class="brand" href="index.html"><span class="brand__logo" aria-hidden="true">FC</span>FlatChat</a>
          <button type="button" class="site-header__menu" aria-expanded="false" aria-label="Toggle menu">Menu</button>
          <nav class="site-header__nav" aria-label="Main">${nav}</nav>
          ${actions}
        </header>`;

      const header = this.querySelector('.site-header');
      const toggle = this.querySelector('.site-header__menu');
      toggle.addEventListener('click', () => {
        const open = header.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
  }

  class FcFooter extends HTMLElement {
    connectedCallback() {
      const links = FOOTER_LINKS.map(({ href, label }) => `<li><a href="${href}">${label}</a></li>`).join('');

      this.innerHTML = `
        <footer class="site-footer">
          <a class="brand" href="index.html"><span class="brand__logo" aria-hidden="true">FC</span>FlatChat</a>
          <ul class="site-footer__links">${links}</ul>
          <p class="site-footer__copy">&copy; ${new Date().getFullYear()} FlatChat</p>
        </footer>`;
    }
  }

  customElements.define('fc-header', FcHeader);
  customElements.define('fc-footer', FcFooter);
})();
