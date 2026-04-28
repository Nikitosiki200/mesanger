const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "db.json");

const EMPTY_DB = {
  users: [],
  sessions: [],
  friendships: [],
  groups: [],
  groupMembers: [],
  messages: []
};

let db = structuredClone(EMPTY_DB);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function pairKey(a, b) {
  return [a, b].sort().join("_");
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function makeId5() {
  let id = "";
  do {
    id = Math.random().toString(36).slice(2, 7).toUpperCase();
  } while (db.users.some((u) => u.id === id));
  return id;
}

function makeToken() {
  return crypto.randomBytes(24).toString("hex");
}

function publicUser(u) {
  return {
    id: u.id,
    login: u.login,
    displayName: u.displayName || u.login,
    accent: u.accent || "indigo",
    theme: u.theme || "dark",
    compact: !!u.compact
  };
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

function canAccessChannel(userId, type, id) {
  if (type === "dm") {
    const [a, b] = id.split("_");
    return a === userId || b === userId;
  }
  if (type === "group") {
    return db.groupMembers.some((m) => m.groupId === id && m.userId === userId);
  }
  return false;
}

function channelRoom(type, id) {
  return `chat:${type}:${id}`;
}

function callRoom(type, id) {
  return `call:${type}:${id}`;
}

function conversationIdFrom(type, id, meId) {
  if (type === "dm") return id;
  if (type === "group") return id;
  return `${type}:${id}:${meId}`;
}

function getFriends(userId) {
  return db.friendships
    .filter(
      (f) =>
        f.status === "accepted" &&
        (f.a === userId || f.b === userId)
    )
    .map((f) => {
      const friendId = f.a === userId ? f.b : f.a;
      const friend = db.users.find((u) => u.id === friendId);
      return friend ? publicUser(friend) : null;
    })
    .filter(Boolean);
}

function getGroupsFor(userId) {
  return db.groupMembers
    .filter((m) => m.userId === userId)
    .map((m) => db.groups.find((g) => g.id === m.groupId))
    .filter(Boolean)
    .map((g) => ({
      id: g.id,
      type: "group",
      title: g.name,
      membersCount: db.groupMembers.filter((m) => m.groupId === g.id).length,
      ownerId: g.ownerId
    }));
}

function getConversations(userId) {
  const friends = getFriends(userId).map((f) => ({
    id: pairKey(userId, f.id),
    type: "dm",
    title: f.displayName,
    subtitle: `@${f.login}`,
    avatar: f.displayName?.slice(0, 1)?.toUpperCase() || "U",
    peer: f
  }));

  const groups = getGroupsFor(userId).map((g) => ({
    id: g.id,
    type: "group",
    title: g.title,
    subtitle: `${g.membersCount} участников`,
    avatar: "#",
    peer: null
  }));

  return [...friends, ...groups];
}

async function loadDb() {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    db = JSON.parse(raw);
  } catch {
    db = structuredClone(EMPTY_DB);
    await saveDb();
  }
}

async function saveDb() {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function storeMessage(type, id, senderId, text) {
  const msg = {
    id: crypto.randomBytes(8).toString("hex"),
    type,
    channelId: id,
    senderId,
    text,
    createdAt: Date.now()
  };
  db.messages.push(msg);
  return msg;
}

app.post("/api/register", async (req, res) => {
  const { login, password, displayName } = req.body || {};
  const cleanLogin = String(login || "").trim();
  const cleanPassword = String(password || "").trim();
  const cleanName = String(displayName || "").trim();

  if (cleanLogin.length < 3 || cleanPassword.length < 4) {
    return res.status(400).json({ error: "Логин минимум 3 символа, пароль минимум 4." });
  }

  if (db.users.some((u) => u.login.toLowerCase() === cleanLogin.toLowerCase())) {
    return res.status(400).json({ error: "Такой логин уже занят." });
  }

  const user = {
    id: makeId5(),
    login: cleanLogin,
    passwordHash: hashPassword(cleanPassword),
    displayName: cleanName || cleanLogin,
    accent: "indigo",
    theme: "dark",
    compact: false,
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
      u.login.toLowerCase() === cleanLogin.toLowerCase() &&
      u.passwordHash === hashPassword(cleanPassword)
  );

  if (!user) {
    return res.status(400).json({ error: "Неверный логин или пароль." });
  }

  const token = makeToken();
  db.sessions.push({ token, userId: user.id, createdAt: Date.now() });
  await saveDb();

  res.json({ token, user: publicUser(user) });
});

app.get("/api/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  res.json({
    user: publicUser(user),
    conversations: getConversations(user.id)
  });
});

app.patch("/api/settings", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  const { displayName, accent, theme, compact } = req.body || {};
  if (typeof displayName === "string") user.displayName = displayName.trim().slice(0, 24) || user.login;
  if (typeof accent === "string") user.accent = accent;
  if (typeof theme === "string") user.theme = theme;
  if (typeof compact === "boolean") user.compact = compact;

  await saveDb();
  res.json({ user: publicUser(user) });
});

app.get("/api/search", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) return res.json([]);

  const list = db.users
    .filter((u) => u.id !== user.id)
    .filter((u) =>
      u.login.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    )
    .slice(0, 20)
    .map(publicUser);

  res.json(list);
});

