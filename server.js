const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const UPLOADS_DIR = path.join(ROOT, "uploads");
const AVATARS_DIR = path.join(UPLOADS_DIR, "avatars");
const FILES_DIR = path.join(UPLOADS_DIR, "files");
const DB_FILE = path.join(ROOT, "db.json");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(FILES_DIR, { recursive: true });

app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));
app.use(express.static(path.join(ROOT, "public")));

const EMPTY_DB = {
  users: [],
  sessions: [],
  friendships: [],
  guilds: [],
  channels: [],
  guildMembers: [],
  messages: []
};

let db = structuredClone(EMPTY_DB);
const userSockets = new Map();
const connectionCounts = new Map();

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, AVATARS_DIR);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const fileUpload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, FILES_DIR);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 }
});

function hashPassword(password) {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function makeId5() {
  let id = "";
  do {
    id = Math.random().toString(36).slice(2, 7).toUpperCase();
  } while (db.users.some((u) => u.id === id));
  return id;
}

function safeLogin(value) {
  return String(value || "").trim().toLowerCase();
}

function pairKey(a, b) {
  return [a, b].sort().join("_");
}

function dmRoom(a, b) {
  return `dm:${pairKey(a, b)}`;
}

function guildRoom(channelId) {
  return `guild:${channelId}`;
}

function publicUser(u) {
  return {
    id: u.id,
    login: u.login,
    displayName: u.displayName || u.login,
    language: u.language || "ru",
    theme: u.theme || "midnight",
    accent: u.accent || "indigo",
    avatarUrl: u.avatarUrl || "",
    online: !!u.online,
    lastSeen: u.lastSeen || Date.now()
  };
}

function normalizeAttachments(list) {
  return Array.isArray(list)
    ? list
        .map((a) => ({
          name: String(a.name || "file"),
          url: String(a.url || ""),
          size: Number(a.size || 0),
          type: String(a.type || "")
        }))
        .filter((a) => a.url)
    : [];
}

function getAuthToken(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice(7);
}

function getUserFromToken(token) {
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

function getAuthUser(req) {
  return getUserFromToken(getAuthToken(req));
}

function authRequired(req, res, next) {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  req.user = user;
  next();
}

function getRole(userId, guildId) {
  const row = db.guildMembers.find((m) => m.guildId === guildId && m.userId === userId);
  return row ? row.role : null;
}

function isGuildMember(userId, guildId) {
  return !!getRole(userId, guildId);
}

function canManageGuild(userId, guildId) {
  const role = getRole(userId, guildId);
  return role === "owner" || role === "admin";
}

function canEditRoles(userId, guildId) {
  return getRole(userId, guildId) === "owner";
}

function canModerateMessage(userId, msg) {
  if (!msg) return false;

  if (msg.scope === "dm") {
    return msg.senderId === userId;
  }

  if (msg.scope === "guild") {
    const channel = db.channels.find((c) => c.id === msg.targetId);
    if (!channel) return false;
    const role = getRole(userId, channel.guildId);
    return msg.senderId === userId || role === "owner" || role === "admin";
  }

  return false;
}

function canPinMessage(userId, msg) {
  return canModerateMessage(userId, msg);
}

function getGuildChannels(guildId) {
  return db.channels
    .filter((c) => c.guildId === guildId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function getGuildsFor(userId) {
  return db.guildMembers
    .filter((m) => m.userId === userId)
    .map((m) => db.guilds.find((g) => g.id === m.guildId))
    .filter(Boolean)
    .map((g) => ({
      id: g.id,
      name: g.name,
      ownerId: g.ownerId,
      role: getRole(userId, g.id),
      channels: getGuildChannels(g.id).map((c) => ({
        id: c.id,
        guildId: c.guildId,
        name: c.name
      }))
    }));
}

function getFriends(userId) {
  return db.friendships
    .filter((f) => f.status === "accepted" && (f.a === userId || f.b === userId))
    .map((f) => {
      const friendId = f.a === userId ? f.b : f.a;
      const friend = db.users.find((u) => u.id === friendId);
      return friend ? publicUser(friend) : null;
    })
    .filter(Boolean);
}

function getDmList(userId) {
  return getFriends(userId)
    .map((peer) => {
      const room = pairKey(userId, peer.id);
      const msgs = db.messages
        .filter((m) => m.scope === "dm" && m.targetId === room && !m.deleted)
        .sort((a, b) => a.createdAt - b.createdAt);

      const last = msgs[msgs.length - 1];
      return {
        peer,
        room,
        preview: last ? (last.deleted ? "" : last.text) : "",
        lastMessageAt: last ? last.createdAt : 0
      };
    })
    .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
}

function messagePayload(m) {
  const sender = db.users.find((u) => u.id === m.senderId);
  return {
    id: m.id,
    scope: m.scope,
    targetId: m.targetId,
    senderId: m.senderId,
    senderName: sender ? (sender.displayName || sender.login) : "Unknown",
    senderLogin: sender ? sender.login : "unknown",
    senderAvatar: sender ? (sender.avatarUrl || "") : "",
    text: m.text,
    attachments: normalizeAttachments(m.attachments),
    pinned: !!m.pinned,
    deleted: !!m.deleted,
    createdAt: m.createdAt
  };
}

function storeMessage(scope, targetId, senderId, text, attachments = []) {
  const msg = {
    id: crypto.randomBytes(8).toString("hex"),
    scope,
    targetId,
    senderId,
    text,
    attachments: normalizeAttachments(attachments),
    pinned: false,
    deleted: false,
    createdAt: Date.now()
  };
  db.messages.push(msg);
  return msg;
}

function messagesForDm(userId, peerId) {
  const room = pairKey(userId, peerId);
  return db.messages
    .filter((m) => m.scope === "dm" && m.targetId === room)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(messagePayload);
}

function messagesForGuild(channelId) {
  return db.messages
    .filter((m) => m.scope === "guild" && m.targetId === channelId)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(messagePayload);
}

function pinsForDm(userId, peerId) {
  const room = pairKey(userId, peerId);
  return db.messages
    .filter((m) => m.scope === "dm" && m.targetId === room && m.pinned && !m.deleted)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(messagePayload);
}

function pinsForGuild(channelId) {
  return db.messages
    .filter((m) => m.scope === "guild" && m.targetId === channelId && m.pinned && !m.deleted)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(messagePayload);
}

function broadcastPresence(user) {
  io.emit("presence:update", publicUser(user));
}

function refreshDmsFor(userId) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const sid of sockets) io.to(sid).emit("dms:refresh");
}

function refreshGuildsFor(userId) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  for (const sid of sockets) io.to(sid).emit("guilds:refresh");
}

async function loadDb() {
  try {
    const raw = await fsp.readFile(DB_FILE, "utf8");
    db = JSON.parse(raw);
  } catch {
    db = structuredClone(EMPTY_DB);
    await saveDb();
  }

  for (const u of db.users) {
    if (typeof u.online !== "boolean") u.online = false;
    if (!u.lastSeen) u.lastSeen = Date.now();
    if (!u.language) u.language = "ru";
    if (!u.theme) u.theme = "midnight";
    if (!u.accent) u.accent = "indigo";
    if (!u.avatarUrl) u.avatarUrl = "";
  }

  for (const gm of db.guildMembers) {
    if (!gm.role) gm.role = "member";
  }

  for (const m of db.messages) {
    if (!Array.isArray(m.attachments)) m.attachments = [];
    if (typeof m.pinned !== "boolean") m.pinned = false;
    if (typeof m.deleted !== "boolean") m.deleted = false;
  }
}

async function saveDb() {
  await fsp.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return next(new Error("unauthorized"));

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return next(new Error("unauthorized"));

  socket.data.userId = user.id;
  socket.data.login = user.login;
  next();
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  const user = db.users.find((u) => u.id === userId);

  if (user) {
    connectionCounts.set(userId, (connectionCounts.get(userId) || 0) + 1);
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);
    user.online = true;
    user.lastSeen = Date.now();
    broadcastPresence(user);
  }

  socket.on("presence:ping", async () => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) return;
    u.online = true;
    u.lastSeen = Date.now();
    await saveDb();
    broadcastPresence(u);
  });

  socket.on("join-dm", ({ peerId }) => {
    if (!peerId) return;
    socket.join(dmRoom(userId, peerId));
  });

  socket.on("leave-dm", ({ peerId }) => {
    if (!peerId) return;
    socket.leave(dmRoom(userId, peerId));
  });

  socket.on("join-guild-channel", ({ channelId }) => {
    if (!channelId) return;
    const channel = db.channels.find((c) => c.id === channelId);
    if (!channel || !isGuildMember(userId, channel.guildId)) return;
    socket.join(guildRoom(channelId));
  });

  socket.on("leave-guild-channel", ({ channelId }) => {
    if (!channelId) return;
    socket.leave(guildRoom(channelId));
  });

  socket.on("message:send", async (payload) => {
    const scope = String(payload?.scope || "");
    const text = String(payload?.text || "").trim();
    const attachments = normalizeAttachments(payload?.attachments || []);

    if (!text && attachments.length === 0) return;

    if (scope === "dm") {
      const peerId = String(payload?.peerId || "");
      if (!peerId || peerId === userId) return;

      const peer = db.users.find((u) => u.id === peerId);
      if (!peer) return;

      const exists = db.friendships.find(
        (f) =>
          f.status === "accepted" &&
          ((f.a === userId && f.b === peerId) || (f.a === peerId && f.b === userId))
      );

      if (!exists) {
        db.friendships.push({
          a: userId,
          b: peerId,
          status: "accepted",
          createdAt: Date.now()
        });
      }

      const room = pairKey(userId, peerId);
      const msg = storeMessage("dm", room, userId, text, attachments);
      await saveDb();

      io.to(dmRoom(userId, peerId)).emit("message:new", messagePayload(msg));
      refreshDmsFor(userId);
      refreshDmsFor(peerId);
      return;
    }

    if (scope === "guild") {
      const channelId = String(payload?.channelId || "");
      const channel = db.channels.find((c) => c.id === channelId);
      if (!channel || !isGuildMember(userId, channel.guildId)) return;

      const msg = storeMessage("guild", channelId, userId, text, attachments);
      await saveDb();

      io.to(guildRoom(channelId)).emit("message:new", messagePayload(msg));
    }
  });

  socket.on("disconnect", async () => {
    const current = connectionCounts.get(userId) || 0;
    const next = Math.max(0, current - 1);

    if (next <= 0) connectionCounts.delete(userId);
    else connectionCounts.set(userId, next);

    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) userSockets.delete(userId);
    }

    const u = db.users.find((x) => x.id === userId);
    if (u) {
      u.lastSeen = Date.now();
      if ((connectionCounts.get(userId) || 0) === 0) u.online = false;
      await saveDb();
      broadcastPresence(u);
    }
  });
});

