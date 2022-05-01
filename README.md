# WatchParty

## Starting the WatchParty Server

- In the root folder, install the required packages through: `npm install`
- Now, run the server by: `npm start`
- The server is now up and running in `localhost:3000/` by default.

## Joining the Party

- We can invoke the server in multiple browser tabs to simulate multiple sessions of users in the distributed watchparty application.
- Enter username and choose a room
- Two ways of choosing rooms:
  - Existing Rooms : Popular Rooms used frequently by users
  - Custom Rooms : Create your own room
- When a users join a room, they can see other participants in the group and use the chat feature to interact with all participants in the group
- The youtube stream is synced across all users in the group in real time!
- Any user in the group can enter a new youtube link in the top bar and stream it for the group.

## Events Handling Implementaion

The `socket.io` framework is used for broadcasting and receiving events and messages in the server.
Other than the default events, we differentiate our events as follows:  
`{custom-event}-server` : For events emitted by server.  
`{custom-event}-client` : For events emitted by client.

### Connection Event

- This event is invoked when a new client joins the server.
- When a client joins the server, we capture the username and room name of the client.
- The client is added to the requested room using `socket.join()`
- Existing users in the requested room are notified of the event that a new user, named `username` has joined their room.
- The requested room's metadata containing the id's of the participants is updated with the new user's id.

### Chat Message Event

- This Event is emitted when a new message is sent by a client using `socket.emit()`
- The message is broadcasted to other users in the same room using socket.`broadcast.emit()`

### Disconnect Event

- This Event is emitted when client leaves the room or closes the tab
- All other users are notified of the event occurence
- Room metadata is updated

### Video-state-first-server Event

- This Event is emitted for sending current video state to server.
- This happens when server requests for vide state from a particular client.
- This data is used to get new joinee in sync with everyone in room.

### Request-video-server

- This Event is emitted by server, requesting one of the existing user in room for current video state.
- This happens when a new user joins a room

### Video-playing-server

- This event is broadcasted by a server to the room when one of the user in room starts playing the video.
- Every client catches this event and starts playing and syncs to current time.

### Video-paused-server

- This event is broadcasted by a server to the room when one of the user in room pauses the video.
- Every client catches this event and pauses playing and syncs to current time.

### Video-changed-server

- This event is broadcasted by a server to the room when one of the user in room changes the video.
- Every client catches this event and loads the new video.

## Plans Ahead

- Integrate Database for storing room sessions and user chat history.
- Public and Private Rooms
- Authentication for Private chat rooms : Generate keys to share with friends for custom Private rooms
- Private message/tag a user in the group
- Voting for streaming a new video
- Voice Chatting
- User targetted messaging
