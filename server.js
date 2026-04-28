const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

// база
const db = new Low(new JSONFile("db.json"), { users: [] });

async function initDB() {
  await db.read();
  db.data ||= { users: [] };
}
initDB();


// 🔐 РЕГИСТРАЦИЯ
app.post("/register", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.json({ error: "Заполни все поля" });
  }

  await db.read();

  const exists = db.data.users.find(u => u.login === login);
  if (exists) {
    return res.json({ error: "Логин занят" });
  }

  const user = {
    id: uuidv4(),
    login,
    password,
    friends: []
  };

  db.data.users.push(user);
  await db.write();

  res.json({ success: true });
});


// 🔓 ВХОД
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  await db.read();

  const user = db.data.users.find(
    u => u.login === login && u.password === password
  );

  if (!user) {
    return res.json({ error: "Неверные данные" });
  }

  res.json({
    id: user.id,
    login: user.login
  });
});


// 🔎 ПОИСК
app.get("/search/:query", async (req, res) => {
  await db.read();

  const q = req.params.query.toLowerCase();

  const result = db.data.users.filter(
    u => u.login.toLowerCase().includes(q) || u.id === q
  );

  res.json(result);
});


// ➕ ДОБАВИТЬ В ДРУЗЬЯ
app.post("/add-friend", async (req, res) => {
  const { myId, friendId } = req.body;

  await db.read();

  const me = db.data.users.find(u => u.id === myId);
  const friend = db.data.users.find(u => u.id === friendId);

  if (!me || !friend) {
    return res.json({ error: "Ошибка" });
  }

  if (!me.friends.includes(friendId)) {
    me.friends.push(friendId);
  }

  await db.write();

  res.json({ success: true });
});

server.listen(3000, () => console.log("Server started"));