setInterval(async () => {
  const now = Date.now();
  let changed = false;

  for (const user of db.users) {
    if (user.online && now - (user.lastSeen || 0) > 3 * 60 * 1000) {
      user.online = false;
      changed = true;
      broadcastPresence(user);
    }
  }

  if (changed) await saveDb();
}, 30000);

app.post("/api/register", async (req, res) => {
  const { login, password, displayName, language = "ru", theme = "midnight", accent = "indigo" } = req.body || {};
  const cleanLogin = String(login || "").trim();
  const cleanPassword = String(password || "").trim();
  const cleanName = String(displayName || "").trim();
  const lang = language === "en" ? "en" : "ru";

  if (cleanLogin.length < 3) return res.status(400).json({ error: "login_min" });
  if (cleanPassword.length < 4) return res.status(400).json({ error: "password_min" });
  if (db.users.some((u) => safeLogin(u.login) === safeLogin(cleanLogin))) {
    return res.status(400).json({ error: "login_taken" });
  }

  const user = {
    id: makeId5(),
    login: cleanLogin,
    passwordHash: hashPassword(cleanPassword),
    displayName: cleanName || cleanLogin,
    language: lang,
    theme,
    accent,
    avatarUrl: "",
    online: false,
    lastSeen: Date.now(),
    createdAt: Date.now()
  };

  const token = makeToken();
  db.users.push(user);
  db.sessions.push({ token, userId: user.id, createdAt: Date.now() });
  await saveDb();

  res.json({ token, user: publicUser(user) });
});

