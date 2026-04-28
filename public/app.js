const socket = io();

let peers = {};
let localStream;
let name, room;

const videoGrid = document.getElementById("videos");

function join() {
  name = nameInput.value;
  room = roomInput.value;

  socket.emit("join", {name, room});

  login.style.display = "none";
  document.querySelector(".app").style.display = "grid";
}

async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;
}

async function shareScreen() {
  const screen = await navigator.mediaDevices.getDisplayMedia({
    video: true
  });

  localVideo.srcObject = screen;
}

function createPeer(id) {
  const pc = new RTCPeerConnection({
    iceServers: [
      {urls: "stun:stun.l.google.com:19302"},
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  });

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (e) => {
    const video = document.createElement("video");
    video.srcObject = e.streams[0];
    video.autoplay = true;
    videoGrid.appendChild(video);
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("signal", {to: id, data: e.candidate});
    }
  };

  return pc;
}

socket.on("all-users", (users) => {
  users.forEach(u => {
    const pc = createPeer(u.id);
    peers[u.id] = pc;
  });
});

socket.on("user-joined", ({id}) => {
  const pc = createPeer(id);
  peers[id] = pc;
});

socket.on("signal", async ({from, data}) => {
  const pc = peers[from];

  if (data.sdp) {
    await pc.setRemoteDescription(data.sdp);

    if (data.sdp.type === "offer") {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("signal", {
        to: from,
        data: pc.localDescription
      });
    }
  } else {
    await pc.addIceCandidate(data);
  }
});
