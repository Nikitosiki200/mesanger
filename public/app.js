const state = {
  token: localStorage.getItem("ms_token") || "",
  me: null,
  conversations: [],
  current: null,
  socket: null,
  peers: {},
  localStream: null,
  screenStream: null,
  currentCallKey: null,
  currentTab: "chats"
};

const el = {
  authScreen: document.getElementById("authScreen"),
  app: document.getElementById("app"),
  tabLogin: document.getElementById("tabLogin"),
  tabRegister: document.getElementById("tabRegister"),
  displayNameWrap: document.getElementById("displayNameWrap"),
  authLogin: document.getElementById("authLogin"),
  authDisplayName: document.getElementById("authDisplayName"),
  authPassword: document.getElementById("authPassword"),
  authMainBtn: document.getElementById("authMainBtn"),
  authAltBtn: document.getElementById("authAltBtn"),
  authError: document.getElementById("authError"),
  logoutBtn: document.getElementById("logoutBtn"),

  meName: document.getElementById("meName"),
  meInfo: document.getElementById("meInfo"),

  chatList: document.getElementById("chatList"),
  findInput: document.getElementById("findInput"),
  findBtn: document.getElementById("findBtn"),
  findResults: document.getElementById("findResults"),
  groupNameInput: document.getElementById("groupNameInput"),
  createGroupBtn: document.getElementById("createGroupBtn"),
  groupList: document.getElementById("groupList"),
  inviteInput: document.getElementById("inviteInput"),
  inviteBtn: document.getElementById("inviteBtn"),

  setDisplayName: document.getElementById("setDisplayName"),
  setAccent: document.getElementById("setAccent"),
  setTheme: document.getElementById("setTheme"),
  setCompact: document.getElementById("setCompact"),
  saveSettingsBtn: document.getElementById("saveSettingsBtn"),

  chatTitle: document.getElementById("chatTitle"),
  chatSub: document.getElementById("chatSub"),
  messages: document.getElementById("messages"),
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),

  members: document.getElementById("members"),
  localVideo: document.getElementById("localVideo"),
  remoteVideos: document.getElementById("remoteVideos"),

  voiceCallBtn: document.getElementById("voiceCallBtn"),
  videoCallBtn: document.getElementById("videoCallBtn"),
  screenBtn: document.getElementById("screenBtn"),
  hangupBtn: document.getElementById("hangupBtn")
};

function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (state.token) headers.set("Authorization", `Bearer ${state.token}`);
  return fetch(path, { ...options, headers });
}

function setAccent(accent) {
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

function applyTheme(theme) {
  if (theme === "midnight") {
    document.documentElement.style.setProperty("--bg", "#050816");
    document.documentElement.style.setProperty("--bg2", "#0a1021");
  } else {
    document.documentElement.style.setProperty("--bg", "#0b1020");
    document.documentElement.style.setProperty("--bg2", "#11162a");
  }
}

function showError(text) {
  el.authError.textContent = text || "";
}

function switchAuthMode(mode) {
  const isLogin = mode === "login";
  el.tabLogin.classList.toggle("active", isLogin);
  el.tabRegister.classList.toggle("active", !isLogin);
  el.displayNameWrap.style.display = isLogin ? "none" : "flex";
  el.authMainBtn.textContent = isLogin ? "Войти" : "Создать аккаунт";
  el.authAltBtn.textContent = isLogin ? "Создать аккаунт" : "Вернуться ко входу";
  el.authAltBtn.onclick = () => switchAuthMode(isLogin ? "register" : "login");
  el.authMainBtn.onclick = isLogin ? login : register;
  showError("");
}

async function register() {
  showError("");
  const login = el.authLogin.value.trim();
  const password = el.authPassword.value.trim();
  const displayName = el.authDisplayName.value.trim();

  const res = await api("/api/register", {
    method: "POST",
    body: JSON.stringify({ login, password, displayName })
  });
  const data = await res.json();
  if (!res.ok) return showError(data.error || "Ошибка регистрации");

  finishAuth(data.token, data.user);
}

async function login() {
  showError("");
  const login = el.authLogin.value.trim();
  const password = el.authPassword.value.trim();

  const res = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ login, password })
  });
  const data = await res.json();
  if (!res.ok) return showError(data.error || "Ошибка входа");

  finishAuth(data.token, data.user);
}

