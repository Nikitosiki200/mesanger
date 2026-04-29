const i18n = {
  ru: {
    language_label: "Язык / Language",
    lang_ru: "Русский",
    lang_en: "English",
    auth_title: "Mesanger",
    auth_sub: "Чаты, серверы, закрепы и файлы",
    tab_login: "Вход",
    tab_register: "Регистрация",
    login_label: "Логин",
    display_name_label: "Имя профиля",
    password_label: "Пароль",
    login_placeholder: "Логин",
    display_name_placeholder: "Имя профиля",
    password_placeholder: "Пароль",
    login_button: "Войти",
    register_button: "Создать аккаунт",
    dms_title: "Личные чаты",
    find_title: "Найти друзей",
    create_guild_title: "Создать сервер",
    channels_title: "Каналы",
    create_channel_title: "Создать канал",
    invite_title: "Пригласить",
    settings_title: "Настройки",
    settings_sub: "Язык, тема, профиль и аватар",
    settings_display_name: "Имя профиля",
    settings_language: "Язык",
    settings_theme: "Тема",
    settings_accent: "Акцент",
    save_settings: "Сохранить",
    close_btn: "Закрыть",
    find_placeholder: "Логин, имя или ID",
    find_button: "Найти",
    guild_name_placeholder: "Название сервера",
    channel_name_placeholder: "Название канала",
    invite_placeholder: "Логин или ID",
    create_button: "Создать",
    invite_button: "Добавить",
    no_chats: "Пока нет чатов",
    no_messages: "Сообщений пока нет",
    chat_select_title: "Выбери чат",
    chat_select_sub: "Слева открой диалог или канал",
    message_placeholder: "Написать сообщение...",
    send_button: "Отправить",
    members_title: "Участники",
    pins_title: "Закрепы",
    pins_button: "📌 Закрепы",
    attach_btn: "📎 Файл",
    authors_sub: "Учебный проект",
    authors_sub2: "Помощь и код",
    avatar_pick: "Загрузить аватар",
    avatar_note: "Квадратная картинка лучше смотрится",
    theme_dark: "Тёмная",
    theme_midnight: "Midnight",
    theme_ocean: "Ocean",
    theme_violet: "Violet",
    theme_light: "Светлая",
    accent_indigo: "Indigo",
    accent_pink: "Pink",
    accent_cyan: "Cyan",
    accent_lime: "Lime",
    accent_orange: "Orange",
    owner: "Владелец",
    admin: "Админ",
    member: "Участник",
    role_change: "Роль",
    delete_btn: "Удалить",
    pin_btn: "Закрепить",
    unpin_btn: "Открепить"
  },
  en: {
    language_label: "Language / Язык",
    lang_ru: "Russian",
    lang_en: "English",
    auth_title: "Mesanger",
    auth_sub: "Chats, servers, pins and files",
    tab_login: "Login",
    tab_register: "Register",
    login_label: "Username",
    display_name_label: "Display name",
    password_label: "Password",
    login_placeholder: "Username",
    display_name_placeholder: "Display name",
    password_placeholder: "Password",
    login_button: "Sign in",
    register_button: "Create account",
    dms_title: "Direct messages",
    find_title: "Find friends",
    create_guild_title: "Create server",
    channels_title: "Channels",
    create_channel_title: "Create channel",
    invite_title: "Invite",
    settings_title: "Settings",
    settings_sub: "Language, theme, profile and avatar",
    settings_display_name: "Display name",
    settings_language: "Language",
    settings_theme: "Theme",
    settings_accent: "Accent",
    save_settings: "Save",
    close_btn: "Close",
    find_placeholder: "Username, name or ID",
    find_button: "Search",
    guild_name_placeholder: "Server name",
    channel_name_placeholder: "Channel name",
    invite_placeholder: "Username or ID",
    create_button: "Create",
    invite_button: "Add",
    no_chats: "No chats yet",
    no_messages: "No messages yet",
    chat_select_title: "Pick a chat",
    chat_select_sub: "Open a DM or channel from the left",
    message_placeholder: "Write a message...",
    send_button: "Send",
    members_title: "Members",
    pins_title: "Pins",
    pins_button: "📌 Pins",
    attach_btn: "📎 File",
    authors_sub: "Learning project",
    authors_sub2: "Code & help",
    avatar_pick: "Upload avatar",
    avatar_note: "Square images look best",
    theme_dark: "Dark",
    theme_midnight: "Midnight",
    theme_ocean: "Ocean",
    theme_violet: "Violet",
    theme_light: "Light",
    accent_indigo: "Indigo",
    accent_pink: "Pink",
    accent_cyan: "Cyan",
    accent_lime: "Lime",
    accent_orange: "Orange",
    owner: "Owner",
    admin: "Admin",
    member: "Member",
    role_change: "Role",
    delete_btn: "Delete",
    pin_btn: "Pin",
    unpin_btn: "Unpin"
  }
};

const state = {
  token: localStorage.getItem("ms_token") || "",
  locale: localStorage.getItem("ms_locale") || (navigator.language?.startsWith("ru") ? "ru" : "en"),
  me: null,
  guilds: [],
  dms: [],
  currentView: "home",
  currentGuildId: null,
  currentChat: null,
  socket: null,
  notificationsAllowed: false,
  lastPingAt: 0,
  pendingFiles: [],
  currentPins: []
};

