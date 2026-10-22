(function () {
  const chatList = document.getElementById('chat-list');
  const chatEmpty = document.getElementById('chat-empty');
  const memberList = document.getElementById('member-list');

  // TODO: replace with a real call to the backend.
  async function loadDashboard() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      user: { name: 'Alex Morgan' },
      chats: [
        { id: 1, title: 'Flat 4B', preview: 'Who took the last of the milk?', time: '10:42', unread: 3 },
        { id: 2, title: 'Bills & rent', preview: 'Electricity bill is due Friday', time: 'Yesterday', unread: 1 },
        { id: 3, title: 'Cleaning rota', preview: 'Your turn for the kitchen this week', time: 'Mon', unread: 0 },
      ],
      members: [
        { name: 'Alex Morgan', online: true },
        { name: 'Sam Lee', online: true },
        { name: 'Priya Shah', online: false },
        { name: 'Jordan Kim', online: false },
      ],
    };
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
    document.getElementById('greeting').textContent = 'Welcome, ' + data.user.name.split(' ')[0];
    document.getElementById('user-name').textContent = data.user.name;
    document.getElementById('user-avatar').textContent = initials(data.user.name);

    document.getElementById('stat-unread').textContent = data.chats.reduce((sum, c) => sum + c.unread, 0);
    document.getElementById('stat-chats').textContent = data.chats.length;
    document.getElementById('stat-members').textContent = data.members.length;

    renderChats(data.chats);
    renderMembers(data.members);
  });
})();