function finishAuth(token, user) {
  state.token = token;
  state.me = user;
  localStorage.setItem("ms_token", token);
  openApp();
}

function openApp() {
  el.authScreen.classList.add("hidden");
  el.app.classList.remove("hidden");
  connectSocket();
  refreshMe();
  renderTabs();
  setThemeFromUser();
}

function setThemeFromUser() {
  if (!state.me) return;
  setAccent(state.me.accent || "indigo");
  applyTheme(state.me.theme || "dark");
  el.setDisplayName.value = state.me.displayName || "";
  el.setAccent.value = state.me.accent || "indigo";
  el.setTheme.value = state.me.theme || "dark";
  el.setCompact.checked = !!state.me.compact;
}

async function refreshMe() {
  const res = await api("/api/me");
  const data = await res.json();
  if (!res.ok) return logout();

  state.me = data.user;
  state.conversations = data.conversations || [];
  setThemeFromUser();

  el.meName.textContent = `${state.me.displayName} · ${state.me.login}`;
  el.meInfo.textContent = `ID: ${state.me.id} · ${state.me.compact ? "компакт" : "обычный"} режим`;
  renderChats();
  renderGroups();
  renderSettings();
}

function renderTabs() {
  const railButtons = [...document.querySelectorAll(".rail-btn[data-tab]")];
  const views = {
    chats: document.getElementById("tabChats"),
    find: document.getElementById("tabFind"),
    groups: document.getElementById("tabGroups"),
    settings: document.getElementById("tabSettings")
  };

  railButtons.forEach((btn) => {
    btn.onclick = () => {
      state.currentTab = btn.dataset.tab;
      railButtons.forEach((b) => b.classList.toggle("active", b === btn));
      Object.entries(views).forEach(([k, node]) => {
        node.classList.toggle("active", k === state.currentTab);
      });
    };
  });
}

function renderChats() {
  el.chatList.innerHTML = "";
  state.conversations.forEach((c) => {
    const item = document.createElement("div");
    item.className = "item" + (state.current && state.current.type === c.type && state.current.id === c.id ? " active" : "");
    item.innerHTML = `
      <div class="avatar">${c.avatar || "U"}</div>
      <div class="item-main">
        <div class="item-title">${escapeHtml(c.title)}</div>
        <div class="item-sub">${escapeHtml(c.subtitle || "")}</div>
      </div>
      <div class="badge">${c.type === "dm" ? "DM" : "GRP"}</div>
    `;
    item.onclick = () => openConversation(c);
    el.chatList.appendChild(item);
  });
}

function renderGroups() {
  const groups = state.conversations.filter((c) => c.type === "group");
  el.groupList.innerHTML = "";
  groups.forEach((g) => {
    const item = document.createElement("div");
    item.className = "item" + (state.current && state.current.type === g.type && state.current.id === g.id ? " active" : "");
    item.innerHTML = `
      <div class="avatar">#</div>
      <div class="item-main">
        <div class="item-title">${escapeHtml(g.title)}</div>
        <div class="item-sub">${escapeHtml(g.subtitle || "")}</div>
      </div>
      <div class="badge">group</div>
    `;
    item.onclick = () => openConversation(g);
    el.groupList.appendChild(item);
  });
}

async function openConversation(c) {
  if (state.current) {
    try { socketEmit("leave-chat", state.current); } catch {}
    stopCall(true);
  }

  state.current = c;
  renderChats();
  renderGroups();

  el.chatTitle.textContent = c.title;
  el.chatSub.textContent = c.type === "dm"
    ? c.subtitle
    : `Групповой чат · ${c.subtitle || ""}`;

  await loadMessages();
  await loadMembers();

  socketEmit("join-chat", c);
}