app.post("/api/login", async (req, res) => {
  const { login, password } = req.body || {};
  const cleanLogin = String(login || "").trim();
  const cleanPassword = String(password || "").trim();

  const user = db.users.find(
    (u) =>
      safeLogin(u.login) === safeLogin(cleanLogin) &&
      u.passwordHash === hashPassword(cleanPassword)
  );

  if (!user) return res.status(400).json({ error: "bad_login" });

  const token = makeToken();
  db.sessions.push({ token, userId: user.id, createdAt: Date.now() });
  await saveDb();

  res.json({ token, user: publicUser(user) });
});

app.get("/api/me", authRequired, (req, res) => {
  res.json({
    user: publicUser(req.user),
    guilds: getGuildsFor(req.user.id),
    dms: getDmList(req.user.id)
  });
});

app.patch("/api/settings", authRequired, async (req, res) => {
  const { displayName, language, theme, accent } = req.body || {};

  if (typeof displayName === "string") {
    req.user.displayName = displayName.trim().slice(0, 24) || req.user.login;
  }
  if (language === "ru" || language === "en") {
    req.user.language = language;
  }
  if (typeof theme === "string") {
    req.user.theme = theme;
  }
  if (typeof accent === "string") {
    req.user.accent = accent;
  }

  await saveDb();
  res.json({ user: publicUser(req.user) });
});

