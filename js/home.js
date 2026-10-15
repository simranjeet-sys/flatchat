(function () {
  // TODO: replace sample data with chats loaded from the backend.
  const chats = [
    {
      id: 1, name: 'Flatmates', color: '#4f46e5', status: '4 members', group: true,
      messages: [
        { from: 'Priya', text: 'Who is buying milk today?', time: '09:12' },
        { from: 'me', text: 'I can grab it on the way back.', time: '09:15' },
        { from: 'Rahul', text: 'Thanks! Also we are out of bread.', time: '09:20' },
      ],
    },
    {
      id: 2, name: 'Priya', color: '#0d9488', status: 'Online',
      messages: [
        { from: 'Priya', text: 'Rent is due on the 1st, reminder!', time: 'Yesterday' },
        { from: 'me', text: 'Noted, will transfer tonight.', time: 'Yesterday' },
      ],
    },
    {
      id: 3, name: 'Rahul', color: '#d97706', status: 'Last seen 2h ago',
      messages: [
        { from: 'Rahul', text: 'Can you let the plumber in at 4?', time: 'Mon' },
      ],
    },
  ];

  const app = document.querySelector('.app');
  const list = document.getElementById('chat-list');
  const search = document.getElementById('search');
  const messagesEl = document.getElementById('messages');
  const composer = document.getElementById('composer');
  const input = document.getElementById('message-input');
  let activeId = chats[0].id;

  function initials(name) {
    return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderList() {
    const query = search.value.trim().toLowerCase();
    list.replaceChildren();

    chats
      .filter((chat) => chat.name.toLowerCase().includes(query))
      .forEach((chat) => {
        const last = chat.messages[chat.messages.length - 1];
        const item = el('li');
        const button = el('button', 'chat-item');
        button.type = 'button';
        button.setAttribute('aria-current', String(chat.id === activeId));

        const avatar = el('div', 'avatar', initials(chat.name));
        avatar.style.background = chat.color;

        const body = el('div', 'chat-item__body');
        const top = el('div', 'chat-item__top');
        top.append(el('span', 'chat-item__name', chat.name), el('span', 'chat-item__time', last ? last.time : ''));
        const preview = last ? (last.from === 'me' ? 'You: ' : '') + last.text : 'No messages yet';
        body.append(top, el('p', 'chat-item__preview', preview));

        button.append(avatar, body);
        button.addEventListener('click', () => openChat(chat.id));
        item.append(button);
        list.append(item);
      });
  }

  function renderChat() {
    const chat = chats.find((c) => c.id === activeId);
    const avatar = document.getElementById('chat-avatar');
    avatar.textContent = initials(chat.name);
    avatar.style.background = chat.color;
    document.getElementById('chat-name').textContent = chat.name;
    document.getElementById('chat-status').textContent = chat.status;

    messagesEl.replaceChildren(
      ...chat.messages.map((msg) => {
        const li = el('li', 'message' + (msg.from === 'me' ? ' message--me' : ''));
        const text = msg.from !== 'me' && chat.group ? msg.from + ': ' + msg.text : msg.text;
        li.append(document.createTextNode(text), el('span', 'message__time', msg.time));
        return li;
      })
    );
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function openChat(id) {
    activeId = id;
    app.classList.add('is-chat-open');
    renderList();
    renderChat();
    input.focus();
  }

  search.addEventListener('input', renderList);

  document.getElementById('back-btn').addEventListener('click', () => {
    app.classList.remove('is-chat-open');
  });

  composer.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // TODO: send the message to the backend.
    chats.find((c) => c.id === activeId).messages.push({ from: 'me', text, time });
    input.value = '';
    renderList();
    renderChat();
  });

  renderList();
  renderChat();
})();
