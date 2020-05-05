## Realtime TicTacToe

### Motivation

- How about looking beyond Http protocol and CRUD based applications?
- How about building a game and integrating real-time features to it?

Exploring WebSockets is fun and powerful. There are genuine use cases for it to thrive. While exploring WebSockets, I came across a realtime engine called Socket.io that enables bidirectional and event-based communication.

I chose to develop a minimal web app based on Socket.io. Users can create a game or join the game started by someone with
the generated code. Happy playing!

### Server-Side Technical Skills

- Server-side API is developed in Express.js (Node.js Web Application Framework) and Database in MongoDB.
- JSON Web Token is used to implement authentication and authorization of the app. App uses Access tokens to authorize the user and Refresh tokens to generate additional access tokens.
- Real-time communication is setup using Socket.io server.
- User uploaded assets are stored in the Cloudinary (Cloud-based image and video management platform).
- Supports gameplay using multiple connections(devices) and view player(opponent) statistics during gameplay.