const el = {
  authScreen: document.getElementById("authScreen"),
  app: document.getElementById("app"),
  authLang: document.getElementById("authLang"),
  tabLogin: document.getElementById("tabLogin"),
  tabRegister: document.getElementById("tabRegister"),
  authLogin: document.getElementById("authLogin"),
  authDisplayName: document.getElementById("authDisplayName"),
  authPassword: document.getElementById("authPassword"),
  displayNameWrap: document.getElementById("displayNameWrap"),
  authMainBtn: document.getElementById("authMainBtn"),
  authAltBtn: document.getElementById("authAltBtn"),
  authError: document.getElementById("authError"),

  homeBtn: document.getElementById("homeBtn"),
  createGuildBtn: document.getElementById("createGuildBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  guildRailList: document.getElementById("guildRailList"),

  homeView: document.getElementById("homeView"),
  guildView: document.getElementById("guildView"),
  guildTitleHead: document.getElementById("guildTitleHead"),

  meAvatar: document.getElementById("meAvatar"),
  meName: document.getElementById("meName"),
  meInfo: document.getElementById("meInfo"),

  dmList: document.getElementById("dmList"),
  emptyDms: document.getElementById("emptyDms"),
  findInput: document.getElementById("findInput"),
  findBtn: document.getElementById("findBtn"),
  findResults: document.getElementById("findResults"),
  guildNameInput: document.getElementById("guildNameInput"),
  guildCreateBtn2: document.getElementById("guildCreateBtn2"),
  channelList: document.getElementById("channelList"),
  channelNameInput: document.getElementById("channelNameInput"),
  channelCreateBtn: document.getElementById("channelCreateBtn"),
  inviteInput: document.getElementById("inviteInput"),
  inviteBtn: document.getElementById("inviteBtn"),

  setDisplayName: document.getElementById("setDisplayName"),
  setLang: document.getElementById("setLang"),
  setTheme: document.getElementById("setTheme"),
  setAccent: document.getElementById("setAccent"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),

  settingsModal: document.getElementById("settingsModal"),
  modalDisplayName: document.getElementById("modalDisplayName"),
  modalLang: document.getElementById("modalLang"),
  modalTheme: document.getElementById("modalTheme"),
  modalAccent: document.getElementById("modalAccent"),
  saveModalSettingsBtn: document.getElementById("saveModalSettingsBtn"),
  closeSettingsBtn: document.getElementById("closeSettingsBtn"),
  avatarInput: document.getElementById("avatarInput"),
  avatarPickBtn: document.getElementById("avatarPickBtn"),
  avatarPreview: document.getElementById("avatarPreview"),

  chatTitle: document.getElementById("chatTitle"),
  chatSub: document.getElementById("chatSub"),
  messages: document.getElementById("messages"),
  emptyMessages: document.getElementById("emptyMessages"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  attachBtn: document.getElementById("attachBtn"),
  fileInput: document.getElementById("fileInput"),
  attachmentPreview: document.getElementById("attachmentPreview"),
  pinsBtn: document.getElementById("pinsBtn"),

  membersList: document.getElementById("membersList"),
  pinsList: document.getElementById("pinsList"),

  messageActionsMenu: document.getElementById("messageActionsMenu")
};

function t(key) {
  return (i18n[state.locale] && i18n[state.locale][key]) || key;
}

function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
  return fetch(path, { ...options, headers });
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return String(str || "").replaceAll('"', "&quot;");
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme || "midnight");
}

function applyAccent(accent) {
  const map = {
    indigo: ["#6677ff", "#8b5cf6"],
    pink: ["#ec4899", "#a855f7"],
    cyan: ["#06b6d4", "#3b82f6"],
    lime: ["#84cc16", "#14b8a6"],
    orange: ["#f97316", "#eab308"]
  };
  const [a, b] = map[accent] || map.indigo;
  document.documentElement.style.setProperty("--accent", a);
  document.documentElement.style.setProperty("--accent2", b);
}

function avatarMarkup(user, size = "md") {
  const initials = (user.displayName || user.login || "U").slice(0, 1).toUpperCase();
  const url = user.avatarUrl || "";
  const cls = `avatar avatar-${size}`;
  if (url) {
    return `<div class="${cls}"><img src="${escapeAttr(url)}" alt=""></div>`;
  }
  return `<div class="${cls}"><span>${escapeHtml(initials)}</span></div>`;
}

function setLocale(locale, save = true) {
  state.locale = locale === "en" ? "en" : "ru";
  if (save) localStorage.setItem("ms_locale", state.locale);
  document.documentElement.lang = state.locale;
  renderLocale();
  applyCapabilities();
}

function renderLocale() {
  document.title = t("auth_title");

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    node.placeholder = t(key);
  });

  el.authLang.value = state.locale;
  el.setLang.value = state.me?.language || state.locale;
  el.modalLang.value = state.me?.language || state.locale;

  if (!state.currentChat) {
    el.chatTitle.textContent = t("chat_select_title");
    el.chatSub.textContent = t("chat_select_sub");
  }

  renderHomeLists();
  renderGuildSidebar();
  renderMembers();
  renderPins();
  renderSettingsFields();
}

function showAuthError(code) {
  const map = {
    login_min: state.locale === "ru" ? "Логин минимум 3 символа" : "Username must be at least 3 characters",
    password_min: state.locale === "ru" ? "Пароль минимум 4 символа" : "Password must be at least 4 characters",
    login_taken: state.locale === "ru" ? "Логин уже занят" : "Username is already taken",
    bad_login: state.locale === "ru" ? "Неверный логин или пароль" : "Wrong username or password"
  };
  el.authError.textContent = code ? (map[code] || code) : "";
}

function switchAuthMode(mode) {
  const loginMode = mode === "login";
  el.tabLogin.classList.toggle("active", loginMode);
  el.tabRegister.classList.toggle("active", !loginMode);
  el.displayNameWrap.style.display = loginMode ? "none" : "flex";
  el.authMainBtn.textContent = loginMode ? t("login_button") : t("register_button");
  el.authAltBtn.textContent = loginMode ? t("register_button") : t("tab_login");
  el.authMainBtn.onclick = loginMode ? login : register;
  el.authAltBtn.onclick = () => switchAuthMode(loginMode ? "register" : "login");
  showAuthError("");
}

async function register() {
  showAuthError("");
  const res = await api("/api/register", {
    method: "POST",
    body: JSON.stringify({
      login: el.authLogin.value.trim(),
      password: el.authPassword.value.trim(),
      displayName: el.authDisplayName.value.trim(),
      language: state.locale,
      theme: "midnight",
      accent: "indigo"
    })
  });

  const data = await res.json();
  if (!res.ok) return showAuthError(data.error);
  finishAuth(data.token, data.user);
}

