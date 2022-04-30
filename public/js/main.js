const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");
const greetingText = document.getElementById("greetings");

// Get username and room from URL
let { username, room, customRoom } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();
let firstTime = true;
if (room === "SelectRoom") {
  room = customRoom;
}
// Join chatroom
socket.emit("joinRoom", { username, room });

//add greetings text
addGreetings(username);

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get message text
  let msg = e.target.elements.msg.value;

  msg = msg.trim();

  if (!msg) {
    return false;
  }

  // Emit message to server
  socket.emit("chatMessage", msg);

  // Clear input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  if (message.username === username) div.classList.add("message");
  else div.classList.add("my-message");

  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = message.username;
  p.innerHTML += `<span>${message.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.classList.add("text");
  para.innerText = message.text;
  div.appendChild(para);
  document.querySelector(".chat-messages").appendChild(div);
}

//add greeting text to DOM
function addGreetings(username) {
  greetingText.innerText = `Welcome to the Party, ${username}`;
}
// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}

//Prompt the user before leave chat room
document.getElementById("leave-btn").addEventListener("click", () => {
  const leaveRoom = confirm("Are you sure you want to leave the chatroom?");
  if (leaveRoom) {
    window.location = "../index.html";
  } else {
  }
});

// Youtube player
// For video
var player;
let curState = "";
let curTime = 0;
function onYouTubeIframeAPIReady() {
  const videoId = "dQw4w9WgXcQ";
  player = new YT.Player("player", {
    height: "720",
    width: "640",
    videoId: videoId,
    playerVars: {
      playsinline: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  let search = document.getElementById("youtube-link");
  search.value = player.getVideoUrl();
  // player.mute();
  player.playVideo();
  // Send event to get video playing on other clients
  socket.emit("request-video-server");
  // firstTime = true;
  console.log("Sent request to find playing videos");
}

function onPlayerStateChange(event) {
  curState = event.data;
  curTime = player.getCurrentTime();
  if (firstTime) return;
  if (curState === YT.PlayerState.PLAYING) {
    curTime = player.getCurrentTime();
    socket.emit("video-playing-server", { curTime });
  }
  if (curState === YT.PlayerState.PAUSED) {
    socket.emit("video-paused-server", { curTime });
  }
  // if (curState === YT.PlayerState.ENDED) {
  //   socket.emit("video-ended-server", { curTime });
  // }
}

function changeVideo() {
  let search = document.getElementById("youtube-link");
  player.loadVideoById(search.value.split("watch?v=")[1]);

  // TODO: Emit event
  socket.emit("video-changed-server", {
    videoId: search.value.split("watch?v=")[1],
  });
}

socket.on("request-video-client", () => {
  console.log("Received request to for video details");
  let curId = player.getVideoData()["video_id"];
  // Get current player state
  curTime = player.getCurrentTime();
  curState = player.getPlayerState();
  socket.emit("video-state-first-server", { curId, curTime, curState });
  console.log("Sent video state to server");
});

socket.on(
  "video-state-first-client",
  async ({ videoId, curTime, isPlaying }) => {
    console.log("ID: ", videoId);
    if (!videoId) {
      console.log("No change, because I am the first client");
      firstTime = false;
      return;
    } else {
      console.log("I am not the first client");
      player.loadVideoById(videoId);
      // Sleep for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (isPlaying == 1) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
      player.seekTo(curTime + 1);
    }
    firstTime = false;
  }
);

// Catch all the events
socket.on("video-playing-client", ({ curTime }) => {
  console.log("Received video playing event");
  if (Math.abs(curTime - player.getCurrentTime()) > 3) {
    player.seekTo(curTime);
  }
  if (curState !== YT.PlayerState.PLAYING) {
    player.playVideo();
  }
});

socket.on("video-paused-client", ({ curTime }) => {
  console.log("Received video paused event");
  if (Math.abs(curTime - player.getCurrentTime()) > 3) {
    player.seekTo(curTime);
  }
  if (curState !== YT.PlayerState.PAUSED) {
    player.pauseVideo();
  }
});

socket.on("video-changed-client", ({ videoId }) => {
  console.log("Received video change event");
  if (player.getVideoData()["video_id"] !== videoId) {
    player.loadVideoById(videoId);
  }
});

// Handle all socket events