app.post("/api/avatar", authRequired, avatarUpload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no_file" });
  req.user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await saveDb();
  res.json({ user: publicUser(req.user) });
});

app.post("/api/upload", authRequired, fileUpload.array("files", 10), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const attachments = files.map((file) => ({
    name: file.originalname,
    url: `/uploads/files/${file.filename}`,
    size: file.size,
    type: file.mimetype
  }));
  res.json({ attachments });
});

app.get("/api/search", authRequired, (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) return res.json([]);

  const list = db.users
    .filter((u) => u.id !== req.user.id)
    .filter((u) =>
      u.login.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.displayName || "").toLowerCase().includes(q)
    )
    .slice(0, 20)
    .map((u) => ({
      ...publicUser(u),
      isFriend: db.friendships.some(
        (f) =>
          f.status === "accepted" &&
          ((f.a === req.user.id && f.b === u.id) || (f.a === u.id && f.b === req.user.id))
      )
    }));

  res.json(list);
});

app.post("/api/dm", authRequired, async (req, res) => {
  const { query } = req.body || {};
  const q = String(query || "").trim().toLowerCase();

  const target = db.users.find(
    (u) =>
      u.id.toLowerCase() === q ||
      u.login.toLowerCase() === q ||
      (u.displayName || "").toLowerCase() === q
  );

  if (!target) return res.status(404).json({ error: "not_found" });
  if (target.id === req.user.id) return res.status(400).json({ error: "self_chat" });

  const exists = db.friendships.find(
    (f) =>
      f.status === "accepted" &&
      ((f.a === req.user.id && f.b === target.id) || (f.a === target.id && f.b === req.user.id))
  );

  if (!exists) {
    db.friendships.push({
      a: req.user.id,
      b: target.id,
      status: "accepted",
      createdAt: Date.now()
    });
    await saveDb();
    refreshDmsFor(req.user.id);
    refreshDmsFor(target.id);
  }

  res.json({
    ok: true,
    room: pairKey(req.user.id, target.id),
    peer: publicUser(target)
  });
});

