let myId = "";

async function register() {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({login, password})
  });

  const data = await res.json();
  alert(data.error || "Аккаунт создан");
}

async function login() {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({login, password})
  });

  const data = await res.json();

  if (data.error) return alert(data.error);

  myId = data.id;

  document.querySelector(".center").style.display = "none";
  document.getElementById("app").style.display = "block";

  document.getElementById("me").innerText =
    "Ты: " + data.login + " (" + data.id + ")";
}

async function search() {
  const q = document.getElementById("search").value;

  const res = await fetch("/search/" + q);
  const users = await res.json();

  const div = document.getElementById("results");
  div.innerHTML = "";

  users.forEach(u => {
    div.innerHTML += `
      <div>
        ${u.login} (${u.id})
        <button onclick="add('${u.id}')">+</button>
      </div>
    `;
  });
}

async function add(id) {
  await fetch("/add-friend", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({myId, friendId: id})
  });

  alert("Добавлен");
}