async function loadMessages() {
  if (!state.current) return;
  const res = await api(`/api/messages?type=${encodeURIComponent(state.current.type)}&id=${encodeURIComponent(state.current.id)}`);
  const data = await res.json();
  if (!res.ok) return;

  el.messages.innerHTML = "";
  (data.messages || []).forEach(renderMessage);
  scrollMessagesBottom();
}

function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = "msg" + (state.me && msg.senderId === state.me.id ? " me" : "");
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  div.innerHTML = `
    <div class="msg-meta">${escapeHtml(msg.senderName)} · ${time}</div>
    <div class="msg-text">${escapeHtml(msg.text)}</div>
  `;
  el.messages.appendChild(div);
}

function scrollMessagesBottom() {
  el.messages.scrollTop = el.messages.scrollHeight;
}

async function sendMessage() {
  if (!state.current) return;
  const text = el.messageInput.value.trim();
  if (!text) return;

  socketEmit("message:send", {
    type: state.current.type,
    id: state.current.id,
    text
  });
  el.messageInput.value = "";
}

async function searchUsers() {
  const q = el.findInput.value.trim();
  const res = await api(`/api/search?q=${encodeURIComponent(q)}`);
  const users = await res.json();
  if (!res.ok) return;

  el.findResults.innerHTML = "";
  users.forEach((u) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <div class="avatar">${escapeHtml((u.displayName || u.login).slice(0, 1).toUpperCase())}</div>
      <div class="item-main">
        <div class="item-title">${escapeHtml(u.displayName || u.login)}</div>
        <div class="item-sub">@${escapeHtml(u.login)} · ID ${escapeHtml(u.id)}</div>
      </div>
      <button class="small-btn">Добавить</button>
    `;
    item.querySelector("button").onclick = async (e) => {
      e.stopPropagation();
      const add = await api("/api/friends/add", {
        method: "POST",
        body: JSON.stringify({ query: u.login })
      });
      const data = await add.json();
      if (!add.ok) return alert(data.error || "Ошибка");
      await refreshMe();
    };
    item.onclick = async () => {
      const add = await api("/api/friends/add", {
        method: "POST",
        body: JSON.stringify({ query: u.id })
      });
      const data = await add.json();
      if (!add.ok) return alert(data.error || "Ошибка");
      await refreshMe();
    };
    el.findResults.appendChild(item);
  });
}

async function createGroup() {
  const name = el.groupNameInput.value.trim();
  if (!name) return;

  const res = await api("/api/groups", {
    method: "POST",
    body: JSON.stringify({ name })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Ошибка");

  el.groupNameInput.value = "";
  await refreshMe();
  openConversation({
    id: data.group.id,
    type: "group",
    title: data.group.name,
    subtitle: "1 участников"
  });
}

async function inviteToCurrentGroup() {
  if (!state.current || state.current.type !== "group") return alert("Открой групповой чат");
  const query = el.inviteInput.value.trim();
  if (!query) return;

  const res = await api(`/api/groups/${state.current.id}/invite`, {
    method: "POST",
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Ошибка");

  el.inviteInput.value = "";
  await loadMembers();
  await refreshMe();
}

async function loadMembers() {
  el.members.innerHTML = "";
  if (!state.current) return;

  if (state.current.type === "dm") {
    const friend = state.conversations.find((c) => c.id === state.current.id && c.type === "dm");
    const mine = state.me;
    const other = state.conversations.find((c) => c.id === state.current.id && c.type === "dm");
    const label = other ? other.title : "Диалог";
    const list = [
      { name: mine.displayName, login: mine.login },
      { name: label, login: other ? other.subtitle.replace("@", "") : "" }
    ];
    list.forEach((u) => {
      const node = document.createElement("div");
      node.className = "member";
      node.innerHTML = `<div class="dot"></div><div><div>${escapeHtml(u.name)}</div><div class="item-sub">@${escapeHtml(u.login || "")}</div></div>`;
      el.members.appendChild(node);
    });
    return;
  }

  const res = await api(`/api/groups/${state.current.id}/members`);
  const data = await res.json();
  if (!res.ok) return;

  (data.members || []).forEach((u) => {
    const node = document.createElement("div");
    node.className = "member";
    node.innerHTML = `<div class="dot"></div><div><div>${escapeHtml(u.displayName || u.login)}</div><div class="item-sub">@${escapeHtml(u.login)} · ${escapeHtml(u.id)}</div></div>`;
    el.members.appendChild(node);
  });
}

async function saveSettings() {
  const payload = {
    displayName: el.setDisplayName.value.trim(),
    accent: el.setAccent.value,
    theme: el.setTheme.value,
    compact: el.setCompact.checked
  };

  const res = await api("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error || "Ошибка");

  state.me = data.user;
  setThemeFromUser();
  await refreshMe();
}

function connectSocket() {
  if (state.socket) {
    state.socket.disconnect();
  }

  state.socket = io({
    auth: { token: state.token }
  });

  state.socket.on("connect_error", () => {
    logout();
  });

  state.socket.on("message:new", (msg) => {
    if (
      state.current &&
      state.current.type === msg.type &&
      state.current.id === msg.channelId
    ) {
      renderMessage(msg);
      scrollMessagesBottom();
    }
  });

  state.socket.on("call:members", async ({ type, id, members }) => {
    if (!state.current || state.current.type !== type || state.current.id !== id) return;
    for (const m of members) {
      await createPeer(m.id, true);
    }
  });

  state.socket.on("call:user-joined", async ({ id }) => {
    if (!state.current) return;
    await createPeer(id, false);
  });

  state.socket.on("call:user-left", ({ id }) => {
    removePeer(id);
  });

  state.socket.on("call:signal", async ({ from, data }) => {
    await handleSignal(from, data);
  });
}

function socketEmit(event, payload) {
  if (!state.socket) return;
  state.socket.emit(event, payload);
}

async function ensureMedia(kind) {
  if (state.localStream) {
    const hasVideo = state.localStream.getVideoTracks().length > 0;
    if ((kind === "voice" && !hasVideo) || (kind === "video" && hasVideo)) {
      return state.localStream;
    }
    state.localStream.getTracks().forEach((t) => t.stop());
  }

  const constraints = kind === "video"
    ? { audio: true, video: true }
    : { audio: true, video: false };

  state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
  el.localVideo.srcObject = state.localStream;
  return state.localStream;
}

async function startCall(kind) {
  if (!state.current) return alert("Сначала открой чат");
  await ensureMedia(kind);
  joinCallRoom();
}

function callKey() {
  if (!state.current) return "";
  return `${state.current.type}:${state.current.id}`;
}

function joinCallRoom() {
  if (!state.current) return;
  state.currentCallKey = callKey();
  cleanupPeers();
  socketEmit("call:join", state.current);
}

async function shareScreen() {
  if (!state.current) return alert("Сначала открой чат");
  if (!state.localStream) await ensureMedia("video");

  const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  state.screenStream = screen;

  const screenTrack = screen.getVideoTracks()[0];
  el.localVideo.srcObject = screen;

  replaceOutgoingVideoTrack(screenTrack);

  screenTrack.onended = () => {
    restoreCameraTrack();
  };
}

function replaceOutgoingVideoTrack(track) {
  Object.values(state.peers).forEach((pc) => {
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
    if (sender) sender.replaceTrack(track);
  });
}

function restoreCameraTrack() {
  if (!state.localStream) return;
  const camera = state.localStream.getVideoTracks()[0];
  if (camera) {
    replaceOutgoingVideoTrack(camera);
    el.localVideo.srcObject = state.localStream;
  }
  if (state.screenStream) {
    state.screenStream.getTracks().forEach((t) => t.stop());
    state.screenStream = null;
  }
}

async function createPeer(remoteId, initiator) {
  if (state.peers[remoteId]) return state.peers[remoteId];
  if (!state.localStream) return null;

  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  });

  state.peers[remoteId] = pc;

  state.localStream.getTracks().forEach((track) => {
    pc.addTrack(track, state.localStream);
  });

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socketEmit("call:signal", {
        to: remoteId,
        data: { candidate: e.candidate }
      });
    }
  };

  pc.ontrack = (e) => {
    attachRemoteStream(remoteId, e.streams[0]);
  };

  pc.onconnectionstatechange = () => {
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
      removePeer(remoteId);
    }
  };

  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketEmit("call:signal", {
      to: remoteId,
      data: { sdp: pc.localDescription }
    });
  }

  return pc;
}

async function handleSignal(from, data) {
  const pc = state.peers[from] || await createPeer(from, false);
  if (!pc) return;

  try {
    if (data.sdp) {
      await pc.setRemoteDescription(data.sdp);
      if (data.sdp.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketEmit("call:signal", {
          to: from,
          data: { sdp: pc.localDescription }
        });
      }
    } else if (data.candidate) {
      await pc.addIceCandidate(data.candidate);
    }
  } catch (err) {
    console.error(err);
  }
}

function attachRemoteStream(id, stream) {
  let tile = document.getElementById(`remote-${id}`);
  if (!tile) {
    tile = document.createElement("div");
    tile.className = "remote-tile";
    tile.id = `remote-${id}`;
    tile.innerHTML = `
      <div class="remote-name">${escapeHtml(id)}</div>
      <video autoplay playsinline></video>
    `;
    el.remoteVideos.appendChild(tile);
  }
  tile.querySelector("video").srcObject = stream;
}

function removePeer(id) {
  if (state.peers[id]) {
    state.peers[id].close();
    delete state.peers[id];
  }
  const tile = document.getElementById(`remote-${id}`);
  if (tile) tile.remove();
}

function cleanupPeers() {
  Object.keys(state.peers).forEach(removePeer);
  el.remoteVideos.innerHTML = "";
}

function stopCall(silent = false) {
  cleanupPeers();
  if (!silent && state.current) {
    socketEmit("call:leave", state.current);
  }

  if (state.screenStream) {
    state.screenStream.getTracks().forEach((t) => t.stop());
    state.screenStream = null;
  }
  if (state.localStream) {
    state.localStream.getTracks().forEach((t) => t.stop());
    state.localStream = null;
  }
  el.localVideo.srcObject = null;
  state.currentCallKey = null;
}

function logout() {
  localStorage.removeItem("ms_token");
  state.token = "";
  state.me = null;
  state.conversations = [];
  state.current = null;
  stopCall(true);
  if (state.socket) state.socket.disconnect();
  state.socket = null;
  el.app.classList.add("hidden");
  el.authScreen.classList.remove("hidden");
  showError("");
  switchAuthMode("login");
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

el.authMainBtn.onclick = login;
el.authAltBtn.onclick = () => switchAuthMode("register");
el.tabLogin.onclick = () => switchAuthMode("login");
el.tabRegister.onclick = () => switchAuthMode("register");
el.findBtn.onclick = searchUsers;
el.findInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchUsers();
});
el.createGroupBtn.onclick = createGroup;
el.inviteBtn.onclick = inviteToCurrentGroup;
el.sendBtn.onclick = sendMessage;
el.messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
el.saveSettingsBtn.onclick = saveSettings;
el.logoutBtn.onclick = logout;
el.voiceCallBtn.onclick = () => startCall("voice");
el.videoCallBtn.onclick = () => startCall("video");
el.screenBtn.onclick = shareScreen;
el.hangupBtn.onclick = () => stopCall(false);

(async function init() {
  switchAuthMode("login");
  if (!state.token) return;

  const res = await api("/api/me");
  if (!res.ok) return;
  const data = await res.json();

  state.me = data.user;
  state.conversations = data.conversations || [];
  openApp();
})();