app.get("/api/messages", authRequired, (req, res) => {
  const scope = String(req.query.scope || "");

  if (scope === "dm") {
    const peerId = String(req.query.peerId || "");
    const peer = db.users.find((u) => u.id === peerId);
    if (!peer) return res.status(404).json({ error: "not_found" });

    return res.json({
      scope: "dm",
      room: pairKey(req.user.id, peerId),
      peer: publicUser(peer),
      messages: messagesForDm(req.user.id, peerId)
    });
  }

  if (scope === "guild") {
    const channelId = String(req.query.channelId || "");
    const channel = db.channels.find((c) => c.id === channelId);
    if (!channel) return res.status(404).json({ error: "not_found" });
    if (!isGuildMember(req.user.id, channel.guildId)) return res.status(403).json({ error: "no_access" });

    const guild = db.guilds.find((g) => g.id === channel.guildId);
    return res.json({
      scope: "guild",
      guild: guild ? { id: guild.id, name: guild.name } : null,
      channel: { id: channel.id, guildId: channel.guildId, name: channel.name },
      messages: messagesForGuild(channelId)
    });
  }

  res.json({ messages: [] });
});

app.get("/api/pins", authRequired, (req, res) => {
  const scope = String(req.query.scope || "");

  if (scope === "dm") {
    const peerId = String(req.query.peerId || "");
    const peer = db.users.find((u) => u.id === peerId);
    if (!peer) return res.status(404).json({ error: "not_found" });
    return res.json({ pins: pinsForDm(req.user.id, peerId) });
  }

  if (scope === "guild") {
    const channelId = String(req.query.channelId || "");
    const channel = db.channels.find((c) => c.id === channelId);
    if (!channel) return res.status(404).json({ error: "not_found" });
    if (!isGuildMember(req.user.id, channel.guildId)) return res.status(403).json({ error: "no_access" });

    return res.json({ pins: pinsForGuild(channelId) });
  }

  res.json({ pins: [] });
});

app.post("/api/guilds", authRequired, async (req, res) => {
  const { name } = req.body || {};
  const clean = String(name || "").trim().slice(0, 40);
  if (!clean) return res.status(400).json({ error: "empty_name" });

  const guild = {
    id: makeId5(),
    name: clean,
    ownerId: req.user.id,
    createdAt: Date.now()
  };

  db.guilds.push(guild);
  db.guildMembers.push({
    guildId: guild.id,
    userId: req.user.id,
    role: "owner",
    createdAt: Date.now()
  });

  const channel = {
    id: makeId5(),
    guildId: guild.id,
    name: "general",
    createdAt: Date.now()
  };

  db.channels.push(channel);
  await saveDb();

  refreshGuildsFor(req.user.id);

  res.json({
    guild: {
      id: guild.id,
      name: guild.name,
      ownerId: guild.ownerId,
      role: "owner",
      channels: [channel]
    }
  });
});

app.get("/api/guilds/:id/channels", authRequired, (req, res) => {
  const guildId = req.params.id;
  if (!isGuildMember(req.user.id, guildId)) return res.status(403).json({ error: "no_access" });

  res.json({
    channels: getGuildChannels(guildId).map((c) => ({
      id: c.id,
      guildId: c.guildId,
      name: c.name
    }))
  });
});

app.post("/api/guilds/:id/channels", authRequired, async (req, res) => {
  const guildId = req.params.id;
  if (!canManageGuild(req.user.id, guildId)) return res.status(403).json({ error: "no_access" });

  const { name } = req.body || {};
  const clean = String(name || "").trim().slice(0, 40);
  if (!clean) return res.status(400).json({ error: "empty_name" });

  const channel = {
    id: makeId5(),
    guildId,
    name: clean,
    createdAt: Date.now()
  };

  db.channels.push(channel);
  await saveDb();
  refreshGuildsFor(req.user.id);
  broadcastGuildToMembers(guildId, "guilds:refresh", {});
  res.json({ channel });
});

function broadcastGuildToMembers(guildId, event, payload) {
  const members = db.guildMembers.filter((m) => m.guildId === guildId).map((m) => m.userId);
  for (const userId of members) {
    const sockets = userSockets.get(userId);
    if (!sockets) continue;
    for (const sid of sockets) io.to(sid).emit(event, payload);
  }
}

