const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};

io.on("connection", (socket) => {

  socket.on("join", ({name, room}) => {
    socket.join(room);
    users[socket.id] = {name, room};

    const roomUsers = Object.entries(users)
      .filter(([id, u]) => u.room === room)
      .map(([id, u]) => ({id, name: u.name}));

    socket.emit("all-users", roomUsers);
    socket.to(room).emit("user-joined", {id: socket.id, name});

    io.to(room).emit("users", roomUsers);
  });

  socket.on("signal", ({to, data}) => {
    io.to(to).emit("signal", {
      from: socket.id,
      data
    });
  });

  socket.on("message", (msg) => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit("message", {
        name: user.name,
        text: msg
      });
    }
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (!user) return;

    delete users[socket.id];

    socket.to(user.room).emit("user-left", socket.id);

    const roomUsers = Object.entries(users)
      .filter(([id, u]) => u.room === user.room)
      .map(([id, u]) => ({id, name: u.name}));

    io.to(user.room).emit("users", roomUsers);
  });

});

server.listen(3000, () => console.log("Server started"));