async function login() {
  showAuthError("");
  const res = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({
      login: el.authLogin.value.trim(),
      password: el.authPassword.value.trim()
    })
  });

  const data = await res.json();
  if (!res.ok) return showAuthError(data.error);
  finishAuth(data.token, data.user);
}

function finishAuth(token, user) {
  state.token = token;
  state.me = user;
  localStorage.setItem("ms_token", token);
  setLocale(user.language || state.locale, false);
  openApp();
  askNotificationPermission();
}

function openApp() {
  el.authScreen.classList.add("hidden");
  el.app.classList.remove("hidden");
  connectSocket();
  setupDeviceMode();
  refreshMe();
}

function setupDeviceMode() {
  const touch = window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900;
  document.body.classList.toggle("touch", touch);
}

async function refreshMe() {
  const res = await api("/api/me");
  const data = await res.json();
  if (!res.ok) return logout();

  state.me = data.user;
  state.guilds = data.guilds || [];
  state.dms = data.dms || [];

  applyTheme(state.me.theme || "midnight");
  applyAccent(state.me.accent || "indigo");

  el.meName.textContent = `${state.me.displayName} · ${state.me.login}`;
  el.meInfo.textContent = `${state.me.id} · ${state.me.online ? "online" : presenceText(state.me.lastSeen)}`;

  renderMyAvatar();
  el.setDisplayName.value = state.me.displayName || "";
  el.setLang.value = state.me.language || state.locale;
  el.setTheme.value = state.me.theme || "midnight";
  el.setAccent.value = state.me.accent || "indigo";

  el.modalDisplayName.value = state.me.displayName || "";
  el.modalLang.value = state.me.language || state.locale;
  el.modalTheme.value = state.me.theme || "midnight";
  el.modalAccent.value = state.me.accent || "indigo";

  renderGuildRail();
  renderHomeLists();
  renderGuildSidebar();
  renderMembers();
  renderPins();
  renderSettingsFields();
  applyCapabilities();
}

function renderMyAvatar() {
  el.meAvatar.innerHTML = avatarMarkup(state.me, "lg");
  el.avatarPreview.innerHTML = avatarMarkup(state.me, "xl");
}

function renderSettingsFields() {
  if (!state.me) return;
  el.setDisplayName.value = state.me.displayName || "";
  el.setLang.value = state.me.language || "ru";
  el.setTheme.value = state.me.theme || "midnight";
  el.setAccent.value = state.me.accent || "indigo";

  el.modalDisplayName.value = state.me.displayName || "";
  el.modalLang.value = state.me.language || "ru";
  el.modalTheme.value = state.me.theme || "midnight";
  el.modalAccent.value = state.me.accent || "indigo";
  renderMyAvatar();
}

function updateRailActive() {
  el.homeBtn.classList.toggle("active", state.currentView === "home" && !state.currentGuildId);
}

function renderGuildRail() {
  el.guildRailList.innerHTML = "";

  state.guilds.forEach((g) => {
    const btn = document.createElement("button");
    btn.className = "rail-btn" + (state.currentGuildId === g.id ? " active" : "");
    btn.type = "button";
    btn.textContent = (g.name || "G").slice(0, 1).toUpperCase();
    btn.title = `${g.name} · ${g.role || ""}`;
    btn.onclick = () => selectGuild(g.id);
    el.guildRailList.appendChild(btn);
  });

  updateRailActive();
}

function renderHomeLists() {
  if (state.currentView !== "home") {
    el.homeView.classList.remove("active");
    return;
  }
  el.homeView.classList.add("active");
  el.guildView.classList.remove("active");

  el.dmList.innerHTML = "";
  el.emptyDms.classList.toggle("hidden", state.dms.length > 0);

  state.dms.forEach((d) => {
    const peer = d.peer;
    const active = state.currentChat && state.currentChat.scope === "dm" && state.currentChat.peerId === peer.id;
    const item = document.createElement("div");
    item.className = "item" + (active ? " active" : "");
    item.innerHTML = `
      ${avatarMarkup(peer, "sm")}
      <div class="item-main">
        <div class="item-title">${escapeHtml(peer.displayName || peer.login)}</div>
        <div class="item-sub">${escapeHtml(d.preview || (peer.online ? "online" : presenceText(peer.lastSeen)))}</div>
      </div>
      <div class="badge">DM</div>
    `;
    item.onclick = () => openDm(peer);
    el.dmList.appendChild(item);
  });
}

function renderGuildSidebar() {
  if (!state.currentGuildId) {
    el.homeView.classList.add("active");
    el.guildView.classList.remove("active");
    updateRailActive();
    return;
  }

  el.homeView.classList.remove("active");
  el.guildView.classList.add("active");

  const guild = state.guilds.find((g) => g.id === state.currentGuildId);
  el.guildTitleHead.textContent = guild ? guild.name : "Server";

  el.channelList.innerHTML = "";
  const channels = guild ? guild.channels || [] : [];
  channels.forEach((c) => {
    const active = state.currentChat && state.currentChat.scope === "guild" && state.currentChat.id === c.id;
    const item = document.createElement("div");
    item.className = "item" + (active ? " active" : "");
    item.innerHTML = `
      <div class="avatar">#</div>
      <div class="item-main">
        <div class="item-title">#${escapeHtml(c.name)}</div>
        <div class="item-sub">${escapeHtml(guild ? guild.name : "")}</div>
      </div>
      <div class="badge">CH</div>
    `;
    item.onclick = () => openGuildChannel(state.currentGuildId, c);
    el.channelList.appendChild(item);
  });

  updateRailActive();
}

async function selectGuild(guildId) {
  state.currentView = "guild";
  state.currentGuildId = guildId;
  state.currentChat = null;
  state.currentPins = [];
  clearMessages();
  renderGuildRail();
  renderGuildSidebar();
  el.chatTitle.textContent = state.guilds.find((g) => g.id === guildId)?.name || "Server";
  el.chatSub.textContent = t("chat_select_sub");
  await refreshGuildChannels(guildId);
  await renderMembers();
  await renderPins();
}