app.post("/api/friends/add", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  const { query } = req.body || {};
  const q = String(query || "").trim().toLowerCase();
  if (!q) return res.status(400).json({ error: "Введите логин или ID" });

  const target = db.users.find(
    (u) =>
      u.id.toLowerCase() === q ||
      u.login.toLowerCase() === q
  );

  if (!target) return res.status(404).json({ error: "Пользователь не найден" });
  if (target.id === user.id) return res.status(400).json({ error: "Нельзя добавить себя" });

  const already = db.friendships.find(
    (f) =>
      f.status === "accepted" &&
      ((f.a === user.id && f.b === target.id) || (f.a === target.id && f.b === user.id))
  );

  if (!already) {
    db.friendships.push({
      a: user.id,
      b: target.id,
      status: "accepted",
      createdAt: Date.now()
    });
    await saveDb();
  }

  res.json({
    ok: true,
    friend: publicUser(target),
    dmId: pairKey(user.id, target.id)
  });
});

app.post("/api/groups", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  const { name } = req.body || {};
  const clean = String(name || "").trim().slice(0, 30);
  if (!clean) return res.status(400).json({ error: "Введите название группы" });

  const group = {
    id: makeId5(),
    name: clean,
    ownerId: user.id,
    createdAt: Date.now()
  };
  db.groups.push(group);
  db.groupMembers.push({ groupId: group.id, userId: user.id, createdAt: Date.now() });
  await saveDb();

  res.json({ group });
});

app.get("/api/groups/:id/members", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  const groupId = req.params.id;
  if (!canAccessChannel(user.id, "group", groupId)) {
    return res.status(403).json({ error: "Нет доступа" });
  }

  const members = db.groupMembers
    .filter((m) => m.groupId === groupId)
    .map((m) => db.users.find((u) => u.id === m.userId))
    .filter(Boolean)
    .map(publicUser);

  res.json({ members });
});

app.post("/api/groups/:id/invite", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  const groupId = req.params.id;
  const { query } = req.body || {};
  const q = String(query || "").trim().toLowerCase();

  const group = db.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Группа не найдена" });
  if (group.ownerId !== user.id && !canAccessChannel(user.id, "group", groupId)) {
    return res.status(403).json({ error: "Нет доступа" });
  }

  const target = db.users.find(
    (u) => u.id.toLowerCase() === q || u.login.toLowerCase() === q
  );
  if (!target) return res.status(404).json({ error: "Пользователь не найден" });

  const exists = db.groupMembers.some(
    (m) => m.groupId === groupId && m.userId === target.id
  );
  if (!exists) {
    db.groupMembers.push({ groupId, userId: target.id, createdAt: Date.now() });
    await saveDb();
  }

  res.json({ ok: true, member: publicUser(target) });
});

app.get("/api/messages", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });

  const type = String(req.query.type || "");
  const id = String(req.query.id || "");
  if (!canAccessChannel(user.id, type, id)) {
    return res.status(403).json({ error: "Нет доступа" });
  }

  const messages = db.messages
    .filter((m) => m.type === type && m.channelId === id)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-200)
    .map((m) => {
      const sender = db.users.find((u) => u.id === m.senderId);
      return {
        id: m.id,
        type: m.type,
        channelId: m.channelId,
        senderId: m.senderId,
        senderName: sender ? sender.displayName || sender.login : "Неизвестно",
        senderLogin: sender ? sender.login : "unknown",
        text: m.text,
        createdAt: m.createdAt
      };
    });

  res.json({ messages });
});

function messagePayload(m) {
  const sender = db.users.find((u) => u.id === m.senderId);
  return {
    id: m.id,
    type: m.type,
    channelId: m.channelId,
    senderId: m.senderId,
    senderName: sender ? sender.displayName || sender.login : "Неизвестно",
    senderLogin: sender ? sender.login : "unknown",
    text: m.text,
    createdAt: m.createdAt
  };
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
  socket.on("join-chat", ({ type, id }) => {
    if (!canAccessChannel(socket.data.userId, type, id)) return;
    socket.join(channelRoom(type, id));
  });

  socket.on("leave-chat", ({ type, id }) => {
    socket.leave(channelRoom(type, id));
  });

  socket.on("message:send", async ({ type, id, text }) => {
    const clean = String(text || "").trim();
    if (!clean) return;
    if (!canAccessChannel(socket.data.userId, type, id)) return;

    const msg = storeMessage(type, id, socket.data.userId, clean);
    await saveDb();

    io.to(channelRoom(type, id)).emit("message:new", messagePayload(msg));
  });

  socket.on("call:join", async ({ type, id }) => {
    if (!canAccessChannel(socket.data.userId, type, id)) return;

    const room = callRoom(type, id);
    socket.join(room);

    const peers = await io.in(room).fetchSockets();
    const members = peers
      .filter((s) => s.id !== socket.id)
      .map((s) => ({
        id: s.id,
        login: s.data.login
      }));

    socket.emit("call:members", { type, id, members });
    socket.to(room).emit("call:user-joined", {
      id: socket.id,
      login: socket.data.login
    });
  });

  socket.on("call:leave", ({ type, id }) => {
    const room = callRoom(type, id);
    socket.leave(room);
    socket.to(room).emit("call:user-left", { id: socket.id });
  });

  socket.on("call:signal", ({ to, data }) => {
    io.to(to).emit("call:signal", {
      from: socket.id,
      data
    });
  });

  socket.on("disconnect", () => {
    for (const room of socket.rooms) {
      if (room.startsWith("call:")) {
        socket.to(room).emit("call:user-left", { id: socket.id });
      }
    }
  });
});

(async () => {
  await loadDb();
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
})();
