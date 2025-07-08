# ws-server

A simple Node.js WebSocket server using the `ws` library. This server tracks connected clients, monitors their activity, and broadcasts status updates to all clients.

## Features
- Assigns a unique ID to each client
- Tracks connection time, message count, and last activity
- Monitors connection status (connected/disconnected)
- Disconnects inactive clients after 60 seconds
- Broadcasts server status to all clients every 30 seconds
- All messages are JSON formatted with types (`welcome`, `status`, `message`)

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or newer recommended)

### Installation
1. Clone or download this repository.
2. Install dependencies:
   ```sh
   npm install
   ```

### Running the Server
Start the WebSocket server:
```sh
npm start
```
The server will run on `ws://localhost:8080` by default.

## Protocol
- On connection, the server sends a `welcome` message with the assigned client ID.
- The server broadcasts a `status` message every 30 seconds, listing all connected clients and their metadata.
- Any message sent by a client is broadcast to all clients as a `message` event, including the sender's client ID and a timestamp.
- If a client is inactive for more than 60 seconds, it will be disconnected automatically.

## Example Message Formats

**Welcome:**
```json
{
  "type": "welcome",
  "data": {
    "clientId": 1,
    "message": "Welcome to the WebSocket server!"
  }
}
```

**Status:**
```json
{
  "type": "status",
  "data": {
    "totalClients": 2,
    "clients": [
      {
        "id": 1,
        "connectedAt": 1720450000000,
        "messageCount": 5,
        "lastActive": 1720450030000,
        "status": "connected",
        "uptime": 30
      }
    ]
  }
}
```

**Message:**
```json
{
  "type": "message",
  "data": {
    "clientId": 1,
    "message": "Hello, world!",
    "timestamp": 1720450030000
  }
}
```

## Customization
- You can change the server port or heartbeat interval by editing the constants at the top of `index.js`.

## License
MIT