async function refreshGuildChannels(guildId) {
  const res = await api(`/api/guilds/${encodeURIComponent(guildId)}/channels`);
  const data = await res.json();
  if (!res.ok) return;

  const guild = state.guilds.find((g) => g.id === guildId);
  if (guild) guild.channels = data.channels || [];
  renderGuildRail();
  renderGuildSidebar();
}

async function openDm(peer) {
  state.currentView = "home";
  state.currentGuildId = null;
  state.currentPins = [];

  const res = await api("/api/dm", {
    method: "POST",
    body: JSON.stringify({ query: peer.id })
  });
  const data = await res.json();
  if (!res.ok) return;

  state.currentChat = {
    scope: "dm",
    id: data.room,
    peerId: peer.id,
    title: peer.displayName || peer.login,
    subtitle: `@${peer.login}`,
    peer
  };

  state.socket.emit("join-dm", { peerId: peer.id });
  await loadMessagesForCurrentChat();
  renderGuildRail();
  renderHomeLists();
  renderGuildSidebar();
  await renderMembers();
  await renderPins();
  updateHeader();
}

async function openGuildChannel(guildId, channel) {
  state.currentView = "guild";
  state.currentGuildId = guildId;
  state.currentPins = [];
  state.currentChat = {
    scope: "guild",
    id: channel.id,
    guildId,
    title: `#${channel.name}`,
    subtitle: state.guilds.find((g) => g.id === guildId)?.name || "Server",
    channel
  };

  state.socket.emit("join-guild-channel", { channelId: channel.id });
  await loadMessagesForCurrentChat();
  renderGuildRail();
  renderGuildSidebar();
  await renderMembers();
  await renderPins();
  updateHeader();
}

function updateHeader() {
  if (!state.currentChat) {
    el.chatTitle.textContent = t("chat_select_title");
    el.chatSub.textContent = t("chat_select_sub");
    return;
  }
  el.chatTitle.textContent = state.currentChat.title;
  el.chatSub.textContent = state.currentChat.subtitle || "";
}

function clearMessages() {
  el.messages.innerHTML = "";
  renderMessagesEmpty();
}

function renderMessagesEmpty() {
  const hasMessages = el.messages.querySelectorAll(".msg").length > 0;
  el.emptyMessages.classList.toggle("hidden", hasMessages);
}

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function buildAttachmentHTML(att) {
  const isImg = String(att.type || "").startsWith("image/");
  const name = escapeHtml(att.name || "file");
  const url = escapeAttr(att.url || "");
  if (isImg) {
    return `
      <a class="attachment" href="${url}" target="_blank" rel="noreferrer">
        <img src="${url}" alt="">
        <div class="attachment-info">
          <div class="attachment-name">${name}</div>
          <div class="attachment-size">${formatSize(att.size)}</div>
        </div>
      </a>
    `;
  }
  return `
    <a class="attachment" href="${url}" target="_blank" rel="noreferrer">
      <div class="attachment-info">
        <div class="attachment-name">📎 ${name}</div>
        <div class="attachment-size">${formatSize(att.size)}</div>
      </div>
    </a>
  `;
}

function canModerateCurrentChatMessage(msg) {
  if (!state.me || !state.currentChat) return false;

  if (state.currentChat.scope === "dm") {
    return msg.senderId === state.me.id;
  }

  if (state.currentChat.scope === "guild") {
    const guild = state.guilds.find((g) => g.id === state.currentGuildId);
    const role = guild?.role || "member";
    return msg.senderId === state.me.id || role === "owner" || role === "admin";
  }

  return false;
}

function canPinCurrentChatMessage(msg) {
  return canModerateCurrentChatMessage(msg);
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = "msg" + (state.me && msg.senderId === state.me.id ? " me" : "");
  if (msg.deleted) div.classList.add("deleted");
  div.id = `message-${msg.id}`;
  div.dataset.msgId = msg.id;

  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const deletedText = state.locale === "ru" ? "Сообщение удалено" : "Message deleted";

  div.innerHTML = `
    <div class="msg-head">
      <div class="msg-author">
        ${avatarMarkup({ displayName: msg.senderName, login: msg.senderLogin, avatarUrl: msg.senderAvatar }, "sm")}
        <span>${escapeHtml(msg.senderName)}</span>
        ${msg.pinned ? `<span class="pinned-badge">📌 ${escapeHtml(t("pin_btn"))}</span>` : ""}
      </div>
      <div class="msg-meta">${time}</div>
    </div>
    <div class="msg-text">${msg.deleted ? escapeHtml(deletedText) : escapeHtml(msg.text)}</div>
    ${msg.attachments && msg.attachments.length ? `<div class="msg-attachments">${msg.attachments.map(buildAttachmentHTML).join("")}</div>` : ""}
    <div class="message-actions"></div>
  `;

  const actions = div.querySelector(".message-actions");
  if (!msg.deleted) {
    if (canPinCurrentChatMessage(msg)) {
      const pinBtn = document.createElement("button");
      pinBtn.textContent = msg.pinned ? t("unpin_btn") : t("pin_btn");
      pinBtn.onclick = () => togglePin(msg.id);
      actions.appendChild(pinBtn);
    }

    if (canModerateCurrentChatMessage(msg)) {
      const delBtn = document.createElement("button");
      delBtn.textContent = t("delete_btn");
      delBtn.classList.add("danger");
      delBtn.onclick = () => deleteMessage(msg.id);
      actions.appendChild(delBtn);
    }
  }

  el.messages.appendChild(div);
  renderMessagesEmpty();
}

function scrollBottom() {
  el.messages.scrollTop = el.messages.scrollHeight;
}