app.get("/api/guilds/:id/members", authRequired, (req, res) => {
  const guildId = req.params.id;
  if (!isGuildMember(req.user.id, guildId)) return res.status(403).json({ error: "no_access" });

  const members = db.guildMembers
    .filter((m) => m.guildId === guildId)
    .map((m) => {
      const user = db.users.find((u) => u.id === m.userId);
      if (!user) return null;
      return {
        ...publicUser(user),
        role: m.role || "member"
      };
    })
    .filter(Boolean);

  res.json({ members });
});

app.post("/api/guilds/:id/invite", authRequired, async (req, res) => {
  const guildId = req.params.id;
  if (!canManageGuild(req.user.id, guildId)) return res.status(403).json({ error: "no_access" });

  const { query } = req.body || {};
  const q = String(query || "").trim().toLowerCase();
  if (!q) return res.status(400).json({ error: "empty_query" });

  const target = db.users.find(
    (u) => u.id.toLowerCase() === q || u.login.toLowerCase() === q || (u.displayName || "").toLowerCase() === q
  );
  if (!target) return res.status(404).json({ error: "not_found" });

  const exists = db.guildMembers.some((m) => m.guildId === guildId && m.userId === target.id);
  if (!exists) {
    db.guildMembers.push({
      guildId,
      userId: target.id,
      role: "member",
      createdAt: Date.now()
    });
    await saveDb();
    refreshGuildsFor(target.id);
    broadcastGuildToMembers(guildId, "guilds:refresh", {});
  }

  res.json({ ok: true });
});

app.put("/api/guilds/:id/members/:memberId/role", authRequired, async (req, res) => {
  const guildId = req.params.id;
  const memberId = req.params.memberId;
  const { role } = req.body || {};

  if (!canEditRoles(req.user.id, guildId)) return res.status(403).json({ error: "no_access" });
  if (!["member", "admin"].includes(role)) return res.status(400).json({ error: "bad_role" });

  const row = db.guildMembers.find((m) => m.guildId === guildId && m.userId === memberId);
  if (!row) return res.status(404).json({ error: "not_found" });
  if (row.role === "owner") return res.status(400).json({ error: "cannot_edit_owner" });

  row.role = role;
  await saveDb();
  broadcastGuildToMembers(guildId, "guilds:refresh", {});
  res.json({ ok: true, role });
});

app.post("/api/messages/:id/pin", authRequired, async (req, res) => {
  const msg = db.messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: "not_found" });
  if (!canPinMessage(req.user.id, msg)) return res.status(403).json({ error: "no_access" });

  msg.pinned = !msg.pinned;
  await saveDb();

  if (msg.scope === "dm") {
    const [a, b] = msg.targetId.split("_");
    io.to(dmRoom(a, b)).emit("chat:updated", { scope: "dm", targetId: msg.targetId });
  } else if (msg.scope === "guild") {
    io.to(guildRoom(msg.targetId)).emit("chat:updated", { scope: "guild", targetId: msg.targetId });
  }

  res.json({ ok: true, pinned: msg.pinned });
});

app.delete("/api/messages/:id", authRequired, async (req, res) => {
  const msg = db.messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: "not_found" });
  if (!canModerateMessage(req.user.id, msg)) return res.status(403).json({ error: "no_access" });

  msg.deleted = true;
  msg.text = "";
  msg.attachments = [];
  msg.pinned = false;
  await saveDb();

  if (msg.scope === "dm") {
    const [a, b] = msg.targetId.split("_");
    io.to(dmRoom(a, b)).emit("chat:updated", { scope: "dm", targetId: msg.targetId });
    refreshDmsFor(a);
    refreshDmsFor(b);
  } else if (msg.scope === "guild") {
    io.to(guildRoom(msg.targetId)).emit("chat:updated", { scope: "guild", targetId: msg.targetId });
  }

  res.json({ ok: true });
});

(async () => {
  await loadDb();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
