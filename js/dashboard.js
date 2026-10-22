(function () {
  const chatList = document.getElementById('chat-list');
  const chatEmpty = document.getElementById('chat-empty');
  const memberList = document.getElementById('member-list');

  async function loadDashboard() {
    const response = await fetch('/api/dashboard', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Dashboard data is unavailable. Please sign in and try again.');
    return response.json();
  }

  function initials(name) {
    return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderChats(chats) {
    chatList.replaceChildren();
    chatEmpty.hidden = chats.length > 0;

    chats.forEach((chat) => {
      const link = el('a', 'chat');
      link.href = '#'; // TODO: link to the chat view once it exists.

      const avatar = el('span', 'avatar', initials(chat.title));
      avatar.setAttribute('aria-hidden', 'true');

      const body = el('div', 'chat__body');
      body.append(el('p', 'chat__title', chat.title), el('p', 'chat__preview', chat.preview));

      const meta = el('div', 'chat__meta');
      meta.append(el('span', 'chat__time', chat.time));
      if (chat.unread) {
        const badge = el('span', 'badge', String(chat.unread));
        badge.setAttribute('aria-label', chat.unread + ' unread');
        meta.append(badge);
      }

      link.append(avatar, body, meta);
      const item = el('li');
      item.append(link);
      chatList.append(item);
    });
  }

  function renderMembers(members) {
    memberList.replaceChildren();
    members.forEach((member) => {
      const item = el('li', 'member');
      const avatar = el('span', 'avatar', initials(member.name));
      avatar.setAttribute('aria-hidden', 'true');
      const status = el(
        'span',
        'member__status' + (member.online ? ' member__status--online' : ''),
        member.online ? 'Online' : 'Offline'
      );
      item.append(avatar, el('span', '', member.name), status);
      memberList.append(item);
    });
  }

  document.getElementById('new-chat-btn').addEventListener('click', () => {
    // TODO: open the new chat flow.
    console.log('new chat clicked');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    // TODO: clear the session with the auth backend before redirecting.
  });

  loadDashboard().then((data) => {
    if (!data || !data.user || typeof data.user.name !== 'string' ||
        !Array.isArray(data.chats) || !Array.isArray(data.members)) {
      throw new Error('Dashboard data is unavailable. Please try again later.');
    }

    document.getElementById('greeting').textContent = 'Welcome, ' + data.user.name.split(' ')[0];
    document.getElementById('user-name').textContent = data.user.name;
    document.getElementById('user-avatar').textContent = initials(data.user.name);

    document.getElementById('stat-unread').textContent = data.chats.reduce((sum, c) => sum + c.unread, 0);
    document.getElementById('stat-chats').textContent = data.chats.length;
    document.getElementById('stat-members').textContent = data.members.length;

    renderChats(data.chats);
    renderMembers(data.members);
    document.getElementById('dashboard-status').hidden = true;
    document.getElementById('dashboard-header').hidden = false;
    document.getElementById('dashboard-content').hidden = false;
  }).catch((error) => {
    document.getElementById('dashboard-status').textContent = error.message ||
      'Dashboard data is unavailable. Please try again later.';
  });
})();
