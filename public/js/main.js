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
  console.log("Sent request to find playing videos");
}

function onPlayerStateChange(event) {}

function changeVideo() {
  let search = document.getElementById("youtube-link");
  player.loadVideoById(search.value.split("watch?v=")[1]);
}

// TODO: Emit event
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
      return;
    } else {
      console.log("I am not the first client");
      player.loadVideoById(videoId);
      // Sleep for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (isPlaying == 1) {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
      player.seekTo(curTime + 2);
    }
  }
);

// Handle all socket events