async function loadMessagesForCurrentChat() {
  clearMessages();
  if (!state.currentChat) return;

  let res;
  if (state.currentChat.scope === "dm") {
    res = await api(`/api/messages?scope=dm&peerId=${encodeURIComponent(state.currentChat.peerId)}`);
  } else {
    res = await api(`/api/messages?scope=guild&channelId=${encodeURIComponent(state.currentChat.id)}`);
  }

  const data = await res.json();
  if (!res.ok) return;

  (data.messages || []).forEach(renderMessage);
  renderMessagesEmpty();
  scrollBottom();
  await renderPins();
}

async function renderPins() {
  el.pinsList.innerHTML = "";
  if (!state.currentChat) return;

  let res;
  if (state.currentChat.scope === "dm") {
    res = await api(`/api/pins?scope=dm&peerId=${encodeURIComponent(state.currentChat.peerId)}`);
  } else {
    res = await api(`/api/pins?scope=guild&channelId=${encodeURIComponent(state.currentChat.id)}`);
  }

  const data = await res.json();
  if (!res.ok) return;

  state.currentPins = data.pins || [];
  if (!state.currentPins.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = state.locale === "ru" ? "Нет закрепов" : "No pins yet";
    el.pinsList.appendChild(empty);
    return;
  }

  state.currentPins.forEach((p) => {
    const card = document.createElement("div");
    card.className = "pin-card";
    card.innerHTML = `
      ${avatarMarkup({ displayName: p.senderName, login: p.senderLogin, avatarUrl: p.senderAvatar }, "sm")}
      <div class="pin-main">
        <div class="pin-title">📌 ${escapeHtml(p.senderName)}</div>
        <div class="pin-sub">${escapeHtml(p.deleted ? (state.locale === "ru" ? "Сообщение удалено" : "Message deleted") : p.text || "")}</div>
        <button class="pin-go" type="button">${escapeHtml(state.locale === "ru" ? "Перейти" : "Go to message")}</button>
      </div>
    `;
    card.querySelector("button").onclick = () => {
      const target = document.getElementById(`message-${p.id}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    el.pinsList.appendChild(card);
  });
}

function autoGrowTextarea() {
  el.messageInput.style.height = "auto";
  el.messageInput.style.height = Math.min(170, el.messageInput.scrollHeight) + "px";
}

function renderAttachmentPreview() {
  el.attachmentPreview.innerHTML = "";
  state.pendingFiles.forEach((f, idx) => {
    const chip = document.createElement("div");
    chip.className = "attach-chip";
    chip.innerHTML = `
      <span>📎 ${escapeHtml(f.name)}</span>
      <button type="button">×</button>
    `;
    chip.querySelector("button").onclick = () => {
      state.pendingFiles.splice(idx, 1);
      renderAttachmentPreview();
    };
    el.attachmentPreview.appendChild(chip);
  });
}

async function uploadPendingFiles() {
  if (!state.pendingFiles.length) return [];
  const fd = new FormData();
  state.pendingFiles.forEach((file) => fd.append("files", file));

  const res = await api("/api/upload", {
    method: "POST",
    body: fd
  });
  const data = await res.json();
  if (!res.ok) return [];

  return data.attachments || [];
}

async function sendMessage() {
  if (!state.currentChat) return;

  const text = el.messageInput.value.trim();
  if (!text && !state.pendingFiles.length) return;

  const attachments = await uploadPendingFiles();

  if (state.currentChat.scope === "dm") {
    state.socket.emit("message:send", {
      scope: "dm",
      peerId: state.currentChat.peerId,
      text,
      attachments
    });
    state.socket.emit("dm:ensure", { query: state.currentChat.peerId });
  } else {
    state.socket.emit("message:send", {
      scope: "guild",
      channelId: state.currentChat.id,
      text,
      attachments
    });
  }

  el.messageInput.value = "";
  state.pendingFiles = [];
  renderAttachmentPreview();
  autoGrowTextarea();
}

async function searchUsers() {
  const q = el.findInput.value.trim();
  el.findResults.innerHTML = "";
  if (!q) return;

  const res = await api(`/api/search?q=${encodeURIComponent(q)}`);
  const users = await res.json();
  if (!res.ok) return;

  users.forEach((u) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      ${avatarMarkup(u, "sm")}
      <div class="item-main">
        <div class="item-title">${escapeHtml(u.displayName || u.login)}</div>
        <div class="item-sub">@${escapeHtml(u.login)} · ${escapeHtml(u.id)} · ${u.online ? "online" : presenceText(u.lastSeen)}</div>
      </div>
      <div class="badge">${u.isFriend ? "DM" : "User"}</div>
    `;

    item.onclick = async () => {
      await openDm(u);
    };

    el.findResults.appendChild(item);
  });
}

async function createGuild() {
  const name = el.guildNameInput.value.trim();
  if (!name) return;

  const res = await api("/api/guilds", {
    method: "POST",
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (!res.ok) return;

  el.guildNameInput.value = "";
  await refreshMe();
  const created = data.guild;
  if (created) {
    state.currentGuildId = created.id;
    state.currentView = "guild";
    renderGuildRail();
    renderGuildSidebar();
    const firstChannel = created.channels?.[0];
    if (firstChannel) await openGuildChannel(created.id, firstChannel);
  }
}

async function createChannel() {
  if (!state.currentGuildId) return;
  const name = el.channelNameInput.value.trim();
  if (!name) return;

  const res = await api(`/api/guilds/${encodeURIComponent(state.currentGuildId)}/channels`, {
    method: "POST",
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (!res.ok) return;

  el.channelNameInput.value = "";
  await refreshGuildChannels(state.currentGuildId);
  if (data.channel) {
    await openGuildChannel(state.currentGuildId, data.channel);
  }
}

async function inviteToGuild() {
  if (!state.currentGuildId) return;
  const query = el.inviteInput.value.trim();
  if (!query) return;

  const res = await api(`/api/guilds/${encodeURIComponent(state.currentGuildId)}/invite`, {
    method: "POST",
    body: JSON.stringify({ query })
  });
  await res.json();
  if (!res.ok) return;

  el.inviteInput.value = "";
  await refreshMe();
  await renderMembers();
}

async function saveSettings() {
  const res = await api("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      displayName: el.setDisplayName.value.trim(),
      language: el.setLang.value,
      theme: el.setTheme.value,
      accent: el.setAccent.value
    })
  });

  const data = await res.json();
  if (!res.ok) return;

  state.me = data.user;
  setLocale(state.me.language || "ru", true);
  applyTheme(state.me.theme || "midnight");
  applyAccent(state.me.accent || "indigo");
  await refreshMe();
}

function openSettingsModal() {
  el.modalDisplayName.value = state.me?.displayName || "";
  el.modalLang.value = state.me?.language || state.locale;
  el.modalTheme.value = state.me?.theme || "midnight";
  el.modalAccent.value = state.me?.accent || "indigo";
  renderMyAvatar();
  el.settingsModal.classList.remove("hidden");
}

function closeSettingsModal() {
  el.settingsModal.classList.add("hidden");
}

async function saveModalSettings() {
  const res = await api("/api/settings", {
    method: "PATCH",
    body: JSON.stringify({
      displayName: el.modalDisplayName.value.trim(),
      language: el.modalLang.value,
      theme: el.modalTheme.value,
      accent: el.modalAccent.value
    })
  });

  const data = await res.json();
  if (!res.ok) return;

  state.me = data.user;
  setLocale(state.me.language || "ru", true);
  applyTheme(state.me.theme || "midnight");
  applyAccent(state.me.accent || "indigo");
  await refreshMe();
  closeSettingsModal();
}

async function uploadAvatar(file) {
  if (!file) return;
  const fd = new FormData();
  fd.append("avatar", file);

  const res = await api("/api/avatar", {
    method: "POST",
    body: fd
  });
  const data = await res.json();
  if (!res.ok) return alert("Upload failed");

  state.me = data.user;
  await refreshMe();
}

async function renderMembers() {
  el.membersList.innerHTML = "";
  if (!state.currentChat) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = t("chat_select_sub");
    el.membersList.appendChild(empty);
    return;
  }

  if (state.currentChat.scope === "dm") {
    const peer = state.currentChat.peer;
    const items = [
      {
        ...state.me,
        role: "self"
      },
      {
        ...peer,
        role: "friend"
      }
    ];

    items.forEach((u) => {
      const node = document.createElement("div");
      node.className = "member-card" + (u.online ? "" : " offline");
      node.innerHTML = `
        ${avatarMarkup(u, "sm")}
        <div class="member-main">
          <div class="member-name">${escapeHtml(u.displayName || u.login)} <span class="role-badge">${escapeHtml(u.role === "self" ? "You" : "Friend")}</span></div>
          <div class="member-sub">@${escapeHtml(u.login)} · ${u.online ? "online" : presenceText(u.lastSeen)}</div>
        </div>
      `;
      el.membersList.appendChild(node);
    });
    return;
  }

  if (state.currentChat.scope === "guild") {
    const guildId = state.currentGuildId;
    if (!guildId) return;

    const res = await api(`/api/guilds/${encodeURIComponent(guildId)}/members`);
    const data = await res.json();
    if (!res.ok) return;

    const guild = state.guilds.find((g) => g.id === guildId);
    const myRole = guild?.role || "member";
    const canEdit = myRole === "owner";

    (data.members || []).forEach((u) => {
      const node = document.createElement("div");
      node.className = "member-card" + (u.online ? "" : " offline");
      const roleText =
        u.role === "owner" ? t("owner") :
        u.role === "admin" ? t("admin") :
        t("member");

      node.innerHTML = `
        ${avatarMarkup(u, "sm")}
        <div class="member-main">
          <div class="member-name">${escapeHtml(u.displayName || u.login)} <span class="role-badge">${escapeHtml(roleText)}</span></div>
          <div class="member-sub">@${escapeHtml(u.login)} · ${escapeHtml(u.id)} · ${u.online ? "online" : presenceText(u.lastSeen)}</div>
          ${canEdit && u.role !== "owner" ? `
            <select class="role-select">
              <option value="member" ${u.role === "member" ? "selected" : ""}>${escapeHtml(t("member"))}</option>
              <option value="admin" ${u.role === "admin" ? "selected" : ""}>${escapeHtml(t("admin"))}</option>
            </select>
          ` : ""}
        </div>
      `;

      const select = node.querySelector("select");
      if (select) {
        select.onchange = async () => {
          await api(`/api/guilds/${encodeURIComponent(guildId)}/members/${encodeURIComponent(u.id)}/role`, {
            method: "PUT",
            body: JSON.stringify({ role: select.value })
          });
        };
      }

      el.membersList.appendChild(node);
    });
  }
}

async function renderPins() {
  el.pinsList.innerHTML = "";
  if (!state.currentChat) return;

  let res;
  if (state.currentChat.scope === "dm") {
    res = await api(`/api/pins?scope=dm&peerId=${encodeURIComponent(state.currentChat.peerId)}`);
  } else {
    res = await api(`/api/pins?scope=guild&channelId=${encodeURIComponent(state.currentChat.id)}`);
  }

  const data = await res.json();
  if (!res.ok) return;

  state.currentPins = data.pins || [];
  if (!state.currentPins.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = state.locale === "ru" ? "Нет закрепов" : "No pins yet";
    el.pinsList.appendChild(empty);
    return;
  }

  state.currentPins.forEach((p) => {
    const card = document.createElement("div");
    card.className = "pin-card";
    card.innerHTML = `
      ${avatarMarkup({ displayName: p.senderName, login: p.senderLogin, avatarUrl: p.senderAvatar }, "sm")}
      <div class="pin-main">
        <div class="pin-title">📌 ${escapeHtml(p.senderName)}</div>
        <div class="pin-sub">${escapeHtml(p.deleted ? (state.locale === "ru" ? "Сообщение удалено" : "Message deleted") : p.text || "")}</div>
        <button class="pin-go" type="button">${escapeHtml(state.locale === "ru" ? "Перейти" : "Go to message")}</button>
      </div>
    `;
    card.querySelector("button").onclick = () => {
      const target = document.getElementById(`message-${p.id}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    el.pinsList.appendChild(card);
  });
}

function applyCapabilities() {
  const screenOK = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  if (!screenOK) {
    el.attachBtn.disabled = false;
  }
}

async function togglePin(messageId) {
  if (!state.currentChat) return;

  if (state.currentChat.scope === "dm") {
    await api(`/api/messages/${encodeURIComponent(messageId)}/pin`, { method: "POST" });
  } else {
    await api(`/api/messages/${encodeURIComponent(messageId)}/pin`, { method: "POST" });
  }
}

async function deleteMessage(messageId) {
  if (!state.currentChat) return;
  if (!confirm(state.locale === "ru" ? "Удалить сообщение?" : "Delete message?")) return;

  await api(`/api/messages/${encodeURIComponent(messageId)}`, {
    method: "DELETE"
  });
}

function startRingtone() {
  stopRingtone();
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);

    let flip = false;
    const timer = setInterval(() => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = flip ? 660 : 880;
      osc.connect(gain);
      osc.start();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      setTimeout(() => {
        try { osc.stop(); } catch {}
      }, 260);
      flip = !flip;
    }, 420);

    state.ringtone = { ctx, timer };
  } catch {}
}

function stopRingtone() {
  if (!state.ringtone) return;
  clearInterval(state.ringtone.timer);
  try {
    state.ringtone.ctx.close();
  } catch {}
  state.ringtone = null;
}

function askNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      state.notificationsAllowed = perm === "granted";
    });
  } else {
    state.notificationsAllowed = Notification.permission === "granted";
  }
}

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();

    o1.frequency.value = 880;
    o2.frequency.value = 1320;
    o1.type = "sine";
    o2.type = "sine";
    g.gain.value = 0.0001;

    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);

    o1.start();
    o2.start();

    g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

    setTimeout(() => {
      try { o1.stop(); o2.stop(); ctx.close(); } catch {}
    }, 250);
  } catch {}
}

function notifyIncomingMessage(msg) {
  playNotificationSound();
  if (state.notificationsAllowed && "Notification" in window) {
    try {
      new Notification(msg.senderName || "New message", {
        body: String(msg.deleted ? "" : msg.text || "").slice(0, 120)
      });
    } catch {}
  }
}

function presenceText(lastSeen) {
  if (!lastSeen) return state.locale === "ru" ? "был(а) давно" : "seen long ago";
  const diff = Date.now() - lastSeen;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return state.locale === "ru" ? "был(а) только что" : "seen just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return state.locale === "ru" ? `был(а) ${min} мин назад` : `seen ${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return state.locale === "ru" ? `был(а) ${hr} ч назад` : `seen ${hr}h ago`;
  const days = Math.floor(hr / 24);
  return state.locale === "ru" ? `был(а) ${days} дн назад` : `seen ${days}d ago`;
}

function markActivity() {
  if (!state.socket || !state.me) return;
  const now = Date.now();
  if (now - state.lastPingAt < 8000) return;
  state.lastPingAt = now;
  state.socket.emit("presence:ping");
}

function connectSocket() {
  if (state.socket) state.socket.disconnect();

  state.socket = io({ auth: { token: state.token } });

  state.socket.on("connect_error", () => {
    logout();
  });

  state.socket.on("dms:refresh", refreshMe);
  state.socket.on("guilds:refresh", refreshMe);

  state.socket.on("presence:update", (user) => {
    if (state.me && user.id === state.me.id) {
      state.me.online = user.online;
      state.me.lastSeen = user.lastSeen;
      el.meInfo.textContent = `${state.me.id} · ${state.me.online ? "online" : presenceText(state.me.lastSeen)}`;
    }

    const dm = state.dms.find((x) => x.peer.id === user.id);
    if (dm) {
      dm.peer.online = user.online;
      dm.peer.lastSeen = user.lastSeen;
    }

    if (state.currentChat?.scope === "dm" && state.currentChat.peerId === user.id) {
      state.currentChat.peer.online = user.online;
      state.currentChat.peer.lastSeen = user.lastSeen;
      el.chatSub.textContent = `@${state.currentChat.peer.login} · ${state.currentChat.peer.online ? "online" : presenceText(state.currentChat.peer.lastSeen)}`;
    }

    renderGuildRail();
    renderHomeLists();
    renderMembers();
    renderPins();
  });

  state.socket.on("message:new", (msg) => {
    if (!state.currentChat) return;

    if (state.currentChat.scope === "dm") {
      const room = pairKey(state.me.id, state.currentChat.peerId);
      if (msg.scope === "dm" && msg.targetId === room) {
        renderMessage(msg);
        scrollBottom();
        renderPins();
      } else if (msg.senderId !== state.me.id) {
        notifyIncomingMessage(msg);
      }
    }

    if (state.currentChat.scope === "guild") {
      if (msg.scope === "guild" && msg.targetId === state.currentChat.id) {
        renderMessage(msg);
        scrollBottom();
        renderPins();
      } else if (msg.senderId !== state.me.id) {
        notifyIncomingMessage(msg);
      }
    }

    refreshMe();
  });

  state.socket.on("chat:updated", async (payload) => {
    if (!state.currentChat) return;
    if (state.currentChat.scope !== payload.scope) return;

    if (payload.scope === "dm" && state.currentChat.peerId) {
      const room = pairKey(state.me.id, state.currentChat.peerId);
      if (payload.targetId !== room) return;
    }

    if (payload.scope === "guild" && state.currentChat.id !== payload.targetId) return;

    await loadMessagesForCurrentChat();
    await renderPins();
    await renderMembers();
    renderHomeLists();
    renderGuildSidebar();
  });

  state.socket.on("guild:members:updated", async ({ guildId }) => {
    if (state.currentGuildId === guildId) {
      await renderMembers();
      await renderGuildSidebar();
      await renderPins();
    }
    await refreshMe();
  });

  state.socket.on("message:push", (msg) => {
    if (msg.senderId === state.me.id) return;
    notifyIncomingMessage(msg);
  });

  state.socket.on("guild:invited", async () => {
    await refreshMe();
  });

  state.socket.on("disconnect", () => {});
}

function showSettingsModal() {
  el.settingsModal.classList.remove("hidden");
  renderMyAvatar();
}

function hideSettingsModal() {
  el.settingsModal.classList.add("hidden");
}

function logout() {
  localStorage.removeItem("ms_token");
  state.token = "";
  state.me = null;
  state.guilds = [];
  state.dms = [];
  state.currentChat = null;
  state.currentGuildId = null;
  state.currentView = "home";
  state.pendingFiles = [];
  state.currentPins = [];
  stopRingtone();
  if (state.socket) state.socket.disconnect();
  state.socket = null;
  el.app.classList.add("hidden");
  el.authScreen.classList.remove("hidden");
  switchAuthMode("login");
}

function openMessageMenu(msg, x, y) {
  el.messageActionsMenu.innerHTML = "";
  el.messageActionsMenu.style.left = `${x}px`;
  el.messageActionsMenu.style.top = `${y}px`;
  el.messageActionsMenu.classList.remove("hidden");

  const close = () => el.messageActionsMenu.classList.add("hidden");

  if (canPinCurrentChatMessage(msg)) {
    const pinBtn = document.createElement("button");
    pinBtn.textContent = msg.pinned ? t("unpin_btn") : t("pin_btn");
    pinBtn.onclick = async () => {
      await togglePin(msg.id);
      close();
    };
    el.messageActionsMenu.appendChild(pinBtn);
  }

  if (canModerateCurrentChatMessage(msg)) {
    const delBtn = document.createElement("button");
    delBtn.textContent = t("delete_btn");
    delBtn.className = "danger";
    delBtn.onclick = async () => {
      await deleteMessage(msg.id);
      close();
    };
    el.messageActionsMenu.appendChild(delBtn);
  }

  if (!el.messageActionsMenu.children.length) {
    const none = document.createElement("button");
    none.textContent = state.locale === "ru" ? "Нет действий" : "No actions";
    none.disabled = true;
    el.messageActionsMenu.appendChild(none);
  }

  setTimeout(() => {
    const handler = (ev) => {
      if (!el.messageActionsMenu.contains(ev.target)) {
        close();
        document.removeEventListener("click", handler);
      }
    };
    document.addEventListener("click", handler);
  }, 0);
}

function bindUI() {
  el.authMainBtn.onclick = login;
  el.authAltBtn.onclick = () => switchAuthMode("register");
  el.tabLogin.onclick = () => switchAuthMode("login");
  el.tabRegister.onclick = () => switchAuthMode("register");
  el.authLang.onchange = () => setLocale(el.authLang.value);

  el.homeBtn.onclick = () => {
    state.currentView = "home";
    state.currentGuildId = null;
    state.currentChat = null;
    state.currentPins = [];
    renderGuildRail();
    renderHomeLists();
    renderGuildSidebar();
    clearMessages();
    updateHeader();
    renderMembers();
    renderPins();
    updateRailActive();
  };

  el.createGuildBtn.onclick = showCreateGuildHint;
  el.guildCreateBtn2.onclick = createGuild;
  el.channelCreateBtn.onclick = createChannel;
  el.inviteBtn.onclick = inviteToGuild;

  el.findBtn.onclick = searchUsers;
  el.findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchUsers();
  });

  el.sendBtn.onclick = sendMessage;
  el.messageInput.addEventListener("input", autoGrowTextarea);
  el.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  el.attachBtn.onclick = () => el.fileInput.click();
  el.fileInput.onchange = () => {
    state.pendingFiles = Array.from(el.fileInput.files || []);
    renderAttachmentPreview();
  };

  el.saveSettingsBtn.onclick = saveSettings;
  el.settingsBtn.onclick = showSettingsModal;
  el.closeSettingsBtn.onclick = hideSettingsModal;
  el.saveModalSettingsBtn.onclick = saveModalSettings;
  el.avatarPickBtn.onclick = () => el.avatarInput.click();
  el.avatarInput.onchange = () => uploadAvatar(el.avatarInput.files?.[0]);

  el.logoutBtn.onclick = logout;
  el.pinsBtn.onclick = () => renderPins();

  el.messageActionsMenu.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", () => {
    el.messageActionsMenu.classList.add("hidden");
  });

  el.messages.addEventListener("contextmenu", (e) => {
    const card = e.target.closest(".msg");
    if (!card) return;
    const msgId = card.dataset.msgId;
    const msg = (state.currentChat?.scope === "dm" || state.currentChat?.scope === "guild")
      ? getVisibleMessageById(msgId)
      : null;
    if (!msg) return;
    e.preventDefault();
    openMessageMenu(msg, e.pageX, e.pageY);
  });

  window.addEventListener("resize", setupDeviceMode);
  ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "focus"].forEach((evt) => {
    window.addEventListener(evt, markActivity, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) markActivity();
  });
}

function getVisibleMessageById(id) {
  const node = [...el.messages.querySelectorAll(".msg")].find((m) => m.dataset.msgId === id);
  if (!node) return null;

  const all = [];
  [...el.messages.querySelectorAll(".msg")].forEach((m) => {
    const mid = m.dataset.msgId;
    if (mid) all.push(mid);
  });

  if (!state.currentChat) return null;

  const cached = state.currentPins.find((p) => p.id === id);
  if (cached) return cached;

  return null;
}

function showCreateGuildHint() {
  el.guildNameInput.focus();
}

function applyCapabilities() {
  const screenOK = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  if (!screenOK) {
    el.attachBtn.disabled = false;
  }
}

async function init() {
  bindUI();
  applyTheme("midnight");
  applyAccent("indigo");
  setLocale(state.locale, false);
  switchAuthMode("login");
  applyCapabilities();

  if (!state.token) return;

  const res = await api("/api/me");
  if (!res.ok) return;

  const data = await res.json();
  state.me = data.user;
  state.guilds = data.guilds || [];
  state.dms = data.dms || [];
  openApp();
}

init();
