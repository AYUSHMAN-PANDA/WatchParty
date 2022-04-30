const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Notifications";

let roomFirstUsers = {};

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Create an empty array for the room if it doesn't exist
    if (!roomFirstUsers[user.room]) {
      roomFirstUsers[user.room] = [];
    }

    // Welcome current user
    // socket.emit('message', formatMessage(botName, 'Welcome to WatchParty!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });

  // Send video details
  socket.on("video-state-first-server", ({ curId, curTime, curState }) => {
    // Pop the user from the array
    let room = getCurrentUser(socket.id).room;
    const user = roomFirstUsers[room].pop();
    console.log(
      "sending video details to ",
      user.username,
      " with id ",
      user.id
    );
    io.to(user.id).emit("video-state-first-client", {
      videoId: curId,
      curTime: curTime,
      isPlaying: curState,
    });
    console.log("Sent video state to client ", user.username);
  });

  // First join video request
  socket.on("request-video-server", () => {
    const user = getCurrentUser(socket.id);
    const room = user.room;
    console.log("User ", user.username, " requested video");
    const users = getRoomUsers(room);
    // If user is the first user in the room
    if (users.length === 1) {
      console.log("== First user in room");
      io.to(user.id).emit("video-state-first-client", {
        videoId: false,
        curTime: 0,
        isPlaying: true,
      });
    } else {
      console.log("== Not first user in room");
      const firstUser = users[0];
      console.log("First user is ", firstUser.username, " id: ", firstUser.id);
      io.to(firstUser.id).emit("request-video-client");
      console.log("== Sent request to ", firstUser.username);
      // Add user to firstUsers object
      roomFirstUsers[room].push(user);
      console.log("== Added user to firstUsers object");
    }
  });

  // Get video-playing-server, video-paused-server, video-ended-server
  socket.on("video-playing-server", ({ curTime }) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("video-playing-client", {
      curTime: curTime,
    });
  });

  socket.on("video-paused-server", ({ curTime }) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("video-paused-client", {
      curTime: curTime,
    });
  });

  // socket.on("video-ended-server", () => {
  //   const user = getCurrentUser(socket.id);
  //   io.to(user.room).emit("video-ended-client");
  // });

  // Get video-changed-server
  socket.on("video-changed-server", ({ videoId }) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("video-changed-client", {
      videoId: videoId,
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
