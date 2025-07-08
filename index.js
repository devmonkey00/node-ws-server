const WebSocket = require('ws');

// Create a new WebSocket server instance
const wss = new WebSocket.Server({ port: 8080 });

// Store connected clients with their metadata
const clients = new Map();

// Connection monitor configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const INACTIVITY_THRESHOLD = 60000; // 60 seconds
let clientIdCounter = 0;

function getClientInfo(clientId) {
    const client = clients.get(clientId);
    if (!client) return null;
    
    return {
        id: clientId,
        connectedAt: client.connectedAt,
        messageCount: client.messageCount,
        lastActive: client.lastActive,
        status: client.ws.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
        uptime: Math.round((Date.now() - client.connectedAt) / 1000) // in seconds
    };
}

function broadcastServerStatus() {
    // Remove disconnected clients first
    for (const [clientId, client] of clients.entries()) {
        if (client.ws.readyState !== WebSocket.OPEN) {
            clients.delete(clientId);
        }
    }
    const now = Date.now();
    for (const [clientId, client] of clients.entries()) {
        if (now - client.lastActive > INACTIVITY_THRESHOLD) { // 60 seconds inactivity threshold
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.close();
            }
            clients.delete(clientId);
            console.log(`Client ${clientId} disconnected due to inactivity.`);
        }
    }
    const status = {
        totalClients: clients.size,
        clients: Array.from(clients.keys()).map(getClientInfo).filter(Boolean)
    };
    
    clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ type: 'status', data: status }));
        }
    });
}

// Connection event handler
wss.on('connection', (ws) => {
    const clientId = ++clientIdCounter;
    const clientInfo = {
        ws,
        connectedAt: Date.now(),
        messageCount: 0,
        lastActive: Date.now()
    };
    
    clients.set(clientId, clientInfo);
    console.log(`New client connected (ID: ${clientId})`);

    // Send a welcome message to the connected client
    ws.send(JSON.stringify({
        type: 'welcome',
        data: {
            clientId,
            message: 'Welcome to the WebSocket server!'
        }
    }));

    // Broadcast updated status to all clients
    broadcastServerStatus();

    // Message event handler
    ws.on('ping', (message) => {
        clientInfo.lastActive = Date.now();
        // console.log(`Ping received from client ${clientId}:`, message.toString());
    })
    ws.on('message', (message) => {
        clientInfo.messageCount++;
        clientInfo.lastActive = Date.now();
        console.log(`Received from client ${clientId}:`, message.toString());
        

        // Broadcast the message to all connected clients
        clients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                    type: 'message',
                    data: {
                        clientId,
                        message: message.toString(),
                        timestamp: Date.now()
                    }
                }));
            }
        });
    });    // Close event handler
    ws.on('close', () => {
        console.log(`Client disconnected (ID: ${clientId})`);
        clients.delete(clientId);
        broadcastServerStatus();
    });

    // Error event handler
    ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
    });

    ws.on('message', (message) => {

    })
});

// Set up periodic status broadcast
setInterval(broadcastServerStatus, HEARTBEAT_INTERVAL);

console.log('WebSocket server is running on ws://localhost:8080');

// Log initial server state
console.log('Connection monitor active. Broadcasting status every', HEARTBEAT_INTERVAL/1000, 'seconds');
